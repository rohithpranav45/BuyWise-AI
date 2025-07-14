import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import DeeperAnalysisDashboard from './DeeperAnalysisDashboard';
import './ProductDetail.css';

const ProductDetail = ({ product, analysisResult, isLoading, onBack, onRerunAnalysis, allProducts, allTariffs }) => {
  const [simTariff, setSimTariff] = useState(null);
  const [simDemand, setSimDemand] = useState(null);

  useEffect(() => {
    if (analysisResult?.analysis?.inputs) {
      setSimTariff(analysisResult.analysis.inputs.tariffRate);
      setSimDemand(analysisResult.analysis.inputs.demandSignal);
    }
  }, [analysisResult]);

  const handleRerunClick = () => {
    if (isLoading || !product || simTariff === null) return;
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

      <DeeperAnalysisDashboard 
        analysis={analysisResult?.analysis} 
        recommendation={analysisResult?.recommendation}
        isSimLoading={isLoading}
        simTariff={simTariff}
        simDemand={simDemand}
        onSimTariffChange={setSimTariff}
        onSimDemandChange={setSimDemand}
        onRerun={handleRerunClick}
        // Pass the new data down
        primaryProduct={product}
        allProducts={allProducts}
        allTariffs={allTariffs}
      />
    </div>
  );
};

ProductDetail.propTypes = {
  product: PropTypes.object,
  analysisResult: PropTypes.object,
  isLoading: PropTypes.bool,
  onBack: PropTypes.func.isRequired,
  onRerunAnalysis: PropTypes.func.isRequired,
  allProducts: PropTypes.array, // Can be empty initially
  allTariffs: PropTypes.object, // Can be empty initially
};

ProductDetail.defaultProps = {
  allProducts: [],
  allTariffs: {},
}

export default ProductDetail;