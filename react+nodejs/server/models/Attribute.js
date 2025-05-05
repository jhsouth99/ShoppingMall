const { DataTypes, Sequelize } = require('sequelize');
const sequelize = require('../config/database.js');

const Attribute = sequelize.define('Attribute', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  data_type: {
    type: DataTypes.ENUM('string', 'integer', 'float', 'boolean', 'date'),
    allowNull: false,
    defaultValue: 'string'
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