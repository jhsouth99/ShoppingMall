const { DataTypes, Sequelize } = require('sequelize');
const sequelize = require('../config/database');
const Order   = require('./Order');
const Product = require('./Product');
const Option  = require('./ProductOption'); // 옵션 가격 반영 시 사용

const OrderItem = sequelize.define('OrderItem', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  order_id: {
    type: DataTypes.INTEGER.UNSIGNED, allowNull: false,
    references: { model: Order, key: 'id' }
  },
  product_id: {
    type: DataTypes.INTEGER.UNSIGNED, allowNull: false,
    references: { model: Product, key: 'id' }
  },
  option_id: {
    type: DataTypes.INTEGER.UNSIGNED, allowNull: true,
    references: { model: Option, key: 'id' }
  },
  unit_price: {
    type: DataTypes.INTEGER.UNSIGNED, allowNull: false,
    comment: '옵션·할인 적용된 단가'
  },
  quantity: {
    type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 1
  },
  total_price: {
    type: DataTypes.INTEGER.UNSIGNED, allowNull: false,
    comment: 'unit_price × quantity'
  },
  created_at: {
    type: DataTypes.DATE, allowNull: false,
    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
  }
},{
  tableName: 'order_items',
  timestamps: false
});

// Association
OrderItem.belongsTo(Order,   { foreignKey: 'order_id',   as: 'order'   });
Order.hasMany(OrderItem,     { foreignKey: 'order_id',   as: 'items'   });

OrderItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
Product.hasMany(OrderItem,   { foreignKey: 'product_id', as: 'orderItems' });

OrderItem.belongsTo(Option,  { foreignKey: 'option_id',  as: 'option'  });

module.exports = OrderItem;