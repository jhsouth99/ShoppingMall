const { DataTypes, Sequelize } = require('sequelize');
const sequelize = require('../config/database');
const Product = require('./Product');

const GroupPurchase = sequelize.define(
  'GroupPurchase',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    product_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: Product, key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    target_qty: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false
    },
    discounted_price: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false
    },
    current_qty: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0
    },
    deadline: {
      type: DataTypes.DATE,
      allowNull: false
    },
    is_success: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    }
  },
  {
    tableName: 'group_purchases',
    timestamps: false
  }
);

// 관계 설정
GroupPurchase.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
Product.hasMany(GroupPurchase, { foreignKey: 'product_id', as: 'groupPurchases' });

module.exports = GroupPurchase;
