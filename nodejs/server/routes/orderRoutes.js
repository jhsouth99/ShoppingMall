const express = require("express");
const { Op, Sequelize } = require("sequelize");
const authenticate = require("../middleware/auth");
const Order = require("../models/Order");
const Payment = require("../models/Payment");
const Product = require("../models/Product");
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
    const { items, shipping_address_id } = req.body;
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
      const created = [];
      for (let { product_id, quantity, cart_item_id } of items) {
        const product = await Product.findByPk(product_id, { transaction: t });
        if (!product) throw new Error(`상품(${product_id})이 없습니다.`);
        if (quantity < 1 || quantity > product.stock) {
          throw new Error(`상품(${product_id}) 수량이 올바르지 않습니다.`);
        }
        // 총액 = (price × quantity) – 할인
        const total_price = Math.floor(
          ((product.price * (100 - product.discount)) / 100) * quantity
        );

        // 주문 생성
        const order = await Order.create(
          {
            user_id: userId,
            product_id,
            quantity,
            total_price,
            status: "pending",
            order_type: "normal",
            recipient_name: addr.recipient_name,
            recipient_phone: addr.phone,
            recipient_address: addr.address,
            recipient_address_detail: addr.address_detail,
            recipient_zipcode: addr.zipcode,
          },
          { transaction: t }
        );

        // (선택) 재고 차감
        //await product.decrement("stock", { by: quantity, transaction: t });

        // 장바구니 아이템 삭제
        if (cart_item_id) {
          await CartItem.destroy({
            where: { id: cart_item_id, user_id: userId },
            transaction: t,
          });
        }

        // 결제 레코드 생성 (Pending)
        await Payment.create(
          {
            order_id: order.id,
            payment_method: "card", // 실제 환경에 맞춰 동적으로
            amount: total_price,
            status: "pending",
          },
          { transaction: t }
        );

        created.push(order);
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
