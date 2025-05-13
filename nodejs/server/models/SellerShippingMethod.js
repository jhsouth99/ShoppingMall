// models/sellerShippingMethod.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const ShippingMethod = require('./ShippingMethod');

const SellerShippingMethod = sequelize.define('SellerShippingMethod', {
  seller_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    allowNull: false,
    references: { model: 'users', key: 'id' },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  shipping_method_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    allowNull: false,
    references: { model: 'shipping_methods', key: 'id' },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
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
  tableName: 'seller_shipping_methods',
  timestamps: false
});

module.exports = SellerShippingMethod;