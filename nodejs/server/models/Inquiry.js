// models/inquiry.js
const { DataTypes, Sequelize } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const Inquiry = sequelize.define('Inquiry', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    references: { model: 'users', key: 'id' },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  question: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  answer: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  answered_by_admin_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    references: { model: 'users', key: 'id' }
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
  },
  answered_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'inquiries',
  timestamps: false, // created_at, answered_at 수동 관리
  indexes: [
    { fields: ['user_id'] },
    { fields: ['answered_by_admin_id'] },
    { fields: ['created_at'] }
  ]
});

module.exports = Inquiry;