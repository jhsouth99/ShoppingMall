// models/productVariantOptionValue.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const ProductVariant = require('./ProductVariant');
const ProductOption = require('./ProductOption');
const ProductOptionValue = require('./ProductOptionValue');

const ProductVariantOptionValue = sequelize.define('ProductVariantOptionValue', {
  variant_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    allowNull: false,
    references: { model: 'product_variants', key: 'id' },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  product_option_id: {
    type: DataTypes.BIGINT.UNSIGNED, // PK는 아니지만, 관계 및 인덱스용
    allowNull: false,
    references: { model: 'product_options', key: 'id' },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  product_option_value_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    allowNull: false,
    references: { model: 'product_option_values', key: 'id' },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  }
}, {
  tableName: 'product_variant_option_values',
  timestamps: false,
  indexes: [
    { fields: ['product_option_id'] }
  ]
});


module.exports = ProductVariantOptionValue;