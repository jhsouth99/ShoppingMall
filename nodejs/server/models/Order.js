const { DataTypes, Sequelize } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const Product = require('./Product');

const Order = sequelize.define(
  'Order',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: User, key: 'id' }
    },
    recipient_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    recipient_phone: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    recipient_address: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    recipient_address_detail: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    recipient_zipcode: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'paid', 'shipped', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending'
    },
    order_type: {
      type: DataTypes.ENUM('normal', 'group'),
      allowNull: false,
      defaultValue: 'normal'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    }
  },
  {
    tableName: 'orders',
    timestamps: false   // created_at을 직접 관리하므로 Sequelize 자동타임스탬프 비활성화
  }
);

// 관계 설정
Order.belongsTo(User,    { foreignKey: 'user_id',    as: 'user'    });

module.exports = Order;
