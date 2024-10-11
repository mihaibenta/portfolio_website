import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // Ensure this imports your App component
import 'leaflet/dist/leaflet.css'; // Import Leaflet CSS

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
