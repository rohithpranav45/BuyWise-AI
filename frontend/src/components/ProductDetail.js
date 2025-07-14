import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import DeeperAnalysisDashboard from './DeeperAnalysisDashboard';
import './ProductDetail.css';

const ProductDetail = ({ product, analysisResult, isLoading, onBack, onRerunAnalysis }) => {
  const [simTariff, setSimTariff] = useState(null);
  const [simDemand, setSimDemand] = useState(null);

  useEffect(() => {
    if (analysisResult?.analysis?.inputs) {
      setSimTariff(analysisResult.analysis.inputs.tariffRate);
      setSimDemand(analysisResult.analysis.inputs.demandSignal);
    }
  }, [analysisResult]);

  const handleRerunAnalysis = () => {
    if (isLoading || !product) return;
    onRerunAnalysis(product.id, {
      customTariff: simTariff,
      customDemand: simDemand,
    });
  };

  if (!product) { return <div>Loading product information...</div>; }
  
  const { name, sku, category, price, imageUrl } = product;

  return (
    <div className="product-detail-container">
      <button onClick={onBack} className="back-button">← Back to Dashboard</button>
      
      <div className="product-detail-header">
        <img src={process.env.PUBLIC_URL + imageUrl} alt={name} className="product-detail-image"/>
        <div className="product-info">
          <h2>{name || 'Unnamed Product'}</h2>
          <p><strong>SKU:</strong> {sku ?? 'N/A'}</p>
          <p><strong>Category:</strong> {category ?? 'N/A'}</p>
        </div>
      </div>

      {isLoading && !analysisResult ? (
        <div className="loading-analysis">
          {/* Placeholder for loading state can go here */}
        </div>
      ) : (
        <>
          <DeeperAnalysisDashboard 
            analysis={analysisResult?.analysis} 
            recommendation={analysisResult?.recommendation}
          />
          <div className="simulation-container">
            <h3>What-If Scenario Simulator</h3>
            <p>Adjust the sliders to see how external factors impact the procurement decision.</p>
            {simTariff !== null ? (
              <div className="slider-group">
                <label>Tariff Rate: <strong>{(simTariff * 100).toFixed(1)}%</strong></label>
                <input type="range" min="0" max="0.5" step="0.01" value={simTariff} onChange={(e) => setSimTariff(parseFloat(e.target.value))} />
              </div>
            ) : <p>Loading simulator...</p>}
            {simDemand !== null ? (
              <div className="slider-group">
                <label>Demand Signal: <strong>{simDemand.toFixed(2)}</strong></label>
                <input type="range" min="-1" max="1" step="0.1" value={simDemand} onChange={(e) => setSimDemand(parseFloat(e.target.value))} />
              </div>
            ) : null}
            <button onClick={handleRerunAnalysis} disabled={isLoading || simTariff === null} className="rerun-button">
              {isLoading ? 'Re-analyzing...' : '⚡ Re-Run Analysis'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

ProductDetail.propTypes = {
  product: PropTypes.object,
  analysisResult: PropTypes.object,
  isLoading: PropTypes.bool,
  onBack: PropTypes.func.isRequired,
  onRerunAnalysis: PropTypes.func.isRequired,
};

export default ProductDetail;