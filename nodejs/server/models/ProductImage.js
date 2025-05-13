// models/productImage.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { ProductImageType } = require('../enums');
const Product = require('./Product');

const ProductImage = sequelize.define('ProductImage', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  product_id: {
    type: DataTypes.BIGINT.UNSIGNED, // Product ID 타입과 일치
    allowNull: false,
    references: { model: 'products', key: 'id' }
  },
  image_url: {
    type: DataTypes.STRING,
    allowNull: false
  },
  alt_text: {
    type: DataTypes.STRING,
    allowNull: true
  },
  image_type: {
    type: DataTypes.ENUM,
    values: Object.values(ProductImageType), // ['THUMBNAIL', 'DETAIL', 'ZOOM']
    allowNull: false
  },
  order: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'product_images',
  timestamps: false
});

module.exports = ProductImage;