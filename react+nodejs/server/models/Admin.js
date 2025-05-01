// server/models/Admin.js
const bcrypt = require('bcrypt');
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SALT_ROUNDS = 10;

const Admin = sequelize.define(
  'Admin',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    adminname: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    password: {
      type: DataTypes.STRING(100),
      allowNull: false
      // DB에는 bcrypt 해시가 저장됩니다
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('super', 'manager', 'staff'),
      allowNull: false,
      defaultValue: 'staff'
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
      validate: { isEmail: true }
    }
  },
  {
    tableName: 'admins',
    timestamps: false, 
    hooks: {
      beforeCreate: async admin => {
        if (admin.password) {
          admin.password = await bcrypt.hash(admin.password, SALT_ROUNDS);
        }
      },
      beforeUpdate: async admin => {
        if (admin.changed('password')) {
          admin.password = await bcrypt.hash(admin.password, SALT_ROUNDS);
        }
      }
    }
  }
);

// 비밀번호 검증 메서드
Admin.prototype.validatePassword = function (plainText) {
  return bcrypt.compare(plainText, this.password);
};

module.exports = Admin;
