import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './TeamRegistration.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const TeamRegistration = () => {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [formData, setFormData] = useState({
    team_id: '',
    owner_name: '',
    owner_email: '',
    owner_phone: '',
    sponsor_name: '',
    sponsor_details: '',
    about_us: '',
    logo_url: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);

  useEffect(() => {
    fetchUnregisteredTeams();
  }, []);

  const fetchUnregisteredTeams = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/teams/unregistered`);
      setTeams(response.data);
    } catch (err) {
      console.error('Error fetching teams:', err);
      setError('Failed to load teams');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please upload a valid image file');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        setError('Logo size should be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
        setFormData({
          ...formData,
          logo_url: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_BASE_URL}/api/teams/register`, {
        ...formData,
        team_id: parseInt(formData.team_id)
      });
      
      setSuccess(true);
      
      setTimeout(() => {
        navigate(`/teams/${response.data.id}`);
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Team registration failed. Please try again.');
      setLoading(false);
    }
  };

  const selectedTeam = teams.find(t => t.id === parseInt(formData.team_id));

  return (
    <div className="team-registration">
      <div className="team-registration-container">
        <motion.div
          className="team-registration-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="team-registration-header">
            <h1>Team Registration</h1>
            <p>GPL Season 2 - Complete Your Team Setup</p>
          </div>

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success">
              ✅ Team registered successfully! Redirecting...
            </div>
          )}

          <form onSubmit={handleSubmit} className="team-registration-form">
            <div className="form-group">
              <label htmlFor="team_id">Select Your Team *</label>
              <select
                id="team_id"
                name="team_id"
                value={formData.team_id}
                onChange={handleChange}
                required
              >
                <option value="">Choose a team</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>
                    {team.name} ({team.short_name})
                  </option>
                ))}
              </select>
            </div>

            {selectedTeam && (
              <div className="team-info-preview">
                <h3>{selectedTeam.name}</h3>
                <div className="team-colors">
                  <div 
                    className="color-box" 
                    style={{backgroundColor: selectedTeam.color_primary}}
                    title="Primary Color"
                  ></div>
                  <div 
                    className="color-box" 
                    style={{backgroundColor: selectedTeam.color_secondary}}
                    title="Secondary Color"
                  ></div>
                </div>
                <p>Budget: ₹{selectedTeam.budget.toLocaleString()}</p>
              </div>
            )}

            <div className="form-section-title">Owner Information</div>

            <div className="form-group">
              <label htmlFor="owner_name">Owner Name *</label>
              <input
                type="text"
                id="owner_name"
                name="owner_name"
                value={formData.owner_name}
                onChange={handleChange}
                required
                placeholder="Enter owner name"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="owner_email">Owner Email *</label>
                <input
                  type="email"
                  id="owner_email"
                  name="owner_email"
                  value={formData.owner_email}
                  onChange={handleChange}
                  required
                  placeholder="owner@example.com"
                />
              </div>

              <div className="form-group">
                <label htmlFor="owner_phone">Owner Phone *</label>
                <input
                  type="tel"
                  id="owner_phone"
                  name="owner_phone"
                  value={formData.owner_phone}
                  onChange={handleChange}
                  required
                  placeholder="+91 1234567890"
                />
              </div>
            </div>

            <div className="form-section-title">Team Details</div>

            <div className="form-group">
              <label htmlFor="logo_url">Team Logo</label>
              <div className="image-upload-container">
                <input
                  type="file"
                  id="logo_url"
                  name="logo_url"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="file-input"
                />
                {logoPreview && (
                  <div className="logo-preview">
                    <img src={logoPreview} alt="Team logo preview" />
                  </div>
                )}
              </div>
              <p className="form-hint">Upload your team logo (Max 5MB, JPG/PNG)</p>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="sponsor_name">Sponsor Name</label>
                <input
                  type="text"
                  id="sponsor_name"
                  name="sponsor_name"
                  value={formData.sponsor_name}
                  onChange={handleChange}
                  placeholder="Enter sponsor name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="sponsor_details">Sponsor Details</label>
                <input
                  type="text"
                  id="sponsor_details"
                  name="sponsor_details"
                  value={formData.sponsor_details}
                  onChange={handleChange}
                  placeholder="Sponsor website, contact, etc."
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="about_us">About Your Team</label>
              <textarea
                id="about_us"
                name="about_us"
                value={formData.about_us}
                onChange={handleChange}
                rows="4"
                placeholder="Tell us about your team's vision, strategy, and goals..."
              />
            </div>

            <div className="team-registration-info">
              <div className="info-item">
                <strong>Total Budget:</strong> ₹10,00,000
              </div>
              <div className="info-item">
                <strong>Minimum Players:</strong> 12
              </div>
              <div className="info-item">
                <strong>Maximum Players:</strong> 15
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-large"
              disabled={loading || success || !formData.team_id}
            >
              {loading ? 'Registering...' : success ? '✓ Registered!' : 'Complete Team Registration'}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default TeamRegistration;
