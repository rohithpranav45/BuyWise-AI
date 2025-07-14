import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import ProductList from './components/ProductList';
import ProductDetail from './components/ProductDetail';
import Placeholder from './components/Placeholder';
import DashboardSummary from './components/DashboardSummary';
import StoreSelectorModal from './components/StoreSelectorModal';
import CategorySelector from './components/CategorySelector';
import { fetchProducts, analyzeProduct, fetchDashboardStatus, fetchTariffs } from './api/client';
import './App.css';

function App() {
  const [products, setProducts] = useState([]);
  const [tariffs, setTariffs] = useState({}); // <-- NEW STATE
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
      Promise.all([
        fetchProducts(), 
        fetchDashboardStatus(),
        fetchTariffs() // Fetch tariffs on load
      ])
        .then(([productsResponse, statusResponse, tariffsResponse]) => {
          setProducts(productsResponse.data || []);
          setDashboardStatus(statusResponse.data || {});
          setTariffs(tariffsResponse.data || {}); // Set tariffs state
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
    if (!selectedStore) return;
    setLoading(prev => ({ ...prev, analysis: true }));
    setError(null);
    try {
      const response = await analyzeProduct(productId, selectedStore.id, customInputs);
      setAnalysisResult(response.data);
    } catch (err) {
      handleError(err, 'runAnalysis');
      setAnalysisResult({ 
        recommendation: 'Error', 
        analysis: { decisionNarrative: err.message || 'Could not connect to analysis engine.' } 
      });
    } finally {
      setLoading(prev => ({ ...prev, analysis: false }));
    }
  }, [selectedStore]);

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
              // Pass all data down
              allProducts={products}
              allTariffs={tariffs}
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