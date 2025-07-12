import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import DeeperAnalysisDashboard from './DeeperAnalysisDashboard';
import './ProductDetail.css';

const ProductDetail = ({ product, analysis, isLoading, onBack, onRerunAnalysis }) => {
  const [simTariff, setSimTariff] = useState(null);
  const [simDemand, setSimDemand] = useState(null);

  useEffect(() => {
    if (analysis && analysis.analysis && analysis.analysis.inputs) {
      setSimTariff(analysis.analysis.inputs.tariffRate);
      setSimDemand(analysis.analysis.inputs.demandSignal);
    }
  }, [analysis]);

  const handleRerunAnalysis = () => {
    if (isLoading) return;
    onRerunAnalysis(product.id, {
      customTariff: simTariff,
      customDemand: simDemand,
    });
  };

  if (!product) {
    return (
      <div className="product-detail-container">
        <button onClick={onBack} className="back-button">← Back to Products</button>
        <p>Product data is unavailable.</p>
      </div>
    );
  }

  const { name, sku, category, price, imageUrl, inventory } = product;
  const recommendationClass = analysis?.recommendation?.toLowerCase().replace(/ /g, '-');

  return (
    <div className="product-detail-container">
      <button onClick={onBack} className="back-button">← Back to Products</button>
      
      <div className="product-detail-header">
        <img src={imageUrl || '/placeholder-product.png'} alt={name} className="product-detail-image"/>
        <div className="product-info">
          <h2>{name || 'Unnamed Product'}</h2>
          <p><strong>SKU:</strong> {sku ?? 'N/A'}</p>
          <p><strong>Category:</strong> {category ?? 'N/A'}</p>
          <p><strong>Current Stock:</strong> {inventory?.stock ?? 'N/A'}</p>
          <p><strong>Price:</strong> {typeof price === 'number' ? `$${price.toFixed(2)}` : 'N/A'}</p>
        </div>
      </div>

      {isLoading && !analysis && <div className="loading-analysis">⏳ Analyzing product...</div>}
      
      {analysis && (
        <div className="recommendation-section">
          <h3>Procurement Recommendation</h3>
          <div className={`recommendation-badge ${recommendationClass}`}>
            {analysis.recommendation}
          </div>
        </div>
      )}

      <div className="simulation-container">
        <h3>What-If Scenario Simulator</h3>
        <p>Adjust the sliders to see how external factors impact the procurement decision in real-time.</p>
        
        {simTariff !== null ? (
          <div className="slider-group">
            <label>Tariff Rate: <strong>{(simTariff * 100).toFixed(1)}%</strong></label>
            <input 
              type="range" min="0" max="0.5" step="0.01" 
              value={simTariff} 
              onChange={(e) => setSimTariff(parseFloat(e.target.value))}
            />
          </div>
        ) : <p>Loading simulator...</p>}

        {simDemand !== null ? (
          <div className="slider-group">
            <label>Demand Signal (News Sentiment): <strong>{simDemand.toFixed(2)}</strong></label>
            <input 
              type="range" min="-1" max="1" step="0.1"
              value={simDemand}
              onChange={(e) => setSimDemand(parseFloat(e.target.value))}
            />
          </div>
        ) : null}
        
        <button onClick={handleRerunAnalysis} disabled={isLoading || simTariff === null} className="rerun-button">
          {isLoading ? 'Analyzing...' : '⚡ Re-Run Analysis'}
        </button>
      </div>
      
      {analysis?.analysis && <DeeperAnalysisDashboard analysisData={analysis.analysis} />}
    </div>
  );
};

ProductDetail.propTypes = {
  product: PropTypes.object.isRequired,
  analysis: PropTypes.object,
  isLoading: PropTypes.bool,
  onBack: PropTypes.func.isRequired,
  onRerunAnalysis: PropTypes.func.isRequired,
};

export default ProductDetail;