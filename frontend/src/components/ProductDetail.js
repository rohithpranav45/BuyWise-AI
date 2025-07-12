import React from 'react';
import PropTypes from 'prop-types';
import DeeperAnalysisDashboard from './DeeperAnalysisDashboard';
import './ProductDetail.css';

/**
 * Displays the detailed view for a single product, including its information,
 * the procurement recommendation, and a deeper analysis dashboard.
 */
const ProductDetail = ({ product, analysis, isLoading, onBack }) => {

  // --- Safety Check ---
  // If there's no product data, render a fallback UI to prevent crashes.
  if (!product || !product.id) {
    return (
      <div className="product-detail-container">
        <button onClick={onBack} className="back-button">
          ← Back to Products
        </button>
        <div className="error-message" style={{ marginTop: '20px' }}>
            Could not display product. The selected product data is invalid or missing.
        </div>
      </div>
    );
  }

  // Destructure product data with fallbacks for safety
  const {
    name = 'Unnamed Product',
    sku = 'N/A',
    category = 'N/A',
    price,
    imageUrl = '/placeholder-product.png',
    inventory = { stock: 'N/A', salesVelocity: 'N/A' } // Provide a fallback inventory object
  } = product;

  // Dynamically create a CSS class from the recommendation string (e.g., "Standard Order" -> "standard-order")
  const recommendationClass = analysis?.recommendation
    ? analysis.recommendation.toLowerCase().replace(/ /g, '-')
    : '';

  return (
    <div className="product-detail-container">
      <button onClick={onBack} className="back-button">
        ← Back to Products
      </button>

      {/* --- Product Header --- */}
      <div className="product-detail-header">
        <img
          src={imageUrl}
          alt={`Image of ${name}`}
          className="product-detail-image"
          // Fallback to a placeholder if the image fails to load
          onError={(e) => { e.target.onerror = null; e.target.src = '/placeholder-product.png'; }}
        />
        <div className="product-info">
          <h2>{name}</h2>
          <p><strong>SKU:</strong> {sku}</p>
          <p><strong>Category:</strong> {category}</p>
          <p><strong>Current Stock:</strong> {inventory.stock ?? 'N/A'}</p>
          <p><strong>Price:</strong> {typeof price === 'number' ? `$${price.toFixed(2)}` : 'N/A'}</p>
        </div>
      </div>

      {/* --- Loading State --- */}
      {isLoading && (
        <div className="loading-analysis">
          ⏳ Analyzing product, please wait...
        </div>
      )}

      {/* --- Recommendation Display --- */}
      {analysis && (
        <div className="recommendation-section">
          <h3>Procurement Recommendation</h3>
          <div className={`recommendation-badge ${recommendationClass}`}>
            {analysis.recommendation}
          </div>
        </div>
      )}

      {/* --- Deeper Analysis Dashboard --- */}
      {analysis?.analysis && (
        <DeeperAnalysisDashboard analysisData={analysis.analysis} />
      )}
    </div>
  );
};

// --- PropTypes for Type-Checking ---
// This helps catch bugs by ensuring components receive the right type of data.
ProductDetail.propTypes = {
  /** The product object to display */
  product: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string,
    sku: PropTypes.string,
    category: PropTypes.string,
    price: PropTypes.number,
    imageUrl: PropTypes.string,
    inventory: PropTypes.shape({
      stock: PropTypes.number,
      salesVelocity: PropTypes.number
    })
  }),

  /** The analysis result from the API */
  analysis: PropTypes.shape({
    recommendation: PropTypes.string,
    analysis: PropTypes.object // The nested object passed to the dashboard
  }),

  /** A boolean indicating if the analysis is in progress */
  isLoading: PropTypes.bool,

  /** A function to handle navigating back to the product list */
  onBack: PropTypes.func.isRequired
};

export default ProductDetail;