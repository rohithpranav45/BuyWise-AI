import React from 'react';
import PropTypes from 'prop-types';
import './DashboardSummary.css';

const RECOMMENDATION_ORDER = [
  'Bulk Order', 'Standard Order', 'Use Substitute', 'Hold', 'Monitor', 'Deprioritize', 'Error'
];

const DashboardSummary = ({ statuses, activeFilter, onFilterChange, selectedCategory, onBackToCategories }) => {
  // Calculate counts for each recommendation type
  const counts = Object.values(statuses).reduce((acc, status) => {
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
  
  // Create a nicer display name, e.g., "Canned Goods" -> "Canned Goods"
  const categoryDisplayName = selectedCategory.replace(/_/g, ' ');

  const totalProducts = Object.keys(statuses).length;

  return (
    <div className="dashboard-summary">
      <div className="summary-header">
        <h2 className="summary-title">{categoryDisplayName} Dashboard</h2>
        <button onClick={onBackToCategories} className="back-btn">← All Departments</button>
      </div>
      <div className="summary-filters">
        <button
          onClick={() => onFilterChange('All')}
          className={`filter-badge all ${activeFilter === 'All' ? 'active' : ''}`}
        >
          All Products ({totalProducts})
        </button>
        {RECOMMENDATION_ORDER.map(rec => {
          if (counts[rec]) {
            const className = rec.toLowerCase().replace(/ /g, '-');
            return (
              <button
                key={rec}
                onClick={() => onFilterChange(rec)}
                className={`filter-badge ${className} ${activeFilter === rec ? 'active' : ''}`}
              >
                {rec} ({counts[rec]})
              </button>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
};

DashboardSummary.propTypes = {
  statuses: PropTypes.object.isRequired,
  activeFilter: PropTypes.string.isRequired,
  onFilterChange: PropTypes.func.isRequired,
  selectedCategory: PropTypes.string.isRequired,
  onBackToCategories: PropTypes.func.isRequired,
};

export default DashboardSummary;