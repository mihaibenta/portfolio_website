import React, { useState, useEffect } from 'react';
import './Popup.css';
import { FaGithub, FaLinkedin } from 'react-icons/fa'; // Importing icons

const WelcomePopup = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasSeenPopup = localStorage.getItem('hasSeenPopup');
    if (!hasSeenPopup) {
      setIsVisible(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('hasSeenPopup', 'true');
    setIsVisible(false);
  };

  return (
    isVisible && (
      <div className="popup-overlay">
        <div className="popup-container">
          <h2>Welcome to Our App!</h2>
          <p><strong>Functionality Overview:</strong></p>
          <ul>
            <li>🌍 Interactive Webmap</li>
            <li>🗺️ Fetch and Style OSM Data</li>
            <li>🏗️ Surface and Edit Elements</li>
          </ul>
          <p>
            This is a <strong>pre-alpha version</strong>. Your feedback is welcome!
          </p>
          <div className="social-links">
            <a href="https://github.com/your-github-username" target="_blank" rel="noopener noreferrer">
              <FaGithub size={30} /> 
            </a>
            <a href="https://linkedin.com/in/your-linkedin-username" target="_blank" rel="noopener noreferrer">
              <FaLinkedin size={30} /> 
            </a>
          </div>
          <button className="close-button" onClick={handleClose}>
            Get Started
          </button>
        </div>
      </div>
    )
  );
};

export default WelcomePopup;
