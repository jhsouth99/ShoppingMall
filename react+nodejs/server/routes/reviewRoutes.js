const express = require('express');
const { Op } = require('sequelize');
const Review = require('../models/Review');
const User = require('../models/User');

const router = express.Router();

// 상품별 리뷰 목록 조회 (페이징, 정렬)
router.get('/:productId/reviews', async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = 'created_at', order = 'DESC' } = req.query;
    const offset = (page - 1) * limit;

    const { rows, count } = await Review.findAndCountAll({
      where: { product_id: req.params.productId },
      include: [{ model: User, as: 'user', attributes: ['id','username'] }],
      order: [[sort, order]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      reviews: rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '리뷰 조회 실패' });
  }
});

module.exports = router;