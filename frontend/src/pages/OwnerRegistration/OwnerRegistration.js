import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaUsers, FaBuilding, FaHome, FaTrophy, FaFileExcel, FaCheckCircle } from 'react-icons/fa';
import { ownerRegistrationAPI } from '../../services/api';
import './OwnerRegistration.css';

const OwnerRegistration = () => {
  const [formData, setFormData] = useState({
    owner_full_name: '',
    co_owner_full_name: '',
    owner_block: '',
    owner_unit_number: '',
    co_owner_block: '',
    co_owner_unit_number: '',
    interested_to_buy: false,
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [registrations, setRegistrations] = useState([]);

  const blocks = [
    'Ophelia', 'Bianca', 'Orion', 'Cygnus', 
    'Phoenix', 'Mynsa', 'Europa', 'Atlas', 'Capella'
  ];

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      const response = await ownerRegistrationAPI.getAll();
      setRegistrations(response.data);
    } catch (err) {
      console.error('Error fetching registrations:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      await ownerRegistrationAPI.register(formData);
      setSuccess(true);
      setFormData({
        owner_full_name: '',
        co_owner_full_name: '',
        owner_block: '',
        owner_unit_number: '',
        co_owner_block: '',
        co_owner_unit_number: '',
        interested_to_buy: false,
      });
      fetchRegistrations();
      
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      const response = await ownerRegistrationAPI.exportExcel();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `GPL_Season2_Owner_Registrations_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error exporting Excel:', err);
      alert('Failed to export Excel file');
    }
  };

  return (
    <div className="owner-registration-container">
      {/* Hero Section */}
      <motion.div 
        className="owner-hero"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="hero-content">
          <FaTrophy className="hero-icon" />
          <h1>Galaxia Premier League</h1>
          <h2>Season 2</h2>
          <div className="event-details">
            <div className="event-detail-item">
              <strong>Tournament Dates:</strong>
              <span>10-11 January 2026</span>
            </div>
            <div className="event-detail-item">
              <strong>Auction Date:</strong>
              <span>2nd November 2025</span>
            </div>
            <div className="event-detail-item">
              <strong>Venue:</strong>
              <span>Club Stella</span>
            </div>
            <div className="event-detail-item highlight">
              <strong>Team Price:</strong>
              <span>₹15,000 INR</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Success Message */}
      {success && (
        <motion.div 
          className="success-banner"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <FaCheckCircle />
          <span>Registration submitted successfully! We'll contact you soon.</span>
        </motion.div>
      )}

      {/* Registration Form */}
      <motion.div 
        className="registration-form-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="form-header">
          <FaUsers className="form-icon" />
          <h2>Team Owner Registration</h2>
          <p>Express your interest in owning one of the 12 available teams</p>
        </div>

        <form onSubmit={handleSubmit} className="owner-form">
          {/* Owner Details */}
          <div className="form-section">
            <h3><FaUser className="section-icon" /> Owner Details</h3>
            
            <div className="form-group">
              <label htmlFor="owner_full_name">
                Full Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="owner_full_name"
                name="owner_full_name"
                value={formData.owner_full_name}
                onChange={handleChange}
                required
                placeholder="Enter owner's full name"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="owner_block">
                  <FaBuilding className="inline-icon" /> Residential Block <span className="required">*</span>
                </label>
                <select
                  id="owner_block"
                  name="owner_block"
                  value={formData.owner_block}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Block</option>
                  {blocks.map(block => (
                    <option key={block} value={block}>{block}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="owner_unit_number">
                  <FaHome className="inline-icon" /> Unit Number <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="owner_unit_number"
                  name="owner_unit_number"
                  value={formData.owner_unit_number}
                  onChange={handleChange}
                  required
                  placeholder="e.g., 101"
                />
              </div>
            </div>
          </div>

          {/* Co-Owner Details */}
          <div className="form-section">
            <h3><FaUsers className="section-icon" /> Co-Owner Details</h3>
            
            <div className="form-group">
              <label htmlFor="co_owner_full_name">
                Full Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="co_owner_full_name"
                name="co_owner_full_name"
                value={formData.co_owner_full_name}
                onChange={handleChange}
                required
                placeholder="Enter co-owner's full name"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="co_owner_block">
                  <FaBuilding className="inline-icon" /> Residential Block <span className="required">*</span>
                </label>
                <select
                  id="co_owner_block"
                  name="co_owner_block"
                  value={formData.co_owner_block}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Block</option>
                  {blocks.map(block => (
                    <option key={block} value={block}>{block}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="co_owner_unit_number">
                  <FaHome className="inline-icon" /> Unit Number <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="co_owner_unit_number"
                  name="co_owner_unit_number"
                  value={formData.co_owner_unit_number}
                  onChange={handleChange}
                  required
                  placeholder="e.g., 202"
                />
              </div>
            </div>
          </div>

          {/* Interest Section */}
          <div className="form-section interest-section">
            <h3><FaTrophy className="section-icon" /> Team Purchase Interest</h3>
            
            <div className="interest-card">
              <div className="interest-info">
                <p className="interest-text">
                  Are you interested in purchasing a team for <strong>₹15,000 INR</strong>?
                </p>
                <p className="interest-subtext">
                  This amount covers team registration and jerseys for all players.
                </p>
              </div>
              
              <div className="radio-group">
                <label className="radio-option">
                  <input
                    type="radio"
                    name="interested_to_buy"
                    value="true"
                    checked={formData.interested_to_buy === true}
                    onChange={() => setFormData(prev => ({ ...prev, interested_to_buy: true }))}
                  />
                  <span className="radio-label yes">✓ Yes, I'm Interested</span>
                </label>
                
                <label className="radio-option">
                  <input
                    type="radio"
                    name="interested_to_buy"
                    value="false"
                    checked={formData.interested_to_buy === false}
                    onChange={() => setFormData(prev => ({ ...prev, interested_to_buy: false }))}
                  />
                  <span className="radio-label no">✗ No, Not at this time</span>
                </label>
              </div>
            </div>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-actions">
            <button 
              type="submit" 
              className="btn-submit"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Registration'}
            </button>
          </div>
        </form>
      </motion.div>

      {/* Admin Section - Export */}
      <motion.div 
        className="admin-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <div className="admin-header">
          <h3>Registrations Summary</h3>
          <button 
            onClick={handleExportExcel}
            className="btn-export"
          >
            <FaFileExcel /> Export to Excel
          </button>
        </div>
        
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{registrations.length}</div>
            <div className="stat-label">Total Registrations</div>
          </div>
          <div className="stat-card interested">
            <div className="stat-number">
              {registrations.filter(r => r.interested_to_buy).length}
            </div>
            <div className="stat-label">Interested to Buy</div>
          </div>
          <div className="stat-card available">
            <div className="stat-number">12</div>
            <div className="stat-label">Teams Available</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Fix missing import
const FaUser = FaUsers;

export default OwnerRegistration;
