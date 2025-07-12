import React from 'react';
import ProductListItem from './ProductListItem';
import Placeholder from './Placeholder';
import './ProductList.css';

const ProductList = ({ products, onProductSelect, statuses, filter }) => {
  // Apply filtering logic
  const filteredProducts = filter === 'All' 
    ? products 
    : products.filter(product => statuses[product.id] === filter);

  if (!products || products.length === 0) {
    return <Placeholder count={12} />;
  }

  return (
    <div className="product-list-container">
      <div className="product-list">
        {filteredProducts.map((product) => (
          <ProductListItem 
            key={product.id} 
            product={product} 
            onProductSelect={onProductSelect}
            // Pass status down to the item for badge display
            status={statuses[product.id]}
          />
        ))}
      </div>
      {filteredProducts.length === 0 && filter !== 'All' && (
        <div className="no-results-message">
          No products match the filter: "{filter}"
        </div>
      )}
    </div>
  );
};

export default ProductList;