const express = require('express');
const sequelize = require('../config/database.js');
const Product = require('../models/Product.js');

const router = express.Router();

// 전체 상품 조회
router.get('/', async (req, res) => {
  try {
    const products = await Product.findAll();
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '상품 조회 실패' });
  }
});

// 특정 상품 조회
router.get('/:id', async (req, res) => {
  try {
    const prod = await Product.findByPk(req.params.id);
    if (!prod) return res.status(404).json({ message: '상품을 찾을 수 없습니다.' });
    res.json(prod);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '상품 조회 실패' });
  }
});

module.exports = router;
