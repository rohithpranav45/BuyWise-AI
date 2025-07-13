import React from 'react';
import './Header.css';

// A simple SVG icon for the "Change Location" button
const SwitchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M8.707 1.5a1 1 0 0 0-1.414 0L.646 8.146a.5.5 0 0 0 .708.708L8 2.207l6.646 6.647a.5.5 0 0 0 .708-.708L8.707 1.5z"/>
    <path d="m12.5 5.5a.5.5 0 0 1 .5.5v5.793l2.146-2.147a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 1 1 .708-.708L12.5 11.293V6a.5.5 0 0 1 .5-.5m-9-1a.5.5 0 0 1 .5.5v5.793l2.146-2.147a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 0 1 .708-.708L3.5 11.293V6a.5.5 0 0 1 .5-.5"/>
  </svg>
);

const Header = ({ store, onChangeStore }) => {
  return (
    <header className="app-header">
      <div className="header-title">
        <h1>Store<span className="spark">IQ</span></h1>
      </div>
      {store && (
        <div className="header-context">
          <div className="header-status">
            <span>OPERATIONAL AREA</span>
            <strong>{store.name} - {store.city}, {store.state}</strong>
          </div>
          <button onClick={onChangeStore} className="change-store-btn" title="Switch Location">
            <SwitchIcon />
          </button>
        </div>
      )}
    </header>
  );
};

export default Header;