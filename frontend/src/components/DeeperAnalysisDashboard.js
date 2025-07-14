import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import FactorAnalysisCard from './FactorAnalysisCard';
import SupplyChainMap from './SupplyChainMap';
import TariffImpactAnalysis from './TariffImpactAnalysis';
import './DeeperAnalysisDashboard.css';

// --- HELPER: DYNAMIC STYLES & ICONS FOR HERO CARD ---
const getRecommendationStyle = (recommendation) => {
  const styles = {
    "Bulk Order": {
      className: 'decision-bulk-order',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 12l3 3 7-7" /><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /></svg>,
      description: "Optimal time to secure bulk pricing and maximize cost efficiency"
    },
    "Standard Order": {
      className: 'decision-standard-order',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>,
      description: "Standard procurement approach recommended for current market conditions"
    },
    "Use Substitute": {
      className: 'decision-use-substitute',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12h16M4 12l6-6M4 12l6 6M20 12l-6 6M20 12l-6-6"/></svg>,
      description: "Alternative products available with better value proposition"
    },
    "Hold": {
      className: 'decision-hold',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2z"/><path d="M12 8v4l2 1"/></svg>,
      description: "Market conditions suggest waiting for better opportunities"
    },
    "Monitor": {
      className: 'decision-monitor',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
      description: "Continue monitoring market signals for optimal timing"
    },
    "Deprioritize": {
      className: 'decision-deprioritize',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>,
      description: "Focus resources on higher-priority procurement opportunities"
    },
    "Error": {
      className: 'decision-error',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
      description: "Unable to process recommendation - please review input data"
    }
  };
  return styles[recommendation] || styles["Error"];
};

// --- HELPER: NORMALIZE & FORMAT VALUES ---
const normalizeScore = (score = 0) => (score + 1) / 2;
const formatValue = (value, type = 'number') => {
  if (value === null || value === undefined) return 'N/A';
  switch (type) {
    case 'percentage': return `${(value * 100).toFixed(1)}%`;
    case 'decimal': return value.toFixed(2);
    case 'days': return `${value.toFixed(1)} days`;
    default: return value.toString();
  }
};

// --- HELPER: ICONS FOR BREAKDOWN & FACTOR CARDS ---
const getMetricIcon = (metric) => {
  const icons = {
    'Days of Stock': <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27,6.96 12,12.01 20.73,6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
    'Tariff Rate': <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
    'Demand Signal': <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/></svg>,
    'Weather Factor': <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>
  };
  return icons[metric] || null;
};

const factorIcons = {
  cost: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>,
  demand: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>,
  urgency: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
};

// --- MAIN COMPONENT ---
const DeeperAnalysisDashboard = ({
  analysis,
  recommendation,
  isSimLoading,
  simTariff,
  simDemand,
  onSimTariffChange,
  onSimDemandChange,
  onRerun,
  primaryProduct,
  allProducts,
  allTariffs,
}) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (analysis) {
      setIsLoading(false);
    }
  }, [analysis]);

  if (isLoading || !analysis) {
    return (
      <div className="intelligence-hub">
        <div className="loading-message">
          Analyzing market intelligence and generating recommendations...
        </div>
      </div>
    );
  }

  const {
    scores = {},
    substitutes = [],
    news_articles = [],
    supplyChainMapData = [],
    decisionNarrative = '',
    rulesTriggered = [],
    inputs = {}
  } = analysis;
  
  const heroStyle = getRecommendationStyle(recommendation);

  const enhancedInputs = [
    { label: 'Days of Stock', value: inputs.daysOfStock, type: 'days', icon: getMetricIcon('Days of Stock') },
    { label: 'Tariff Rate', value: inputs.tariffRate, type: 'percentage', icon: getMetricIcon('Tariff Rate') },
    { label: 'Demand Signal', value: inputs.demandSignal, type: 'decimal', icon: getMetricIcon('Demand Signal') },
    { label: 'Weather Factor', value: inputs.weatherFactor, type: 'decimal', icon: getMetricIcon('Weather Factor') }
  ];

  return (
    <div className="intelligence-hub">
      <h3 className="hub-title">Intelligence Hub</h3>
      
      <div className="intelligence-hub-layout">
        
        {/* === MAIN CONTENT COLUMN === */}
        <div className="main-column">
          
          <div className={`hero-card ${heroStyle.className}`}>
            <div className="hero-icon">{heroStyle.icon}</div>
            <div className="hero-text">
              <h4>{recommendation}</h4>
              <p>{decisionNarrative || heroStyle.description}</p>
            </div>
          </div>

          <div className="hub-section">
            <h4 className="section-title">Tariff Impact & ROI Analysis</h4>
            <TariffImpactAnalysis
              primaryProduct={primaryProduct}
              allProducts={allProducts}
              allTariffs={allTariffs}
              substitutes={substitutes || []}
            />
          </div>
          
          {supplyChainMapData && supplyChainMapData.length > 0 && (
            <div className="hub-section">
              <h4 className="section-title">Supply Chain Visualization</h4>
              <SupplyChainMap mapData={supplyChainMapData} />
            </div>
          )}

          <div className="hub-section">
            <h4 className="section-title">Core Factor Analysis</h4>
            <div className="factor-grid">
              <FactorAnalysisCard 
                icon={factorIcons.cost}
                title="Cost Impact" 
                subtitle="Inverted score of tariff & logistics costs"
                value={normalizeScore(scores.costImpactScore * -1)}
              />
              <FactorAnalysisCard 
                icon={factorIcons.demand}
                title="Demand Signal" 
                subtitle="Market sentiment and sales velocity"
                value={normalizeScore(scores.demandScore)}
              />
              <FactorAnalysisCard 
                icon={factorIcons.urgency}
                title="Urgency" 
                subtitle="Driven by low days of stock"
                value={normalizeScore(scores.urgencyScore)}
              />
            </div>
          </div>

          <div className="hub-section">
            <h4 className="section-title">"What-If" Scenario Simulator</h4>
            <div className="simulation-card">
              <p className="simulation-intro">
                Adjust the sliders to see how external factors could impact the procurement decision in real-time.
              </p>
              
              {simTariff !== null ? (
                <div className="slider-group">
                  <label>Tariff Rate: <strong>{(simTariff * 100).toFixed(1)}%</strong></label>
                  <input type="range" min="0" max="0.5" step="0.01" value={simTariff} onChange={(e) => onSimTariffChange(parseFloat(e.target.value))} />
                </div>
              ) : <p>Loading simulator...</p>}
              
              {simDemand !== null ? (
                <div className="slider-group">
                  <label>Demand Signal: <strong>{simDemand.toFixed(2)}</strong></label>
                  <input type="range" min="-1" max="1" step="0.1" value={simDemand} onChange={(e) => onSimDemandChange(parseFloat(e.target.value))} />
                </div>
              ) : null}

              <button onClick={onRerun} disabled={isSimLoading || simTariff === null} className="rerun-button">
                {isSimLoading ? 'Re-analyzing...' : '⚡ Re-Run Analysis'}
              </button>
            </div>
          </div>
        </div>

        {/* === SIDEBAR COLUMN === */}
        <div className="sidebar-column">
          <div className="hub-section">
            <h4 className="section-title">Analysis Breakdown</h4>
            <div className="breakdown-card">
              <h5>Key Market Inputs</h5>
              <ul className="inputs-list">
                {enhancedInputs.map((input, index) => (
                  <li key={index}>
                    <span className="input-label">
                      {input.icon}
                      {input.label}:
                    </span>
                    <strong>{formatValue(input.value, input.type)}</strong>
                  </li>
                ))}
              </ul>
              <hr />
              <h5>Decision Logic Chain</h5>
              <ul className="rules-list">
                {rulesTriggered.map((rule, index) => (
                  <li key={index} className={rule.startsWith("RULE:") ? 'final-rule' : ''}>{rule.replace("RULE: ", "")}</li>
                ))}
              </ul>
            </div>
          </div>
          
          {news_articles && news_articles.length > 0 && (
            <div className="hub-section">
              <h4 className="section-title">Live Market Intelligence</h4>
              <div className="news-feed">
                {news_articles.slice(0, 4).map((article, index) => (
                  <a href={article.url} target="_blank" rel="noopener noreferrer" className="news-card" key={index}>
                    <div className="news-source">{article.source || 'Market Intelligence'}</div>
                    <div className="news-title">{article.title}</div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {substitutes && substitutes.length > 0 && (
            <div className="hub-section">
              <h4 className="section-title">Strategic Alternatives</h4>
              <div className="substitute-grid">
                {substitutes.slice(0, 3).map(item => (
                  <div key={item.id} className="substitute-card">
                    <h5>{item.name}</h5>
                    <p>SKU: {item.sku}</p>
                    <div className="similarity-metric">{(item.similarity * 100).toFixed(0)}% Match</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- PROP TYPES ---
DeeperAnalysisDashboard.propTypes = {
  analysis: PropTypes.object,
  recommendation: PropTypes.string,
  isSimLoading: PropTypes.bool,
  simTariff: PropTypes.number,
  simDemand: PropTypes.number,
  onSimTariffChange: PropTypes.func,
  onSimDemandChange: PropTypes.func,
  onRerun: PropTypes.func,
  primaryProduct: PropTypes.object,
  allProducts: PropTypes.array,
  allTariffs: PropTypes.object,
};

export default DeeperAnalysisDashboard;