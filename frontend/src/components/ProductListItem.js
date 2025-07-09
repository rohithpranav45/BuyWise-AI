import React from 'react';
import PropTypes from 'prop-types';
import './ProductListItem.css';

const ProductListItem = ({ product, onProductSelect }) => {
  // Safely handle undefined/null product
  const safeProduct = {
    ...product,
    id: product?.id || product?._id || null
  };
  
  // Safely access nested inventory
  const stock = safeProduct.inventory?.stock ?? 'N/A';
  const sku = safeProduct.sku || 'No SKU';
  const imageUrl = safeProduct.imageUrl || '/placeholder-product.png';

  const handleClick = () => {
    console.log("👆 Clicked product:", safeProduct);
    if (typeof onProductSelect === 'function' && safeProduct.id) {
      onProductSelect(safeProduct);
    } else {
      console.warn("Missing product is:", safeProduct);
    }
  };

  return (
    <div 
      className="product-list-item" 
      onClick={handleClick}
      role="button" 
      tabIndex={0}
      aria-label={`View details for ${safeProduct.name || 'product'}`}
    >
      <img 
        src={imageUrl} 
        alt={safeProduct.name || 'Product image'} 
        className="product-image"
        onError={(e) => {
          e.target.src = '/placeholder-product.png';
        }}
      />
      <h3>{safeProduct.name || 'Unnamed Product'}</h3>
      <p>SKU: {sku}</p>
      <p>Stock: {stock}</p>
    </div>
  );
};

ProductListItem.propTypes = {
  product: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string,
    sku: PropTypes.string,
    imageUrl: PropTypes.string,
    inventory: PropTypes.shape({
      stock: PropTypes.number
    })
  }),
  onProductSelect: PropTypes.func.isRequired
};

ProductListItem.defaultProps = {
  product: {
    name: 'Unnamed Product',
    sku: 'No SKU',
    imageUrl: '/placeholder-product.png',
    inventory: {
      stock: 0
    }
  }
};

export default ProductListItem;