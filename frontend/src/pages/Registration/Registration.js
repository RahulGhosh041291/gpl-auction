import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { registrationAPI } from '../../services/api';
import './Registration.css';

const Registration = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    age: '',
    date_of_birth: '',
    role: 'batsman',
    batting_style: '',
    bowling_style: '',
    block_name: '',
    flat_number: '',
    payment_mode: '',
    amount: '',
    payment_transaction_number: '',
    payment_date: '',
    jersey_size: '',
    cricheroes_id: '',
    bio: '',
    player_image: '',  // Player image URL
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [cricheroesData, setCricheroesData] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Use functional form to avoid stale state issues
    setFormData(prevData => {
      const updated = {
        ...prevData,
        [name]: value,
      };
      // Log if player_image exists to detect if it's being lost
      if (prevData.player_image && !updated.player_image) {
        console.error('⚠️ player_image was LOST during field change!', name);
      }
      return updated;
    });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please upload a valid image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Image = reader.result;
        console.log('📸 Image loaded:', base64Image.substring(0, 50), '... Length:', base64Image.length);
        setImagePreview(base64Image);
        // Use functional form to ensure we get the latest state
        setFormData(prevData => ({
          ...prevData,
          player_image: base64Image  // Base64 encoded image
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const checkCricheroes = async () => {
    if (!formData.cricheroes_id) return;
    
    try {
      const response = await registrationAPI.checkCricheroes(formData.cricheroes_id);
      if (response.data.available) {
        setCricheroesData(response.data.data);
      }
    } catch (err) {
      console.error('Error checking Cricheroes:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Debug logging
      console.log('=== REGISTRATION SUBMIT DEBUG ===');
      console.log('Form data keys:', Object.keys(formData));
      console.log('player_image in formData:', 'player_image' in formData);
      console.log('Has player_image:', !!formData.player_image);
      console.log('player_image value:', formData.player_image ? `${formData.player_image.substring(0, 50)}... (${formData.player_image.length} chars)` : 'EMPTY/NULL');
      if (formData.player_image) {
        console.log('✅ Image data exists, length:', formData.player_image.length);
        console.log('Image starts with:', formData.player_image.substring(0, 50));
      } else {
        console.error('❌ NO IMAGE DATA IN FORM!');
      }
      console.log('Full formData being sent:', JSON.stringify({...formData, player_image: formData.player_image ? `[BASE64 DATA: ${formData.player_image.length} chars]` : 'EMPTY'}, null, 2));
      console.log('=== END DEBUG ===');
      
      // Register player - no payment required
      const response = await registrationAPI.register(formData);
      const playerId = response.data.id;
      
      console.log('✅ Registration successful, player ID:', playerId);
      
      setSuccess(true);
      
      // Redirect to success page after 2 seconds
      setTimeout(() => {
        navigate(`/players/${playerId}`);
      }, 2000);
    } catch (err) {
      console.error('❌ Registration error:', err);
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="registration">
      <div className="registration-container">
        <motion.div
          className="registration-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="registration-header">
            <h1>Player Registration</h1>
            <p>GPL Season 2 - Registration Fee: ₹500</p>
          </div>

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success">
              ✅ Registration successful! Redirecting to your profile...
            </div>
          )}

          <form onSubmit={handleSubmit} className="registration-form">
            <div className="form-group">
              <label htmlFor="name">Full Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter your full name"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="age">Age *</label>
                <select
                  id="age"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Age</option>
                  {[...Array(101)].map((_, i) => (
                    <option key={i} value={i}>{i}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="date_of_birth">Date of Birth *</label>
                <input
                  type="date"
                  id="date_of_birth"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="your.email@example.com"
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Contact Number *</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  placeholder="+91 1234567890"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="role">Player Role *</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
              >
                <option value="batsman">Batsman</option>
                <option value="bowler">Bowler</option>
                <option value="all_rounder">All Rounder</option>
                <option value="left_handed">Left Handed</option>
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="batting_style">Batting Style *</label>
                <select
                  id="batting_style"
                  name="batting_style"
                  value={formData.batting_style}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select</option>
                  <option value="left_handed">Left Handed</option>
                  <option value="right_handed">Right Handed</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="bowling_style">Bowling Style *</label>
                <select
                  id="bowling_style"
                  name="bowling_style"
                  value={formData.bowling_style}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select</option>
                  <option value="left_handed">Left Handed</option>
                  <option value="right_handed">Right Handed</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="block_name">Block Name *</label>
                <select
                  id="block_name"
                  name="block_name"
                  value={formData.block_name}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Block</option>
                  <option value="Ophelia">Ophelia</option>
                  <option value="Bianca">Bianca</option>
                  <option value="Orion">Orion</option>
                  <option value="Cygnus">Cygnus</option>
                  <option value="Phoenix">Phoenix</option>
                  <option value="Mynsa">Mynsa</option>
                  <option value="Europa">Europa</option>
                  <option value="Atlas">Atlas</option>
                  <option value="Capella">Capella</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="flat_number">Flat Number *</label>
                <input
                  type="text"
                  id="flat_number"
                  name="flat_number"
                  value={formData.flat_number}
                  onChange={handleChange}
                  required
                  maxLength="3"
                  pattern="[0-9]{3}"
                  placeholder="e.g., 101"
                  title="Enter exactly 3 digits"
                />
              </div>
            </div>

            <div className="form-section-title">Payment Details</div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="payment_mode">Payment Mode *</label>
                <select
                  id="payment_mode"
                  name="payment_mode"
                  value={formData.payment_mode}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Payment Mode</option>
                  <option value="UPI">UPI</option>
                  <option value="Net Banking">Net Banking</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="amount">Amount (₹) *</label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  required
                  step="500"
                  min="500"
                  placeholder="e.g., 500, 1000, 1500"
                  title="Amount must be in multiples of 500"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="payment_transaction_number">Payment Transaction Number *</label>
                <input
                  type="text"
                  id="payment_transaction_number"
                  name="payment_transaction_number"
                  value={formData.payment_transaction_number}
                  onChange={handleChange}
                  required
                  placeholder="Enter transaction ID"
                />
              </div>

              <div className="form-group">
                <label htmlFor="payment_date">Payment Date *</label>
                <input
                  type="date"
                  id="payment_date"
                  name="payment_date"
                  value={formData.payment_date}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-section-title">Additional Details</div>

            <div className="form-group">
              <label htmlFor="player_image">Player Photo *</label>
              <div className="image-upload-container">
                <input
                  type="file"
                  id="player_image"
                  name="player_image"
                  accept="image/*"
                  onChange={handleImageUpload}
                  required
                  className="file-input"
                />
                {imagePreview && (
                  <div className="image-preview">
                    <img src={imagePreview} alt="Player preview" />
                  </div>
                )}
              </div>
              <p className="form-hint">Upload a clear photo of yourself (Max 5MB, JPG/PNG)</p>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="jersey_size">Jersey Size *</label>
                <select
                  id="jersey_size"
                  name="jersey_size"
                  value={formData.jersey_size}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Size</option>
                  <option value="XS">XS</option>
                  <option value="S">S</option>
                  <option value="M">M</option>
                  <option value="L">L</option>
                  <option value="XL">XL</option>
                  <option value="XXL">XXL</option>
                  <option value="XXXL">XXXL</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="cricheroes_id">Cricheroes Profile ID</label>
                <div className="input-with-button">
                  <input
                    type="text"
                    id="cricheroes_id"
                    name="cricheroes_id"
                    value={formData.cricheroes_id}
                    onChange={handleChange}
                    placeholder="Enter your Cricheroes player ID"
                  />
                  <button
                    type="button"
                    onClick={checkCricheroes}
                    className="btn btn-secondary btn-sm"
                    disabled={!formData.cricheroes_id}
                  >
                    Check
                  </button>
                </div>
                {cricheroesData && (
                  <p className="form-hint success">✓ Cricheroes data found!</p>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="bio">About You</label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows="3"
                placeholder="Tell us about your cricket journey..."
              />
            </div>

            <div className="registration-info">
              <div className="info-item">
                <strong>Registration Fee:</strong> ₹500
              </div>
              <div className="info-item">
                <strong>Base Auction Price:</strong> ₹10,000
              </div>
              <div className="info-item">
                <strong>Status:</strong> Instant Approval
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-large"
              disabled={loading || success}
            >
              {loading ? 'Processing...' : success ? '✓ Registered!' : 'Complete Registration'}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Registration;
