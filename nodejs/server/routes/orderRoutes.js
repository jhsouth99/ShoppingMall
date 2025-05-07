const express = require("express");
const { Op, Sequelize } = require("sequelize");
const authenticate = require("../middleware/auth");
const Order = require("../models/Order");
const Payment = require("../models/Payment");
const Product = require("../models/Product");
const Coupon = require("../models/Coupon");
const UserCoupon = require("../models/UserCoupon");
const ShippingAddress = require("../models/ShippingAddress");

const router = express.Router();

// ——————————————————————————————
// 주문 생성
// POST /api/orders
// body: {
//   items: [ { product_id, quantity, cart_item_id } ],       // 필수
//   shipping_address_id: number               // 필수
// }
router.post("/", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { items, shipping_address_id, coupon_code } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "items 배열을 입력하세요." });
    }
    // 배송지 조회 및 복사
    const addr = await ShippingAddress.findOne({
      where: { id: shipping_address_id, user_id: userId },
    });
    if (!addr) {
      return res.status(400).json({ message: "유효한 배송주소를 선택하세요." });
    }

    // 트랜잭션으로 묶기
    const result = await Sequelize.transaction(async (t) => {
      // 1) 쿠폰 검증 및 UserCoupon 조회
      let coupon = null,
        uc = null;
      if (coupon_code) {
        coupon = await Coupon.findOne({
          where: { code: coupon_code, is_active: true },
          transaction: t,
        });
        if (!coupon) throw new Error("존재하지 않거나 비활성화된 쿠폰입니다.");

        // 만료일, 최소주문금액, 사용횟수 체크
        if (coupon.expires_at && coupon.expires_at < new Date())
          throw new Error("이미 만료된 쿠폰입니다.");
        if (coupon.min_order_price > 0)
          if (coupon.usage_limit !== null) {
            // will check later against total_before_discount

            // 전역 사용 가능 횟수 제한
            const usedCount = await UserCoupon.count({
              where: { coupon_id: coupon.id, used: true },
              transaction: t,
            });
            if (usedCount >= coupon.usage_limit)
              throw new Error("이미 사용 가능한 횟수를 초과한 쿠폰입니다.");
          }

        // 사용자 보유 쿠폰(리딤) 기록
        uc = await UserCoupon.findOne({
          where: { user_id: userId, coupon_id: coupon.id, used: false },
          transaction: t,
        });
        if (!uc) throw new Error("사용 가능한 쿠폰을 보유하고 있지 않습니다.");
      }

      const orders = [];
      for (const { product_id, quantity, cart_item_id } of items) {
        const product = await Product.findByPk(product_id, { transaction: t });
        if (!product) throw new Error(`상품(${product_id})이 없습니다.`);
        if (quantity < 1 || quantity > product.stock)
          throw new Error(`상품(${product_id}) 수량이 올바르지 않습니다.`);

        // 2) 기본 총액 계산
        let total = Math.floor(
          ((product.price * (100 - product.discount)) / 100) * quantity
        );

        // 3) 쿠폰 할인 적용 (첫 아이템에만 적용하든지, 합계에 대해 한 번만)
        if (coupon && uc && orders.length === 0) {
          if (total < coupon.min_order_price)
            throw new Error("최소 주문 금액 미달로 쿠폰 사용 불가입니다.");

          let discountAmount = 0;
          if (coupon.discount_type === "percent") {
            discountAmount = Math.floor((total * coupon.discount_value) / 100);
          } else {
            discountAmount = coupon.discount_value;
          }
          total = Math.max(0, total - discountAmount);

          // UserCoupon 사용 처리
          await uc.update(
            {
              used: true,
              used_at: Sequelize.literal("CURRENT_TIMESTAMP"),
              order_id: null, // 이후 설정
            },
            { transaction: t }
          );
        }

        // 4) 주문 생성
        const order = await Order.create(
          {
            user_id: userId,
            product_id,
            quantity,
            total_price: total,
            status: "pending",
            order_type: "normal",
            recipient_name: addr.recipient_name,
            recipient_phone: addr.recipient_phone,
            recipient_address: addr.recipient_address,
            recipient_address_detail: addr.recipient_address_detail,
            recipient_zipcode: addr.recipient_zipcode,
          },
          { transaction: t }
        );

        // 5) UserCoupon에 주문 ID 기록
        if (uc) {
          await uc.update({ order_id: order.id }, { transaction: t });
        }

        // 6) 결제 레코드 생성
        await Payment.create(
          {
            order_id: order.id,
            payment_method: "card",
            amount: total,
            status: "pending",
          },
          { transaction: t }
        );

        orders.push(order);
      }
      return created;
    });

    res.status(201).json(result);
  } catch (err) {
    console.error("주문 생성 실패", err);
    res.status(400).json({ message: err.message || "주문 생성 실패" });
  }
});

// 내 주문 목록 조회
// GET /api/orders
router.get("/", authenticate, async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { user_id: req.user.id },
      include: [
        {
          model: Product,
          as: "product",
          attributes: ["id", "name", "price", "discount"],
        },
        { model: Payment, as: "payment" },
      ],
      order: [["created_at", "DESC"]],
    });
    res.json(orders);
  } catch (err) {
    console.error("주문 조회 실패", err);
    res.status(500).json({ message: "주문 조회 실패" });
  }
});

// 주문 상세 조회
// GET /api/orders/:id
router.get("/:id", authenticate, async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.id, user_id: req.user.id },
      include: [
        { model: Product, as: "product" },
        { model: Payment, as: "payment" },
      ],
    });
    if (!order)
      return res.status(404).json({ message: "주문을 찾을 수 없습니다." });
    res.json(order);
  } catch (err) {
    console.error("주문 상세 실패", err);
    res.status(500).json({ message: "주문 상세 조회 실패" });
  }
});

// 주문 취소
// POST /api/orders/:id/cancel
router.post("/:id/cancel", authenticate, async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.id, user_id: req.user.id },
    });
    if (!order)
      return res.status(404).json({ message: "주문을 찾을 수 없습니다." });
    if (order.status !== "pending") {
      return res.status(400).json({ message: "취소 가능한 상태가 아닙니다." });
    }
    order.status = "cancelled";
    await order.save();
    res.json(order);
  } catch (err) {
    console.error("주문 취소 실패", err);
    res.status(500).json({ message: "주문 취소 실패" });
  }
});

// 환불 요청
// POST /api/orders/:id/refund
// body: { reason: string }
router.post("/:id/refund", authenticate, async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.id, user_id: req.user.id },
      include: [{ model: Payment, as: "payment" }],
    });
    if (!order)
      return res.status(404).json({ message: "주문을 찾을 수 없습니다." });
    if (!["paid", "shipped"].includes(order.status)) {
      return res
        .status(400)
        .json({ message: "환불 요청 불가능한 상태입니다." });
    }

    // 주문 상태 변경
    order.status = "cancelled";
    await order.save();

    // 결제 레코드 상태 변경
    const pay = order.payment;
    pay.status = "refund_requested";
    pay.paid_at = Sequelize.fn("NOW");
    await pay.save();

    res.json({ order, payment: pay });
  } catch (err) {
    console.error("환불 요청 실패", err);
    res.status(500).json({ message: "환불 요청 실패" });
  }
});

module.exports = router;
