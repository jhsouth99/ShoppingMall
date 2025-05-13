// models/tag.js
const { DataTypes, Sequelize } = require('sequelize');
const sequelize = require('../config/database');
const Product = require('./Product');
const ProductTag = require('./ProductTag');

const Tag = sequelize.define('Tag', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
  }
}, {
  tableName: 'tags',
  timestamps: false // 수동 정의
});

module.exports = Tag;