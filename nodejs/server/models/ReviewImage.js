// models/reviewImage.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Review = require('./Review');

const ReviewImage = sequelize.define('ReviewImage', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  review_id: {
    type: DataTypes.BIGINT.UNSIGNED, // Review ID 타입과 일치
    allowNull: false,
    references: { model: 'reviews', key: 'id' },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  image_url: {
    type: DataTypes.STRING,
    allowNull: false
  },
  order: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'review_images',
  timestamps: false
});

module.exports = ReviewImage;