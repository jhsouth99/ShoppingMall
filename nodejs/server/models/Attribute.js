// models/attribute.js
const { DataTypes, Sequelize } = require('sequelize');
const sequelize = require('../config/database');
const { AttributeDataType } = require('../enums');
const CategoryAttribute = require('./CategoryAttribute');
const ProductAttributeValue = require('./ProductAttributeValue');

const Attribute = sequelize.define('Attribute', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  data_type: {
    type: DataTypes.ENUM,
    values: Object.values(AttributeDataType), // ['TEXT', 'NUMBER', 'BOOLEAN', 'DATE']
    allowNull: false,
    defaultValue: AttributeDataType.TEXT, // 혹은 가장 일반적인 타입으로 기본값 설정
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
  }
}, {
  tableName: 'attributes',
  timestamps: false
});

module.exports = Attribute;