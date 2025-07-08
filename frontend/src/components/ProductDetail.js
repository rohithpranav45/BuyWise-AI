import React from 'react';
import DeeperAnalysisDashboard from './DeeperAnalysisDashboard';
import './ProductDetail.css';

const ProductDetail = ({ product, analysis, isLoading, onBack }) => {
  if (!product) {
    return null;
  }

  return (
    <div className="product-detail-container">
      <button onClick={onBack} className="back-button">&larr; Back to Products</button>
      <div className="product-detail-header">
        <img src={product.imageUrl} alt={product.name} className="product-detail-image" />
        <div className="product-info">
          <h2>{product.name}</h2>
          <p><strong>SKU:</strong> {product.sku}</p>
          <p><strong>Category:</strong> {product.category}</p>
          <p><strong>Current Stock:</strong> {product.inventory.stock}</p>
          <p><strong>Price:</strong> ${product.price.toFixed(2)}</p>
        </div>
      </div>
      
      {isLoading && <div className="loading-analysis">Analyzing...</div>}

      {analysis && (
        <div className="recommendation-section">
          <h3>Procurement Recommendation</h3>
          <div className={`recommendation-badge ${analysis.recommendation.toLowerCase().replace(/ /g, '-')}`}>
            {analysis.recommendation}
          </div>
        </div>
      )}

      {analysis && <DeeperAnalysisDashboard analysisData={analysis.analysis} />}
    </div>
  );
};

export default ProductDetail;