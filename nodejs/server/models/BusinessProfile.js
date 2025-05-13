// models/businessProfile.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BusinessProfile = sequelize.define('BusinessProfile', {
  user_id: {
    type: DataTypes.BIGINT.UNSIGNED, // User 모델의 id 타입과 일치
    primaryKey: true,
    allowNull: false,
    references: { model: 'users', key: 'id' },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  business_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  biz_number: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  verified_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  additional_documents: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  tableName: 'business_profiles',
  timestamps: false
});

module.exports = BusinessProfile;