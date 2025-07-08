import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import ProductList from './components/ProductList';
import ProductDetail from './components/ProductDetail';
import { fetchProducts, analyzeProduct } from './api/client';
import './App.css';

function App() {
  const [products, setProducts] = useState([]); // Initialize as empty array
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState({
    products: true,
    analysis: false
  });
  const [error, setError] = useState(null);

  // Memoized fetch function to prevent unnecessary recreations
  const fetchProductsData = useCallback(async () => {
    try {
      setError(null);
      setLoading(prev => ({ ...prev, products: true }));
    
      const response = await fetchProducts();
    
      if  (!response?.data) {
        throw new Error('Server responded with no data');
      }
    
      setProducts(response.data);
    } catch (err) {
      let errorMessage = err.message;
    
      if (err.message.includes('Network Error')) {
        errorMessage = 'Backend server is unavailable. Please try again later.';
      } else if (err.message.includes('timeout')) {
      errorMessage = 'Backend is waking up (Render free tier). Try refreshing in 30 seconds.';
      }
    
      setError(errorMessage);
      console.error('API Error:', err);
      setProducts([]);
    } finally {
      setLoading(prev => ({ ...prev, products: false }));
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      await fetchProductsData();
    };

    if (isMounted) {
      loadData();
    }

    return () => {
      isMounted = false;
    };
  }, [fetchProductsData]);

  const handleProductSelect = async (product) => {
    if (!product?.id) return;
    
    setSelectedProduct(product);
    setLoading(prev => ({ ...prev, analysis: true }));
    setAnalysisResult(null);

    try {
      const response = await analyzeProduct(product.id);
      
      if (!response?.data) {
        throw new Error('Invalid analysis response');
      }
      
      setAnalysisResult(response.data);
    } catch (err) {
      console.error("Analysis Error:", err);
      setAnalysisResult({ 
        recommendation: 'Error', 
        analysis: { 
          rulesTriggered: [`Analysis failed: ${err.message}`],
          summary: 'Could not retrieve analysis'
        },
        error: true
      });
    } finally {
      setLoading(prev => ({ ...prev, analysis: false }));
    }
  };

  const handleBackToProducts = useCallback(() => {
    setSelectedProduct(null);
    setAnalysisResult(null);
  }, []);

  const renderContent = () => {
    if (selectedProduct) {
      return (
        <ProductDetail 
          product={selectedProduct} 
          analysis={analysisResult}
          isLoading={loading.analysis}
          onBack={handleBackToProducts} 
        />
      );
    }

    return (
      <ProductList 
        products={products} 
        onProductSelect={handleProductSelect}
        isLoading={loading.products}
        error={error}
      />
    );
  };

  return (
    <div className="app-container">
      <Header />
      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;