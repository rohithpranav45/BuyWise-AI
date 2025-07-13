import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import DeeperAnalysisDashboard from './DeeperAnalysisDashboard';
import './ProductDetail.css';

// --- NEW: The Aesthetic Decision Map ---
// This object maps the logical recommendation from the backend to beautiful frontend properties.
const DECISION_MAP = {
  'Bulk Order': {
    icon: '🚀',
    title: 'Expedite Purchase',
    subtitle: 'High demand and critical urgency detected. Order in bulk to maximize stock.',
    className: 'decision-expedite',
  },
  'Standard Order': {
    icon: '🚚',
    title: 'Standard Replenishment',
    subtitle: 'Inventory levels are low under normal sales velocity. A standard order is advised.',
    className: 'decision-standard',
  },
  'Use Substitute': {
    icon: '↔️',
    title: 'Source Alternate SKU',
    subtitle: 'Prohibitive costs or external factors advise against ordering this product. Evaluate substitutes.',
    className: 'decision-substitute',
  },
  'Hold': {
    icon: '⏸️',
    title: 'Defer Action',
    subtitle: 'Current conditions (cost, demand, or inventory) are unfavorable. Hold all orders.',
    className: 'decision-hold',
  },
  'Monitor': {
    icon: '🔍',
    title: 'Place on Watchlist',
    subtitle: 'Metrics are stable but require monitoring for potential changes in demand or urgency.',
    className: 'decision-monitor',
  },
  'Deprioritize': {
    icon: '🔻',
    title: 'Deprioritize SKU',
    subtitle: 'Low demand and sufficient stock. Deprioritize this product from procurement cycle.',
    className: 'decision-deprioritize',
  },
  'Error': {
    icon: '⚠️',
    title: 'Analysis Error',
    subtitle: 'Could not complete the analysis due to an error. Please check the logs.',
    className: 'decision-error',
  },
};

const ProductDetail = ({ product, analysis, isLoading, onBack, onRerunAnalysis }) => {
  const [simTariff, setSimTariff] = useState(null);
  const [simDemand, setSimDemand] = useState(null);

  useEffect(() => {
    if (analysis?.analysis?.inputs) {
      setSimTariff(analysis.analysis.inputs.tariffRate);
      setSimDemand(analysis.analysis.inputs.demandSignal);
    }
  }, [analysis]);

  const handleRerunAnalysis = () => {
    if (isLoading) return;
    onRerunAnalysis(product.id, { customTariff: simTariff, customDemand: simDemand });
  };

  // Get the aesthetic properties from our map, with a safe fallback
  const decision = analysis ? (DECISION_MAP[analysis.recommendation] || DECISION_MAP['Error']) : null;

  if (!product) return null;
  const { name, sku, category, price, imageUrl, inventory } = product;

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
      
      {/* --- vvvvvv THIS IS THE NEW JSX FOR THE DECISION CARD vvvvvv --- */}
      {decision && (
        <div className={`decision-card ${decision.className}`}>
          <div className="decision-icon">{decision.icon}</div>
          <div className="decision-text">
            <h4>{decision.title}</h4>
            <p>{decision.subtitle}</p>
          </div>
        </div>
      )}
      {/* --- ^^^^^^ END OF NEW JSX ^^^^^^ --- */}

      <div className="simulation-container">
        <h3>What-If Scenario Simulator</h3>
        <p>Adjust the sliders to see how external factors impact the procurement decision in real-time.</p>
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
          {isLoading ? 'Analyzing...' : '⚡ Re-Run Analysis'}
        </button>
      </div>
      
      {analysis?.analysis && <DeeperAnalysisDashboard analysisData={analysis.analysis} />}
    </div>
  );
};

ProductDetail.propTypes = {
  product: PropTypes.object,
  analysis: PropTypes.object,
  isLoading: PropTypes.bool,
  onBack: PropTypes.func.isRequired,
  onRerunAnalysis: PropTypes.func.isRequired,
};

export default ProductDetail;