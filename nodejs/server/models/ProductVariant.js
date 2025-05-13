// models/productVariant.js
const { DataTypes, Sequelize } = require('sequelize');
const sequelize = require('../config/database');
const Product = require('./Product');
const ProductVariantOptionValue = require('./ProductVariantOptionValue');

const ProductVariant = sequelize.define('ProductVariant', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  product_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    references: { model: 'products', key: 'id' },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  sku: {
    type: DataTypes.STRING,
    allowNull: false, // 일반적으로 SKU는 필수
    unique: true
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  stock_quantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
  }
}, {
  tableName: 'product_variants',
  timestamps: false, // 수동 정의
  indexes: [
    { fields: ['product_id'] },
    { unique: true, fields: ['sku'] }
  ]
});

module.exports = ProductVariant;