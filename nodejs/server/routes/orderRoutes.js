// routes/orderRoutes.js
const express = require("express");
const { Op, Sequelize } = require("sequelize");
const sequelize = require("../config/database.js");
const authenticate = require("../middleware/auth");
const {
  Order,
  OrderItem,
  Payment,
  Product,
  ProductVariant,
  UserCoupon,
  Coupon,
  Promotion,
  PromotionCondition,
  OrderPromotion,
  ShippingAddress,
  CartItem,
  User,
  UserRole,
  Refund,
  RefundItem,
  ProductImage,
  ProductVariantOptionValue,
  ProductOptionValue,
  ProductOption,
} = require("../models"); // 필요한 모든 모델 임포트
const {
  OrderStatus,
  PaymentMethodType,
  PaymentStatus,
  OrderItemStatus,
  RefundReasonType,
  RefundStatus,
  PromotionType,
  RoleType,
} = require("../enums");

const router = express.Router();

const calculateShippingFee = require("./modules/calculateShippingFee");
const applyPromotionsAndCoupons = require("./modules/discountCalculator");


// --- 주문 생성 ---
// POST /api/orders
// body: {
//   items: [ { product_variant_id, quantity, comment? (옵션 코멘트) } ], // 필수
//   shipping_address_id: BIGINT,                                     // 필수
//   payment_method_type: "CREDIT_CARD" | "BANK_TRANSFER" ...,      // 필수
//   card_issuer?: "HYUNDAI_CARD" ..., (카드 결제시)
//   user_coupon_id?: BIGINT (사용할 UserCoupon의 ID)
// }
router.post("/", authenticate, async (req, res) => {
  const user_id = req.user.id;
  const {
    items,
    shipping_address_id,
    payment_method_type,
    card_issuer,
    user_coupon_id,
  } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res
      .status(400)
      .json({ message: "주문할 상품(items) 배열을 정확히 입력하세요." });
  }
  if (!shipping_address_id) {
    return res
      .status(400)
      .json({ message: "배송지 ID(shipping_address_id)를 선택하세요." });
  }
  if (
    !payment_method_type ||
    !Object.values(PaymentMethodType).includes(payment_method_type)
  ) {
    return res
      .status(400)
      .json({ message: "결제 수단(payment_method_type)을 정확히 선택하세요." });
  }

  const t = await sequelize.transaction();
  try {
    // 1. 배송지 조회 및 유효성 검사
    const shippingAddress = await ShippingAddress.findOne({
      where: { id: shipping_address_id, user_id: parseInt(user_id) },
      transaction: t,
    });
    if (!shippingAddress) {
      await t.rollback();
      return res
        .status(404)
        .json({ message: "유효한 배송주소를 찾을 수 없습니다." });
    }

    let subTotalAmount = 0;
    const orderItemsData = [];

    // 2. 주문 아이템 정보 구성 및 재고 확인, 소계 계산
    for (const item of items) {
      if (!item.product_variant_id || !item.quantity || item.quantity < 1) {
        throw new Error(
          "각 아이템에는 product_variant_id와 1 이상의 quantity가 필요합니다."
        );
      }
      const productVariant = await ProductVariant.findByPk(
        item.product_variant_id,
        { transaction: t }
      );
      if (!productVariant) {
        throw new Error(
          `상품 옵션(ID: ${item.product_variant_id})을 찾을 수 없습니다.`
        );
      }
      if (productVariant.stock_quantity < item.quantity) {
        throw new Error(
          `상품 옵션(ID: ${item.product_variant_id})의 재고(${productVariant.stock_quantity}개)가 부족합니다. (요청수량: ${item.quantity}개)`
        );
      }

      const priceAtPurchase = parseFloat(productVariant.price);
      const totalPriceAtPurchase = priceAtPurchase * item.quantity;
      subTotalAmount += totalPriceAtPurchase;

      orderItemsData.push({
        // order_id는 Order 생성 후 할당
        product_variant_id: productVariant.id,
        comment: item.comment || null,
        quantity: item.quantity,
        price_at_purchase: priceAtPurchase,
        total_price_at_purchase: totalPriceAtPurchase,
        status: OrderItemStatus.PENDING, // 초기 상태
      });

      // 재고 차감 (Optimistic lock 또는 select for update 고려 가능)
      await productVariant.decrement("stock_quantity", {
        by: item.quantity,
        transaction: t,
      });
    }

    // 3. 할인 및 프로모션 적용
    const discountInfo = await applyPromotionsAndCoupons(
      user_id,
      items,
      subTotalAmount,
      user_coupon_id,
      t
    );

    // 4. 배송비 계산
    const orderItemsWithDetails = [];
    for (const item of items) {
      // items는 req.body.items
      const productVariant = await ProductVariant.findByPk(
        item.product_variant_id,
        {
          include: [
            { model: Product, as: "product", attributes: ["seller_id"] },
          ], // ProductVariant에 Product(as 'product') 관계 필요
          transaction: t,
        }
      );
      if (!productVariant || !productVariant.product) {
        throw new Error(`배송비 계산 중 상품 정보를 찾을 수 없습니다 (Variant ID: ${item.product_variant_id})`);
      }

      // 각 아이템의 할인 후 단가 계산 (이 부분은 applyPromotionsAndCoupons와 연계되거나 별도 계산 필요)
      // 여기서는 단순화를 위해 variant.price를 사용. 실제로는 아이템별 프로모션 적용 후 가격이어야 함.
      const itemPrice = parseFloat(productVariant.price);
      const itemDiscount = (await calculateItemSpecificDiscount(item.product_variant_id, user_id, t)).amount || 0;
      const variantPriceAfterDiscount = itemPrice - itemDiscount;

      orderItemsWithDetails.push({
        product_variant_id: item.product_variant_id,
        quantity: item.quantity,
        seller_id: productVariant.product.seller_id,
        variant_price_after_discount: variantPriceAfterDiscount, // 개별 아이템의 (프로모션 적용 후) 단가
        // 기타 필요한 정보 (예: ProductVariantShippingMethod 조회용 정보)
      });
    }

    // ... 이후 globalSubTotalAmountAfterDiscount 계산 ...
    // (applyPromotionsAndCoupons 함수는 이제 아이템별 할인보다는 장바구니 전체 할인 위주로 역할 변경 또는,
    //  아이템별 할인 정보를 orderItemsWithDetails에 미리 반영 후, 장바구니 쿠폰/프로모션만 처리)

    const globalSubTotalAmountAfterCartDiscounts =
      discountInfo.finalAmountBeforeShipping; // 장바구니 전체 할인까지 적용된 금액

    const shippingFee = await calculateShippingFee(
      orderItemsWithDetails,
      globalSubTotalAmountAfterCartDiscounts, // 플랫폼 전체 무료배송 기준액 비교용
      shipping_address_id,
      t
    );

    // 5. 최종 결제 금액 계산
    const finalAmount = discountInfo.finalAmountBeforeShipping + shippingFee;

    // 6. Order 레코드 생성
    const newOrder = await Order.create(
      {
        user_id: user_id,
        recipient_name: shippingAddress.recipient_name,
        recipient_phone: shippingAddress.phone,
        recipient_address: shippingAddress.address,
        recipient_address_detail: shippingAddress.address_detail,
        recipient_zipcode: shippingAddress.zipcode,
        status: OrderStatus.PENDING, // 초기 주문 상태 '주문 접수'
        sub_total_amount: subTotalAmount,
        shipping_fee: shippingFee,
        coupon_discount_amount: discountInfo.couponDiscountAmount,
        promotion_discount_amount: discountInfo.promotionDiscountAmount,
        total_discount_amount: discountInfo.totalDiscountAmount,
        final_amount: finalAmount,
        // created_at, updated_at 자동 생성
      },
      { transaction: t }
    );

    // 7. OrderItem 레코드 생성
    const createdOrderItems = await OrderItem.bulkCreate(
      orderItemsData.map((itemData) => ({
        ...itemData,
        order_id: newOrder.id,
      })),
      { transaction: t }
    );

    // 8. 적용된 프로모션 정보 저장 (OrderPromotion)
    if (discountInfo.appliedPromotionsInfo.length > 0) {
      await OrderPromotion.bulkCreate(
        discountInfo.appliedPromotionsInfo.map((promoInfo) => ({
          order_id: newOrder.id,
          promotion_id: promoInfo.promotion_id,
          discount_amount_applied: promoInfo.discount_amount_applied,
          // user_coupon_id: promoInfo.user_coupon_id // 필요시 UserCoupon ID도 저장 (스키마에 컬럼 추가 필요)
        })),
        { transaction: t }
      );
    }

    // 9. 사용된 UserCoupon 업데이트
    if (discountInfo.usedUserCouponInstance) {
      await discountInfo.usedUserCouponInstance.update(
        {
          used_at: new Date(),
          order_id: newOrder.id,
        },
        { transaction: t }
      );
      // Coupon의 current_usage_count는 리딤 시점에 올렸거나, 여기서 올릴 수도 있음 (정책에 따라)
    }

    // 10. Payment 레코드 생성 (실제 결제는 PG 연동 후 상태 변경)
    const newPayment = await Payment.create(
      {
        order_id: newOrder.id,
        payment_method_type: payment_method_type,
        card_issuer:
          payment_method_type === PaymentMethodType.CREDIT_CARD
            ? card_issuer
            : null,
        amount: finalAmount,
        status: PaymentStatus.PENDING, // 결제 대기 상태
        // created_at, updated_at 자동 생성
      },
      { transaction: t }
    );

    // 11. 장바구니 아이템 삭제 (주문된 상품들)
    const orderedVariantIds = items.map((item) => item.product_variant_id);
    await CartItem.destroy({
      where: {
        user_id: user_id,
        product_variant_id: { [Op.in]: orderedVariantIds },
      },
      transaction: t,
    });

    await t.commit(); // 모든 작업 성공 시 커밋

    // 생성된 주문 정보 반환 (필요에 따라 상세 정보 포함)
    const orderDetails = await Order.findByPk(newOrder.id, {
      include: [
        {
          model: OrderItem,
          as: "items",
          include: [
            {
              model: ProductVariant,
              as: "product_variant",
              include: [{ model: Product, as: "product" }],
            },
          ],
        },
        { model: Payment, as: "payments" },
        {
          model: OrderPromotion,
          as: "applied_promotions",
          include: [{ model: Promotion, as: "promotion" }],
        },
      ],
    });

    res.status(201).json(orderDetails);
  } catch (err) {
    await t.rollback(); // 오류 발생 시 롤백
    console.error("주문 생성 실패:", err);
    res
      .status(400)
      .json({ message: err.message || "주문 생성 중 오류가 발생했습니다." });
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
            {
              model: ProductVariant,
              as: "product_variant",
              include: [
                {
                  model: Product,
                  as: "product",
                  include: [
                    {
                      model: ProductImage,
                      as: "images",
                      where: { image_type: "THUMBNAIL" },
                      required: false,
                      limit: 1,
                    },
                  ],
                }, // ProductVariant에 Product(as:'product'), Product에 ProductImage(as:'images') 관계 필요
                {
                  model: ProductVariantOptionValue,
                  as: "option_values",
                  include: [
                    {
                      model: ProductOptionValue,
                      as: "product_option_value",
                      include: [{ model: ProductOption, as: "product_option" }],
                    },
                  ],
                },
              ],
            },
          ],
        },
        { model: Payment, as: "payments" },
        {
          model: OrderPromotion,
          as: "applied_promotions",
          include: [{ model: Promotion, as: "promotion" }],
        },
      ],
      order: [["created_at", "DESC"]],
    });
    res.json(orders);
  } catch (err) {
    console.error("내 주문 목록 조회 실패:", err);
    res.status(500).json({ message: "주문 목록 조회 중 오류가 발생했습니다." });
  }
});

// 주문 상세 조회
// GET /api/orders/:order_id (UUID)
router.get("/:order_id", authenticate, async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.order_id, user_id: req.user.id }, // order_id는 UUID
      include: [
        {
          model: OrderItem,
          as: "items",
          include: [
            {
              model: ProductVariant,
              as: "product_variant",
              include: [
                {
                  model: Product,
                  as: "product",
                  include: [
                    {
                      model: ProductImage,
                      as: "images",
                      where: { image_type: "THUMBNAIL" },
                      required: false,
                      limit: 1,
                    },
                  ],
                },
                {
                  model: ProductVariantOptionValue,
                  as: "option_values",
                  include: [
                    {
                      model: ProductOptionValue,
                      as: "product_option_value",
                      include: [{ model: ProductOption, as: "product_option" }],
                    },
                  ],
                },
              ],
            },
          ],
        },
        { model: Payment, as: "payments" },
        {
          model: UserCoupon,
          as: "used_coupons",
          include: [{ model: Coupon, as: "coupon" }],
        }, // 사용된 쿠폰 정보
        {
          model: OrderPromotion,
          as: "applied_promotions",
          include: [{ model: Promotion, as: "promotion" }],
        },
      ],
    });
    if (!order) {
      return res.status(404).json({ message: "주문을 찾을 수 없습니다." });
    }
    res.json(order);
  } catch (err) {
    console.error("주문 상세 조회 실패:", err);
    res.status(500).json({ message: "주문 상세 조회 중 오류가 발생했습니다." });
  }
});

// 주문 취소 (사용자)
// POST /api/orders/:order_id/cancel
router.post("/:order_id/cancel", authenticate, async (req, res) => {
  const { order_id } = req.params; // UUID
  const user_id = req.user.id;

  const t = await sequelize.transaction();
  try {
    const order = await Order.findOne({
      where: { id: order_id, user_id: user_id },
      include: [
        { model: OrderItem, as: "items" },
        { model: Payment, as: "payments" },
      ],
      transaction: t,
    });

    if (!order) {
      await t.rollback();
      return res
        .status(404)
        .json({ message: "취소할 주문을 찾을 수 없습니다." });
    }

    // 주문 취소 가능 상태 확인 (예: 'PENDING' 또는 'PROCESSING' 전까지만)
    if (![OrderStatus.PENDING].includes(order.status)) {
      // PENDING 상태만 취소 가능하다고 가정
      await t.rollback();
      return res
        .status(400)
        .json({
          message: `현재 주문 상태(${order.status})에서는 취소할 수 없습니다.`,
        });
    }

    // 1. 재고 복구
    for (const item of order.items) {
      await ProductVariant.increment("stock_quantity", {
        by: item.quantity,
        where: { id: item.product_variant_id },
        transaction: t,
      });
    }

    // 2. 사용된 쿠폰 복구 (UserCoupon의 used_at, order_id를 null로)
    const usedUserCoupons = await UserCoupon.findAll({
      where: { order_id: order.id, user_id: user_id },
      transaction: t,
    });
    for (const uc of usedUserCoupons) {
      await uc.update({ used_at: null, order_id: null }, { transaction: t });
      // Coupon의 current_usage_count를 감소시켜야 한다면 여기서 처리 (리딤 시 올렸다면)
      // await Coupon.decrement('current_usage_count', {by: 1, where: {id: uc.coupon_id}, transaction: t});
    }
    // OrderPromotion에 기록된 것은 보통 주문 취소 시 함께 무효화되므로 별도 복구 작업은 없음.

    // 3. 주문 상태 및 주문 아이템 상태 변경
    await order.update({ status: OrderStatus.CANCELLED }, { transaction: t });
    await OrderItem.update(
      { status: OrderItemStatus.CANCELLED },
      { where: { order_id: order.id }, transaction: t }
    );

    // 4. 결제 상태 변경 (PG 연동된 실제 결제 취소 로직 필요)
    // 여기서는 Payment 상태만 변경.
    if (order.payments && order.payments.length > 0) {
      for (const payment of order.payments) {
        if (payment.status === PaymentStatus.COMPLETED) {
          // 이미 결제 완료된 경우
          // 실제 PG 결제 취소 API 호출...
          // 성공 시 payment.status를 REFUNDED 또는 CANCELLED로 변경
          await payment.update(
            { status: PaymentStatus.REFUNDED, updated_at: new Date() },
            { transaction: t }
          ); // 예시: 환불됨
        } else if (payment.status === PaymentStatus.PENDING) {
          await payment.update(
            { status: PaymentStatus.FAILED, updated_at: new Date() },
            { transaction: t }
          ); // 예시: 결제 실패(취소)
        }
      }
    }

    await t.commit();
    res.json({
      message: "주문이 성공적으로 취소되었습니다.",
      order_id: order.id,
      new_status: OrderStatus.CANCELLED,
    });
  } catch (err) {
    await t.rollback();
    console.error("주문 취소 실패:", err);
    res
      .status(500)
      .json({
        message: err.message || "주문 취소 처리 중 오류가 발생했습니다.",
      });
  }
});

// (참고) 환불 요청 API - 새로운 Refund 모델 사용
// POST /api/orders/:order_id/refund-request
// body: { items: [{order_item_id, quantity, reason_type, reason_detail? }] }
router.post("/:order_id/refund-request", authenticate, async (req, res) => {
  const { order_id } = req.params;
  const user_id = req.user.id;
  const { items: refundRequestItems } = req.body; // [{order_item_id, quantity, reason_type, reason_detail}]

  if (!Array.isArray(refundRequestItems) || refundRequestItems.length === 0) {
    return res
      .status(400)
      .json({ message: "환불 요청할 아이템 정보를 제공해주세요." });
  }

  const t = await sequelize.transaction();
  try {
    const order = await Order.findOne({
      where: { id: order_id, user_id: user_id },
      include: [
        {
          model: OrderItem,
          as: "items",
          include: [{ model: ProductVariant, as: "product_variant" }],
        },
        {
          model: Payment,
          as: "payments",
          where: { status: PaymentStatus.COMPLETED },
          required: false,
        }, // 완료된 결제 건
      ],
      transaction: t,
    });

    if (!order) {
      await t.rollback();
      return res
        .status(404)
        .json({ message: "환불 요청할 주문을 찾을 수 없습니다." });
    }

    // 환불 가능 상태인지 확인 (예: DELIVERED 후 일정 기간 등)
    if (order.status !== OrderStatus.DELIVERED) {
      // 배송 완료 상태에서만 환불 요청 가능하다고 가정
      await t.rollback();
      return res
        .status(400)
        .json({
          message: `현재 주문 상태(${order.status})에서는 환불 요청을 할 수 없습니다.`,
        });
    }
    if (!order.payments || order.payments.length === 0) {
      await t.rollback();
      return res
        .status(400)
        .json({
          message: "결제 정보를 찾을 수 없어 환불 요청을 진행할 수 없습니다.",
        });
    }
    const primaryPayment = order.payments[0]; // 주 결제 건

    let totalRefundItemAmount = 0;
    const refundItemsData = [];

    for (const reqItem of refundRequestItems) {
      const orderItem = order.items.find(
        (oi) => oi.id === reqItem.order_item_id
      );
      if (!orderItem) {
        throw new Error(
          `주문 아이템(ID: ${reqItem.order_item_id})을 찾을 수 없습니다.`
        );
      }
      if (reqItem.quantity <= 0 || reqItem.quantity > orderItem.quantity) {
        throw new Error(
          `아이템(ID: ${reqItem.order_item_id})의 환불 요청 수량이 잘못되었습니다.`
        );
      }
      if (
        !reqItem.reason_type ||
        !Object.values(RefundReasonType).includes(reqItem.reason_type)
      ) {
        throw new Error(
          `아이템(ID: ${reqItem.order_item_id})의 환불 사유 타입이 잘못되었습니다.`
        );
      }
      // 이미 환불 요청/완료된 수량 체크 로직 추가 필요

      const itemPriceAtRefundTime = parseFloat(orderItem.price_at_purchase); // 구매 시점 가격으로 환불 가정
      const itemTotalAmount = itemPriceAtRefundTime * reqItem.quantity;
      totalRefundItemAmount += itemTotalAmount;

      refundItemsData.push({
        // refund_id는 Refund 생성 후
        order_item_id: orderItem.id,
        quantity: reqItem.quantity,
        item_price_at_refund_time: itemPriceAtRefundTime,
        item_total_amount: itemTotalAmount,
      });

      // 주문 아이템 상태 변경 (예: RETURN_REQUESTED)
      await orderItem.update(
        { status: OrderItemStatus.RETURN_REQUESTED },
        { transaction: t }
      );
    }

    // 전체 환불인지 부분 환불인지에 따라 로직 분기 가능
    // 여기서는 요청된 아이템들에 대한 환불 요청 생성

    const newRefund = await Refund.create(
      {
        order_id: order.id,
        payment_id: primaryPayment.id,
        product_items_total_amount: totalRefundItemAmount,
        // shipping_fee_deduction, other_deductions 등은 관리자 승인 시 결정
        final_refund_amount: totalRefundItemAmount, // 초기 요청 시에는 아이템 금액만으로 설정
        refund_reason: refundRequestItems[0].reason_type, // 대표 사유 하나만 저장하거나, 아이템별 사유를 RefundItem에 저장
        refund_reason_detail: refundRequestItems[0].reason_detail || null,
        status: RefundStatus.REQUESTED, // 환불 요청 상태
        // requested_at 자동 생성
      },
      { transaction: t }
    );

    await RefundItem.bulkCreate(
      refundItemsData.map((riData) => ({ ...riData, refund_id: newRefund.id })),
      { transaction: t }
    );

    // 주문 전체 상태 변경 (예: PARTIALLY_RETURN_REQUESTED 등 새로운 상태 필요시 정의)
    // 또는 모든 아이템이 반품 요청되면 주문 상태를 RETURN_REQUESTED로 변경 등

    await t.commit();
    res
      .status(201)
      .json({
        message: "환불 요청이 접수되었습니다.",
        refund_id: newRefund.id,
      });
  } catch (err) {
    await t.rollback();
    console.error("환불 요청 실패:", err);
    res
      .status(400)
      .json({
        message: err.message || "환불 요청 처리 중 오류가 발생했습니다.",
      });
  }
});

module.exports = router;
