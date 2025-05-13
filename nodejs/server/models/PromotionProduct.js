// models/promotionProduct.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Promotion = require('./Promotion');
const Product = require('./Product');

const PromotionProduct = sequelize.define('PromotionProduct', {
  promotion_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    allowNull: false,
    references: { model: 'promotions', key: 'id' },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  product_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    allowNull: false,
    references: { model: 'products', key: 'id' },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  }
}, {
  tableName: 'promotion_products',
  timestamps: false
});

module.exports = PromotionProduct;