import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaGavel, FaUser, FaCheckCircle, FaTimesCircle, FaPlay, FaUndo } from 'react-icons/fa';
import { auctionAPI, teamsAPI } from '../../services/api';
import './LiveAuction.css';

const LiveAuction = () => {
  const [auction, setAuction] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [bidAmount, setBidAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recentBids, setRecentBids] = useState([]);
  const [ws, setWs] = useState(null);
  const wsRef = useRef(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTeamId, setEditTeamId] = useState('');
  const [editBidAmount, setEditBidAmount] = useState('');
  
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [username, setUsername] = useState(null);

  useEffect(() => {
    // Check authentication status
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const user = localStorage.getItem('username');
    
    setIsAuthenticated(!!token);
    setUserRole(role);
    setUsername(user);
    
    fetchInitialData();
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const connectWebSocket = () => {
    const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:8000/api/auction/ws';
    const websocket = new WebSocket(wsUrl);

    websocket.onopen = () => {
      console.log('WebSocket connected');
    };

    websocket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      handleWebSocketMessage(message);
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    websocket.onclose = () => {
      console.log('WebSocket disconnected');
      // Reconnect after 3 seconds
      setTimeout(connectWebSocket, 3000);
    };

    wsRef.current = websocket;
    setWs(websocket);
  };

  const handleWebSocketMessage = (message) => {
    switch (message.type) {
      case 'auction_started':
        fetchCurrentAuction();
        break;
      case 'new_bid':
        setRecentBids(prev => [message.data, ...prev].slice(0, 10));
        fetchCurrentAuction();
        fetchTeams();
        break;
      case 'player_sold':
        setRecentBids(prev => [
          { ...message.data, type: 'sold' },
          ...prev
        ].slice(0, 10));
        fetchCurrentAuction();
        fetchTeams();
        break;
      case 'player_unsold':
        setRecentBids(prev => [
          { ...message.data, type: 'unsold' },
          ...prev
        ].slice(0, 10));
        fetchCurrentAuction();
        break;
      case 'next_player':
        setCurrentPlayer(message.data.player);
        fetchCurrentAuction();
        break;
      case 'auction_completed':
        fetchCurrentAuction();
        break;
      default:
        break;
    }
  };

  const fetchInitialData = async () => {
    try {
      await Promise.all([
        fetchCurrentAuction(),
        fetchTeams(),
      ]);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentAuction = async () => {
    try {
      const response = await auctionAPI.getCurrent();
      setAuction(response.data);
      if (response.data.current_player) {
        setCurrentPlayer(response.data.current_player);
        setBidAmount(response.data.current_bid_amount + 5000);
      }
    } catch (error) {
      console.error('Error fetching auction:', error);
      setError('No active auction');
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await teamsAPI.getAll();
      setTeams(response.data);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const startAuction = async () => {
    if (!isAuthenticated) {
      alert('You must be logged in to start the auction. Please login first.');
      return;
    }
    
    if (userRole !== 'admin') {
      alert('Only admins can start the auction.');
      return;
    }

    try {
      await auctionAPI.start();
      await fetchCurrentAuction();
      setError('');
    } catch (error) {
      console.error('Start auction error:', error);
      const errorMsg = error.response?.data?.detail || 'Failed to start auction';
      setError(errorMsg);
      alert('Failed to start auction: ' + errorMsg);
    }
  };

  const placeBid = async () => {
    if (!isAuthenticated) {
      setError('Please login to place bids');
      alert('You must be logged in to place bids. Please login first.');
      return;
    }

    if (userRole === 'generic_user') {
      setError('You do not have permission to place bids');
      alert('Only admin users can place bids. Please contact an administrator.');
      return;
    }

    if (!selectedTeam) {
      setError('Please select a team');
      return;
    }

    try {
      await auctionAPI.placeBid({
        team_id: selectedTeam,
        bid_amount: bidAmount,
      });
      setError('');
      setBidAmount(prev => prev + 5000);
    } catch (error) {
      setError(error.response?.data?.detail || 'Bid failed');
    }
  };

  const markSold = async () => {
    if (!isAuthenticated) {
      alert('You must be logged in to mark players as sold. Please login first.');
      return;
    }

    if (userRole === 'generic_user') {
      alert('Only admin users can mark players as sold. Please contact an administrator.');
      return;
    }

    try {
      await auctionAPI.markSold();
      setError('');
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to mark as sold');
    }
  };

  const markUnsold = async () => {
    if (!isAuthenticated) {
      alert('You must be logged in to mark players as unsold. Please login first.');
      return;
    }

    if (userRole === 'generic_user') {
      alert('Only admin users can mark players as unsold. Please contact an administrator.');
      return;
    }

    try {
      await auctionAPI.markUnsold();
      setError('');
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to mark as unsold');
    }
  };

  const getRandomPlayer = async () => {
    if (!isAuthenticated) {
      alert('You must be logged in to select random player. Please login first.');
      return;
    }
    
    if (userRole !== 'admin') {
      alert('Only admins can select random players.');
      return;
    }

    if (!window.confirm('Skip current player and select a random player from available pool?')) {
      return;
    }

    try {
      const response = await auctionAPI.getRandomPlayer();
      alert(`Next player: ${response.data.name}`);
      await fetchCurrentAuction();
    } catch (error) {
      console.error('Error getting random player:', error);
      alert('Failed to get random player: ' + (error.response?.data?.detail || error.message));
    }
  };

  const resetAuction = async () => {
    if (!isAuthenticated) {
      alert('You must be logged in to reset auction. Please login first.');
      return;
    }
    
    if (userRole !== 'admin') {
      alert('Only admins can reset the auction.');
      return;
    }

    const confirmMessage = '🚨 MASTER RESET 🚨\n\n' +
      'This will:\n' +
      '• Mark ALL players as AVAILABLE\n' +
      '• Reset ALL team purses to ₹10,00,000\n' +
      '• Clear all player-team assignments\n' +
      '• Reset auction status\n\n' +
      'This action CANNOT be undone!\n\n' +
      'Type "RESET" to confirm:';
    
    const userInput = window.prompt(confirmMessage);
    
    if (userInput !== 'RESET') {
      if (userInput !== null) {
        alert('Reset cancelled. You must type "RESET" exactly to confirm.');
      }
      return;
    }

    try {
      const response = await auctionAPI.resetAuction();
      alert(`✅ ${response.data.message}\n\n` +
        `Players reset: ${response.data.details.players_reset}\n` +
        `Teams reset: ${response.data.details.teams_reset}\n` +
        `Team purse: ${response.data.details.team_purse_reset_to}`);
      
      // Refresh data
      await fetchInitialData();
    } catch (error) {
      console.error('Error resetting auction:', error);
      alert('Failed to reset auction: ' + (error.response?.data?.detail || error.message));
    }
  };
    const handleEditBid = () => {
    if (!isAuthenticated) {
      alert('You must be logged in to edit bids. Please login first.');
      return;
    }
    
    if (userRole !== 'admin') {
      alert('Only admins can edit bids.');
      return;
    }

    if (auction?.current_bid_amount) {
      setEditTeamId(auction.current_bidding_team_id?.toString() || '');
      setEditBidAmount(auction.current_bid_amount.toString());
      setShowEditModal(true);
    }
  };

  const submitEditBid = async (e) => {
    e.preventDefault();
    try {
      await auctionAPI.editLastBid({
        team_id: parseInt(editTeamId),
        bid_amount: parseFloat(editBidAmount)
      });
      setShowEditModal(false);
      setError('');
      fetchCurrentAuction();
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to edit bid');
    }
  };

  const formatCurrency = (amount) => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)}L`;
    }
    return `₹${(amount / 1000).toFixed(0)}K`;
  };

  const getTeamMaxBid = (teamId) => {
    const team = teams.find(t => t.id === teamId);
    return team?.max_bid_limit || 0;
  };

  if (loading) {
    return (
      <div className="live-auction-page">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!auction && error) {
    return (
      <div className="live-auction-page">
        <div className="auction-container">
          <div className="no-auction">
            <FaGavel className="no-auction-icon" />
            <h2>No Active Auction</h2>
            <p>Start the auction to begin bidding</p>
            {!isAuthenticated && (
              <div className="alert alert-warning" style={{maxWidth: '500px', margin: '20px auto'}}>
                🔒 Please <strong>login as Admin</strong> to start the auction.
              </div>
            )}
            {isAuthenticated && userRole !== 'admin' && (
              <div className="alert alert-warning" style={{maxWidth: '500px', margin: '20px auto'}}>
                ⚠️ Only <strong>Admin</strong> users can start the auction.
              </div>
            )}
            <button 
              onClick={startAuction} 
              className="btn btn-primary btn-large"
              disabled={!isAuthenticated || userRole !== 'admin'}
              title={!isAuthenticated ? "Please login as admin to start" : userRole !== 'admin' ? "Only admins can start auction" : ""}
            >
              <FaPlay /> Start Auction
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="live-auction-page">
      <div className="auction-container">
        <div className="auction-header">
          <div className="auction-title">
            <FaGavel className="gavel-icon" />
            <div>
              <h1>Live Auction</h1>
              <p className="auction-status">
                <span className="status-indicator pulsing"></span>
                {auction?.status === 'in_progress' ? 'In Progress' : 'Paused'}
              </p>
            </div>
          </div>
        </div>

        <div className="auction-content">
          <div className="main-auction-area">
            <div className="player-and-bid-container">
              <AnimatePresence mode="wait">
                {currentPlayer && (
                  <motion.div
                    key={currentPlayer.id}
                    className="current-player-card"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="player-spotlight">
                      <div className="player-avatar-auction">
                        {(currentPlayer.player_image || currentPlayer.photo_url) ? (
                          <img src={currentPlayer.player_image || currentPlayer.photo_url} alt={currentPlayer.name} />
                        ) : (
                          <FaUser />
                        )}
                      </div>
                      <div className="player-glow"></div>
                    </div>

                    <div className="player-auction-info">
                      <div className="player-badges-auction">
                        {currentPlayer.has_cricheroes_data && (
                          <span className="verified-badge-auction">
                            <FaCheckCircle /> Verified
                          </span>
                        )}
                        <span className="role-badge-auction">
                          {currentPlayer.role.replace('_', ' ')}
                        </span>
                      </div>

                      <h2 className="player-name-auction">{currentPlayer.name}</h2>
                      
                      {currentPlayer.has_cricheroes_data ? (
                        <div className="player-quick-stats">
                          <div className="quick-stat">
                            <span>Matches</span>
                            <strong>{currentPlayer.matches_played}</strong>
                          </div>
                          <div className="quick-stat">
                            <span>Runs</span>
                            <strong>{currentPlayer.runs_scored}</strong>
                          </div>
                          <div className="quick-stat">
                            <span>Wickets</span>
                            <strong>{currentPlayer.wickets_taken}</strong>
                          </div>
                        </div>
                      ) : (
                        <div className="new-player-indicator">
                          <FaTimesCircle /> New Player
                        </div>
                      )}

                      <div className="current-bid-display">
                        <span className="bid-label">Current Bid</span>
                        <motion.span
                          className="bid-amount"
                          key={auction?.current_bid_amount}
                          initial={{ scale: 1.2 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 300 }}
                        >
                          {formatCurrency(auction?.current_bid_amount || currentPlayer.base_price)}
                        </motion.span>
                      </div>

                      {auction?.current_bidding_team_id && (
                        <div className="leading-team">
                          <span>Leading: </span>
                          <strong>
                            {teams.find(t => t.id === auction.current_bidding_team_id)?.name}
                          </strong>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="bidding-panel">
                <h3>Place Bid</h3>
                
                {!isAuthenticated && (
                  <div className="alert alert-warning">
                    🔒 Please <strong>login</strong> to place bids and participate in the auction.
                  </div>
                )}
                
                {error && (
                <div className="alert alert-error">
                  {error}
                </div>
              )}

              <div className="bid-controls">
                <div className="form-group">
                  <label>Select Team</label>
                  <select
                    value={selectedTeam || ''}
                    onChange={(e) => setSelectedTeam(Number(e.target.value))}
                    className="team-select"
                    disabled={!isAuthenticated}
                  >
                    <option value="">Choose a team</option>
                    {teams.map(team => (
                      <option key={team.id} value={team.id}>
                        {team.name} - {formatCurrency(team.remaining_budget)} left
                      </option>
                    ))}
                  </select>
                  {selectedTeam && (
                    <p className="team-hint">
                      Max bid allowed: {formatCurrency(getTeamMaxBid(selectedTeam))}
                    </p>
                  )}
                </div>

                <div className="form-group">
                  <label>Bid Amount</label>
                  <div className="bid-input-group">
                    <button
                      onClick={() => setBidAmount(prev => Math.max(currentPlayer?.base_price || 10000, prev - 5000))}
                      className="btn btn-secondary"
                      disabled={!isAuthenticated}
                    >
                      -₹5K
                    </button>
                    <input
                      type="number"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(Number(e.target.value))}
                      step="5000"
                      className="bid-input"
                      disabled={!isAuthenticated}
                    />
                    <button
                      onClick={() => setBidAmount(prev => prev + 5000)}
                      className="btn btn-secondary"
                      disabled={!isAuthenticated}
                    >
                      +₹5K
                    </button>
                  </div>
                </div>

                <button
                  onClick={placeBid}
                  className="btn btn-primary btn-large"
                  disabled={!isAuthenticated || userRole === 'generic_user' || !selectedTeam || !currentPlayer}
                  title={!isAuthenticated ? "Please login to place bids" : userRole === 'generic_user' ? "Admin only" : ""}
                >
                  <FaGavel /> Place Bid
                </button>
              </div>

              <div className="auction-actions">
                <button 
                  onClick={markSold} 
                  className="btn btn-success"
                  disabled={!isAuthenticated || userRole === 'generic_user'}
                  title={!isAuthenticated ? "Please login to mark as sold" : userRole === 'generic_user' ? "Admin only" : ""}
                >
                  <FaCheckCircle /> Mark Sold
                </button>
                <button 
                  onClick={markUnsold} 
                  className="btn btn-danger"
                  disabled={!isAuthenticated || userRole === 'generic_user'}
                  title={!isAuthenticated ? "Please login to mark as unsold" : userRole === 'generic_user' ? "Admin only" : ""}
                >
                  <FaTimesCircle /> Mark Unsold
                </button>
                <button 
                  onClick={getRandomPlayer} 
                  className="btn btn-info"
                  disabled={!isAuthenticated || userRole !== 'admin'}
                  title={!isAuthenticated ? "Please login as admin" : userRole !== 'admin' ? "Admin only" : "Select random player"}
                >
                  🎲 Random Player
                </button>
                {auction?.current_bidding_team_id && (
                  <button 
                    onClick={handleEditBid} 
                    className="btn btn-warning"
                    disabled={!isAuthenticated || userRole !== 'admin'}
                    title={!isAuthenticated ? "Please login as admin" : userRole !== 'admin' ? "Admin only" : "Edit last bid"}
                  >
                    Edit Last Bid
                  </button>
                )}
              </div>

              <div className="auction-reset-section">
                <button 
                  onClick={resetAuction} 
                  className="btn btn-reset"
                  disabled={!isAuthenticated || userRole !== 'admin'}
                  title={!isAuthenticated ? "Please login as admin" : userRole !== 'admin' ? "Admin only" : "Reset auction"}
                >
                  <FaUndo /> Master Reset
                </button>
                <p className="reset-warning">⚠️ Resets all players & teams to initial state</p>
              </div>
            </div>
            </div>
          </div>

          <div className="auction-sidebar">
            <div className="sidebar-section">
              <h3>Teams Overview</h3>
              <div className="teams-list">
                {teams.map(team => (
                  <div key={team.id} className="team-item-auction">
                    <div
                      className="team-color-indicator"
                      style={{ background: team.color_primary }}
                    />
                    <span className="team-players">{team.players_count}/15</span>
                    <div className="team-item-info">
                      <span className="team-name">{team.short_name}</span>
                      <span className="team-budget">Budget: {formatCurrency(team.remaining_budget)}</span>
                      <span className="team-max-bid">Max Bid: {formatCurrency(team.max_bid_limit || 0)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="sidebar-section">
              <h3>Recent Activity</h3>
              <div className="recent-bids">
                {recentBids.length > 0 ? (
                  recentBids.map((bid, index) => (
                    <motion.div
                      key={`${bid.bid_id || bid.player_id}-${index}`}
                      className={`bid-item ${bid.type || 'bid'}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      {bid.type === 'sold' ? (
                        <>
                          <FaCheckCircle className="bid-icon sold" />
                          <div className="bid-content">
                            <span className="bid-player">{bid.player_name}</span>
                            <span className="bid-details">
                              SOLD to {bid.team_name} for {formatCurrency(bid.sold_price)}
                            </span>
                          </div>
                        </>
                      ) : bid.type === 'unsold' ? (
                        <>
                          <FaTimesCircle className="bid-icon unsold" />
                          <div className="bid-content">
                            <span className="bid-player">{bid.player_name}</span>
                            <span className="bid-details">UNSOLD</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <FaGavel className="bid-icon" />
                          <div className="bid-content">
                            <span className="bid-team">{bid.team_name}</span>
                            <span className="bid-details">
                              bid {formatCurrency(bid.bid_amount)} for {bid.player_name}
                            </span>
                          </div>
                        </>
                      )}
                    </motion.div>
                  ))
                ) : (
                  <p className="no-activity">No recent activity</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {showEditModal && (
          <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
            <div className="modal-content edit-bid-modal" onClick={(e) => e.stopPropagation()}>
              <h2>Edit Last Bid</h2>
              <form onSubmit={submitEditBid}>
                <div className="form-group">
                  <label>Team</label>
                  <select 
                    value={editTeamId} 
                    onChange={(e) => setEditTeamId(e.target.value)}
                    required
                  >
                    <option value="">Select Team</option>
                    {teams.map(team => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Bid Amount (₹)</label>
                  <input
                    type="number"
                    value={editBidAmount}
                    onChange={(e) => setEditBidAmount(e.target.value)}
                    step="5000"
                    min={currentPlayer?.base_price || 10000}
                    required
                  />
                </div>

                {error && <p className="error-message">{error}</p>}

                <div className="modal-actions">
                  <button type="button" className="btn-cancel" onClick={() => setShowEditModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-save">
                    Update Bid
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveAuction;
