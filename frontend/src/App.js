import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ProductList from './components/ProductList';
import ProductDetail from './components/ProductDetail';
import { fetchProducts, analyzeProduct } from './api/client'; // Import API functions

import './App.css';

function App() {
  const [products, setProducts] = useState();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);

  useEffect(() => {
    const getProducts = async () => {
      try {
        setError(null);
        setIsLoading(true);
        const response = await fetchProducts();
        setProducts(response.data);
      } catch (err) {
        setError('Failed to load products. Is the backend server running?');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    getProducts();
  },);

  const handleProductSelect = async (product) => {
    setSelectedProduct(product);
    setIsAnalysisLoading(true);
    setAnalysisResult(null); // Clear previous analysis
    try {
      const response = await analyzeProduct(product.id);
      setAnalysisResult(response.data);
    } catch (err) {
      console.error("Failed to get analysis:", err);
      // Set a default error structure for the detail view
      setAnalysisResult({ 
        recommendation: 'Error', 
        analysis: { rulesTriggered: ['Could not retrieve analysis from server.'] } 
      });
    } finally {
      setIsAnalysisLoading(false);
    }
  };

  const handleBackToProducts = () => {
    setSelectedProduct(null);
    setAnalysisResult(null);
  };

  const renderContent = () => {
    if (selectedProduct) {
      return (
        <ProductDetail 
          product={selectedProduct} 
          analysis={analysisResult}
          isLoading={isAnalysisLoading}
          onBack={handleBackToProducts} 
        />
      );
    } else {
      return (
        <ProductList 
          products={products} 
          onProductSelect={handleProductSelect}
          isLoading={isLoading}
          error={error}
        />
      );
    }
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