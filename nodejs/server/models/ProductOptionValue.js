// models/productOptionValue.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const ProductOption = require('./ProductOption');
const ProductVariantOptionValue = require('./ProductVariantOptionValue');

const ProductOptionValue = sequelize.define('ProductOptionValue', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  product_option_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    references: { model: 'product_options', key: 'id' },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  value: {
    type: DataTypes.STRING,
    allowNull: false
  },
  price_adjustment: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  comment_needed: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  tableName: 'product_option_values',
  timestamps: false
});

module.exports = ProductOptionValue;