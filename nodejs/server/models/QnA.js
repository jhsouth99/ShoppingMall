// models/qna.js
const { DataTypes, Sequelize } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const Product = require('./Product');

const QnA = sequelize.define('QnA', {
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
  seller_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true, // 답변 전에는 null
    references: { model: 'users', key: 'id' }
  },
  product_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    references: { model: 'products', key: 'id' },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  title: {
    type: DataTypes.STRING,
    allowNull: true
  },
  question: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  answer: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  questioned_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
  },
  answered_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  is_secret: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  tableName: 'qnas',
  timestamps: false, // questioned_at, answered_at 수동 관리
  indexes: [
    { fields: ['user_id'] },
    { fields: ['seller_id'] },
    { fields: ['product_id'] },
    { fields: ['questioned_at'] }
  ]
});

module.exports = QnA;