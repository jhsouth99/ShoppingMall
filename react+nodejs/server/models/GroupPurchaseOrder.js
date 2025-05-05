const { DataTypes, Sequelize } = require('sequelize');
const sequelize = require('../config/database');
const GroupPurchase = require('./GroupPurchase');
const User = require('./User');

const GroupPurchaseOrder = sequelize.define(
  'GroupPurchaseOrder',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    group_purchase_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: GroupPurchase, key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: User, key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    quantity: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 1
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending'
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

    ordered_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    }
  },
  {
    tableName: 'group_purchase_orders',
    timestamps: false
  }
);

// 관계 설정
GroupPurchaseOrder.belongsTo(GroupPurchase, {
  foreignKey: 'group_purchase_id',
  as: 'groupPurchase'
});
GroupPurchase.hasMany(GroupPurchaseOrder, {
  foreignKey: 'group_purchase_id',
  as: 'orders'
});

GroupPurchaseOrder.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});
User.hasMany(GroupPurchaseOrder, {
  foreignKey: 'user_id',
  as: 'groupPurchaseOrders'
});

module.exports = GroupPurchaseOrder;
