import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaUserShield, FaUser, FaKey, FaLock, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { authAPI } from '../../services/api';
import './Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState({
    username: '',
    role: '',
    created_at: '',
    last_login: ''
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Get user info from localStorage
    const username = localStorage.getItem('username');
    const role = localStorage.getItem('role');

    setUserInfo({
      username: username || '',
      role: role || '',
    });

    // Optionally fetch from API for more details
    fetchUserDetails();
  }, [navigate]);

  const fetchUserDetails = async () => {
    try {
      const response = await authAPI.getMe();
      setUserInfo({
        username: response.data.username,
        role: response.data.role,
        created_at: response.data.created_at,
        last_login: response.data.last_login
      });
    } catch (err) {
      console.error('Error fetching user details:', err);
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear messages when user starts typing
    if (error) setError('');
    if (success) setSuccess('');
  };

  const validatePasswordForm = () => {
    if (!passwordForm.current_password) {
      setError('Please enter your current password');
      return false;
    }

    if (!passwordForm.new_password) {
      setError('Please enter a new password');
      return false;
    }

    if (passwordForm.new_password.length < 6) {
      setError('New password must be at least 6 characters long');
      return false;
    }

    if (passwordForm.new_password === passwordForm.current_password) {
      setError('New password must be different from current password');
      return false;
    }

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setError('New passwords do not match');
      return false;
    }

    return true;
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await authAPI.updatePassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password
      });

      setSuccess(response.data.message || 'Password updated successfully!');
      
      // Clear form
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });

      // Show success message for 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 5000);

    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="profile-container">
      <motion.div 
        className="profile-content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="profile-header">
          <div className="profile-header-icon">
            {userInfo.role === 'admin' ? (
              <FaUserShield className="header-icon admin" />
            ) : (
              <FaUser className="header-icon user" />
            )}
          </div>
          <h1>Profile & Settings</h1>
          <p>Manage your account information and security</p>
        </div>

        {/* User Information Card */}
        <motion.div 
          className="info-card"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h2>
            <FaUser className="section-icon" />
            Account Information
          </h2>
          
          <div className="info-grid">
            <div className="info-item">
              <label>Username</label>
              <div className="info-value">
                <strong>{userInfo.username}</strong>
              </div>
            </div>

            <div className="info-item">
              <label>Role</label>
              <div className="info-value">
                <span className={`role-badge ${userInfo.role}`}>
                  {userInfo.role === 'admin' ? (
                    <>
                      <FaUserShield /> Admin
                    </>
                  ) : (
                    <>
                      <FaUser /> Generic User
                    </>
                  )}
                </span>
              </div>
            </div>

            {userInfo.created_at && (
              <div className="info-item">
                <label>Account Created</label>
                <div className="info-value">{formatDate(userInfo.created_at)}</div>
              </div>
            )}

            {userInfo.last_login && (
              <div className="info-item">
                <label>Last Login</label>
                <div className="info-value">{formatDate(userInfo.last_login)}</div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Password Update Card */}
        <motion.div 
          className="password-card"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2>
            <FaKey className="section-icon" />
            Change Password
          </h2>

          {success && (
            <motion.div 
              className="message success-message"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <FaCheckCircle />
              <span>{success}</span>
            </motion.div>
          )}

          {error && (
            <motion.div 
              className="message error-message"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <FaExclamationTriangle />
              <span>{error}</span>
            </motion.div>
          )}

          <form onSubmit={handlePasswordUpdate} className="password-form">
            <div className="form-group">
              <label htmlFor="current_password">
                <FaLock className="input-icon" />
                Current Password
              </label>
              <input
                type={showPasswords ? "text" : "password"}
                id="current_password"
                name="current_password"
                value={passwordForm.current_password}
                onChange={handlePasswordChange}
                placeholder="Enter your current password"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="new_password">
                <FaKey className="input-icon" />
                New Password
              </label>
              <input
                type={showPasswords ? "text" : "password"}
                id="new_password"
                name="new_password"
                value={passwordForm.new_password}
                onChange={handlePasswordChange}
                placeholder="Enter new password (min 6 characters)"
                required
              />
              <small className="form-hint">
                Password must be at least 6 characters long
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="confirm_password">
                <FaKey className="input-icon" />
                Confirm New Password
              </label>
              <input
                type={showPasswords ? "text" : "password"}
                id="confirm_password"
                name="confirm_password"
                value={passwordForm.confirm_password}
                onChange={handlePasswordChange}
                placeholder="Re-enter new password"
                required
              />
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={showPasswords}
                  onChange={(e) => setShowPasswords(e.target.checked)}
                />
                <span>Show passwords</span>
              </label>
            </div>

            <div className="form-actions">
              <button 
                type="submit" 
                className="btn-update"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="spinner"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <FaKey /> Update Password
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>

        {/* Security Tips */}
        <motion.div 
          className="security-tips"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h3>Security Tips</h3>
          <ul>
            <li>Use a strong password with at least 6 characters</li>
            <li>Don't share your password with anyone</li>
            <li>Change your password regularly</li>
            <li>Use different passwords for different accounts</li>
            <li>Log out when using shared computers</li>
          </ul>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Profile;
