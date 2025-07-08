import React from 'react';
import './ProductListItem.css';

const ProductListItem = ({ product, onProductSelect }) => {
  return (
    <div className="product-list-item" onClick={() => onProductSelect(product)}>
      <img src={product.imageUrl} alt={product.name} className="product-image" />
      <h3>{product.name}</h3>
      <p>SKU: {product.sku}</p>
      <p>Stock: {product.inventory.stock}</p>
    </div>
  );
};

export default ProductListItem;