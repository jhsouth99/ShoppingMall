// models/productAttributeValue.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Product = require('./Product');
const Attribute = require('./Attribute');

const ProductAttributeValue = sequelize.define('ProductAttributeValue', {
  id: { // Prisma 스키마의 id 유지
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  product_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    references: { model: 'products', key: 'id' }
  },
  attribute_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    references: { model: 'attributes', key: 'id' }
  },
  value: {
    type: DataTypes.STRING, // Attribute.data_type에 따라 검증/저장 방식 고려
    allowNull: false
  }
}, {
  tableName: 'product_attribute_values',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['product_id', 'attribute_id']
    }
  ]
});

module.exports = ProductAttributeValue;