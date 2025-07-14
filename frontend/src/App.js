import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import ProductList from './components/ProductList';
import ProductDetail from './components/ProductDetail';
import Placeholder from './components/Placeholder';
import DashboardSummary from './components/DashboardSummary';
import StoreSelectorModal from './components/StoreSelectorModal';
import CategorySelector from './components/CategorySelector';
import { fetchProducts, analyzeProduct, fetchDashboardStatus } from './api/client';
import './App.css';

function App() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState({ app: true, analysis: false });
  const [error, setError] = useState(null);
  const [dashboardStatus, setDashboardStatus] = useState({});
  const [activeFilter, setActiveFilter] = useState('All');
  
  const [selectedStore, setSelectedStore] = useState(() => {
    try {
      const saved = localStorage.getItem('selectedStore');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const [selectedCategory, setSelectedCategory] = useState(null);

  const handleError = (err, ctx) => {
    console.error(`Error in ${ctx}:`, err);
    setError(err.message || 'An unexpected error occurred.');
  };

  useEffect(() => {
    if (selectedStore) {
      setLoading(prev => ({ ...prev, app: true }));
      Promise.all([fetchProducts(), fetchDashboardStatus()])
        .then(([productsResponse, statusResponse]) => {
          setProducts(productsResponse.data || []);
          setDashboardStatus(statusResponse.data || {});
        })
        .catch(err => handleError(err, 'fetchInitialData'))
        .finally(() => setLoading(prev => ({ ...prev, app: false })));
    }
  }, [selectedStore]);

  const handleStoreSelect = (store) => {
    localStorage.setItem('selectedStore', JSON.stringify(store));
    setSelectedStore(store);
  };
  
  const handleBackToStoreSelect = () => {
    localStorage.removeItem('selectedStore');
    setSelectedStore(null);
    setSelectedCategory(null);
    setProducts([]);
  };

  const runAnalysis = useCallback(async (productId, customInputs) => {
    console.log('🚀 Starting runAnalysis for product:', productId);
    console.log('🏪 Selected store:', selectedStore);
    console.log('📝 Custom inputs:', customInputs);
    
    if (!selectedStore) {
      console.error('❌ No selected store, aborting analysis');
      return;
    }
    
    if (!productId) {
      console.error('❌ No product ID provided, aborting analysis');
      return;
    }
    
    console.log('⏳ Setting loading state to true');
    setLoading(prev => ({ ...prev, analysis: true }));
    setError(null);
    
    try {
      console.log('📡 Calling analyzeProduct API...');
      const response = await analyzeProduct(productId, selectedStore.id, customInputs);
      console.log('✅ API response received:', response);
      
      if (!response || !response.data) {
        throw new Error('Invalid response structure from API');
      }
      
      console.log('💾 Setting analysis result:', response.data);
      setAnalysisResult(response.data);
      console.log('✅ Analysis completed successfully');
      
    } catch (err) {
      console.error('❌ Analysis failed:', err);
      console.error('❌ Error stack:', err.stack);
      
      handleError(err, 'runAnalysis');
      
      // Create fallback result
      const fallbackResult = { 
        recommendation: 'Error', 
        analysis: { 
          decisionNarrative: err.message || 'Could not connect to analysis engine.',
          error: true
        } 
      };
      
      console.log('🔄 Setting fallback result:', fallbackResult);
      setAnalysisResult(fallbackResult);
      
    } finally {
      console.log('🏁 Analysis complete, resetting loading state');
      // Add a small delay to ensure state updates are processed
      setTimeout(() => {
        setLoading(prev => ({ ...prev, analysis: false }));
      }, 100);
    }
  }, [selectedStore]);

  const handleProductSelect = useCallback((product) => {
    if (!product || !product.id) return;
    
    console.log('📦 Product selected:', product.id);
    setSelectedProduct(product);
    setAnalysisResult(null);
    setError(null);
    
    // Start analysis
    runAnalysis(product.id);
  }, [runAnalysis]);

  const handleBackToProducts = useCallback(() => {
    console.log('🔙 Returning to product list');
    setSelectedProduct(null);
    setAnalysisResult(null);
    setError(null);
    setLoading(prev => ({ ...prev, analysis: false }));
  }, []);

  if (!selectedStore) {
    return <StoreSelectorModal onStoreSelect={handleStoreSelect} />;
  }

  if (!selectedCategory) {
    return (
      <CategorySelector
        products={products}
        statuses={dashboardStatus}
        onCategorySelect={setSelectedCategory}
        onBackToStoreSelect={handleBackToStoreSelect}
      />
    );
  }

  return (
    <div className="app-container">
      <Header store={selectedStore} onChangeStore={handleBackToStoreSelect} />
      <main className="main-content" key={selectedProduct ? selectedProduct.id : 'product-list'}>
        {loading.app ? <Placeholder count={12} /> : (
          selectedProduct ? (
            <ProductDetail 
              product={selectedProduct} 
              analysisResult={analysisResult}
              isLoading={loading.analysis}
              onBack={handleBackToProducts}
              onRerunAnalysis={runAnalysis}
            />
          ) : (
            <>
              <DashboardSummary 
                products={products.filter(p => p.category === selectedCategory)}
                statuses={dashboardStatus}
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
                selectedCategory={selectedCategory}
                onBackToCategories={() => setSelectedCategory(null)}
              />
              <ProductList 
                products={products.filter(p => p.category === selectedCategory)}
                onProductSelect={handleProductSelect}
                statuses={dashboardStatus}
                filter={activeFilter}
              />
            </>
          )
        )}
      </main>
    </div>
  );
}

export default App;