import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaTrophy, FaUsers, FaUserPlus, FaGavel, FaSignInAlt, FaSignOutAlt, FaUserShield } from 'react-icons/fa';
import './Navbar.css';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const storedUsername = localStorage.getItem('username');
    const storedRole = localStorage.getItem('role');
    
    if (token && storedUsername) {
      setIsLoggedIn(true);
      setUsername(storedUsername);
      setUserRole(storedRole);
    }
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    setIsLoggedIn(false);
    setUsername('');
    setUserRole('');
    navigate('/login');
  };

  const navItems = [
    { path: '/', label: 'Home', icon: <FaTrophy /> },
    { path: '/teams', label: 'Teams', icon: <FaUsers /> },
    { path: '/players', label: 'Players', icon: <FaUsers /> },
    { path: '/auction', label: 'Live Auction', icon: <FaGavel /> },
    { path: '/registration', label: 'Player Registration', icon: <FaUserPlus /> },
    { path: '/owner-registration', label: 'Owner Registration', icon: <FaUserShield /> },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <FaTrophy className="logo-icon" />
          <span className="logo-text">
            <span className="logo-main">GPL</span>
            <span className="logo-sub">Season 2</span>
          </span>
        </Link>

        <div className={`navbar-menu ${isMenuOpen ? 'active' : ''}`}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`navbar-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => setIsMenuOpen(false)}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}

          {isLoggedIn ? (
            <div className="navbar-user-section">
              <span className="navbar-user-info">
                {userRole === 'admin' && <FaUserShield className="role-icon" />}
                <span className="username">{username}</span>
              </span>
              <button 
                className="navbar-logout-btn"
                onClick={handleLogout}
              >
                <FaSignOutAlt />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className={`navbar-item login-item ${location.pathname === '/login' ? 'active' : ''}`}
              onClick={() => setIsMenuOpen(false)}
            >
              <FaSignInAlt />
              <span>Login</span>
            </Link>
          )}
        </div>

        <button
          className="navbar-toggle"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
