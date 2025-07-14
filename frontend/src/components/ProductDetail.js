import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import DeeperAnalysisDashboard from './DeeperAnalysisDashboard';
import './ProductDetail.css';

const ProductDetail = ({ product, analysisResult, isLoading, onBack, onRerunAnalysis }) => {
  const [simTariff, setSimTariff] = useState(null);
  const [simDemand, setSimDemand] = useState(null);

  // Debug logging
  console.log('🔍 ProductDetail render:', {
    product: product?.id,
    analysisResult: !!analysisResult,
    isLoading,
    analysisResultData: analysisResult
  });

  useEffect(() => {
    if (analysisResult?.analysis?.inputs) {
      console.log('📊 Setting simulation values from analysis:', analysisResult.analysis.inputs);
      setSimTariff(analysisResult.analysis.inputs.tariffRate);
      setSimDemand(analysisResult.analysis.inputs.demandSignal);
    }
  }, [analysisResult]);

  const handleRerunAnalysis = () => {
    if (isLoading || !product) return;
    console.log('🔄 Rerunning analysis with:', { simTariff, simDemand });
    onRerunAnalysis(product.id, {
      customTariff: simTariff,
      customDemand: simDemand,
    });
  };

  if (!product) { 
    return <div className="loading-analysis">Loading product information...</div>; 
  }
  
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

      {/* Debug information */}
      <div style={{ 
        background: '#f0f0f0', 
        padding: '10px', 
        margin: '10px 0', 
        borderRadius: '5px',
        fontSize: '12px'
      }}>
        <strong>Debug Info:</strong><br/>
        isLoading: {isLoading ? 'true' : 'false'}<br/>
        analysisResult exists: {analysisResult ? 'true' : 'false'}<br/>
        recommendation: {analysisResult?.recommendation || 'none'}<br/>
        analysis exists: {analysisResult?.analysis ? 'true' : 'false'}
      </div>

      {/* Conditional rendering with explicit logging */}
      {(() => {
        if (isLoading && !analysisResult) {
          console.log('🔄 Showing loading state');
          return (
            <div className="loading-analysis">
              <div className="spinner"></div>
              <p>⏳ Generating intelligence report...</p>
            </div>
          );
        } else {
          console.log('📊 Showing analysis results');
          return (
            <div>
              {/* Analysis Dashboard */}
              {analysisResult ? (
                <div>
                  <h3>Analysis Results:</h3>
                  <DeeperAnalysisDashboard 
                    analysis={analysisResult.analysis} 
                    recommendation={analysisResult.recommendation}
                  />
                </div>
              ) : (
                <div style={{ padding: '20px', background: '#ffebee', borderRadius: '5px' }}>
                  <p>No analysis results available</p>
                </div>
              )}
              
              {/* Simulation controls */}
              {analysisResult && analysisResult.analysis && (
                <div className="simulation-container">
                  <h3>What-If Scenario Simulator</h3>
                  <p>Adjust the sliders to see how external factors impact the procurement decision.</p>
                  
                  {simTariff !== null ? (
                    <div className="slider-group">
                      <label>Tariff Rate: <strong>{(simTariff * 100).toFixed(1)}%</strong></label>
                      <input 
                        type="range" 
                        min="0" 
                        max="0.5" 
                        step="0.01" 
                        value={simTariff} 
                        onChange={(e) => setSimTariff(parseFloat(e.target.value))} 
                      />
                    </div>
                  ) : (
                    <p>Loading simulator...</p>
                  )}
                  
                  {simDemand !== null ? (
                    <div className="slider-group">
                      <label>Demand Signal: <strong>{simDemand.toFixed(2)}</strong></label>
                      <input 
                        type="range" 
                        min="-1" 
                        max="1" 
                        step="0.1" 
                        value={simDemand} 
                        onChange={(e) => setSimDemand(parseFloat(e.target.value))} 
                      />
                    </div>
                  ) : null}
                  
                  <button 
                    onClick={handleRerunAnalysis} 
                    disabled={isLoading || simTariff === null} 
                    className="rerun-button"
                  >
                    {isLoading ? 'Re-analyzing...' : '⚡ Re-Run Analysis'}
                  </button>
                </div>
              )}
            </div>
          );
        }
      })()}
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