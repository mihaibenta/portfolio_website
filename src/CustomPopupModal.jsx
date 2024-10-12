import React, { useState } from 'react';

const CustomPopupModal = ({ feature, type, visible, onClose }) => {
    const [showModal, setShowModal] = useState(false);
  
    const handleCloseModal = () => {
        onClose(); // Call the onClose prop function
      };
  
    return (
        <div className="custom-popup-modal" style={{ display: visible ? 'block' : 'none' }}>
        <div className="modal-content">
          {feature ? (
            <>
              <h2>{feature.properties.name || `Unnamed ${type}`}</h2>
              <p>Type: {type === "highway" ? feature.properties.highway : "N/A"}</p>
              {/* Add more details or custom content here */}
              <button onClick={handleCloseModal}>Close</button>
            </>
          ) : (
            <p>No feature selected.</p>
          )}
        </div>
      </div>
    );
  };

export default CustomPopupModal;