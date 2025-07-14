import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './FactorAnalysisCard.css';

const FactorAnalysisCard = ({ icon, title, subtitle, value }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayValue(value);
    }, 100);
    return () => clearTimeout(timer);
  }, [value]);

  const getStatusInfo = () => {
    if (value > 0.7) return { className: 'status-high', label: 'High' };
    if (value > 0.4) return { className: 'status-medium', label: 'Medium' };
    return { className: 'status-low', label: 'Low' };
  };

  const { className, label } = getStatusInfo();
  const percentage = Math.round(displayValue * 100);

  return (
    <div className="factor-card">
      <div className="factor-icon">{icon}</div>
      <div className="factor-details">
        <div className="factor-header">
          <h5 className="factor-title">{title}</h5>
          <span className={`factor-label ${className}`}>{label}</span>
        </div>
        <p className="factor-subtitle">{subtitle}</p>
        <div className="factor-progress-container"> {/* UPDATED: Container for bar and score */}
          <div className="factor-progress-bar">
            <div 
              className={`progress-bar-fill ${className}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          {/* --- vvvvvv NEW: SCORE DISPLAY vvvvvv --- */}
          <span className="factor-score">{percentage}/100</span>
          {/* --- ^^^^^^ END OF NEW SCORE ^^^^^^ --- */}
        </div>
      </div>
    </div>
  );
};

FactorAnalysisCard.propTypes = {
  icon: PropTypes.node.isRequired,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
};

export default FactorAnalysisCard;