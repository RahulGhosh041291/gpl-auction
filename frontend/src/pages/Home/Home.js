import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaTrophy, FaUsers, FaGavel, FaRocket } from 'react-icons/fa';
import { teamsAPI, playersAPI } from '../../services/api';
import './Home.css';

const Home = () => {
  const [stats, setStats] = useState({
    teams: 0,
    players: 0,
    availablePlayers: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [teamsRes, playersRes, availableRes] = await Promise.all([
          teamsAPI.getAll(),
          playersAPI.getAll(),
          playersAPI.getAvailableCount(),
        ]);
        
        setStats({
          teams: teamsRes.data.length,
          players: playersRes.data.length,
          availablePlayers: availableRes.data.count,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <div className="home">
      <motion.div
        className="hero-section"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div className="hero-content" variants={itemVariants}>
          <div className="hero-badge">
            <FaRocket /> Season 2 is Here!
          </div>
          <h1 className="hero-title">
            <span className="gradient-text">Galaxia Premier League</span>
            <br />
            Season 2 Auction
          </h1>
          <p className="hero-description">
            Experience the thrill of IPL-style cricket auction with 12 teams competing for the best players.
            Join the action or register as a player today!
          </p>
          <div className="hero-actions">
            <Link to="/auction" className="btn btn-primary btn-large">
              <FaGavel /> Watch Live Auction
            </Link>
            <Link to="/registration" className="btn btn-secondary btn-large">
              <FaUsers /> Register as Player
            </Link>
          </div>
        </motion.div>

        <motion.div className="hero-image" variants={itemVariants}>
          <div className="floating-card">
            <FaTrophy className="trophy-icon" />
            <div className="trophy-glow"></div>
          </div>
        </motion.div>
      </motion.div>

      <motion.div
        className="stats-section"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
      >
        <motion.div className="stat-card" variants={itemVariants}>
          <div className="stat-icon teams-icon">
            <FaUsers />
          </div>
          <div className="stat-content">
            <h3 className="stat-number">{stats.teams}</h3>
            <p className="stat-label">Teams</p>
          </div>
        </motion.div>

        <motion.div className="stat-card" variants={itemVariants}>
          <div className="stat-icon players-icon">
            <FaUsers />
          </div>
          <div className="stat-content">
            <h3 className="stat-number">{stats.players}</h3>
            <p className="stat-label">Registered Players</p>
          </div>
        </motion.div>

        <motion.div className="stat-card" variants={itemVariants}>
          <div className="stat-icon auction-icon">
            <FaGavel />
          </div>
          <div className="stat-content">
            <h3 className="stat-number">{stats.availablePlayers}</h3>
            <p className="stat-label">Available for Auction</p>
          </div>
        </motion.div>

        <motion.div className="stat-card" variants={itemVariants}>
          <div className="stat-icon budget-icon">
            <FaTrophy />
          </div>
          <div className="stat-content">
            <h3 className="stat-number">₹5L</h3>
            <p className="stat-label">Team Budget</p>
          </div>
        </motion.div>
      </motion.div>

      <motion.div
        className="features-section"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
      >
        <h2 className="section-title">How It Works</h2>
        
        <div className="features-grid">
          <motion.div className="feature-card" variants={itemVariants}>
            <div className="feature-number">01</div>
            <h3>Register</h3>
            <p>Pay ₹500 registration fee and create your player profile with stats from Cricheroes.</p>
          </motion.div>

          <motion.div className="feature-card" variants={itemVariants}>
            <div className="feature-number">02</div>
            <h3>Get Verified</h3>
            <p>Complete payment and get approved for the auction pool.</p>
          </motion.div>

          <motion.div className="feature-card" variants={itemVariants}>
            <div className="feature-number">03</div>
            <h3>Auction Day</h3>
            <p>12 teams bid for players with ₹10 lakh budget. Base price starts at ₹10,000.</p>
          </motion.div>

          <motion.div className="feature-card" variants={itemVariants}>
            <div className="feature-number">04</div>
            <h3>Join Your Team</h3>
            <p>Get selected by a team and represent them in GPL Season 2!</p>
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        className="cta-section"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={itemVariants}
      >
        <div className="cta-content">
          <h2>Ready to Join the League?</h2>
          <p>Register now and showcase your cricket skills in GPL Season 2</p>
          <Link to="/registration" className="btn btn-primary btn-large">
            Register Now - ₹500
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Home;
