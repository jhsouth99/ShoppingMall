const { DataTypes, Sequelize } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const Seller = sequelize.define('Seller', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    unique: true,
    references: { model: User, key: 'id' }
  },
  store_name: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  bank_account: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  commission_rate: {
    type: DataTypes.DECIMAL(5,2),
    allowNull: false,
    defaultValue: 0.00
  },
  is_approved: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
  }
}, {
  tableName: 'sellers',
  timestamps: false
});

// 1:1 관계 설정
User.hasOne(Seller, { foreignKey: 'user_id', as: 'sellerProfile' });
Seller.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = Seller;
