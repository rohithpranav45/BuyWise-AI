import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import ProductList from './components/ProductList';
import ProductDetail from './components/ProductDetail';
import Placeholder from './components/Placeholder';
import DashboardSummary from './components/DashboardSummary'; // <-- Import new component
import { 
  fetchProducts, 
  analyzeProduct, 
  healthCheck, 
  fetchSubstitutes,
  fetchDashboardStatus // <-- Import new API function
} from './api/client';
import './App.css';

function App() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState({ products: true, analysis: false });
  const [error, setError] = useState(null);
  
  // --- State for the new dashboard feature ---
  const [dashboardStatus, setDashboardStatus] = useState({});
  const [activeFilter, setActiveFilter] = useState('All');

  const handleError = (err, ctx) => console.error(`Error in ${ctx}:`, err);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(prev => ({ ...prev, products: true }));
        await healthCheck();
        
        // Fetch products and dashboard statuses in parallel
        const [productsResponse, statusResponse] = await Promise.all([
          fetchProducts(),
          fetchDashboardStatus()
        ]);

        setProducts(productsResponse.data || []);
        setDashboardStatus(statusResponse.data || {});
      } catch (err) {
        handleError(err, 'fetchInitialData');
        setError('Could not load initial dashboard data.');
      } finally {
        setLoading(prev => ({ ...prev, products: false }));
      }
    };
    fetchInitialData();
  }, []);

  const runAnalysis = useCallback(async (productId, customInputs) => {
    // (This function is from Enhancement 1 and is unchanged)
    setLoading(prev => ({ ...prev, analysis: true }));
    setError(null);
    try {
      const [analysisResponse, substitutesResponse] = await Promise.all([
        analyzeProduct(productId, customInputs),
        fetchSubstitutes(productId)
      ]);
      const combinedResult = { ...analysisResponse.data, analysis: { ...analysisResponse.data.analysis, substitutes: substitutesResponse.data || [] } };
      setAnalysisResult(combinedResult);
    } catch (err) {
      handleError(err, 'runAnalysis');
      setError('Failed to run detailed analysis.');
    } finally {
      setLoading(prev => ({ ...prev, analysis: false }));
    }
  }, []);

  const handleProductSelect = (product) => {
    if (!product || !product.id) return;
    setSelectedProduct(product);
    setAnalysisResult(null);
    runAnalysis(product.id);
  };

  const handleBackToProducts = useCallback(() => {
    setSelectedProduct(null);
    setAnalysisResult(null);
    setError(null);
  }, []);

  const renderContent = () => {
    if (loading.products) return <Placeholder count={12} />;
    if (error && !selectedProduct) return <div className="error-message">Error: {error}</div>;

    if (selectedProduct) {
      return (
        <ProductDetail 
          product={selectedProduct} 
          analysis={analysisResult}
          isLoading={loading.analysis}
          onBack={handleBackToProducts}
          onRerunAnalysis={runAnalysis}
        />
      );
    }
    
    // Render the dashboard summary and the filtered list
    return (
      <>
        <DashboardSummary 
          statuses={dashboardStatus}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />
        <ProductList 
          products={products} 
          onProductSelect={handleProductSelect}
          statuses={dashboardStatus}
          filter={activeFilter}
        />
      </>
    );
  };

  return (
    <div className="app-container">
      <Header />
      <main className="main-content" key={selectedProduct ? selectedProduct.id : 'product-list'}>
        {renderContent()}
      </main>
    </div>
  );
}

export default App;