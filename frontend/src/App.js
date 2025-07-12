import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import ProductList from './components/ProductList';
import ProductDetail from './components/ProductDetail';
import Placeholder from './components/Placeholder'; // Import the placeholder for better loading
import { fetchProducts, analyzeProduct, healthCheck, fetchSubstitutes } from './api/client';
import './App.css';

function App() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState({ products: true, analysis: false });
  const [error, setError] = useState(null);
  const [serverHealth, setServerHealth] = useState(null);

  // --- FEATURE RESTORED: Full Error Handling ---
  const handleError = (error, context) => {
    console.error(`Error in ${context}:`, error);
    // Use the detailed error message from the API client if it exists
    const userMessage = error.userMessage || error.message || 'An unexpected error occurred. Please try again.';
    setError(userMessage);
  };

  const checkServerHealth = useCallback(async () => {
    try {
      const health = await healthCheck();
      setServerHealth(health);
      console.log('✅ Server health check passed:', health);
    } catch (error) {
      console.error('❌ Server health check failed:', error);
      setServerHealth({ status: 'error', message: 'Server unavailable' });
    }
  }, []);

  const fetchProductsData = useCallback(async () => {
    try {
      setError(null);
      setLoading(prev => ({ ...prev, products: true }));
      const response = await fetchProducts();
      setProducts(response.data || []);
      console.log(`✅ Successfully loaded ${response.data.length} products`);
    } catch (error) {
      handleError(error, 'fetchProducts');
    } finally {
      setLoading(prev => ({ ...prev, products: false }));
    }
  }, []);

  useEffect(() => {
    checkServerHealth();
    fetchProductsData();
  }, [checkServerHealth, fetchProductsData]);

  const handleProductSelect = async (product) => {
    if (!product || !product.id) {
      handleError({ message: 'Invalid product selected.' }, 'handleProductSelect');
      return;
    }
    
    setSelectedProduct(product);
    setLoading(prev => ({ ...prev, analysis: true }));
    setAnalysisResult(null); // Clear previous results
    setError(null);

    try {
      const analysisResponse = await analyzeProduct(product.id);
      const substitutesResponse = await fetchSubstitutes(product.id);
      
      const combinedResult = {
        ...analysisResponse.data,
        analysis: {
          ...analysisResponse.data.analysis,
          substitutes: substitutesResponse.data || []
        }
      };

      setAnalysisResult(combinedResult);
      console.log('✅ Analysis and substitutes fetched successfully');
    } catch (error) {
      handleError(error, 'analyzeProduct');
    } finally {
      setLoading(prev => ({ ...prev, analysis: false }));
    }
  };

  const handleBackToProducts = useCallback(() => {
    setSelectedProduct(null);
    setAnalysisResult(null);
    setError(null);
  }, []);
  
  // --- FEATURE RESTORED: Retry Logic ---
  const handleRetry = useCallback(() => {
    setError(null);
    if (selectedProduct) {
      // If we were on a detail page, re-run the analysis
      handleProductSelect(selectedProduct);
    } else {
      // If we were on the list page, re-fetch the products
      fetchProductsData();
    }
  }, [selectedProduct, fetchProductsData, handleProductSelect]);


  // --- FEATURE RESTORED: Detailed Rendering Logic ---
  const renderContent = () => {
    // Show skeleton placeholder while products are loading initially
    if (loading.products) {
      return <Placeholder count={12} />;
    }

    // Show a full-page error message if loading products failed
    if (error && !selectedProduct) {
      return (
        <div className="error-message">
          <p>⚠️ {error}</p>
          <button onClick={handleRetry} className="retry-button">🔄 Try Again</button>
        </div>
      );
    }
    
    // Show the Product Detail view
    if (selectedProduct) {
      return (
        <ProductDetail 
          product={selectedProduct} 
          analysis={analysisResult}
          isLoading={loading.analysis} // Pass loading state to show spinner inside the component
          onBack={handleBackToProducts}
        />
      );
    }
    
    // Show the Product List
    return <ProductList products={products} onProductSelect={handleProductSelect} />;
  };

  return (
    <div className="app-container">
      <Header />
      {/* 
        --- THE CRITICAL BUG FIX ---
        This 'key' prop forces a full re-render when switching views,
        preventing the Chart.js 'removeChild' error.
      */}
      <main className="main-content" key={selectedProduct ? selectedProduct.id : 'product-list'}>
        {renderContent()}
      </main>
    </div>
  );
}

export default App;