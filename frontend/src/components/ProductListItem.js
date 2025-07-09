import React from 'react';
import PropTypes from 'prop-types';
import './ProductListItem.css';

const ProductListItem = ({ product, onProductSelect }) => {
  // Normalize product to flatten it directly (NO nesting)
  const normalizedProduct = {
    ...product,
    id: product?.id || product?._id || null
  };

  const handleClick = () => {
    console.log("👆 Clicked product:", normalizedProduct);
    if (typeof onProductSelect === 'function' && normalizedProduct.id) {
      onProductSelect(normalizedProduct); // ✅ send clean, flattened product
    } else {
      console.warn("⚠️ Invalid product selected:", normalizedProduct);
    }
  };

  const stock = normalizedProduct.inventory?.stock ?? 'N/A';
  const sku = normalizedProduct.sku || 'No SKU';
  const imageUrl = normalizedProduct.imageUrl || '/placeholder-product.png';

  return (
    <div
      className="product-list-item"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={`View details for ${normalizedProduct.name || 'product'}`}
    >
      <img
        src={imageUrl}
        alt={normalizedProduct.name || 'Product image'}
        className="product-image"
        onError={(e) => {
          e.target.src = '/placeholder-product.png';
        }}
      />
      <h3>{normalizedProduct.name || 'Unnamed Product'}</h3>
      <p>SKU: {sku}</p>
      <p>Stock: {stock}</p>
    </div>
  );
};

ProductListItem.propTypes = {
  product: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    sku: PropTypes.string,
    imageUrl: PropTypes.string,
    inventory: PropTypes.shape({
      stock: PropTypes.number
    })
  }).isRequired,
  onProductSelect: PropTypes.func.isRequired
};

export default ProductListItem;
