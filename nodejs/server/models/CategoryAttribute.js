// models/categoryAttribute.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Category = require('./Category');
const Attribute = require('./Attribute');

const CategoryAttribute = sequelize.define('CategoryAttribute', {
  category_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    allowNull: false,
    references: { model: 'categories', key: 'id' },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  attribute_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    allowNull: false,
    references: { model: 'attributes', key: 'id' },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  }
}, {
  tableName: 'category_attributes',
  timestamps: false
});

module.exports = CategoryAttribute;