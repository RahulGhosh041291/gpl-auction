import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaUser, FaCheckCircle, FaTimesCircle, FaArrowLeft, FaTrophy } from 'react-icons/fa';
import { playersAPI } from '../../services/api';
import './PlayerProfile.css';

const PlayerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlayer();
  }, [id]);

  const fetchPlayer = async () => {
    try {
      const response = await playersAPI.getById(id);
      setPlayer(response.data);
    } catch (error) {
      console.error('Error fetching player:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="player-profile-page">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="player-profile-page">
        <div className="error-message">
          <h2>Player not found</h2>
          <button onClick={() => navigate('/players')} className="btn btn-primary">
            Back to Players
          </button>
        </div>
      </div>
    );
  }

  const getRoleColor = (role) => {
    const colors = {
      batsman: '#6366f1',
      bowler: '#ef4444',
      all_rounder: '#10b981',
      wicket_keeper: '#f59e0b',
    };
    return colors[role] || '#6366f1';
  };

  return (
    <div className="player-profile-page">
      <div className="profile-container">
        <motion.button
          className="back-button"
          onClick={() => navigate('/players')}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <FaArrowLeft /> Back to Players
        </motion.button>

        <motion.div
          className="profile-header"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: `linear-gradient(135deg, ${getRoleColor(player.role)}22 0%, ${getRoleColor(player.role)}11 100%)`,
          }}
        >
          <div className="profile-avatar-large">
            {(player.player_image || player.photo_url) ? (
              <img src={player.player_image || player.photo_url} alt={player.name} />
            ) : (
              <FaUser />
            )}
          </div>

          <div className="profile-info">
            <div className="profile-badges">
              <span
                className="role-badge-large"
                style={{ background: getRoleColor(player.role) }}
              >
                {player.role.replace('_', ' ')}
              </span>
              {player.has_cricheroes_data && (
                <span className="verified-badge">
                  <FaCheckCircle /> Cricheroes Verified
                </span>
              )}
            </div>

            <h1>{player.name}</h1>
            <p className="player-email">{player.email}</p>

            <div className="player-styles">
              {player.batting_style && (
                <span className="style-tag">🏏 {player.batting_style}</span>
              )}
              {player.bowling_style && (
                <span className="style-tag">⚡ {player.bowling_style}</span>
              )}
            </div>

            {player.team && (
              <div className="team-info">
                <FaTrophy /> Playing for: <strong>{player.team.name}</strong>
              </div>
            )}
          </div>
        </motion.div>

        <div className="profile-content">
          <motion.div
            className="profile-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2>Auction Details</h2>
            <div className="auction-details-grid">
              <div className="detail-card">
                <span className="detail-label">Base Price</span>
                <span className="detail-value">₹{(player.base_price / 1000).toFixed(0)}K</span>
              </div>
              
              {player.sold_price && (
                <div className="detail-card highlight">
                  <span className="detail-label">Sold Price</span>
                  <span className="detail-value sold">₹{(player.sold_price / 1000).toFixed(0)}K</span>
                </div>
              )}
              
              <div className="detail-card">
                <span className="detail-label">Status</span>
                <span className="detail-value status">{player.status}</span>
              </div>
              
              <div className="detail-card">
                <span className="detail-label">Registration Fee</span>
                <span className={`detail-value ${player.registration_fee_paid ? 'paid' : 'pending'}`}>
                  {player.registration_fee_paid ? (
                    <><FaCheckCircle /> Paid</>
                  ) : (
                    <><FaTimesCircle /> Pending</>
                  )}
                </span>
              </div>
            </div>
          </motion.div>

          {player.has_cricheroes_data ? (
            <motion.div
              className="profile-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2>Career Statistics</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: getRoleColor(player.role) }}>
                    🎯
                  </div>
                  <div className="stat-content">
                    <span className="stat-number">{player.matches_played}</span>
                    <span className="stat-label">Matches Played</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon" style={{ background: '#10b981' }}>
                    🏏
                  </div>
                  <div className="stat-content">
                    <span className="stat-number">{player.runs_scored}</span>
                    <span className="stat-label">Runs Scored</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon" style={{ background: '#ef4444' }}>
                    ⚡
                  </div>
                  <div className="stat-content">
                    <span className="stat-number">{player.wickets_taken}</span>
                    <span className="stat-label">Wickets Taken</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon" style={{ background: '#f59e0b' }}>
                    📊
                  </div>
                  <div className="stat-content">
                    <span className="stat-number">{player.batting_average.toFixed(2)}</span>
                    <span className="stat-label">Batting Average</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon" style={{ background: '#8b5cf6' }}>
                    🎲
                  </div>
                  <div className="stat-content">
                    <span className="stat-number">{player.bowling_average.toFixed(2)}</span>
                    <span className="stat-label">Bowling Average</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon" style={{ background: '#06b6d4' }}>
                    ⚡
                  </div>
                  <div className="stat-content">
                    <span className="stat-number">{player.strike_rate.toFixed(2)}</span>
                    <span className="stat-label">Strike Rate</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              className="profile-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="no-stats-message">
                <FaTimesCircle className="no-stats-icon" />
                <h3>New Player</h3>
                <p>No Cricheroes data available for this player</p>
                <p className="no-stats-sub">Stats will be updated after playing matches in GPL Season 2</p>
              </div>
            </motion.div>
          )}

          {player.bio && (
            <motion.div
              className="profile-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2>About</h2>
              <p className="bio-text">{player.bio}</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerProfile;
