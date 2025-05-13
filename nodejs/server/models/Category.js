// models/category.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const CategoryImage = require('./CategoryImage');
const CategoryAttribute = require('./CategoryAttribute');
const Product = require('./Product');

const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  parent_id: {
    type: DataTypes.INTEGER.UNSIGNED, // Category의 id 타입과 일치
    allowNull: true,
    references: { model: 'categories', key: 'id' }
    // onDelete, onUpdate: NoAction은 DB 레벨에서 설정하거나
    // Sequelize의 onDelete, onUpdate 옵션에 'NO ACTION' 또는 'RESTRICT' 명시
  }
}, {
  tableName: 'categories',
  timestamps: false
});


module.exports = Category;