const express = require("express");
const { Op, Sequelize } = require('sequelize');
const sequelize = require("../config/database.js");
const Product = require("../models/Product.js");
const Category = require("../models/Category.js");

const router = express.Router();

// 전체 상품 조회
router.get("/", async (req, res) => {
  try {
    // 🔸 쿼리 파라미터 수집
    const {
      search,                // 🔍 검색어
      category_id,           // 카테고리 ID (정수)
      price_range,           // 'under-100000' | '100000-300000' | 'over-300000'
      discount_only,         // true | false
      group_only,            // true | false
      sort_by,               // 'popularity' | 'price_asc' | 'price_desc' | 'latest'
      include_shipping,      // true | false
      page = 1,
      limit = 20
    } = req.query;

    
    const where = {};
    const include = [];
    const searchConditions = [];

    // 가격 필터
    if (price_range === 'under-100000') {
      where.price = { [Op.lt]: 100000 };
    } else if (price_range === '100000-300000') {
      where.price = { [Op.gte]: 100000, [Op.lt]: 300000 };
    } else if (price_range === 'over-300000') {
      where.price = { [Op.gte]: 300000 };
    }

    // 할인 여부
    if (discount_only === 'true') {
      where.discount = { [Op.gt]: 0 };
    }

    // 공동구매 여부
    if (group_only === 'true') {
      where.isGroup = true;
    }

    // Fulltext 검색
    if (search) {
      const tokens = search.trim().split(/\s+/).map(token => `+${token}*`).join(' ');
      where[Sequelize.Op.and] = Sequelize.literal(
        `MATCH(\`Product\`.\`name\`, \`Product\`.\`description\`) AGAINST(${sequelize.escape(tokens)} IN BOOLEAN MODE)`
      );
    }

    // Category.name 포함 검색
    const categoryInclude = {
      model: Category,
      as: 'categories',
      through: { attributes: [] },
      required: false
    };
    if (category_id) {
      categoryInclude.where = { id: category_id };
      categoryInclude.required = true;
    }
    include.push(categoryInclude);

    // 정렬 조건
    let order = [['created_at', 'DESC']];
    if (sort_by === 'price_asc') {
      order = include_shipping === 'true'
        ? [[Sequelize.literal('price + shipping_fee'), 'ASC']]
        : [['price', 'ASC']];
    } else if (sort_by === 'price_desc') {
      order = include_shipping === 'true'
        ? [[Sequelize.literal('price + shipping_fee'), 'DESC']]
        : [['price', 'DESC']];
    } else if (sort_by === 'popularity') {
      order = [['sold_count', 'DESC']];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitInt = parseInt(limit);

    const { rows, count } = await Product.findAndCountAll({
      distinct: true,
      where,
      include,
      order,
      offset,
      limit: limitInt,
      subQuery: false
    });

    res.json({
      total: count,
      page: parseInt(page),
      limit: limitInt,
      items: rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '상품 목록 조회 실패' });
  }
});

// 특정 상품 조회
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [
        {
          model: Category,
          as: 'categories',
          through: { attributes: [] }
        },
        {
          model: require('../models/ProductOption'),
          as: 'options'
        },
        {
          model: require('../models/ProductImage'),
          as: 'images'
        }
      ]
    });

    if (!product) {
      return res.status(404).json({ message: "상품을 찾을 수 없습니다." });
    }

    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "상품 조회 실패" });
  }
});

module.exports = router;
