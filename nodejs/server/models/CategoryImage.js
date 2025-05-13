// models/categoryImage.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { CategoryImageType } = require('../enums');
const Category = require('./Category');

const CategoryImage = sequelize.define('CategoryImage', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  category_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: { model: 'categories', key: 'id' },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  image_url: {
    type: DataTypes.STRING,
    allowNull: false
  },
  alt_text: {
    type: DataTypes.STRING,
    allowNull: true
  },
  image_type: {
    type: DataTypes.ENUM,
    values: Object.values(CategoryImageType),
    allowNull: false
  },
  order: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'category_images',
  timestamps: false
});

module.exports = CategoryImage;