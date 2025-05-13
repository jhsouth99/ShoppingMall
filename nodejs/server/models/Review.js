// models/review.js
const { DataTypes, Sequelize } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const Product = require('./Product');
const OrderItem = require('./OrderItem');
const ReviewImage = require('./ReviewImage');

const Review = sequelize.define('Review', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  product_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    references: { model: 'products', key: 'id' },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  order_item_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    unique: true,
    references: { model: 'order_items', key: 'id' }
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5
    }
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
  }
}, {
  tableName: 'reviews',
  timestamps: false, // created_at 수동 정의
  indexes: [
    { fields: ['user_id'] },
    { fields: ['product_id'] },
    { unique: true, fields: ['order_item_id'] } // unique 제약 조건
  ]
});

module.exports = Review;