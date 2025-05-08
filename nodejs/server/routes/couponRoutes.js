const express = require("express");
const { Sequelize } = require('sequelize');
const authenticate = require("../middleware/auth");
const Coupon = require("../models/Coupon");
const UserCoupon = require("../models/UserCoupon");
const User = require("../models/User");

const router = express.Router();

function requireAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "관리자 전용입니다." });
  }
  next();
}

// 1) 관리자: 쿠폰 생성
// POST /api/coupons
// body: { code, discount_type, discount_value, min_order_price, usage_limit, expires_at, is_active }
router.post("/", authenticate, requireAdmin, async (req, res) => {
  try {
    const c = await Coupon.create(req.body);
    res.status(201).json(c);
  } catch (err) {
    console.error("쿠폰 생성 실패", err);
    res.status(400).json({ message: err.message });
  }
});

// 2) 사용자: 쿠폰 리딤(수동 입력)
// POST /api/coupons/redeem
// body: { code }
router.post("/redeem", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { code } = req.body;
    if (!code)
      return res.status(400).json({ message: "쿠폰 코드를 입력하세요." });

    const coupon = await Coupon.findOne({ where: { code, is_active: true } });
    if (!coupon)
      return res.status(404).json({ message: "유효한 쿠폰이 아닙니다." });

    // 만료, 사용 한도, 이미 리딤 여부 체크
    if (coupon.expires_at && coupon.expires_at < new Date())
      return res.status(400).json({ message: "만료된 쿠폰입니다." });

    const existing = await UserCoupon.findOne({
      where: { coupon_id: coupon.id, user_id: userId },
    });
    if (existing)
      return res.status(400).json({ message: "이미 등록된 쿠폰입니다." });

    const uc = await UserCoupon.create({
      user_id: userId,
      coupon_id: coupon.id,
      issued_at: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
    res.status(201).json(uc);
  } catch (err) {
    console.error("쿠폰 리딤 실패", err);
    res.status(500).json({ message: "쿠폰 리딤 실패" });
  }
});

// 3) 사용자: 내 쿠폰 조회
// GET /api/coupons
// optional query: ?used=true|false
router.get("/", authenticate, async (req, res) => {
  try {
    const usedFilter = req.query.used;
    const where = { user_id: req.user.id };
    if (usedFilter === "true") where.used = true;
    if (usedFilter === "false") where.used = false;

    const list = await UserCoupon.findAll({
      where,
      include: [{ model: Coupon, as: "Coupon" }],
      order: [["issued_at", "DESC"]],
    });
    res.json(list);
  } catch (err) {
    console.error("내 쿠폰 조회 실패", err);
    res.status(500).json({ message: "내 쿠폰 조회 실패" });
  }
});

// 4) 관리자: 전체 쿠폰 사용 내역 조회
// GET /api/coupons/history
router.get("/history", authenticate, requireAdmin, async (req, res) => {
  try {
    const hist = await UserCoupon.findAll({
      include: [
        { model: User, as: "User", attributes: ["id", "username"] },
        { model: Coupon, as: "Coupon" },
      ],
      order: [["issued_at", "DESC"]],
    });
    res.json(hist);
  } catch (err) {
    console.error("쿠폰 히스토리 조회 실패", err);
    res.status(500).json({ message: "쿠폰 히스토리 조회 실패" });
  }
});

module.exports = router;
