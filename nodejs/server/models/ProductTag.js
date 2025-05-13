// models/productTag.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Product = require('./Product');
const Tag = require('./Tag');

const ProductTag = sequelize.define('ProductTag', {
  product_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    allowNull: false,
    references: { model: 'products', key: 'id' },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  tag_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    allowNull: false,
    references: { model: 'tags', key: 'id' },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  }
}, {
  tableName: 'product_tags',
  timestamps: false
});

module.exports = ProductTag;