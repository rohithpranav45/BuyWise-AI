import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import DeeperAnalysisDashboard from './DeeperAnalysisDashboard';
import './ProductDetail.css';

const ProductDetail = ({ product, analysisResult, isLoading, onBack, onRerunAnalysis }) => {
  // --- STATE FOR THE SIMULATOR NOW LIVES HERE ---
  const [simTariff, setSimTariff] = useState(null);
  const [simDemand, setSimDemand] = useState(null);

  useEffect(() => {
    // Initialize slider values when analysis data first arrives
    if (analysisResult?.analysis?.inputs) {
      setSimTariff(analysisResult.analysis.inputs.tariffRate);
      setSimDemand(analysisResult.analysis.inputs.demandSignal);
    }
  }, [analysisResult]);

  const handleRerunClick = () => {
    // Guard clause
    if (isLoading || !product || simTariff === null) return;
    
    // Call the analysis function passed from App.js
    onRerunAnalysis(product.id, {
      customTariff: simTariff,
      customDemand: simDemand,
    });
  };

  if (!product) {
    return <div>Loading product information...</div>;
  }
  
  const { name, sku, category, imageUrl } = product;

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

      {/* --- The Dashboard now handles EVERYTHING, including the simulator --- */}
      <DeeperAnalysisDashboard 
        analysis={analysisResult?.analysis} 
        recommendation={analysisResult?.recommendation}
        // --- vvvvvv NEW PROPS FOR SIMULATOR vvvvvv ---
        isSimLoading={isLoading}
        simTariff={simTariff}
        simDemand={simDemand}
        onSimTariffChange={setSimTariff}
        onSimDemandChange={setSimDemand}
        onRerun={handleRerunClick}
        // --- ^^^^^^ END OF NEW PROPS ^^^^^^ ---
      />
      
      {/* --- THE OLD SIMULATOR UI IS REMOVED FROM HERE --- */}
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