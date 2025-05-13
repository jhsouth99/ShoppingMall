// models/productVariantShippingMethod.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const ProductVariant = require('./ProductVariant');
const ShippingMethod = require('./ShippingMethod');

const ProductVariantShippingMethod = sequelize.define('ProductVariantShippingMethod', {
  product_variant_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false,
    references: { model: 'product_variants', key: 'id' }
  },
  shipping_method_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    allowNull: false,
    references: { model: 'shipping_methods', key: 'id' }
  },
  cost_override: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  is_default: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  tableName: 'product_variant_shipping_methods',
  timestamps: false
});

module.exports = ProductVariantShippingMethod;