import React from 'react';
import PropTypes from 'prop-types';
import DeeperAnalysisDashboard from './DeeperAnalysisDashboard';
import './ProductDetail.css';

const ProductDetail = ({ product, analysis, isLoading, onBack }) => {
  // Debug logging
  console.log('🛠️ Rendering ProductDetail:', product);

  // Fallback UI if product or inventory is missing
  if (!product || !product.inventory) {
    return (
      <div style={{ padding: '20px', color: 'gray' }}>
        Product details are incomplete or unavailable.
        <br />
        <button onClick={onBack} className="back-button" style={{ marginTop: '10px' }}>
          &larr; Back to Products
        </button>
      </div>
    );
  }

  return (
    <div className="product-detail-container">
      <button onClick={onBack} className="back-button">&larr; Back to Products</button>

      <div className="product-detail-header">
        <img
          src={product.imageUrl || '/placeholder-product.png'}
          alt={product.name || 'Product image'}
          className="product-detail-image"
          onError={(e) => {
            e.target.src = '/placeholder-product.png';
          }}
        />

        <div className="product-info">
          <h2>{product.name || 'Unnamed Product'}</h2>
          <p><strong>SKU:</strong> {product.sku ?? 'N/A'}</p>
          <p><strong>Category:</strong> {product.category ?? 'N/A'}</p>
          <p><strong>Current Stock:</strong> {product.inventory?.stock ?? 'N/A'}</p>
          <p><strong>Price:</strong> ${product.price?.toFixed(2) ?? 'N/A'}</p>
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
