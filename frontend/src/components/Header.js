import React from 'react';
import './Header.css';

const Header = () => {
  return (
    <header className="app-header">
      <div className="header-title">
        <h1>Store<span className="spark">IQ</span></h1>
        <p>The Tariff-Aware Procurement & Substitution Engine</p>
      </div>
      <div className="header-status">
        Connected to Walmart Supply Chain API
      </div>
    </header>
  );
};

export default Header;