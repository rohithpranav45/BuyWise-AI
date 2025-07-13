import React from 'react';
import PropTypes from 'prop-types';
import './ProductListItem.css';

const ProductListItem = ({ product, onProductSelect, status }) => {
  const statusClassName = status ? status.toLowerCase().replace(/ /g, '-') : 'unknown';

  return (
    <div className="product-list-item" onClick={() => onProductSelect(product)}>
      <div className="product-image-container">
        {/* --- The badge is now above the image for a cleaner look --- */}
        <img
          src={product.imageUrl || '/placeholder-product.png'}
          alt={product.name}
          className="product-image"
        />
      </div>
      <div className="product-item-info">
        {/* --- vvvvvv BADGE MOVED HERE FOR BETTER STYLING vvvvvv --- */}
        {status && (
          <div className={`product-status-tag ${statusClassName}`}>
            {status}
          </div>
        )}
        {/* --- ^^^^^^ END OF MOVED BADGE ^^^^^^ --- */}
        <h3>{product.name || 'Unnamed Product'}</h3>
        <p>SKU: {product.sku || 'N/A'}</p>
        <p>Stock: <strong>{product.inventory?.stock ?? 'N/A'}</strong> units</p>
      </div>
    </div>
  );
};

ProductListItem.propTypes = {
  product: PropTypes.object.isRequired,
  onProductSelect: PropTypes.func.isRequired,
  status: PropTypes.string,
};

export default ProductListItem;