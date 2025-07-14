import React from 'react';
import PropTypes from 'prop-types';
import './DashboardSummary.css';

const DashboardSummary = ({ products, statuses, activeFilter, onFilterChange, selectedCategory, onBackToCategories }) => {
  // --- vvvvvv THIS IS THE LOGIC FIX vvvvvv ---
  // We calculate the counts ONLY from the products visible in this category.
  const counts = products.reduce((acc, product) => {
    const status = statuses[product.id];
    if (status) {
      acc[status] = (acc[status] || 0) + 1;
    }
    return acc;
  }, {});
  // --- ^^^^^^ END OF THE LOGIC FIX ^^^^^^ ---
  
  const categoryDisplayName = selectedCategory.replace(/_/g, ' ');

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
          All Products ({products.length})
        </button>
        {Object.entries(counts).map(([status, count]) => {
          if (count > 0) { // Only show filters if there are products with that status
            const className = status.toLowerCase().replace(/ /g, '-');
            return (
              <button
                key={status}
                onClick={() => onFilterChange(status)}
                className={`filter-badge ${className} ${activeFilter === status ? 'active' : ''}`}
              >
                {status} ({count})
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
  products: PropTypes.array.isRequired,
  statuses: PropTypes.object.isRequired,
  activeFilter: PropTypes.string.isRequired,
  onFilterChange: PropTypes.func.isRequired,
  selectedCategory: PropTypes.string.isRequired,
  onBackToCategories: PropTypes.func.isRequired,
};

export default DashboardSummary;