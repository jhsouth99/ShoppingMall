// utils/discountCalculator.js

const { Op } = require('sequelize');
const {
  UserCoupon, Coupon, Promotion, PromotionCondition, PromotionProduct, Product, ProductVariant, Category
  // UserGroup 모델이 있다면 추가 (사용자 그룹 조건용)
} = require('../../models'); // ../models/index.js에서 가져온다고 가정 (경로 확인)
const { DiscountType, PromotionType, PromotionConditionType, CardIssuer } = require('../../enums'); // ../enums.js에서 가져온다고 가정

/**
 * 주문에 적용될 쿠폰 및 프로모션 할인을 계산합니다.
 *
 * @param {string} userId - 주문하는 사용자의 ID.
 * @param {Array<Object>} orderItemsDetailed - 주문 상품 상세 정보 배열. 각 객체는 다음을 포함해야 합니다:
 * {
 * product_id: string,
 * product_variant_id: string,
 * category_id: string, // 상품의 주 카테고리 ID
 * quantity: number,
 * unit_price: number, // 아이템별 할인이 이미 적용된 단가 또는 원가
 * original_line_total: number // unit_price * quantity
 * }
 * @param {number} initialSubTotalAmount - 모든 orderItemsDetailed의 original_line_total 합계 (장바구니/쿠폰 할인 전).
 * @param {string|null} userCouponIdToApply - 사용자가 적용하려는 UserCoupon의 ID (선택 사항).
 * @param {import('sequelize').Transaction} transaction - Sequelize 트랜잭션 객체.
 * @returns {Promise<Object>} 할인 결과 객체:
 * {
 * couponDiscountAmount: number,
 * promotionDiscountAmount: number, // 쿠폰 외 자동 적용 프로모션 할인액
 * totalDiscountAmount: number,
 * finalAmountBeforeShipping: number, // initialSubTotalAmount - totalDiscountAmount
 * appliedPromotionsInfo: Array<{promotion_id: string, discount_amount_applied: number, user_coupon_id?: string}>,
 * usedUserCouponInstance: import('../models').UserCoupon | null
 * }
 */
async function applyPromotionsAndCoupons(userId, orderItemsDetailed, initialSubTotalAmount, userCouponIdToApply, transaction) {
  let couponDiscountAmount = 0;
  let promotionDiscountAmount = 0;
  const appliedPromotionsInfo = [];
  let usedUserCouponInstance = null;
  let currentSubtotalForPromotions = initialSubTotalAmount; // 프로모션 적용을 위한 현재 소계

  const now = new Date();

  // --- 1. 사용자 선택 쿠폰 적용 ---
  if (userCouponIdToApply) {
    const userCoupon = await UserCoupon.findOne({
      where: { id: userCouponIdToApply, user_id: userId, used_at: null, order_id: null },
      include: [{
        model: Coupon,
        as: 'coupon',
        where: { is_active: true }, // 활성 쿠폰만
        include: [{
          model: Promotion,
          as: 'promotion', // Coupon 모델과 Promotion (CODE_COUPON)의 관계
          where: {
            is_active: true,
            promotion_type: PromotionType.CODE_COUPON,
            start_date: { [Op.lte]: now },
            [Op.or]: [{ end_date: { [Op.eq]: null } }, { end_date: { [Op.gte]: now } }]
          },
          required: true, // 이 쿠폰에 연결된 유효한 코드쿠폰 프로모션이 있어야 함
          include: [{ model: PromotionCondition, as: 'conditions' }]
        }]
      }],
      transaction
    });

    if (userCoupon && userCoupon.coupon && userCoupon.coupon.promotion) {
      const coupon = userCoupon.coupon;
      const promotion = userCoupon.coupon.promotion;
      let couponApplicable = true;

      // a. 쿠폰 자체 유효기간 재확인 (프로모션 기간과 별개로 쿠폰 자체 기간도 있을 수 있음)
      if ((coupon.valid_from && coupon.valid_from > now) || (coupon.valid_to && coupon.valid_to < now)) {
        couponApplicable = false;
        console.log(`[쿠폰 ${coupon.code}] 유효기간 만료/미시작 (쿠폰 자체)`);
      }

      // b. 쿠폰 최소 구매 금액 조건
      if (couponApplicable && coupon.min_purchase_amount && initialSubTotalAmount < parseFloat(coupon.min_purchase_amount)) {
        couponApplicable = false;
        console.log(`[쿠폰 ${coupon.code}] 최소 구매 금액 미달 (쿠폰 자체 조건: ${coupon.min_purchase_amount}원)`);
      }
      // c. 연결된 프로모션 조건 확인
      if (couponApplicable && promotion.conditions && promotion.conditions.length > 0) {
        for (const cond of promotion.conditions) {
          if (cond.condition_type === PromotionConditionType.MIN_PURCHASE_AMOUNT && initialSubTotalAmount < parseFloat(cond.decimal_value)) {
            couponApplicable = false;
            console.log(`[쿠폰 ${coupon.code}] 프로모션 최소 구매 금액 미달 (프로모션 조건: ${cond.decimal_value}원)`);
            break;
          }
          // TODO: SPECIFIC_PRODUCTS, USER_GROUP, CARD_ISSUER 등 다른 조건 검사 로직 추가
        }
      }

      if (couponApplicable) {
        let calculatedDiscount = 0;
        if (coupon.discount_type === DiscountType.FIXED_AMOUNT) {
          calculatedDiscount = parseFloat(coupon.discount_value);
        } else if (coupon.discount_type === DiscountType.PERCENTAGE) {
          calculatedDiscount = initialSubTotalAmount * (parseFloat(coupon.discount_value) / 100);
          if (promotion.max_discount_amount && calculatedDiscount > parseFloat(promotion.max_discount_amount)) {
            calculatedDiscount = parseFloat(promotion.max_discount_amount);
          }
        }
        // 할인액은 현재 소계를 초과할 수 없음
        couponDiscountAmount = Math.max(0, Math.min(Math.floor(calculatedDiscount), initialSubTotalAmount));

        if (couponDiscountAmount > 0) {
          appliedPromotionsInfo.push({
            promotion_id: promotion.id,
            discount_amount_applied: couponDiscountAmount,
            user_coupon_id: userCoupon.id // 어떤 UserCoupon이 사용되었는지 명시
          });
          usedUserCouponInstance = userCoupon;
          currentSubtotalForPromotions -= couponDiscountAmount; // 쿠폰 적용 후 소계 업데이트
          console.log(`[쿠폰 ${coupon.code}] 적용됨: ${couponDiscountAmount}원 할인`);
        }
      }
    } else {
        console.log(`사용자 쿠폰 ID (${userCouponIdToApply})를 찾을 수 없거나 유효하지 않습니다.`);
    }
  }

  // --- 2. 자동 적용 프로모션 (예: 장바구니 할인, 특정 상품 포함 할인 등) ---
  // 쿠폰과 중복 적용 여부, 프로모션 우선순위 등을 고려해야 함
  // 여기서는 쿠폰이 적용되었다면, 추가적인 장바구니 전체 할인은 적용하지 않는다고 가정 (단순화)
  // 또는 우선순위가 높은 프로모션 하나만 적용하도록 로직 구성 가능

  if (!usedUserCouponInstance || couponDiscountAmount === 0) { // 쿠폰이 미적용되었거나 할인액이 0일 때만 자동 프로모션 탐색 (정책 예시)
    const autoApplyPromotions = await Promotion.findAll({
      where: {
        is_active: true,
        promotion_type: { // 코드 쿠폰 제외한 자동 적용 가능한 타입들
          [Op.in]: [PromotionType.CART_DISCOUNT, PromotionType.PRODUCT_DISCOUNT /*, PromotionType.SHIPPING_DISCOUNT - 배송비는 별도처리 */]
        },
        start_date: { [Op.lte]: now },
        [Op.or]: [{ end_date: { [Op.eq]: null } }, { end_date: { [Op.gte]: now } }]
      },
      include: [
        { model: PromotionCondition, as: 'conditions' },
        {
          model: PromotionProduct,
          as: 'promotion_product_entries', // 위에서 Promotion 모델에 새로 정의한 별칭 사용
          include: [ // 필요하다면 PromotionProduct에 연결된 Product 정보도 가져올 수 있음
            { model: Product, as: 'product', attributes: ['id', 'name'] }
          ]
        }
      ],
      order: [['priority', 'DESC'], ['created_at', 'ASC']], // 우선순위 높은 것, 먼저 생성된 것 순
      transaction
    });

    for (const promotion of autoApplyPromotions) {
      let promotionApplicable = true;
      // a. 프로모션 조건 확인
      if (promotion.conditions && promotion.conditions.length > 0) {
        for (const cond of promotion.conditions) {
          if (cond.condition_type === PromotionConditionType.MIN_PURCHASE_AMOUNT && currentSubtotalForPromotions < parseFloat(cond.decimal_value)) {
            promotionApplicable = false; break;
          }
          if (cond.condition_type === PromotionConditionType.SPECIFIC_PRODUCTS) {
            // PromotionProduct 테이블에 정의된 특정 상품들이 orderItemsDetailed에 모두 포함되어야 하는지,
            // 아니면 하나라도 포함되면 되는지 등 정책 필요. 여기서는 하나라도 포함되면으로 가정.
            if (promotion.applicable_products && promotion.applicable_products.length > 0) {
                const requiredProductIds = promotion.applicable_products.map(pp => pp.product_id);
                const orderProductIds = orderItemsDetailed.map(item => item.product_id);
                const hasRequiredProduct = requiredProductIds.some(rpId => orderProductIds.includes(rpId));
                if (!hasRequiredProduct) { promotionApplicable = false; break; }
            } else { // 적용 상품이 지정되지 않은 PRODUCT_DISCOUNT는 이상함.
                 promotionApplicable = false; break;
            }
          }
          // TODO: USER_GROUP, CARD_ISSUER 등 다른 조건 검사
        }
      }

      if (promotionApplicable) {
        let calculatedPromoDiscount = 0;
        let targetAmountForDiscount = currentSubtotalForPromotions; // 기본은 현재까지 할인된 소계

        if (promotion.promotion_type === PromotionType.PRODUCT_DISCOUNT) {
          let productDiscountSubtotal = 0;
          // promotion.promotion_product_entries (새로운 별칭) 에 접근하여 연결된 상품 ID 목록 확인
          if (promotion.promotion_product_entries && promotion.promotion_product_entries.length > 0) {
            const requiredProductIds = promotion.promotion_product_entries.map(ppe => ppe.product_id);
            const orderProductIds = orderItemsDetailed.map(item => item.product_id);
            const hasRequiredProduct = requiredProductIds.some(rpId => orderProductIds.includes(rpId));
            if (!hasRequiredProduct) { promotionApplicable = false; /* break; */ }
          } else {
              promotionApplicable = false; /* break; */ // 적용 상품 지정 안 된 PRODUCT_DISCOUNT는 적용 불가
          }
          // 할인 대상 금액 계산 시에도 promotion.promotion_product_entries 활용
          if (promotionApplicable && promotion.promotion_product_entries && promotion.promotion_product_entries.length > 0) {
            const applicableProductIdsForDiscount = promotion.promotion_product_entries.map(ppe => ppe.product_id);
            orderItemsDetailed.forEach(item => {
              if (applicableProductIdsForDiscount.includes(item.product_id)) {
                productDiscountSubtotal += item.original_line_total;
              }
            });
          }
          targetAmountForDiscount = productDiscountSubtotal;
        }


        if (promotion.discount_type === DiscountType.FIXED_AMOUNT) {
          calculatedPromoDiscount = parseFloat(promotion.discount_value);
        } else if (promotion.discount_type === DiscountType.PERCENTAGE) {
          calculatedPromoDiscount = targetAmountForDiscount * (parseFloat(promotion.discount_value) / 100);
          if (promotion.max_discount_amount && calculatedPromoDiscount > parseFloat(promotion.max_discount_amount)) {
            calculatedPromoDiscount = parseFloat(promotion.max_discount_amount);
          }
        }
        // 할인액은 대상 금액 초과 불가
        const currentPromoDiscount = Math.max(0, Math.min(Math.floor(calculatedPromoDiscount), targetAmountForDiscount));

        if (currentPromoDiscount > 0) {
          promotionDiscountAmount += currentPromoDiscount; // 누적
          appliedPromotionsInfo.push({
            promotion_id: promotion.id,
            discount_amount_applied: currentPromoDiscount
          });
          currentSubtotalForPromotions -= currentPromoDiscount; // 다음 프로모션 계산을 위해 소계 업데이트
          console.log(`[자동 프로모션 ${promotion.name}] 적용됨: ${currentPromoDiscount}원 할인`);

          // 정책: 가장 유리한 프로모션 하나만 적용하고 루프 중단 (예시)
          // break;
        }
      }
    }
  }


  const totalDiscountAmount = couponDiscountAmount + promotionDiscountAmount;
  // 최종 금액은 음수가 될 수 없음
  const finalAmountBeforeShipping = Math.max(0, initialSubTotalAmount - totalDiscountAmount);

  return {
    couponDiscountAmount,
    promotionDiscountAmount,
    totalDiscountAmount,
    finalAmountBeforeShipping,
    appliedPromotionsInfo,
    usedUserCouponInstance
  };
}

module.exports = applyPromotionsAndCoupons;
