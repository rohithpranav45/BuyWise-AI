import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import ProductList from './components/ProductList';
import ProductDetail from './components/ProductDetail';
import Placeholder from './components/Placeholder';
import DashboardSummary from './components/DashboardSummary';
import StoreSelectorModal from './components/StoreSelectorModal';
import CategorySelector from './components/CategorySelector'; // <-- The new component
import { 
  fetchProducts, 
  analyzeProduct, 
  fetchDashboardStatus
} from './api/client';
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

  // --- NEW: State for the selected category ---
  const [selectedCategory, setSelectedCategory] = useState(null);

  const handleError = (err, ctx) => console.error(`Error in ${ctx}:`, err);

  // This effect fetches product and status data after a store is selected.
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
    setSelectedCategory(null); // Ensure everything resets
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

  // --- NEW HIERARCHICAL RENDERING ---
  // Level 1: If no store is selected, show the store selector.
  if (!selectedStore) {
    return <StoreSelectorModal onStoreSelect={handleStoreSelect} />;
  }

  // Level 2: If a store is selected but no category, show the category selector.
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
  
  // Level 3: If both are selected, render the main application dashboard.
  return (
    <div className="app-container">
      <Header store={selectedStore} onChangeStore={handleBackToStoreSelect} />
      <main className="main-content" key={selectedProduct ? selectedProduct.id : 'product-list'}>
        {loading.app ? <Placeholder count={12} /> : (
          selectedProduct ? (
            <ProductDetail 
              product={selectedProduct} 
              analysis={analysisResult}
              isLoading={loading.analysis}
              onBack={handleBackToProducts}
              onRerunAnalysis={runAnalysis}
            />
          ) : (
            <>
              <DashboardSummary 
                statuses={dashboardStatus}
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
                selectedCategory={selectedCategory}
                onBackToCategories={() => setSelectedCategory(null)} // Provide the reset handler
              />
              <ProductList 
                products={products.filter(p => p.category === selectedCategory)} // Filter products by selected category
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