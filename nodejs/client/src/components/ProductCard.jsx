import React from 'react';

export default function ProductCard({ product }) {
  return (
    <div className="product-card">
      <div className="product-image">
        <img src={product.imageUrl} alt={product.name} />
        {product.discount && (
          <span className="product-badge discount">{product.discount}%</span>
        )}
        {product.isGroup && (
          <span className="product-badge group">공동</span>
        )}
        {product.isHot && (
          <span className="product-badge hot">HOT</span>
        )}
      </div>
      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        <div className="product-price">
          {product.originalPrice && (
            <span className="original-price">
              {product.originalPrice.toLocaleString()}원
            </span>
          )}
          <span className="current-price">
            {product.price.toLocaleString()}원
          </span>
        </div>
        {product.isGroup && (
          <div className="group-purchase-info">
            <div className="group-price">
              {product.groupPrice.toLocaleString()}원
            </div>
            <div className="progress-bar">
              <div
                className="progress"
                style={{
                  width: `${(product.currentQty / product.targetQty) * 100}%`
                }}
              />
            </div>
            <div className="progress-text">
              {product.currentQty} / {product.targetQty}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}