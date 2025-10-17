import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FaUsers, FaMoneyBillWave, FaTrophy, FaEdit } from 'react-icons/fa';
import { teamsAPI, API_URL } from '../../services/api';
import axios from 'axios';
import './Teams.css';

const Teams = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);

  useEffect(() => {
    const role = localStorage.getItem('role');
    setIsAdmin(role === 'admin');
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await teamsAPI.getAll();
      setTeams(response.data);
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamDetails = async (teamId) => {
    try {
      const response = await teamsAPI.getById(teamId);
      setSelectedTeam(response.data);
    } catch (error) {
      console.error('Error fetching team details:', error);
    }
  };

  const formatCurrency = (amount) => {
    return `₹${(amount / 1000).toFixed(0)}K`;
  };

  const handleEditTeam = (e, team) => {
    e.stopPropagation();
    setEditingTeam(team);
    setLogoPreview(team.team_logo || team.logo_url || null);
    setShowEditModal(true);
  };

  const handleLogoChange = (e) => {
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
        const base64Logo = reader.result;
        setLogoPreview(base64Logo);
        setEditingTeam({
          ...editingTeam,
          team_logo: base64Logo
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateTeam = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const updateData = {
        name: editingTeam.name,
        short_name: editingTeam.short_name,
        owner_name: editingTeam.owner_name,
        color_primary: editingTeam.color_primary,
        color_secondary: editingTeam.color_secondary
      };

      // Only include team_logo if it was changed
      if (editingTeam.team_logo && editingTeam.team_logo.startsWith('data:')) {
        updateData.team_logo = editingTeam.team_logo;
      }
      
      await axios.put(
        `${API_URL}/teams/${editingTeam.id}`,
        updateData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowEditModal(false);
      setEditingTeam(null);
      setLogoPreview(null);
      fetchTeams();
    } catch (error) {
      console.error('Error updating team:', error);
      alert('Failed to update team: ' + (error.response?.data?.detail || error.message));
    }
  };

  if (loading) {
    return (
      <div className="teams-page">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="teams-page">
      <div className="teams-container">
        <motion.div
          className="teams-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1>GPL Season 2 Teams</h1>
          <p>12 teams competing for glory with ₹5 Lakh budget each</p>
        </motion.div>

        <div className="teams-grid">
          {teams.map((team, index) => (
            <motion.div
              key={team.id}
              className="team-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => fetchTeamDetails(team.id)}
              style={{
                borderColor: team.color_primary || '#6366f1',
              }}
            >
              <div
                className="team-card-header"
                style={{
                  background: `linear-gradient(135deg, ${team.color_primary || '#6366f1'}, ${team.color_secondary || '#8b5cf6'})`,
                }}
              >
                <div className="team-logo">
                  {team.team_logo || team.logo_url ? (
                    <img src={team.team_logo || team.logo_url} alt={team.name} />
                  ) : (
                    <FaTrophy />
                  )}
                </div>
                <h3>{team.name}</h3>
                <span className="team-short-name">{team.short_name}</span>
              </div>

              <div className="team-card-body">
                <div className="team-stat">
                  <FaUsers className="stat-icon" />
                  <div>
                    <span className="stat-label">Players</span>
                    <span className="stat-value">{team.players_count}/15</span>
                  </div>
                </div>

                <div className="team-stat">
                  <FaMoneyBillWave className="stat-icon" />
                  <div>
                    <span className="stat-label">Budget Left</span>
                    <span className="stat-value">{formatCurrency(team.remaining_budget)}</span>
                  </div>
                </div>

                <div className="team-stat">
                  <FaMoneyBillWave className="stat-icon" />
                  <div>
                    <span className="stat-label">Max Bid</span>
                    <span className="stat-value">{formatCurrency(team.max_bid_limit || 0)}</span>
                  </div>
                </div>

                <div className="budget-bar">
                  <div
                    className="budget-bar-fill"
                    style={{
                      width: `${(team.remaining_budget / team.budget) * 100}%`,
                      background: team.color_primary || '#6366f1',
                    }}
                  />
                </div>

                {team.players_count < 10 && (
                  <div className="team-warning">
                    <span>⚠️ Min {10 - team.players_count} more players needed</span>
                  </div>
                )}

                {isAdmin && (
                  <div className="team-actions" onClick={(e) => e.stopPropagation()}>
                    <button 
                      className="btn-edit"
                      onClick={(e) => handleEditTeam(e, team)}
                      title="Edit Team"
                    >
                      <FaEdit /> Edit
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {selectedTeam && (
          <motion.div
            className="team-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setSelectedTeam(null)}
          >
            <motion.div
              className="team-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                borderTop: `4px solid ${selectedTeam.color_primary || '#6366f1'}`,
              }}
            >
              <div className="modal-header">
                <div className="modal-team-info">
                  <div
                    className="modal-team-logo"
                    style={{
                      background: `linear-gradient(135deg, ${selectedTeam.color_primary}, ${selectedTeam.color_secondary})`,
                    }}
                  >
                    {selectedTeam.team_logo || selectedTeam.logo_url ? (
                      <img src={selectedTeam.team_logo || selectedTeam.logo_url} alt={selectedTeam.name} style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%'}} />
                    ) : (
                      <FaTrophy />
                    )}
                  </div>
                  <div>
                    <h2>{selectedTeam.name}</h2>
                    <span>{selectedTeam.short_name}</span>
                  </div>
                </div>
                <button onClick={() => setSelectedTeam(null)} className="modal-close">
                  ×
                </button>
              </div>

              <div className="modal-body">
                <div className="modal-stats">
                  <div className="modal-stat-card">
                    <h4>Total Budget</h4>
                    <p>{formatCurrency(selectedTeam.budget)}</p>
                  </div>
                  <div className="modal-stat-card">
                    <h4>Remaining</h4>
                    <p>{formatCurrency(selectedTeam.remaining_budget)}</p>
                  </div>
                  <div className="modal-stat-card">
                    <h4>Players</h4>
                    <p>{selectedTeam.players_count}</p>
                  </div>
                  <div className="modal-stat-card">
                    <h4>Max Bid</h4>
                    <p>{formatCurrency(selectedTeam.max_bid_limit || 0)}</p>
                  </div>
                </div>

                <div className="modal-players">
                  <h3>Squad ({selectedTeam.players?.length || 0} players)</h3>
                  {selectedTeam.players && selectedTeam.players.length > 0 ? (
                    <div className="players-list">
                      {selectedTeam.players.map((player) => (
                        <div key={player.id} className="player-item">
                          <div className="player-info">
                            <span className="player-name">{player.name}</span>
                            <span className="player-role">{player.role}</span>
                          </div>
                          <span className="player-price">
                            {formatCurrency(player.sold_price)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-players">No players yet</p>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showEditModal && editingTeam && (
          <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
            <div className="modal-content edit-modal" onClick={(e) => e.stopPropagation()}>
              <h2>Edit Team</h2>
              <form onSubmit={handleUpdateTeam}>
                <div className="form-group">
                  <label>Team Logo</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                  />
                  {logoPreview && (
                    <div style={{marginTop: '10px'}}>
                      <img
                        src={logoPreview}
                        alt="Logo Preview"
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
                  <label>Team Name</label>
                  <input
                    type="text"
                    value={editingTeam.name}
                    onChange={(e) => setEditingTeam({...editingTeam, name: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Short Name</label>
                  <input
                    type="text"
                    value={editingTeam.short_name}
                    onChange={(e) => setEditingTeam({...editingTeam, short_name: e.target.value})}
                    maxLength="5"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Owner Name</label>
                  <input
                    type="text"
                    value={editingTeam.owner_name}
                    onChange={(e) => setEditingTeam({...editingTeam, owner_name: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Primary Color</label>
                  <input
                    type="color"
                    value={editingTeam.color_primary || '#6366f1'}
                    onChange={(e) => setEditingTeam({...editingTeam, color_primary: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>Secondary Color</label>
                  <input
                    type="color"
                    value={editingTeam.color_secondary || '#8b5cf6'}
                    onChange={(e) => setEditingTeam({...editingTeam, color_secondary: e.target.value})}
                  />
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
    </div>
  );
};

export default Teams;
