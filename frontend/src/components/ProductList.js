// In frontend/src/components/ProductList.js
import React from 'react';
import ProductListItem from './ProductListItem';
import Placeholder from './Placeholder';
import './ProductList.css';

const ProductList = ({ products, onProductSelect, isLoading, error, onRetry }) => {
  if (isLoading) {
    return <Placeholder count={12} />;
  }

  if (error && (!products || products.length === 0)) {
    return (
      <div className="error-message">
        <p>{error}</p>
        <button onClick={onRetry}>Try Again</button>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return <div className="info-message">No products found.</div>;
  }

  return (
    <div className="product-list-container">
      <div className="product-list">
        {products.map((product) => (
          <ProductListItem 
            key={product.id} 
            product={product} 
            onProductSelect={onProductSelect} 
          />
        ))}
      </div>
    </div>
  );
};

export default ProductList;