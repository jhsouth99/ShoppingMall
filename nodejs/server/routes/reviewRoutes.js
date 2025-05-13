// routes/reviewRoutes.js
const express = require('express');
const { Op, Sequelize } = require('sequelize');
const sequelize = require("../config/database.js");
const authenticate = require("../middleware/auth.js");
const { Review, User, Product, OrderItem, ReviewImage, Order, UserRole } = require("../models"); // 필요한 모델 임포트
const { OrderStatus, OrderItemStatus, RoleType } = require('../enums');

const router = express.Router();

// 관리자 권한 확인 미들웨어
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


// --- 상품별 리뷰 목록 조회 ---
// GET /api/products/:product_id/reviews
// Query params: page, limit, sort_by (latest, rating_asc, rating_desc, helpful_desc), with_images (true)
router.get("/products/:product_id/reviews", async (req, res) => {
  const { product_id } = req.params;
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;
    const sort_by = req.query.sort_by || 'latest';
    const with_images = req.query.with_images === 'true';

    let orderOption = [[sequelize.col('review.created_at'), 'DESC']]; // Review 모델의 created_at (테이블명 명시)
    switch (sort_by) {
      case 'rating_desc':
        orderOption = [[sequelize.col('review.rating'), 'DESC'], [sequelize.col('review.created_at'), 'DESC']];
        break;
      case 'rating_asc':
        orderOption = [[sequelize.col('review.rating'), 'ASC'], [sequelize.col('review.created_at'), 'DESC']];
        break;
      // case 'helpful_desc': // '도움돼요' 기능이 있다면 해당 카운트 기준으로 정렬
      //   orderOption = [['helpful_count', 'DESC'], ['created_at', 'DESC']];
      //   break;
      case 'latest':
      default:
        orderOption = [[sequelize.col('review.created_at'), 'DESC']];
        break;
    }

    const whereClause = { product_id: product_id };
    const includeClause = [
      {
        model: User,
        as: 'user', // Review 모델에 User (as: 'user') 관계 필요
        attributes: ['id', 'username', 'name'], // 필요한 사용자 정보만 선택
      },
      {
        model: ReviewImage,
        as: 'images', // Review 모델에 ReviewImage (as: 'images') 관계 필요
        attributes: ['id', 'image_url', 'order'],
        required: with_images ? true : false, // 이미지가 있는 리뷰만 필터링
        order: [['order', 'ASC']]
      },
    ];

    const { count, rows: reviews } = await Review.findAndCountAll({
      where: whereClause,
      include: includeClause,
      order: orderOption,
      limit: limit,
      offset: offset,
      distinct: true, // 이미지가 여러 개일 때 count가 부풀려지는 것을 방지
    });

    res.json({
      total_items: count,
      total_pages: Math.ceil(count / limit),
      current_page: page,
      limit: limit,
      items: reviews,
    });
  } catch (err) {
    console.error(`상품(ID: ${product_id}) 리뷰 목록 조회 실패:`, err);
    res.status(500).json({ message: "리뷰 목록 조회 중 오류가 발생했습니다." });
  }
});


// --- 내가 작성한 리뷰 목록 조회 ---
// GET /api/reviews/me
// Query params: page, limit
router.get("/me", authenticate, async (req, res) => {
    const user_id = req.user.id;
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const offset = (page - 1) * limit;

        const { count, rows: reviews } = await Review.findAndCountAll({
            where: { user_id: user_id },
            include: [
                {
                    model: Product,
                    as: 'product', // Review 모델에 Product (as: 'product') 관계 필요
                    attributes: ['id', 'name'],
                    include: [{ // 상품 썸네일 이미지
                        model: ProductImage,
                        as: 'images',
                        where: { image_type: ProductImageType.THUMBNAIL },
                        attributes: ['image_url'],
                        required: false,
                        limit: 1
                    }]
                },
                {
                    model: ReviewImage,
                    as: 'images',
                    attributes: ['id', 'image_url', 'order'],
                    order: [['order', 'ASC']]
                },
                // { model: OrderItem, as: 'order_item', attributes: ['id']} // 어떤 주문건에 대한 리뷰인지
            ],
            order: [['created_at', 'DESC']],
            limit: limit,
            offset: offset,
        });

        res.json({
            total_items: count,
            total_pages: Math.ceil(count / limit),
            current_page: page,
            limit: limit,
            items: reviews,
        });
    } catch (err) {
        console.error("내가 작성한 리뷰 목록 조회 실패:", err);
        res.status(500).json({ message: "내가 작성한 리뷰 목록 조회 중 오류가 발생했습니다." });
    }
});


// --- 리뷰 생성 ---
// POST /api/reviews
// body: { order_item_id: UUID, product_id: UUID, rating: number (1-5), comment?: string, image_urls?: [string] }
router.post("/", authenticate, async (req, res) => {
  const user_id = req.user.id;
  const { order_item_id, product_id, rating, comment, image_urls } = req.body;

  if (!order_item_id || !product_id || rating === undefined) {
    return res.status(400).json({ message: "필수 정보(order_item_id, product_id, rating)가 누락되었습니다." });
  }
  if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "평점(rating)은 1에서 5 사이의 숫자여야 합니다."});
  }

  const t = await sequelize.transaction();
  try {
    // 1. 주문 아이템 확인 및 리뷰 작성 권한 검증
    const orderItem = await OrderItem.findOne({
      where: { id: order_item_id },
      include: [{
          model: Order,
          as: 'order', // OrderItem 모델에 Order (as: 'order') 관계 필요
          where: { user_id: user_id }, // 본인 주문인지 확인
          required: true
      }],
      transaction: t
    });

    if (!orderItem) {
      await t.rollback();
      return res.status(404).json({ message: "리뷰를 작성할 주문 내역을 찾을 수 없습니다." });
    }
    if (orderItem.product_id !== product_id && orderItem.product_variant?.product_id !== product_id) { // OrderItem에 product_id 직접 있거나, variant 통해 product_id 확인
        // OrderItem 모델이 ProductVariant와 연결되어 있고, ProductVariant가 Product와 연결된 경우:
        // const variant = await ProductVariant.findByPk(orderItem.product_variant_id, {include: ['product'], transaction:t});
        // if(!variant || variant.product_id !== product_id) { /* 에러 */ }
        await t.rollback();
        return res.status(400).json({ message: "주문한 상품과 리뷰 대상 상품이 일치하지 않습니다."});
    }

    // 주문 상태 확인 (예: '배송 완료' 상태에서만 리뷰 작성 가능)
    if (orderItem.status !== OrderItemStatus.DELIVERED && orderItem.order.status !== OrderStatus.DELIVERED) {
        await t.rollback();
        return res.status(400).json({ message: `현재 주문 상태(${orderItem.status || orderItem.order.status})에서는 리뷰를 작성할 수 없습니다.` });
    }

    // 이미 해당 주문 아이템에 대한 리뷰가 있는지 확인
    const existingReview = await Review.findOne({
      where: { order_item_id: order_item_id, user_id: user_id },
      transaction: t
    });
    if (existingReview) {
      await t.rollback();
      return res.status(409).json({ message: "이미 이 상품 구매 건에 대한 리뷰를 작성했습니다." });
    }

    // 2. Review 생성
    const newReview = await Review.create({
      user_id: user_id,
      product_id: product_id,
      order_item_id: order_item_id, // Review 모델에 order_item_id (unique) 필드 필요
      rating: rating,
      comment: comment,
      // created_at은 자동 생성
    }, { transaction: t });

    // 3. ReviewImage 생성 (이미지 URL이 제공된 경우)
    if (image_urls && Array.isArray(image_urls) && image_urls.length > 0) {
      const reviewImageCreations = image_urls.map((url, index) => ({
        review_id: newReview.id,
        image_url: url,
        order: index + 1, // 이미지 순서
      }));
      await ReviewImage.bulkCreate(reviewImageCreations, { transaction: t });
    }

    // 4. (선택적) Product의 평균 평점, 리뷰 수 등 업데이트
    // 이 작업은 트리거나 별도 배치 작업으로 처리하는 것이 더 효율적일 수 있음
    // await Product.updateAverageRating(product_id, t);


    await t.commit();
    const resultReview = await Review.findByPk(newReview.id, {
        include: [
            { model: User, as: 'user', attributes: ['id', 'username', 'name'] },
            { model: ReviewImage, as: 'images', attributes: ['id', 'image_url', 'order']}
        ]
    });
    res.status(201).json(resultReview);

  } catch (err) {
    await t.rollback();
    console.error("리뷰 생성 실패:", err);
    if (err.name === 'SequelizeUniqueConstraintError') { // order_item_id unique 제약 위반
        return res.status(409).json({ message: "이미 이 상품 구매 건에 대한 리뷰를 작성했습니다 (중복)." });
    }
    res.status(400).json({ message: err.message || "리뷰 생성 중 오류가 발생했습니다." });
  }
});


// --- 리뷰 수정 ---
// PATCH /api/reviews/:review_id
// body: { rating?: number, comment?: string, images_to_add?: [string], images_to_delete?: [UUID] }
router.patch("/:review_id", authenticate, async (req, res) => {
    const { review_id } = req.params;
    const user_id = req.user.id;
    const { rating, comment, images_to_add, images_to_delete } = req.body;

    if (rating !== undefined && (typeof rating !== 'number' || rating < 1 || rating > 5)) {
        return res.status(400).json({ message: "평점(rating)은 1에서 5 사이의 숫자여야 합니다."});
    }

    const t = await sequelize.transaction();
    try {
        const review = await Review.findOne({
            where: { id: review_id, user_id: user_id }, // 본인 리뷰만 수정 가능
            transaction: t
        });

        if (!review) {
            await t.rollback();
            return res.status(404).json({ message: "수정할 리뷰를 찾을 수 없거나 권한이 없습니다." });
        }

        const updateData = {};
        if (rating !== undefined) updateData.rating = rating;
        if (comment !== undefined) updateData.comment = comment; // 빈 문자열로 내용 삭제 허용

        if (Object.keys(updateData).length > 0) {
            await review.update(updateData, { transaction: t });
        }

        // 이미지 삭제
        if (images_to_delete && Array.isArray(images_to_delete) && images_to_delete.length > 0) {
            await ReviewImage.destroy({
                where: { id: { [Op.in]: images_to_delete }, review_id: review.id },
                transaction: t
            });
        }

        // 이미지 추가
        if (images_to_add && Array.isArray(images_to_add) && images_to_add.length > 0) {
            // 기존 이미지 개수 + 추가할 이미지 개수가 최대 개수 초과하는지 등 검사 가능
            const existingImagesCount = await ReviewImage.count({ where: {review_id: review.id}, transaction: t});
            const newImageCreations = images_to_add.map((url, index) => ({
                review_id: review.id,
                image_url: url,
                order: existingImagesCount + index + 1, // 기존 이미지 순서 뒤에 추가
            }));
            await ReviewImage.bulkCreate(newImageCreations, { transaction: t });
        }

        await t.commit();
        const updatedReview = await Review.findByPk(review.id, {
            include: [
                { model: User, as: 'user', attributes: ['id', 'username', 'name'] },
                { model: ReviewImage, as: 'images', attributes: ['id', 'image_url', 'order'], order: [['order', 'ASC']]}
            ]
        });
        res.json(updatedReview);

    } catch (err) {
        await t.rollback();
        console.error(`리뷰(ID: ${review_id}) 수정 실패:`, err);
        res.status(500).json({ message: "리뷰 수정 중 오류가 발생했습니다." });
    }
});


// --- 리뷰 삭제 ---
// DELETE /api/reviews/:review_id
router.delete("/:review_id", authenticate, async (req, res) => {
    const { review_id } = req.params;
    const user_id = req.user.id;

    const t = await sequelize.transaction();
    try {
        const review = await Review.findOne({
            where: { id: review_id },
            include: [{ model: UserRole, as: 'user_roles_for_delete_check', through: {attributes:[]}, required:false, where: {user_id: user_id} }], // 복잡하지만, user.roles를 가져오는 방법
            transaction: t
        });


        if (!review) {
            await t.rollback();
            return res.status(404).json({ message: "삭제할 리뷰를 찾을 수 없습니다." });
        }

        // 권한 확인: 본인 리뷰 또는 관리자
        const userRoles = await UserRole.findAll({ where: { user_id: user_id }, attributes: ['role'], transaction: t });
        const isAdmin = userRoles.some(ur => ur.role === RoleType.ADMIN);

        if (review.user_id !== user_id && !isAdmin) {
            await t.rollback();
            return res.status(403).json({ message: "이 리뷰를 삭제할 권한이 없습니다." });
        }

        // 1. 연결된 ReviewImage 삭제
        await ReviewImage.destroy({
            where: { review_id: review.id },
            transaction: t
        });

        // 2. Review 삭제
        await review.destroy({ transaction: t });

        // 3. (선택적) Product의 평균 평점, 리뷰 수 등 업데이트
        // await Product.updateAverageRating(review.product_id, t);

        await t.commit();
        res.status(200).json({ message: `리뷰(ID: ${review_id})가 성공적으로 삭제되었습니다.`});

    } catch (err) {
        await t.rollback();
        console.error(`리뷰(ID: ${review_id}) 삭제 실패:`, err);
        res.status(500).json({ message: "리뷰 삭제 중 오류가 발생했습니다." });
    }
});


module.exports = router;