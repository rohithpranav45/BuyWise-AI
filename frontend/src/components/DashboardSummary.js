import React from 'react';
import PropTypes from 'prop-types';
import './DashboardSummary.css';

const RECOMMENDATION_ORDER = [
  'Bulk Order', 'Standard Order', 'Use Substitute', 'Hold', 'Monitor', 'Deprioritize', 'Error'
];

const DashboardSummary = ({ statuses, activeFilter, onFilterChange }) => {
  const counts = Object.values(statuses).reduce((acc, status) => {
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const totalProducts = Object.keys(statuses).length;

  return (
    <div className="dashboard-summary">
      <h2 className="summary-title">Procurement Dashboard</h2>
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
};

export default DashboardSummary;