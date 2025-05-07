const bcrypt = require('bcrypt');
const { DataTypes, Sequelize } = require('sequelize');
const sequelize = require('../config/database.js');

const SALT_ROUNDS = 10;

const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    username: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    password: {
      type: DataTypes.STRING(100),
      allowNull: false,
      // 실제 DB에는 해시된 비밀번호가 저장됩니다.
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    user_type: {
      type: DataTypes.ENUM('individual', 'business', 'seller', 'admin'),
      allowNull: false,
      defaultValue: 'individual'
    },
    business_name: {
      type: DataTypes.STRING(150),
      allowNull: true
    },
    biz_number: {
      type: DataTypes.STRING(20),
      allowNull: true,
      unique: true
    },
    is_verified: {
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
    tableName: 'users',
    timestamps: false,
    hooks: {
      // Create 전, 비밀번호를 해싱
      beforeCreate: async (user, options) => {
        if (user.password) {
          const hash = await bcrypt.hash(user.password, SALT_ROUNDS);
          user.password = hash;
        }
      },
      // Update 시 password 필드가 바뀌었다면 다시 해싱
      beforeUpdate: async (user, options) => {
        if (user.changed('password')) {
          const hash = await bcrypt.hash(user.password, SALT_ROUNDS);
          user.password = hash;
        }
      }
    }
  }
);

// 인스턴스 메서드: 로그인 시 입력한 비밀번호와 비교
User.prototype.validatePassword = function (plainTextPassword) {
  return bcrypt.compare(plainTextPassword, this.password);
};

module.exports = User;