// models/userRole.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { RoleType } = require('../enums');
const User = require('./User');

const UserRole = sequelize.define('UserRole', {
  user_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  role: {
    type: DataTypes.ENUM,
    values: Object.values(RoleType),
    primaryKey: true,
    allowNull: false
  }
}, {
  tableName: 'user_roles',
  timestamps: false
});


module.exports = UserRole;