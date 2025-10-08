import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaCheckCircle } from 'react-icons/fa';
import { paymentsAPI, registrationAPI } from '../../services/api';
import './Payment.css';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [playerId, setPlayerId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('');

  useEffect(() => {
    const loadPaymentDetails = async () => {
      const playerIdParam = searchParams.get('player_id');
      const paymentIdParam = searchParams.get('payment_id');
      const methodParam = searchParams.get('method');
      
      if (!playerIdParam) {
        setVerifying(false);
        return;
      }

      try {
        setPlayerId(playerIdParam);
        setPaymentMethod(methodParam || 'UPI');
        setVerified(true);
        
        // Mark player as available
        await registrationAPI.completeRegistration(playerIdParam);
      } catch (error) {
        console.error('Error completing registration:', error);
      } finally {
        setVerifying(false);
      }
    };

    loadPaymentDetails();
  }, [searchParams]);

  if (verifying) {
    return (
      <div className="payment-page">
        <div className="payment-container">
          <div className="spinner"></div>
          <p>Verifying payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-page">
      <motion.div
        className="payment-container"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="success-icon"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        >
          <FaCheckCircle />
        </motion.div>
        
        <h1>Payment Successful!</h1>
        <p>Thank you for registering for GPL Season 2</p>
        
        <div className="payment-details">
          <div className="detail-item">
            <span>Amount Paid:</span>
            <strong>₹500</strong>
          </div>
          <div className="detail-item">
            <span>Payment Method:</span>
            <strong className="status-paid">{paymentMethod.toUpperCase()}</strong>
          </div>
          <div className="detail-item">
            <span>Status:</span>
            <strong className="status-paid">Confirmed</strong>
          </div>
          <div className="detail-item">
            <span>Base Auction Price:</span>
            <strong>₹10,000</strong>
          </div>
        </div>

        <div className="next-steps">
          <h3>What's Next?</h3>
          <ul>
            <li>✓ Your registration is complete</li>
            <li>✓ You're now available for auction</li>
            <li>✓ Teams can bid for you during the auction</li>
            <li>✓ Base price starts at ₹10,000</li>
          </ul>
        </div>

        <div className="payment-actions">
          {playerId && (
            <button
              onClick={() => navigate(`/players/${playerId}`)}
              className="btn btn-primary"
            >
              View My Profile
            </button>
          )}
          <button
            onClick={() => navigate('/players')}
            className="btn btn-secondary"
          >
            View All Players
          </button>
          <button
            onClick={() => navigate('/auction')}
            className="btn btn-secondary"
          >
            Go to Auction
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentSuccess;
