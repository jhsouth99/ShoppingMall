const express = require("express");
const { Op, Sequelize } = require("sequelize");
const sequelize = require("../config/database.js");
const authenticate = require("../middleware/auth");
const Order = require("../models/Order");
const OrderItem = require("../models/OrderItem");
const Payment = require("../models/Payment");
const Product = require("../models/Product");
const Coupon = require("../models/Coupon");
const UserCoupon = require("../models/UserCoupon");
const ShippingAddress = require("../models/ShippingAddress");
const CartItem = require("../models/CartItem");
const ProductOption = require("../models/ProductOption.js");

const router = express.Router();

// ——————————————————————————————
// 주문 생성
// POST /api/orders
// body: {
//   items: [ { product_id, quantity } ],       // 필수
//   shipping_address_id: number               // 필수
// }
router.post("/", authenticate, async (req, res) => {
  const userId = req.user.id;
  const { items, shipping_address_id, coupon_code } = req.body;

  if (!Array.isArray(items) || !items.length) {
    return res.status(400).json({ message: "items 배열을 입력하세요." });
  }

  try {
    // 배송지 조회 및 복사
    const addr = await ShippingAddress.findOne({
      where: { id: shipping_address_id, user_id: userId },
    });
    if (!addr) {
      return res.status(400).json({ message: "유효한 배송주소를 선택하세요." });
    }

    // 트랜잭션으로 묶기
    const result = await sequelize.transaction(async (t) => {
      // 1) 주문 헤더 생성
      const order = await Order.create(
        {
          user_id: userId,
          recipient_name: addr.recipient_name,
          recipient_phone: addr.phone,
          recipient_address: addr.address,
          recipient_address_detail: addr.address_detail,
          recipient_zipcode: addr.zipcode,
          status: "pending",
          order_type: "normal",
        },
        { transaction: t }
      );

      let grandTotal = 0;

      // 2) 각 아이템(OrderItem) 생성
      for (const { product_id, quantity, option_id, cart_item_id } of items) {
        // 상품 조회
        const product = await Product.findByPk(product_id, { transaction: t });
        if (!product) throw new Error(`상품 ${product_id} 없음.`);
        if (quantity < 1 || quantity > product.stock)
          throw new Error(`수량 오류: product ${product_id}`);

        // 옵션 가격
        let mod = 0;
        if (option_id) {
          const opt = await ProductOption.findOne({
            where: { id: option_id, product_id },
            transaction: t,
          });
          if (!opt) throw new Error("잘못된 옵션");
          mod = opt.price_modifier;
        }

        // 단가 계산 (가격+옵션 → 할인 적용)
        const base = product.price + mod;
        const unit = Math.floor((base * (100 - product.discount)) / 100);
        const sub = unit * quantity;
        // 배송비
        const ship = product.shipping_fee * quantity;
        const total = sub + ship;

        // OrderItem 생성
        await OrderItem.create(
          {
            order_id: order.id,
            product_id,
            option_id: option_id || null,
            unit_price: unit,
            quantity,
            total_price: total,
          },
          { transaction: t }
        );

        grandTotal += total;

        // 장바구니 삭제
        if (cart_item_id) {
          await CartItem.destroy({
            where: { id: cart_item_id, user_id: userId },
            transaction: t,
          });
        }

        // 재고 차감
        await product.decrement("stock", { by: quantity, transaction: t });
      }

      // 3) Payment 생성 (주문 전체 금액)
      await Payment.create(
        {
          order_id: order.id,
          payment_method: "card",
          amount: grandTotal,
          status: "pending",
        },
        { transaction: t }
      );

      return { orderId: order.id, total: grandTotal };
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
          model: OrderItem,
          as: "items",
          include: [
            { model: Product, as: "product" },
            { model: ProductOption, as: "option" },
          ],
        },
        { model: Payment, as: "payments" },
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
        {
          model: OrderItem,
          as: "items",
          include: [
            { model: Product, as: "product" },
            { model: ProductOption, as: "option" },
          ],
        },
        { model: Payment, as: "payments" },
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
  const userId = req.user.id;
  const orderId = parseInt(req.params.id, 10);

  try {
    const cancelledOrder = await sequelize.transaction(async (t) => {
      // 1) 주문 조회
      const order = await Order.findOne({
        where: { id: req.params.id, user_id: req.user.id },
        transaction: t,
      });
      if (!order)
        return res.status(404).json({ message: "주문을 찾을 수 없습니다." });
      if (order.status !== "pending") {
        return res
          .status(400)
          .json({ message: "취소 가능한 상태가 아닙니다." });
      }

      // 2) 쿠폰 복구 (해당 주문에 묶인 UserCoupon)
      const uc = await UserCoupon.findOne({
        where: { order_id: orderId },
        transaction: t,
      });
      if (uc) {
        await uc.update(
          {
            used: false,
            used_at: null,
            order_id: null,
          },
          { transaction: t }
        );
      }

      // 3) 주문 상태 변경
      await order.update({ status: "cancelled" }, { transaction: t });
      return order;
    });
    if (cancelledOrder instanceof Order) {
      return res.json(cancelledOrder);
    }
  } catch (err) {
    console.error("주문 취소 실패", err);
    if (!res.headersSent) {
      res.status(500).json({ message: err.message || "주문 취소 실패" });
    }
  }
});

// 환불 요청
// POST /api/orders/:id/refund
// body: { reason: string }
router.post("/:id/refund", authenticate, async (req, res) => {
  const userId = req.user.id;
  const orderId = parseInt(req.params.id, 10);

  try {
    const result = await sequelize.transaction(async (t) => {
      // 1) 주문 + 결제 조회
      const order = await Order.findOne({
        where: { id: orderId, user_id: userId },
        include: [{ model: Payment, as: "payments" }],
        transaction: t,
      });
      if (!order) {
        return res.status(404).json({ message: "주문을 찾을 수 없습니다." });
      }
      if (!["paid", "shipped"].includes(order.status)) {
        return res
          .status(400)
          .json({ message: "환불 요청 불가능한 상태입니다." });
      }

      // 2) 쿠폰 복구
      const uc = await UserCoupon.findOne({
        where: { order_id: orderId },
        transaction: t,
      });
      if (uc) {
        await uc.update(
          {
            used: false,
            used_at: null,
            order_id: null,
          },
          { transaction: t }
        );
      }

      // 3) 주문 상태 변경 (취소)
      await order.update({ status: "cancelled" }, { transaction: t });

      // 4) 결제 상태 변경 (환불 요청)
      const pay = order.payments[0];
      await pay.update(
        {
          status: "refund_requested",
          paid_at: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
        { transaction: t }
      );

      return { order, payment: pay };
    });

    // 트랜잭션 콜백에서 res를 보내지 않았다면 여기서
    if (!res.headersSent) {
      res.json(result);
    }
  } catch (err) {
    console.error("환불 요청 실패", err);
    if (!res.headersSent) {
      res.status(500).json({ message: err.message || "환불 요청 실패" });
    }
  }
});

module.exports = router;
