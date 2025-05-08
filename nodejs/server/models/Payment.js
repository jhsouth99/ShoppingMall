const { DataTypes, Sequelize } = require('sequelize');
const sequelize = require('../config/database');
const Order = require('./Order');

const Payment = sequelize.define(
  'Payment',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    order_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: Order,
        key: 'id'
      }
    },
    payment_method: {
      type: DataTypes.STRING(50),
      allowNull: false
      // ex: 'card', 'bank_transfer', 'paypal' 등
    },
    amount: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'failed', 'refund_requested', 'refunded'),
      allowNull: false,
      defaultValue: 'pending'
    },
    paid_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    }
  },
  {
    tableName: 'payments',
    timestamps: false   // paid_at만 직접 관리
  }
);

// 관계 설정
Payment.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });
Order.hasMany(Payment, { foreignKey: 'order_id', as: 'payments'});

module.exports = Payment;
