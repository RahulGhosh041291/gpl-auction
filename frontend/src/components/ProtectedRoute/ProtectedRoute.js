import React from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './ProtectedRoute.css';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const username = localStorage.getItem('username');

  // If no token, redirect to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // If admin is required and user is not admin, show unauthorized
  if (requireAdmin && role !== 'admin') {
    return (
      <div className="unauthorized-container">
        <motion.div
          className="unauthorized-box"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="unauthorized-icon">🔒</div>
          <h1>Access Denied</h1>
          <p>You need admin privileges to access this page.</p>
          <p className="user-info">Logged in as: <strong>{username}</strong> ({role})</p>
          <button 
            className="btn-back"
            onClick={() => window.history.back()}
          >
            Go Back
          </button>
        </motion.div>
      </div>
    );
  }

  // User is authenticated and authorized
  return children;
};

export default ProtectedRoute;
