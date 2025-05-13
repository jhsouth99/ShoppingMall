// routes/couponRoutes.js
const express = require("express");
const { Op, Sequelize } = require('sequelize'); // Sequelize 추가
const authenticate = require("../middleware/auth");
const { Coupon, UserCoupon, User, Promotion, PromotionCondition, UserRole } = require("../models"); // Promotion, PromotionCondition, UserRole 추가
const { DiscountType, PromotionType, PromotionConditionType, RoleType } = require('../enums'); // Enums 추가

const router = express.Router();

// 관리자 권한 확인 미들웨어 (categoryRoutes.js에서 가져오거나 유사하게 정의)
async function requireAdmin(req, res, next) {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: "인증되지 않은 사용자입니다." });
  }
  try {
    const userRoles = await UserRole.findAll({ where: { user_id: req.user.id } });
    const isAdmin = userRoles.some(userRole => userRole.role === RoleType.ADMIN);

    if (!isAdmin) {
      return res.status(403).json({ message: "관리자 권한이 필요합니다." });
    }
    next();
  } catch (error) {
    console.error("관리자 권한 확인 중 오류:", error);
    return res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
}

// 1) 관리자: 쿠폰 코드형 프로모션 생성
// POST /api/coupons
// body: {
//   // Coupon Fields
//   code: "SUMMER2025", discount_type: "PERCENTAGE", discount_value: 10,
//   valid_from?: "YYYY-MM-DDTHH:mm:ssZ", valid_to?: "YYYY-MM-DDTHH:mm:ssZ",
//   min_purchase_amount?: 50000, usage_limit_per_user?: 1, total_usage_limit?: 100,
//   // Promotion Fields for this Coupon
//   promotion_name: "여름맞이 10% 할인 쿠폰 프로모션", promotion_description?: "여름 상품 대상",
//   max_discount_amount?: 10000, // PERCENTAGE 할인 시 최대 할인 금액
//   // PromotionCondition Fields (optional)
//   conditions?: [{ condition_type: "MIN_PURCHASE_AMOUNT", decimal_value: 30000 }]
// }
router.post("/", authenticate, requireAdmin, async (req, res) => {
  const t = await sequelize.transaction(); // 트랜잭션 시작
  try {
    const {
      // Coupon fields
      code, discount_type, discount_value, valid_from, valid_to,
      min_purchase_amount, usage_limit_per_user, total_usage_limit,
      // Promotion fields (for this coupon)
      promotion_name, promotion_description, max_discount_amount,
      // PromotionCondition fields (optional array)
      conditions
    } = req.body;

    if (!code || !discount_type || discount_value === undefined || !promotion_name) {
      await t.rollback();
      return res.status(400).json({ message: "필수 정보(code, discount_type, discount_value, promotion_name)가 누락되었습니다." });
    }

    // 1. Coupon 생성
    const newCoupon = await Coupon.create({
      code,
      discount_type, // Enum 값 검증은 모델 레벨 또는 여기서 추가 가능
      discount_value,
      valid_from: valid_from ? new Date(valid_from) : null,
      valid_to: valid_to ? new Date(valid_to) : null,
      min_purchase_amount, // Coupon 자체의 최소 구매 금액 (Promotion 조건과 별개로 둘 수 있음)
      usage_limit_per_user,
      total_usage_limit,
      is_active: true // 기본 활성
    }, { transaction: t });

    // 2. Promotion 생성 (CODE_COUPON 타입)
    const newPromotion = await Promotion.create({
      name: promotion_name,
      description: promotion_description,
      promotion_type: PromotionType.CODE_COUPON, // 코드 쿠폰 타입
      discount_type: newCoupon.discount_type, // 쿠폰의 할인 타입과 동일하게 설정
      discount_value: newCoupon.discount_value, // 쿠폰의 할인 값과 동일하게 설정
      max_discount_amount: max_discount_amount, // % 할인 시 최대 할인액
      start_date: newCoupon.valid_from || new Date(), // 쿠폰 유효 시작일 또는 현재
      end_date: newCoupon.valid_to, // 쿠폰 유효 종료일
      is_active: true,
      coupon_id: newCoupon.id, // 생성된 Coupon의 ID 연결
      priority: 0 // 필요시 우선순위 설정
    }, { transaction: t });

    // 3. Promotion Conditions 생성 (선택적)
    if (conditions && Array.isArray(conditions)) {
      for (const cond of conditions) {
        await PromotionCondition.create({
          promotion_id: newPromotion.id,
          condition_type: cond.condition_type, // Enum 값 검증 필요
          value: cond.value, // 일반 값
          card_issuer_value: cond.card_issuer_value,
          string_value: cond.string_value,
          decimal_value: cond.decimal_value
        }, { transaction: t });
      }
    }

    await t.commit(); // 모든 작업 성공 시 커밋
    res.status(201).json({ coupon: newCoupon, promotion: newPromotion });

  } catch (err) {
    await t.rollback(); // 오류 발생 시 롤백
    console.error("쿠폰형 프로모션 생성 실패:", err);
    if (err.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ message: `이미 존재하는 쿠폰 코드(${req.body.code})이거나 다른 고유 제약 조건 위반입니다.` });
    }
    res.status(400).json({ message: err.message || "쿠폰형 프로모션 생성 중 오류가 발생했습니다." });
  }
});

// 2) 사용자: 쿠폰 코드 입력하여 등록 (리딤)
// POST /api/coupons/redeem
// body: { code: "COUPON_CODE" }
router.post("/redeem", authenticate, async (req, res) => {
  const user_id = req.user.id;
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ message: "쿠폰 코드를 입력하세요." });
  }

  const t = await sequelize.transaction();
  try {
    // 1. 유효한 Coupon 찾기 (연결된 Promotion 정보와 함께)
    const coupon = await Coupon.findOne({
      where: { code, is_active: true },
      include: [{
        model: Promotion,
        as: 'promotion', // Coupon 모델에 'promotion'으로 관계 설정 필요 (hasOne)
        where: { promotion_type: PromotionType.CODE_COUPON, is_active: true }, // 코드 쿠폰 타입이고 활성 상태인 프로모션
        required: true // Coupon에 연결된 CODE_COUPON Promotion이 반드시 있어야 함
      }],
      transaction: t
    });

    if (!coupon || !coupon.promotion) {
      await t.rollback();
      return res.status(404).json({ message: "유효하지 않거나 현재 사용할 수 없는 쿠폰 코드입니다." });
    }

    // 2. 쿠폰 및 프로모션 유효기간 확인
    const now = new Date();
    if ((coupon.valid_to && coupon.valid_to < now) || (coupon.promotion.end_date && coupon.promotion.end_date < now)) {
      await t.rollback();
      return res.status(400).json({ message: "만료된 쿠폰입니다." });
    }
    if ((coupon.valid_from && coupon.valid_from > now) || (coupon.promotion.start_date && coupon.promotion.start_date > now)) {
        await t.rollback();
        return res.status(400).json({ message: "아직 사용할 수 없는 쿠폰입니다." });
    }

    // 3. 사용자별 사용 한도 확인 (UserCoupon 테이블에서 해당 coupon_id로 user_id가 사용한 횟수 카운트)
    if (coupon.usage_limit_per_user && coupon.usage_limit_per_user > 0) {
      const userUsageCount = await UserCoupon.count({
        where: { user_id: user_id, coupon_id: coupon.id },
        transaction: t
      });
      if (userUsageCount >= coupon.usage_limit_per_user) {
        await t.rollback();
        return res.status(400).json({ message: "이 쿠폰에 대한 사용자별 사용 한도를 초과했습니다." });
      }
    }

    // 4. 쿠폰 총 사용 한도 확인 (Coupon 모델의 current_usage_count와 total_usage_limit 비교)
    //    current_usage_count는 UserCoupon 생성 후 증가시키므로, 여기서는 (total_usage_limit - current_usage_count) > 0 체크
    if (coupon.total_usage_limit && coupon.total_usage_limit > 0) {
        if (coupon.current_usage_count >= coupon.total_usage_limit) {
            await t.rollback();
            return res.status(400).json({ message: "쿠폰의 총 사용 한도가 소진되었습니다." });
        }
    }


    // 5. 이미 등록(리딤)했는지 확인 (UserCoupon에 user_id, coupon_id 조합이 있는지)
    const existingUserCoupon = await UserCoupon.findOne({
      where: { user_id: user_id, coupon_id: coupon.id },
      transaction: t
    });
    if (existingUserCoupon) {
      await t.rollback();
      // 이미 등록되었지만 사용하지 않은 경우, 또는 이미 사용한 경우에 따라 메시지 분기 가능
      const message = existingUserCoupon.used_at ? "이미 사용한 쿠폰입니다." : "이미 등록된 쿠폰입니다. '내 쿠폰함'을 확인해주세요.";
      return res.status(400).json({ message });
    }

    // 6. UserCoupon 생성 (쿠폰 등록/발급)
    // UserCoupon 모델에 issued_at 필드가 있거나, created_at을 사용한다고 가정
    const userCouponData = {
        user_id: user_id,
        coupon_id: coupon.id,
    };
    if (UserCoupon.rawAttributes.issued_at) { // issued_at 필드가 모델에 정의되어 있다면
        userCouponData.issued_at = new Date();
    }
    const newUserCoupon = await UserCoupon.create(userCouponData, { transaction: t });

    // 7. Coupon의 current_usage_count 증가 (선택적: 리딤 시점에 카운트할지, 실제 사용 시점에 카운트할지 정책에 따라 다름)
    // 여기서는 리딤 시점에 카운트. 동시성 문제 최소화를 위해 increment 사용.
    await Coupon.increment('current_usage_count', { by: 1, where: { id: coupon.id }, transaction: t });

    await t.commit();
    res.status(201).json({
        message: "쿠폰이 성공적으로 등록되었습니다.",
        user_coupon: newUserCoupon, // 필요시 상세 정보 포함
        coupon_details: { // 쿠폰 및 프로모션 정보 간략히 전달
            code: coupon.code,
            promotion_name: coupon.promotion.name,
            discount_type: coupon.discount_type,
            discount_value: coupon.discount_value
        }
    });

  } catch (err) {
    await t.rollback();
    console.error("쿠폰 리딤 실패:", err);
    if (err.name === 'SequelizeForeignKeyConstraintError') {
        return res.status(400).json({ message: "잘못된 요청입니다 (참조 오류)."});
    }
    res.status(500).json({ message: "쿠폰 리딤 처리 중 오류가 발생했습니다." });
  }
});

// 3) 사용자: 내 쿠폰 목록 조회
// GET /api/coupons
// optional query: ?status=available|used|expired
router.get("/", authenticate, async (req, res) => {
  const user_id = req.user.id;
  const { status } = req.query; // 'available', 'used', 'expired'

  try {
    const userCouponWhereClause = { user_id: user_id };
    const couponInclude = {
      model: Coupon,
      as: 'coupon', // UserCoupon 모델의 관계 설정과 일치해야 함
      include: [{
          model: Promotion,
          as: 'promotion', // Coupon 모델의 관계 설정과 일치해야 함
          where: { promotion_type: PromotionType.CODE_COUPON }, // 코드 쿠폰 프로모션만
          required: true // Coupon에 연결된 Promotion이 있어야 함
      }]
    };

    const now = new Date();

    if (status === 'used') {
      userCouponWhereClause.used_at = { [Op.ne]: null }; // 사용된 쿠폰 (used_at이 null이 아님)
    } else if (status === 'available') {
      userCouponWhereClause.used_at = null; // 아직 사용 안 함
      // 사용 가능한 쿠폰은 만료되지 않아야 함
      couponInclude.where = {
        is_active: true,
        [Op.or]: [
          { valid_to: { [Op.eq]: null } }, // 만료일 없음
          { valid_to: { [Op.gte]: now } }  // 만료일이 현재 이후
        ]
      };
      // 프로모션 기간도 함께 고려
      couponInclude.include[0].where = {
        ...couponInclude.include[0].where, // 기존 promotion_type 조건 유지
        is_active: true,
        [Op.or]: [
            { end_date: { [Op.eq]: null } },
            { end_date: { [Op.gte]: now } }
        ],
        [Op.or]: [
            { start_date: { [Op.eq]: null } },
            { start_date: { [Op.lte]: now } }
        ]
      };

    } else if (status === 'expired') {
      userCouponWhereClause.used_at = null; // 사용하지 않았으면서
      // 만료된 쿠폰 (Coupon의 valid_to 또는 Promotion의 end_date가 과거)
       couponInclude.where = {
        is_active: true, // 쿠폰 자체는 활성일 수 있으나 기간 만료
         [Op.or]: [
            { valid_to: { [Op.ne]: null, [Op.lt]: now } },
            { '$Coupon.promotion.end_date$': { [Op.ne]: null, [Op.lt]: now } } // 중첩된 관계의 컬럼 참조
         ]
       };
       // 프로모션 기간 만료도 고려 (위 $Coupon.promotion.end_date$ 로 일부 처리됨)
    }
    // status 필터가 없으면 모든 쿠폰 (used_at 기준으로 사용/미사용 구분 가능)

    const userCoupons = await UserCoupon.findAll({
      where: userCouponWhereClause,
      include: [couponInclude],
      // UserCoupon 모델에 issued_at 또는 created_at 필드가 있다고 가정
      order: [[UserCoupon.rawAttributes.issued_at ? 'issued_at' : 'created_at', "DESC"]],
    });

    const formattedCoupons = userCoupons.map(uc => {
      if (!uc.coupon || !uc.coupon.promotion) return null; // 데이터 무결성 체크
      const coupon = uc.coupon;
      const promotion = coupon.promotion;
      let currentStatus = 'unknown';
      if (uc.used_at) {
          currentStatus = 'used';
      } else if ((coupon.valid_to && coupon.valid_to < now) || (promotion.end_date && promotion.end_date < now)) {
          currentStatus = 'expired';
      } else if ((coupon.valid_from && coupon.valid_from > now) || (promotion.start_date && promotion.start_date > now)){
          currentStatus = 'upcoming';
      } else {
          currentStatus = 'available';
      }

      return {
        user_coupon_id: uc.id, // UserCoupon의 PK (단일 ID라고 가정)
        coupon_id: coupon.id,
        code: coupon.code,
        promotion_name: promotion.name,
        promotion_description: promotion.description,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        max_discount_amount: promotion.max_discount_amount,
        min_purchase_amount: coupon.min_purchase_amount || (promotion.conditions && promotion.conditions.find(c=>c.condition_type === PromotionConditionType.MIN_PURCHASE_AMOUNT)?.decimal_value), // 조건 우선
        valid_from: coupon.valid_from || promotion.start_date,
        valid_to: coupon.valid_to || promotion.end_date,
        status: currentStatus, // 계산된 상태
        issued_at: uc.issued_at || uc.created_at, // 발급(등록)일
        used_at: uc.used_at,
        order_id: uc.order_id
      };
    }).filter(Boolean); // null 제거

    res.json(formattedCoupons);
  } catch (err) {
    console.error("내 쿠폰 조회 실패:", err);
    res.status(500).json({ message: "내 쿠폰 조회 중 오류가 발생했습니다." });
  }
});

// 4) 관리자: 특정 쿠폰(프로모션)의 발급/사용 내역 조회
// GET /api/coupons/:coupon_id/history
router.get("/:coupon_id/history", authenticate, requireAdmin, async (req, res) => {
  const { coupon_id } = req.params;
  try {
    const coupon = await Coupon.findByPk(coupon_id, {
        include: [{model: Promotion, as: 'promotion'}]
    });
    if(!coupon) {
        return res.status(404).json({ message: "쿠폰을 찾을 수 없습니다." });
    }

    const history = await UserCoupon.findAll({
      where: { coupon_id: coupon_id },
      include: [
        { model: User, as: "user", attributes: ["id", "username", "name", "email"] }, // UserCoupon에 User (as: 'user') 관계 필요
        // Coupon 정보는 이미 coupon_id로 알고 있으므로 중복 include는 선택적
        // { model: Coupon, as: "coupon" }
      ],
      order: [[UserCoupon.rawAttributes.issued_at ? 'issued_at' : 'created_at', "DESC"]],
    });
    res.json({
        coupon_info: coupon,
        usage_history: history
    });
  } catch (err) {
    console.error("쿠폰 사용 내역 조회 실패:", err);
    res.status(500).json({ message: "쿠폰 사용 내역 조회 중 오류가 발생했습니다." });
  }
});

// 5) 관리자: 쿠폰(및 연결된 프로모션) 수정 (예: 유효기간, 활성 상태 등)
// PATCH /api/coupons/:coupon_id
router.patch("/:coupon_id", authenticate, requireAdmin, async (req, res) => {
    const { coupon_id } = req.params;
    const t = await sequelize.transaction();
    try {
        const {
            code, valid_from, valid_to, min_purchase_amount,
            usage_limit_per_user, total_usage_limit, is_active,
            promotion_name, promotion_description, max_discount_amount,
            promotion_is_active, promotion_start_date, promotion_end_date
        } = req.body;

        const coupon = await Coupon.findByPk(coupon_id, { transaction: t });
        if (!coupon) {
            await t.rollback();
            return res.status(404).json({ message: "수정할 쿠폰을 찾을 수 없습니다." });
        }

        const couponUpdateData = {};
        if (code !== undefined) couponUpdateData.code = code;
        if (valid_from !== undefined) couponUpdateData.valid_from = valid_from ? new Date(valid_from) : null;
        if (valid_to !== undefined) couponUpdateData.valid_to = valid_to ? new Date(valid_to) : null;
        if (min_purchase_amount !== undefined) couponUpdateData.min_purchase_amount = min_purchase_amount;
        if (usage_limit_per_user !== undefined) couponUpdateData.usage_limit_per_user = usage_limit_per_user;
        if (total_usage_limit !== undefined) couponUpdateData.total_usage_limit = total_usage_limit;
        if (is_active !== undefined) couponUpdateData.is_active = is_active;

        if(Object.keys(couponUpdateData).length > 0) {
            await coupon.update(couponUpdateData, { transaction: t });
        }

        // 연결된 Promotion 찾기 (CODE_COUPON 타입)
        const promotion = await Promotion.findOne({ where: { coupon_id: coupon.id, promotion_type: PromotionType.CODE_COUPON }, transaction: t});
        if (promotion) {
            const promotionUpdateData = {};
            if (promotion_name !== undefined) promotionUpdateData.name = promotion_name;
            if (promotion_description !== undefined) promotionUpdateData.description = promotion_description;
            if (max_discount_amount !== undefined) promotionUpdateData.max_discount_amount = max_discount_amount;
            if (promotion_is_active !== undefined) promotionUpdateData.is_active = promotion_is_active;
            // 프로모션 기간은 쿠폰 기간을 따르거나, 별도로 설정 가능. 여기서는 쿠폰 기간을 우선 참조하도록 설정.
            promotionUpdateData.start_date = promotion_start_date ? new Date(promotion_start_date) : coupon.valid_from || promotion.start_date;
            promotionUpdateData.end_date = promotion_end_date ? new Date(promotion_end_date) : coupon.valid_to || promotion.end_date;

            // 프로모션의 discount_type과 discount_value는 보통 쿠폰 생성 시 고정되므로 수정하지 않음. 필요시 추가.

            if(Object.keys(promotionUpdateData).length > 0) {
                await promotion.update(promotionUpdateData, { transaction: t });
            }
        }

        await t.commit();
        res.json({
            message: "쿠폰(프로모션) 정보가 업데이트되었습니다.",
            coupon: await Coupon.findByPk(coupon_id), // 최신 정보
            promotion: promotion ? await Promotion.findByPk(promotion.id) : null
        });

    } catch (err) {
        await t.rollback();
        console.error("쿠폰(프로모션) 수정 실패:", err);
        if (err.name === 'SequelizeUniqueConstraintError' && req.body.code) {
            return res.status(409).json({ message: `이미 존재하는 쿠폰 코드(${req.body.code})입니다.` });
        }
        res.status(500).json({ message: "쿠폰(프로모션) 수정 중 오류가 발생했습니다." });
    }
});


// 6) 관리자: 쿠폰(및 연결된 프로모션) 삭제
// DELETE /api/coupons/:coupon_id
router.delete("/:coupon_id", authenticate, requireAdmin, async (req, res) => {
    const { coupon_id } = req.params;
    const t = await sequelize.transaction();
    try {
        const coupon = await Coupon.findByPk(coupon_id, { transaction: t });
        if (!coupon) {
            await t.rollback();
            return res.status(404).json({ message: "삭제할 쿠폰을 찾을 수 없습니다." });
        }

        // 1. 연결된 UserCoupon 삭제 (또는 비활성화) - 쿠폰이 삭제되면 발급된 것도 무효화
        await UserCoupon.destroy({ where: { coupon_id: coupon.id }, transaction: t });

        // 2. 연결된 Promotion (CODE_COUPON 타입) 삭제
        await Promotion.destroy({ where: { coupon_id: coupon.id, promotion_type: PromotionType.CODE_COUPON }, transaction: t });

        // 3. Coupon 삭제
        await coupon.destroy({ transaction: t });

        await t.commit();
        res.status(200).json({ message: "쿠폰(및 관련 프로모션)이 성공적으로 삭제되었습니다." });

    } catch (err) {
        await t.rollback();
        console.error("쿠폰(프로모션) 삭제 실패:", err);
        res.status(500).json({ message: "쿠폰(프로모션) 삭제 중 오류가 발생했습니다." });
    }
});


module.exports = router;