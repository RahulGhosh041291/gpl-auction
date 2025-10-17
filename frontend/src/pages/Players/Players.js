import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaUser, FaCheckCircle, FaTimesCircle, FaFilter, FaEdit, FaTrash, FaDownload } from 'react-icons/fa';
import { playersAPI, API_URL } from '../../services/api';
import axios from 'axios';
import './Players.css';

const Players = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    status: '',
    role: '',
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    // Check if user is admin
    const role = localStorage.getItem('role');
    setIsAdmin(role === 'admin');
    fetchPlayers();
  }, [filter]);

  const fetchPlayers = async () => {
    try {
      const params = {};
      if (filter.status) params.status = filter.status;
      if (filter.role) params.role = filter.role;
      
      const response = await playersAPI.getAll(params);
      setPlayers(response.data);
    } catch (error) {
      console.error('Error fetching players:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      registered: { text: 'Registered', color: '#3b82f6' },
      available: { text: 'Available', color: '#10b981' },
      sold: { text: 'Sold', color: '#f59e0b' },
      unsold: { text: 'Unsold', color: '#6b7280' },
    };
    
    const badge = badges[status] || badges.registered;
    
    return (
      <span className="status-badge" style={{ background: badge.color }}>
        {badge.text}
      </span>
    );
  };

  const getRoleBadge = (role) => {
    const roleColors = {
      batsman: '#6366f1',
      bowler: '#ef4444',
      all_rounder: '#10b981',
      wicket_keeper: '#f59e0b',
    };
    
    return (
      <span className="role-badge" style={{ background: roleColors[role] || '#6366f1' }}>
        {role.replace('_', ' ')}
      </span>
    );
  };

  const handleDeletePlayer = async (e, playerId) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!window.confirm('Are you sure you want to delete this player?')) {
      return;
    }

    try {
      await playersAPI.delete(playerId);
      alert('Player deleted successfully');
      fetchPlayers();
    } catch (error) {
      console.error('Error deleting player:', error);
      console.error('Error response:', error.response);
      
      let errorMessage = 'Failed to delete player. ';
      if (error.response) {
        errorMessage += `Server responded with ${error.response.status}: ${error.response.data?.detail || error.response.statusText}`;
      } else if (error.request) {
        errorMessage += 'No response from server. Check if backend is running.';
      } else {
        errorMessage += error.message;
      }
      
      alert(errorMessage);
    }
  };

  const handleEditPlayer = (e, player) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingPlayer(player);
    setImagePreview(player.player_image || player.photo_url || null);
    setShowEditModal(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please upload a valid image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setEditingPlayer({
          ...editingPlayer,
          player_image: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdatePlayer = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const updateData = {
        name: editingPlayer.name,
        email: editingPlayer.email,
        phone: editingPlayer.phone_number,
        role: editingPlayer.role,
        base_price: editingPlayer.base_price,
        auction_order: editingPlayer.auction_order
      };
      
      // Add player_image if it was changed
      if (editingPlayer.player_image) {
        updateData.player_image = editingPlayer.player_image;
      }
      
      await axios.put(
        `${API_URL}/players/${editingPlayer.id}`,
        updateData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowEditModal(false);
      setEditingPlayer(null);
      setImagePreview(null);
      fetchPlayers();
    } catch (error) {
      console.error('Error updating player:', error);
      alert('Failed to update player: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleMarkAvailable = async (e, playerId) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!window.confirm('Mark this player as available for auction?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/players/${playerId}/mark-available`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Player marked as available for auction');
      fetchPlayers();
    } catch (error) {
      console.error('Error marking player available:', error);
      alert('Failed to mark player available: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleMarkUnsold = async (e, playerId, playerName) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!window.confirm(`Mark ${playerName} as UNSOLD? This will credit back the sold amount to the team.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/players/${playerId}/mark-unsold`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(response.data.message);
      fetchPlayers();
    } catch (error) {
      console.error('Error marking player unsold:', error);
      alert('Failed to mark player unsold: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleDownloadExcel = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('Please login first');
        return;
      }
      
      console.log('Starting Excel download...');
      console.log('Token:', token ? 'Present' : 'Missing');
      
      const response = await axios.get(`${API_URL}/players/export/excel`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob' // Important for file download
      });

      console.log('Response received:', response.status);
      console.log('Content-Type:', response.headers['content-type']);

      // Create a blob from the response
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });

      console.log('Blob created, size:', blob.size);

      // Create a link element and trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `gpl_players_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      alert('Players data downloaded successfully!');
    } catch (error) {
      console.error('Error downloading Excel:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.message);
      console.error('Error config:', error.config);
      
      let errorMessage = 'Failed to download Excel file. ';
      if (error.response) {
        errorMessage += `Server responded with ${error.response.status}: ${error.response.statusText}`;
        if (error.response.data) {
          console.error('Response data:', error.response.data);
          errorMessage += ` - ${JSON.stringify(error.response.data)}`;
        }
      } else if (error.request) {
        errorMessage += 'No response from server. Check if backend is running.';
      } else {
        errorMessage += error.message;
      }
      
      alert(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="players-page">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="players-page">
      <div className="players-container">
        <motion.div
          className="players-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h1>GPL Season 2 Players</h1>
            <p>{players.length} players registered</p>
          </div>
          
          <div className="header-actions">
            {isAdmin && (
              <button onClick={handleDownloadExcel} className="btn-download">
                <FaDownload /> Download Excel
              </button>
            )}
            
            <div className="filters">
              <div className="filter-group">
                <label>
                  <FaFilter /> Status
                </label>
                <select
                  value={filter.status}
                  onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                >
                  <option value="">All</option>
                  <option value="registered">Registered</option>
                  <option value="available">Available</option>
                  <option value="sold">Sold</option>
                  <option value="unsold">Unsold</option>
                </select>
              </div>

              <div className="filter-group">
                <label>
                  <FaFilter /> Role
                </label>
                <select
                  value={filter.role}
                  onChange={(e) => setFilter({ ...filter, role: e.target.value })}
                >
                  <option value="">All Roles</option>
                  <option value="batsman">Batsman</option>
                  <option value="bowler">Bowler</option>
                  <option value="all_rounder">All Rounder</option>
                  <option value="wicket_keeper">Wicket Keeper</option>
                </select>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="players-grid">
          {players.map((player, index) => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
            >
              <Link to={`/players/${player.id}`} className="player-card">
                <div className="player-card-header">
                  <div className="player-avatar">
                    {(player.player_image || player.photo_url) ? (
                      <img src={player.player_image || player.photo_url} alt={player.name} />
                    ) : (
                      <FaUser />
                    )}
                  </div>
                  <div className="player-badges">
                    {getStatusBadge(player.status)}
                    {player.has_cricheroes_data && (
                      <span className="cricheroes-badge" title="Cricheroes Data Available">
                        <FaCheckCircle /> Verified
                      </span>
                    )}
                  </div>
                </div>

                <div className="player-card-body">
                  <h3>{player.name}</h3>
                  {getRoleBadge(player.role)}
                  
                  <div className="player-stats-grid">
                    {player.has_cricheroes_data ? (
                      <>
                        <div className="stat-item">
                          <span className="stat-label">Matches</span>
                          <span className="stat-value">{player.matches_played}</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">Runs</span>
                          <span className="stat-value">{player.runs_scored}</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">Wickets</span>
                          <span className="stat-value">{player.wickets_taken}</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">Avg</span>
                          <span className="stat-value">{player.batting_average.toFixed(1)}</span>
                        </div>
                      </>
                    ) : (
                      <div className="new-player-badge">
                        <FaTimesCircle /> New Player - No Stats Available
                      </div>
                    )}
                  </div>

                  <div className="player-card-footer">
                    <div className="price-info">
                      <span className="price-label">Base Price</span>
                      <span className="price-value">₹{(player.base_price / 1000).toFixed(0)}K</span>
                    </div>
                    {player.sold_price && (
                      <div className="price-info sold">
                        <span className="price-label">Sold For</span>
                        <span className="price-value">₹{(player.sold_price / 1000).toFixed(0)}K</span>
                      </div>
                    )}
                    {player.auction_order && (
                      <div className="price-info auction-order">
                        <span className="price-label">Auction Order</span>
                        <span className="price-value">#{player.auction_order}</span>
                      </div>
                    )}
                  </div>

                  {isAdmin && (
                    <div className="player-actions" onClick={(e) => e.preventDefault()}>
                      {player.status === 'sold' && (
                        <button 
                          className="btn-mark-unsold"
                          onClick={(e) => handleMarkUnsold(e, player.id, player.name)}
                          title="Mark as Unsold (Credit back to team)"
                        >
                          ↩ Mark Unsold
                        </button>
                      )}
                      {player.registration_fee_paid && player.status !== 'available' && (
                        <button 
                          className="btn-mark-available"
                          onClick={(e) => handleMarkAvailable(e, player.id)}
                          title="Mark Available for Auction"
                        >
                          ✓ Mark Available
                        </button>
                      )}
                      <button 
                        className="btn-edit"
                        onClick={(e) => handleEditPlayer(e, player)}
                        title="Edit Player"
                      >
                        <FaEdit /> Edit
                      </button>
                      <button 
                        className="btn-delete"
                        onClick={(e) => handleDeletePlayer(e, player.id)}
                        title="Delete Player"
                      >
                        <FaTrash /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {players.length === 0 && (
          <div className="no-players">
            <FaUser className="no-players-icon" />
            <h3>No players found</h3>
            <p>Try adjusting your filters or check back later</p>
          </div>
        )}
      </div>

      {showEditModal && editingPlayer && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Player</h2>
            <form onSubmit={handleUpdatePlayer}>
              <div className="form-group">
                <label>Player Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                {imagePreview && (
                  <div style={{marginTop: '10px'}}>
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      style={{
                        width: '100px', 
                        height: '100px', 
                        objectFit: 'cover',
                        borderRadius: '8px',
                        border: '2px solid rgba(99, 102, 241, 0.3)'
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={editingPlayer.name}
                  onChange={(e) => setEditingPlayer({...editingPlayer, name: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={editingPlayer.email}
                  onChange={(e) => setEditingPlayer({...editingPlayer, email: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone</label>
                <input
                  type="text"
                  value={editingPlayer.phone_number}
                  onChange={(e) => setEditingPlayer({...editingPlayer, phone_number: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Role</label>
                <select
                  value={editingPlayer.role}
                  onChange={(e) => setEditingPlayer({...editingPlayer, role: e.target.value})}
                  required
                >
                  <option value="batsman">Batsman</option>
                  <option value="bowler">Bowler</option>
                  <option value="all_rounder">All Rounder</option>
                  <option value="wicket_keeper">Wicket Keeper</option>
                </select>
              </div>

              <div className="form-group">
                <label>Base Price (₹)</label>
                <input
                  type="number"
                  value={editingPlayer.base_price}
                  onChange={(e) => setEditingPlayer({...editingPlayer, base_price: parseInt(e.target.value)})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Auction Order (Optional)</label>
                <input
                  type="number"
                  value={editingPlayer.auction_order || ''}
                  onChange={(e) => setEditingPlayer({...editingPlayer, auction_order: e.target.value ? parseInt(e.target.value) : null})}
                  placeholder="Leave empty for default order"
                  min="1"
                />
                <small style={{color: '#94a3b8', fontSize: '12px', marginTop: '4px', display: 'block'}}>
                  Set custom order for auction. Lower numbers appear first.
                </small>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-save">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Players;
