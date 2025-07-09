import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import ProductList from './components/ProductList';
import ProductDetail from './components/ProductDetail';
import { fetchProducts, analyzeProduct, healthCheck } from './api/client';
import './App.css';

function App() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState({
    products: true,
    analysis: false,
    health: false
  });
  const [error, setError] = useState(null);
  const [serverHealth, setServerHealth] = useState(null);

  // Enhanced error handling with user-friendly messages
  const handleError = (error, context) => {
    console.error(`Error in ${context}:`, error);
    
    let userMessage = 'Something went wrong. Please try again.';
    
    if (error.userMessage) {
      userMessage = error.userMessage;
    } else if (error.isNetworkError) {
      userMessage = 'Cannot connect to server. Please check your internet connection and try again.';
    } else if (error.isTimeout) {
      userMessage = 'Request timed out. The server might be starting up, please try again in a moment.';
    } else if (error.message) {
      userMessage = error.message;
    }
    
    setError(userMessage);
    return userMessage;
  };

  // Health check function
  const checkServerHealth = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, health: true }));
      const health = await healthCheck();
      setServerHealth(health);
      console.log('✅ Server health check passed');
    } catch (error) {
      console.error('❌ Server health check failed:', error);
      setServerHealth({ status: 'error', message: 'Server unavailable' });
    } finally {
      setLoading(prev => ({ ...prev, health: false }));
    }
  }, []);

  // Memoized fetch function with enhanced error handling
  const fetchProductsData = useCallback(async () => {
    try {
      setError(null);
      setLoading(prev => ({ ...prev, products: true }));
      
      console.log('🔄 Starting to fetch products...');
      const response = await fetchProducts();
      
      if (!response?.data) {
        throw new Error('No product data received from server');
      }
      
      console.log(`✅ Successfully loaded ${response.data.length} products`);
      setProducts(response.data);
      
    } catch (error) {
      const errorMessage = handleError(error, 'fetchProducts');
      setProducts([]);
      
      // If it's a network error, also check server health
      if (error.isNetworkError) {
        checkServerHealth();
      }
      
    } finally {
      setLoading(prev => ({ ...prev, products: false }));
    }
  }, [checkServerHealth]);

  // Initial data loading
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      if (isMounted) {
        // First check server health
        await checkServerHealth();
        // Then fetch products
        await fetchProductsData();
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [fetchProductsData, checkServerHealth]);

  // Enhanced product selection with better error handling
  const handleProductSelect = async (product) => {
    console.log("📥 handleProductSelect called with:", product);
    console.log("✅ Product.name:", product.name);
    console.log("✅ Product.id:", product.id);
    if (!product || !product.id) {
      console.warn("❌ Invalid product selected:", product);
      setError('Invalid product selected');
      return;
    }
    
    setSelectedProduct(product);
    setLoading(prev => ({ ...prev, analysis: true }));
    setAnalysisResult(null);
    setError(null);

    try {
      console.log(`🔍 Starting analysis for product: ${product.name} (${product.id})`);
      const response = await analyzeProduct(product.id);
      
      if (!response?.data) {
        throw new Error('No analysis data received');
      }
      
      console.log('✅ Analysis completed successfully');
      setAnalysisResult(response.data);
      
    } catch (error) {
      const errorMessage = handleError(error, 'analyzeProduct');
      
      // Set fallback analysis result for better UX
      setAnalysisResult({ 
        recommendation: 'Error', 
        analysis: { 
          rulesTriggered: [
            'Analysis failed',
            `Error: ${errorMessage}`,
            'Please try again or contact support'
          ],
          summary: 'Unable to complete analysis at this time'
        },
        error: true,
        errorMessage: errorMessage
      });
      
    } finally {
      setLoading(prev => ({ ...prev, analysis: false }));
    }
  };

  // Navigate back to product list
  const handleBackToProducts = useCallback = (() => {
    setSelectedProduct(null);
    setAnalysisResult(null);
    setError(null);
  }, []);

  // Retry function for failed operations
  const handleRetry = useCallback(() => {
    setError(null);
    if (selectedProduct) {
      handleProductSelect(selectedProduct);
    } else {
      fetchProductsData();
    }
  }, [selectedProduct, fetchProductsData]);

  // Render error state with retry option
  const renderError = () => {
    if (!error) return null;
    
    return (
      <div className="error-container" style={{
        padding: '20px',
        margin: '20px',
        backgroundColor: '#fee',
        border: '1px solid #fcc',
        borderRadius: '8px',
        textAlign: 'center'
      }}>
        <h3 style={{ color: '#c33', marginBottom: '10px' }}>
          ⚠️ Something went wrong
        </h3>
        <p style={{ color: '#666', marginBottom: '15px' }}>
          {error}
        </p>
        <button 
          onClick={handleRetry}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🔄 Try Again
        </button>
        {serverHealth?.status === 'error' && (
          <p style={{ color: '#999', marginTop: '10px', fontSize: '14px' }}>
            Server Status: {serverHealth.message}
          </p>
        )}
      </div>
    );
  };

  // Render loading state
  const renderLoading = () => {
    if (!loading.products) return null;
    
    return (
      <div className="loading-container" style={{
        padding: '40px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '24px', marginBottom: '10px' }}>
          ⏳ Loading...
        </div>
        <p style={{ color: '#666' }}>
          {loading.health ? 'Checking server status...' : 'Fetching products...'}
        </p>
        {serverHealth?.status === 'ok' && (
          <p style={{ color: '#28a745', fontSize: '14px' }}>
            ✅ Server is healthy
          </p>
        )}
      </div>
    );
  };

  // Main content renderer
  const renderContent = () => {
    // Show loading state
    if (loading.products) {
      return renderLoading();
    }
    
    // Show error state
    if (error && !selectedProduct) {
      return renderError();
    }
    if (selectedProduct && loading.analysis) {
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          ⏳ Analyzing <strong>{selectedProduct.name || 'product'}</strong>...
        </div>
      );
    }

    // Show product detail view
    if (selectedProduct) {
      // ✅ ADDITION: safety check & logging
      console.log('🟡 Selected product:', selectedProduct);
      return (
        <ProductDetail 
          product={selectedProduct} 
          analysis={analysisResult}
          isLoading={loading.analysis}
          onBack={handleBackToProducts}
          error={error}
          onRetry={handleRetry}
        />
      );
    }

    // Show product list
    return (
      <ProductList 
        products={products} 
        onProductSelect={handleProductSelect}
        isLoading={loading.products}
        error={error}
        onRetry={handleRetry}
      />
    );
  };

  // Debug info (only in development)
  const renderDebugInfo = () => {
    if (process.env.NODE_ENV === 'production') return null;
    
    return (
      <div style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        backgroundColor: '#f8f9fa',
        padding: '10px',
        borderRadius: '4px',
        fontSize: '12px',
        border: '1px solid #dee2e6'
      }}>
        <div>📊 Debug Info:</div>
        <div>Products: {products.length}</div>
        <div>Selected: {selectedProduct?.name || 'None'}</div>
        <div>Server: {serverHealth?.status || 'Unknown'}</div>
        <div>API: {process.env.REACT_APP_API_BASE_URL || 'Default'}</div>
      </div>
    );
  };

  return (
    <div className="app-container">
      <Header />
      <main className="main-content">
        {renderContent()}
      </main>
      {renderDebugInfo()}
      {/* ✅ Emergency Debug Overlay */}
      {process.env.NODE_ENV === "development" && selectedProduct && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'rgba(0,0,0,0.8)',
          color: '#fff',
          padding: '8px',
          zIndex: 9999,
          fontFamily: 'monospace',
          maxHeight: '40vh',
          overflowY: 'auto'
        }}>
          Debug: Selected → <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(selectedProduct, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default App;