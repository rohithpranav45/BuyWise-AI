import React from 'react';
import PropTypes from 'prop-types';
import DeeperAnalysisDashboard from './DeeperAnalysisDashboard';
import './ProductDetail.css';

// Ensure the product prop is valid

const ProductDetail = ({ product, analysis, isLoading, onBack }) => {
  // Debug: Log product to ensure it’s valid
  console.log('🛠️ Rendering ProductDetail:', product);

  if (typeof onBack !== 'function') {
    console.warn('❌ onBack prop missing or not a function in ProductDetail');
  }

  // Safety check: product or inventory missing
  if (!product || typeof product !== 'object') {
    return (
      <div className="product-detail-fallback">
        <p>⚠️ Product details are unavailable.</p>
        <button
          onClick={onBack}
          className="back-button"
          style={{ marginTop: '12px' }}
          disabled={typeof onBack !== 'function'}
        >
          &larr; Back to Products
        </button>
      </div>
    );
  }

  const {
    name = 'Unnamed Product',
    sku = 'N/A',
    category = 'N/A',
    price,
    imageUrl = '/placeholder-product.png',
    inventory = {}
  } = product;

  return (
    <div className="product-detail-container">
      <button onClick={onBack} className="back-button">&larr; Back to Products</button>

      <div className="product-detail-header">
        <img
          src={imageUrl}
          alt={name}
          className="product-detail-image"
          onError={(e) => {
            e.target.src = '/placeholder-product.png';
          }}
        />

        <div className="product-info">
          <h2>{name}</h2>
          <p><strong>SKU:</strong> {sku}</p>
          <p><strong>Category:</strong> {category}</p>
          <p><strong>Current Stock:</strong> {inventory?.stock ?? 'N/A'}</p>
          <p><strong>Price:</strong> {price != null ? `$${price.toFixed(2)}` : 'N/A'}</p>
        </div>
      </div>

      {isLoading && (
        <div className="loading-analysis">
          ⏳ Analyzing product...
        </div>
      )}

      {analysis && (
        <div className="recommendation-section">
          <h3>Procurement Recommendation</h3>
          <div className={`recommendation-badge ${analysis.recommendation.toLowerCase().replace(/ /g, '-')}`}>
            {analysis.recommendation}
          </div>
        </div>
      )}

      {analysis?.analysis && (
        <DeeperAnalysisDashboard analysisData={analysis.analysis} />
      )}
    </div>
  );
};

ProductDetail.propTypes = {
  product: PropTypes.shape({
    name: PropTypes.string,
    sku: PropTypes.string,
    category: PropTypes.string,
    price: PropTypes.number,
    imageUrl: PropTypes.string,
    inventory: PropTypes.shape({
      stock: PropTypes.number
    })
  }),
  analysis: PropTypes.shape({
    recommendation: PropTypes.string,
    analysis: PropTypes.object
  }),
  isLoading: PropTypes.bool,
  onBack: PropTypes.func.isRequired
};

export default ProductDetail;
