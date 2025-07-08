import React from 'react';
import ProductListItem from './ProductListItem';
import Placeholder from './Placeholder';
import './ProductList.css';

const ProductList = ({ products, onProductSelect, isLoading, error }) => {
  // Conditional rendering logic
  if (isLoading) {
    return <Placeholder count={8} />;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!products || products.length === 0) {
    return <p>No products found.</p>;
  }

  return (
    <div className="product-list-container">
      <h2>Products</h2>
      <div className="product-list">
        {products.map(product => (
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