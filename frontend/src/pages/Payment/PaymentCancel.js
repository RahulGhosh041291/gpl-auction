import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaTimesCircle } from 'react-icons/fa';
import './Payment.css';

const PaymentCancel = () => {
  const navigate = useNavigate();

  return (
    <div className="payment-page">
      <motion.div
        className="payment-container"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="cancel-icon"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        >
          <FaTimesCircle />
        </motion.div>
        
        <h1>Payment Cancelled</h1>
        <p>Your registration payment was not completed</p>
        
        <div className="cancel-message">
          <p>Don't worry! You can try again anytime.</p>
          <p>If you faced any issues, please contact support.</p>
        </div>

        <div className="payment-actions">
          <button
            onClick={() => navigate('/registration')}
            className="btn btn-primary"
          >
            Try Again
          </button>
          <button
            onClick={() => navigate('/')}
            className="btn btn-secondary"
          >
            Go Home
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentCancel;
