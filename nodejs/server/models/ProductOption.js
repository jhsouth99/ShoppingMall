// models/productOption.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Product = require('./Product');
const ProductOptionValue = require('./ProductOptionValue');
const ProductVariantOptionValue = require('./ProductVariantOptionValue');

const ProductOption = sequelize.define('ProductOption', {
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
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  sku: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  }
}, {
  tableName: 'product_options',
  timestamps: false
});

module.exports = ProductOption;