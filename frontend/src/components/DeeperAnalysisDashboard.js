import React from 'react';
import PropTypes from 'prop-types';
import AnalysisGauge from './AnalysisGauge';         // The new gauge component
import SupplyChainMap from './SupplyChainMap';       // The new map component
import './DeeperAnalysisDashboard.css';

// A helper function to normalize a -1 to 1 score into a 0 to 1 percentile for the gauges
const normalizeScore = (score = 0) => (score + 1) / 2;

const DeeperAnalysisDashboard = ({ analysisData }) => {
  // A safety check for the entire data object to prevent crashes
  if (!analysisData) {
    return (
      <div className="intelligence-hub">
        <p className="loading-message">Loading intelligence report...</p>
      </div>
    );
  }

  // Destructure all needed properties from the analysis data, with safe defaults
  const { 
    scores = {}, 
    substitutes = [], 
    news_articles = [], 
    supplyChainMapData = [] 
  } = analysisData;

  return (
    <div className="intelligence-hub">
      <h3 className="hub-title">Intelligence Hub</h3>
      
      {/* --- GAUGE SECTION --- */}
      <div className="hub-section">
        <h4 className="section-title">Core Factor Analysis</h4>
        <div className="gauge-grid">
          <AnalysisGauge title="Cost Impact" value={normalizeScore(scores.costImpactScore)} />
          <AnalysisGauge title="Demand Signal" value={normalizeScore(scores.demandScore)} />
          <AnalysisGauge title="Urgency Score" value={normalizeScore(scores.urgencyScore)} />
        </div>
      </div>
      
      {/* --- SUPPLY CHAIN VISUALIZATION SECTION --- */}
      {/* This section only renders if the map data exists */}
      {supplyChainMapData && supplyChainMapData.length > 0 && (
        <div className="hub-section">
          <h4 className="section-title">Supply Chain Visualization</h4>
          <SupplyChainMap mapData={supplyChainMapData} />
        </div>
      )}
      
      {/* --- LIVE DEMAND INTEL (NEWS) SECTION --- */}
      {/* This section only renders if there are news articles to show */}
      {news_articles && news_articles.length > 0 && (
        <div className="hub-section">
          <h4 className="section-title">Live Demand Intel</h4>
          <div className="news-feed">
            {news_articles.map((article, index) => (
              <a href={article.url} target="_blank" rel="noopener noreferrer" className="news-card" key={index}>
                <div className="news-source">{article.source || 'Online Publication'}</div>
                <div className="news-title">{article.title}</div>
                <div className="news-link">Read Source Article →</div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* --- STRATEGIC SUBSTITUTES SECTION --- */}
      {/* This section will only render if there are substitutes available */}
      {substitutes && substitutes.length > 0 && (
        <div className="hub-section">
          <h4 className="section-title">Strategic Substitutes</h4>
          <div className="substitute-grid">
            {substitutes.map(item => (
              <div key={item.id} className="substitute-card">
                <h5>{item.name}</h5>
                <p>SKU: {item.sku}</p>
                <div className="substitute-metrics">
                  <span className="similarity-metric">
                    ~{(item.similarity * 100).toFixed(0)}% Match
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

DeeperAnalysisDashboard.propTypes = {
  analysisData: PropTypes.object,
};

export default DeeperAnalysisDashboard;