// routes/productRoutes.js
const express = require("express");
const { Op, Sequelize, literal, fn, col } = require('sequelize'); // literal, fn, col 추가
const sequelize = require("../config/database.js");
const {
    Product, Category, Attribute, ProductAttributeValue, ProductVariant, ProductImage, Tag,
    Promotion, PromotionProduct, SellerShippingMethod, ShippingMethod, ProductVariantShippingMethod,
    ProductOption,
    User,
    UserRole,
    CategoryAttribute,
    PromotionCondition,
    Review
} = require("../models"); // 필요한 모델 임포트
const { ProductImageType, PromotionType, RoleType, AttributeDataType } = require('../enums');
const authenticate = require('../middleware/auth.js');
const ProductVariantOptionValue = require("../models/ProductVariantOptionValue.js");
const ProductOptionValue = require("../models/ProductOptionValue.js");

const router = express.Router();

// routes/productRoutes.js 상단 또는 별도 미들웨어 파일에 정의

// 판매자 역할 확인 미들웨어
async function requireSellerRole(req, res, next) {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: "인증되지 않은 사용자입니다." });
  }
  try {
    const userRoles = await UserRole.findAll({ where: { user_id: req.user.id } });
    const isSeller = userRoles.some(userRole => userRole.role === RoleType.SELLER);

    if (!isSeller) {
      return res.status(403).json({ message: "판매자 권한이 필요합니다." });
    }
    req.sellerId = req.user.id; // 요청 객체에 판매자 ID 추가
    next();
  } catch (error) {
    console.error("판매자 권한 확인 중 오류:", error);
    return res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
}

// 관리자 또는 상품 소유 판매자 확인 미들웨어
async function requireAdminOrOwningSeller(req, res, next) {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: "인증되지 않은 사용자입니다." });
  }
  const { product_id } = req.params;
  if (!product_id) {
      return res.status(400).json({ message: "상품 ID가 경로에 필요합니다."});
  }

  try {
    const userRoles = await UserRole.findAll({ where: { user_id: req.user.id } });
    const isAdmin = userRoles.some(userRole => userRole.role === RoleType.ADMIN);

    if (isAdmin) {
      return next(); // 관리자는 모든 작업 가능
    }

    // 관리자가 아니면 상품 소유자인지 확인
    const product = await Product.findByPk(product_id, { attributes: ['seller_id'] });
    if (!product) {
      return res.status(404).json({ message: "상품을 찾을 수 없습니다." });
    }

    const isSeller = userRoles.some(userRole => userRole.role === RoleType.SELLER);
    if (isSeller && product.seller_id === req.user.id) {
      req.sellerId = req.user.id; // 요청 객체에 판매자 ID 추가
      return next(); // 상품 소유 판매자
    }

    return res.status(403).json({ message: "이 상품에 대한 수정/삭제 권한이 없습니다." });
  } catch (error) {
    console.error("상품 권한 확인 중 오류:", error);
    return res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
}

// 특정 카테고리 및 그 모든 하위 카테고리 ID 리스트 반환
async function getAllSubcategoryIds(categoryId, transaction) {
    const result = [categoryId]; // 현재 카테고리 ID도 포함
    const queue = [categoryId];
    const visited = new Set([categoryId]);

    while (queue.length > 0) {
        const currentId = queue.shift();
        const children = await Category.findAll({
            where: { parent_id: currentId },
            attributes: ['id'],
            transaction
        });
        for (const child of children) {
            if (!visited.has(child.id)) {
                result.push(child.id);
                queue.push(child.id);
                visited.add(child.id);
            }
        }
    }
    return result;
}

// 전체 상품 목록 조회 (필터링, 정렬, 페이지네이션)
// GET /api/products
router.get("/", async (req, res) => {
  try {
    const {
      search,
      category_id,    // number
      seller_id,      // number
      price_min,      // number
      price_max,      // number
      discount_only,  // 'true'
      // group_only,  // is_group_purchase 필드가 Product 모델에 있다고 가정, 현재는 주석 처리
      tags,           // comma-separated string of tag names
      sort_by = 'latest', // 'popularity', 'price_asc', 'price_desc', 'latest', 'name_asc', 'name_desc'
      page = 1,
      limit = 20,
      ...attributeFilters // attr_색상=빨강,노랑&attr_사이즈=M
    } = req.query;

    const whereProduct = {}; // Product 모델에 대한 where 조건
    const includeOptions = [];
    const productVariantWhere = {}; // ProductVariant 모델에 대한 where 조건 (가격 필터용)

    // 검색어 (상품명, 상품 설명)
    if (search) {
      const tokens = search.trim().split(/\s+/).map(token => `+${token}*`).join(' ');
      // Product 모델의 name, description에 대한 Full-text search
      // MySQL Full-text index가 product.name, product.description에 필요
      whereProduct[Op.and] = literal(
        `MATCH(\`Product\`.\`name\`, \`Product\`.\`description\`) AGAINST(${sequelize.escape(tokens)} IN BOOLEAN MODE)`
      );
    }

    // 카테고리 필터 (해당 카테고리 및 모든 하위 카테고리 포함)
    if (category_id) {
      const categoryIds = await getAllSubcategoryIds(category_id);
      whereProduct.category_id = { [Op.in]: categoryIds };
    }

    // 판매자 필터
    if (seller_id) {
        whereProduct.seller_id = seller_id;
    }

    // 가격 필터 (ProductVariant.price 기준)
    if (price_min || price_max) {
        productVariantWhere.price = {};
        if (price_min) productVariantWhere.price[Op.gte] = parseFloat(price_min);
        if (price_max) productVariantWhere.price[Op.lte] = parseFloat(price_max);
    }

    // 할인 상품 필터 (Promotion과 연동)
    if (discount_only === 'true') {
      // 현재 활성 프로모션(상품 할인, 카트 할인 제외)이 적용된 상품
      // Product가 PromotionProduct를 통해 Promotion에 연결되어 있어야 함
      includeOptions.push({
        model: PromotionProduct,
        as: 'applicable_promotions_info', // Product 모델의 관계 설정 (as)
        required: true, // 프로모션이 있는 상품만
        include: [{
            model: Promotion,
            as: 'promotion', // PromotionProduct 모델의 관계 설정 (as)
            where: {
                is_active: true,
                promotion_type: PromotionType.PRODUCT_DISCOUNT,
                start_date: { [Op.lte]: new Date() },
                [Op.or]: [
                    { end_date: { [Op.eq]: null } },
                    { end_date: { [Op.gte]: new Date() } }
                ]
            },
            required: true
        }]
      });
    }

    // 공동구매 상품 필터 (Product 모델에 is_group_purchase: DataTypes.BOOLEAN 필드가 있다고 가정)
    // if (group_only === 'true' && Product.rawAttributes.is_group_purchase) {
    //   whereProduct.is_group_purchase = true;
    // }

    // 태그 필터 (Product와 Tag는 다대다 관계, ProductTag 중간 테이블 사용)
    if (tags) {
        const tagNames = tags.split(',').map(t => t.trim()).filter(t => t);
        if (tagNames.length > 0) {
            includeOptions.push({
                model: Tag,
                as: 'tags', // Product 모델의 관계 설정 (as)
                where: { name: { [Op.in]: tagNames } },
                through: { attributes: [] }, // ProductTag 중간 테이블의 속성은 가져오지 않음
                required: true // 해당 태그가 있는 상품만
            });
        }
    }

    // 속성 필터 (ProductAttributeValue 사용)
    const attributeIncludeCriteria = [];
    for (const [key, value] of Object.entries(attributeFilters)) {
      if (key.startsWith('attr_')) {
        const attributeName = key.slice(5);
        const attributeValues = String(value).split(',').map(v => v.trim()).filter(v => v);
        if (attributeName && attributeValues.length > 0) {
          attributeIncludeCriteria.push({
            model: ProductAttributeValue,
            as: 'attribute_values', // Product 모델의 관계 설정 (as)
            required: true, // 해당 속성값이 있는 상품만
            where: { value: { [Op.in]: attributeValues } },
            include: [{
              model: Attribute,
              as: 'attribute', // ProductAttributeValue 모델의 관계 설정 (as)
              where: { name: attributeName },
              required: true
            }]
          });
        }
      }
    }
    if (attributeIncludeCriteria.length > 0) {
        // 여러 속성 필터는 AND 조건으로 동작하도록 includeOptions에 직접 추가
        // 만약 OR 조건이 필요하면 Op.or을 사용한 복잡한 where 절 구성 필요
        includeOptions.push(...attributeIncludeCriteria);
    }


    // 기본 include: 대표 이미지, 최소 가격 Variant (정렬 전 기본값)
    includeOptions.push(
      {
        model: ProductImage,
        as: 'images', // Product 모델의 관계 설정 (as)
        where: { image_type: 'THUMBNAIL' },
        required: false, // 이미지가 없어도 상품은 나옴
        attributes: ['image_url'],
        limit: 1 // 대표 이미지 하나
      },
      {
        model: ProductVariant,
        as: 'variants', // Product 모델의 관계 설정 (as)
        attributes: ['id', 'price', 'stock_quantity', 'sku'],
        where: Object.keys(productVariantWhere).length > 0 ? productVariantWhere : undefined, // 가격 필터 적용
        required: Object.keys(productVariantWhere).length > 0 ? true : false, // 가격 필터가 있으면 Variant는 필수
      }
    );

    // 정렬 조건
    let orderOption = [[sequelize.col('Product.created_at'), 'DESC']]; // 기본 최신순 (테이블명 명시)
    // ProductVariant.price 기준 정렬을 위해 subquery 또는 join 후 정렬 필요
    // 여기서는 Product.base_price 또는 ProductVariant 중 대표 가격 기준으로 정렬 (단순화)
    // 더 정확한 variant 가격 기준 정렬은 복잡한 쿼리 필요
    switch (sort_by) {
      case 'popularity':
        orderOption = [[sequelize.col('Product.sold_count'), 'DESC']]; // sold_count는 Product 모델에 있음
        break;
      case 'price_asc':
        // ProductVariant 중 가장 낮은 가격을 기준으로 정렬하려면 더 복잡한 쿼리 필요
        // 여기서는 Product.base_price 기준으로 정렬 (또는 ProductVariant 테이블 join 후 Variant.price)
        orderOption = [[sequelize.col('Product.base_price'), 'ASC']]; // base_price는 Product 모델에 있음
        break;
      case 'price_desc':
        orderOption = [[sequelize.col('Product.base_price'), 'DESC']];
        break;
      case 'name_asc':
        orderOption = [[sequelize.col('Product.name'), 'ASC']];
        break;
      case 'name_desc':
        orderOption = [[sequelize.col('Product.name'), 'DESC']];
        break;
      case 'latest':
      default:
        orderOption = [[sequelize.col('Product.created_at'), 'DESC']];
        break;
    }

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const limitInt = parseInt(limit, 10);

    // findAndCountAll 사용
    const { count, rows: products } = await Product.findAndCountAll({
      where: whereProduct,
      include: includeOptions,
      order: orderOption,
      limit: limitInt,
      offset: offset,
      distinct: true, // count를 정확하게 하기 위해 (특히 M:N 관계 include 시)
      // subQuery: false, // limit/offset이 include된 테이블에 잘못 적용되는 것을 방지 (상황에 따라 true/false 조정)
    });

    // 각 상품에 대표 가격 및 총 재고 추가 (variants 정보를 바탕으로)
    const formattedProducts = products.map(p => {
        const plainProduct = p.get({ plain: true });
        plainProduct.base_price = Math.floor(plainProduct.base_price);
        let representativePrice = plainProduct.base_price;
        let totalStock = 0;
        let hasActiveVariants = false;

        if (plainProduct.variants && plainProduct.variants.length > 0) {
            const activeVariants = plainProduct.variants.filter(v => v.stock_quantity > 0);
            if (activeVariants.length > 0) {
                hasActiveVariants = true;
                // 활성 variant 중 최저가
                representativePrice = Math.min(...activeVariants.map(v => parseFloat(v.price)));
                totalStock = activeVariants.reduce((sum, v) => sum + v.stock_quantity, 0);
            } else { // 모든 variant 재고 0
                representativePrice = Math.min(...plainProduct.variants.map(v => parseFloat(v.price))); // 재고 없어도 가격은 표시
                totalStock = 0;
            }
        } else {
            // Variant 없는 상품 (base_price 사용, 재고는 Product 모델에 없으므로 0 또는 별도 관리 필요)
            // Product 모델에 stock 필드가 없으므로, 이 경우는 재고 표현이 어려움.
            // 여기서는 variant가 없는 경우, base_price를 대표가격으로, 재고는 0으로 가정.
            totalStock = 0; // 또는 Product.stock 필드가 있다면 plainProduct.stock
        }
        // 이미지는 이미 include 시 THUMBNAIL 하나만 가져오도록 처리
        const thumbnailUrl = plainProduct.images && plainProduct.images.length > 0 ? plainProduct.images[0].image_url : null;

        return {
            ...plainProduct,
            variants: undefined, // 응답에서 variants 상세 정보는 제거 (필요시 유지)
            images: undefined,   // 응답에서 images 상세 정보는 제거 (대표이미지만 사용)
            representative_price: representativePrice,
            total_stock: totalStock,
            thumbnail_url: thumbnailUrl,
            is_sold_out: !hasActiveVariants && (!plainProduct.variants || plainProduct.variants.length > 0) // variant 있는데 다 품절이거나, variant 자체가 없는 경우(단, Product.stock이 없다면 이 조건 부정확)
        };
    });


    res.json({
      total_items: count,
      total_pages: Math.ceil(count / limitInt),
      current_page: parseInt(page, 10),
      limit: limitInt,
      items: formattedProducts,
    });

  } catch (err) {
    console.error("상품 목록 조회 실패:", err);
    res.status(500).json({ message: "상품 목록 조회 중 오류가 발생했습니다." });
  }
});

// 특정 상품 상세 조회
// GET /api/products/:product_id
router.get("/:product_id", async (req, res) => {
  const { product_id } = req.params;
  try {
    const product = await Product.findByPk(product_id, {
      include: [
        { model: Category, as: 'category' }, // Product는 하나의 Category에 속함 (as: 'category')
        {
          model: ProductVariant,
          as: 'variants', // Product hasMany ProductVariant (as: 'variants')
          include: [
            {
              model: ProductVariantOptionValue,
              as: 'option_values', // ProductVariant hasMany ProductVariantOptionValue (as: 'option_values')
              include: [
                {
                  model: ProductOptionValue,
                  as: 'value_detail', // PVOV belongsTo ProductOptionValue (as: 'product_option_value')
                  include: [
                    { model: ProductOption, as: 'option' } // POV belongsTo ProductOption (as: 'product_option')
                  ]
                }
              ]
            },
            { model: ProductVariantShippingMethod, as: 'shipping_methods_config'} // 필요시 variant별 배송방법 정보
          ],
          order: [['price', 'ASC']] // 옵션(variant) 가격 오름차순 정렬 (예시)
        },
        {
          model: ProductImage,
          as: 'images', // Product hasMany ProductImage (as: 'images')
          attributes: ['id', 'image_url', 'alt_text', 'image_type', 'order'],
          order: [['order', 'ASC'], ['id', 'ASC']]
        },
        {
          model: ProductAttributeValue,
          as: 'attribute_values', // Product hasMany ProductAttributeValue (as: 'attribute_values')
          include: [
            { model: Attribute, as: 'attribute' } // PAV belongsTo Attribute (as: 'attribute')
          ]
        },
        {
          model: Tag,
          as: 'tags', // Product belongsToMany Tag (as: 'tags')
          through: { attributes: [] }
        },
        {
          model: User, // 판매자 정보
          as: 'seller', // Product belongsTo User (as: 'seller')
          attributes: ['id', 'username', 'name'] // 필요한 판매자 정보만 선택
        },
        { // 상품 상세에서는 적용 가능한 모든 활성 프로모션 정보 포함
          model: Promotion,
          as: 'applied_promotions', // Product.belongsToMany(Promotion) 관계 별칭
          through: { attributes: [] }, // PromotionProduct 중간 테이블 정보는 제외
          where: {
            is_active: true,
            promotion_type: { [Op.notIn]: [PromotionType.CODE_COUPON, PromotionType.CART_DISCOUNT] }, // 상품에 직접 적용되는 프로모션 위주 (쿠폰, 장바구니 제외)
            start_date: { [Op.lte]: new Date() },
            [Op.or]: [
                { end_date: { [Op.eq]: null } },
                { end_date: { [Op.gte]: new Date() } }
            ]
          },
          include: [ {model: PromotionCondition, as: 'conditions'} ],
          required: false // 프로모션이 없어도 상품은 조회되어야 함
        },
        { model: Review, as: 'reviews', limit: 5, order: [['created_at', 'DESC']] }
      ]
    });

    if (!product) {
      return res.status(404).json({ message: "상품을 찾을 수 없습니다." });
    }

    // 조회수 증가 (비동기적 처리 가능)
    await product.increment('view_count');

    res.json(product);
  } catch (err) {
    console.error(`상품(ID: ${product_id}) 상세 조회 실패:`, err);
    res.status(500).json({ message: "상품 상세 정보 조회 중 오류가 발생했습니다." });
  }
});

// routes/productRoutes.js 의 기존 코드 하단에 추가

// --- 상품 관리 API (관리자 또는 판매자) ---

// 상품 생성 (판매자만 가능)
// POST /api/products
/* 요청 바디 예시:
{
  "name": "새로운 티셔츠",
  "description": "아주 편안한 면 티셔츠입니다.",
  "base_price": 25000,
  "category_id": "category_uuid_for_tops", // Category ID (UUID)
  "is_business_only": false,
  "tags": ["여름", "반팔", "면"], // 태그 이름 배열
  "images": [ // ProductImage 정보 배열
    { "image_url": "http://example.com/image1.jpg", "image_type": "THUMBNAIL", "order": 1, "alt_text": "티셔츠 앞면" },
    { "image_url": "http://example.com/image2.jpg", "image_type": "DETAIL", "order": 2, "alt_text": "티셔츠 뒷면" }
  ],
  "attributes": [ // ProductAttributeValue 정보 배열
    { "attribute_name": "색상", "value": "빨강" }, // 또는 attribute_id 사용
    { "attribute_name": "소재", "value": "면 100%" }
  ],
  "variants": [ // ProductVariant 정보 배열
    {
      "sku": "TSHIRT-RED-M",
      "price": 25000,
      "stock_quantity": 50,
      "is_active": true,
      "option_values": [ // 이 variant를 구성하는 ProductOptionValue들의 ID 또는 이름 조합
        // 방법 1: 옵션명 + 옵션값명 (시스템이 ProductOption, ProductOptionValue를 찾거나 생성)
        { "option_name": "색상", "value_name": "빨강" },
        { "option_name": "사이즈", "value_name": "M" }
        // 방법 2: ProductOptionValue의 ID 직접 사용 (클라이언트가 ID를 알고 있을 때)
        // { "product_option_value_id": "uuid_for_red_value" },
        // { "product_option_value_id": "uuid_for_m_value" }
      ]
    },
    {
      "sku": "TSHIRT-RED-L",
      "price": 25000,
      "stock_quantity": 30,
      "option_values": [
        { "option_name": "색상", "value_name": "빨강" },
        { "option_name": "사이즈", "value_name": "L" }
      ]
    }
  ]
}
*/
router.post("/", authenticate, requireSellerRole, async (req, res) => {
  const seller_id = req.sellerId; // requireSellerRole에서 설정
  const t = await sequelize.transaction();

  try {
    const {
      name, description, base_price, category_id, is_business_only = false,
      tags, images, attributes, variants // variants는 배열
    } = req.body;

    if (!name || base_price === undefined || !category_id) {
      await t.rollback();
      return res.status(400).json({ message: "필수 정보(상품명, 기본 가격, 카테고리 ID)가 누락되었습니다." });
    }
    const categoryForProduct = await Category.findByPk(category_id, { transaction: t });
    if (!categoryForProduct) {
        await t.rollback();
        return res.status(400).json({ message: "존재하지 않는 카테고리 ID 입니다." });
    }
    if (!Array.isArray(variants) || variants.length === 0) {
        await t.rollback();
        return res.status(400).json({ message: "하나 이상의 상품 옵션(variant) 정보가 필요합니다."});
    }

    // 1. Product 생성
    const product = await Product.create({
      name, description, base_price, category_id, seller_id, is_business_only,
      // view_count, sold_count 등은 기본값 또는 0으로 시작
    }, { transaction: t });

    // 2. ProductImage 생성 및 연결
    if (images && Array.isArray(images)) {
      const imageCreations = images.map(img => ({
        product_id: product.id,
        image_url: img.image_url,
        alt_text: img.alt_text,
        image_type: img.image_type || ProductImageType.DETAIL, // 기본값 DETAIL
        order: img.order
      }));
      await ProductImage.bulkCreate(imageCreations, { transaction: t });
    }

    // 3. Tag 생성 또는 찾기 및 ProductTag 연결
    if (tags && Array.isArray(tags)) {
      const tagInstances = [];
      for (const tagName of tags) {
        const [tagInstance, created] = await Tag.findOrCreate({
          where: { name: tagName.trim() },
          defaults: { name: tagName.trim() },
          transaction: t
        });
        tagInstances.push(tagInstance);
      }
      if (tagInstances.length > 0) {
        await product.addTags(tagInstances, { transaction: t }); // Sequelize의 M:N 관계 메소드
      }
    }

    // 4. ProductAttributeValue 생성 및 연결
    if (attributes && Array.isArray(attributes)) {
      const attributeValueCreations = [];
      for (const attr of attributes) {
        let attributeInstance;
        if (attr.attribute_id) { // ID로 찾는 경우
            attributeInstance = await Attribute.findByPk(attr.attribute_id, { transaction: t });
        } else if (attr.attribute_name) { // 이름으로 찾거나 생성하는 경우
            [attributeInstance] = await Attribute.findOrCreate({
                where: { name: attr.attribute_name },
                // data_type은 어떻게 결정할 것인가? 요청에서 받거나, 미리 정의된 Attribute만 사용
                defaults: { name: attr.attribute_name, data_type: attr.data_type || AttributeDataType.TEXT },
                transaction: t
            });
        }
        if (attributeInstance && attr.value !== undefined) {
          attributeValueCreations.push({
            product_id: product.id,
            attribute_id: attributeInstance.id,
            value: String(attr.value)
          });
          if (product.category_id && attributeInstance.id) {
            await CategoryAttribute.findOrCreate({
              where: {
                category_id: product.category_id,
                attribute_id: attributeInstance.id
              },
              defaults: {
                category_id: product.category_id,
                attribute_id: attributeInstance.id
              },
              transaction: t
            });
          }
        }
      }
      if (attributeValueCreations.length > 0) {
        await ProductAttributeValue.bulkCreate(attributeValueCreations, { transaction: t });
      }
    }

    // 5. ProductVariant, ProductOption, ProductOptionValue, ProductVariantOptionValue 생성 및 연결
    // 이 부분이 가장 복잡합니다.
    for (const variantData of variants) {
        if (!variantData.sku || variantData.price === undefined || variantData.stock_quantity === undefined) {
            throw new Error("각 Variant는 sku, price, stock_quantity를 포함해야 합니다.");
        }

        // 5a. ProductVariant 생성
        const newVariant = await ProductVariant.create({
            product_id: product.id,
            sku: variantData.sku,
            price: variantData.price,
            stock_quantity: variantData.stock_quantity,
            is_active: variantData.is_active !== undefined ? variantData.is_active : true,
        }, { transaction: t });

        // 5b. ProductOption, ProductOptionValue 찾거나 생성, ProductVariantOptionValue 연결
        if (variantData.option_values && Array.isArray(variantData.option_values)) {
            for (const optValData of variantData.option_values) {
                let productOptionInstance;
                let productOptionValueInstance;

                // ProductOption 찾거나 생성 (상품별 옵션이 아닌, 전체 옵션으로 가정)
                // 만약 상품별 고유 옵션이라면 ProductOption에 product_id 필드 추가 및 로직 변경 필요
                if (optValData.option_id) {
                    productOptionInstance = await ProductOption.findByPk(optValData.option_id, {transaction:t});
                } else if (optValData.option_name) {
                    [productOptionInstance] = await ProductOption.findOrCreate({
                        where: { name: optValData.option_name, /* product_id: product.id (상품별 옵션이라면) */ },
                        defaults: { name: optValData.option_name, /* product_id: product.id */ },
                        transaction: t
                    });
                }
                if (!productOptionInstance) throw new Error(`옵션 정보를 찾거나 생성할 수 없습니다: ${JSON.stringify(optValData)}`);

                // ProductOptionValue 찾거나 생성 (해당 ProductOption에 속하는 값)
                if (optValData.product_option_value_id) {
                    productOptionValueInstance = await ProductOptionValue.findByPk(optValData.product_option_value_id, {transaction:t});
                } else if (optValData.value_name) { // value_name으로 ProductOptionValue 찾거나 생성
                    [productOptionValueInstance] = await ProductOptionValue.findOrCreate({
                        where: { product_option_id: productOptionInstance.id, value: optValData.value_name },
                        defaults: { product_option_id: productOptionInstance.id, value: optValData.value_name },
                        transaction: t
                    });
                }
                if (!productOptionValueInstance) throw new Error(`옵션 값 정보를 찾거나 생성할 수 없습니다: ${JSON.stringify(optValData)} (Option ID: ${productOptionInstance.id})`);

                // ProductVariantOptionValue 연결 테이블 레코드 생성
                await ProductVariantOptionValue.create({
                    variant_id: newVariant.id,
                    product_option_id: productOptionInstance.id, // PVOV 스키마에 따라 필요
                    product_option_value_id: productOptionValueInstance.id
                }, { transaction: t });
            }
        }
    }

    await t.commit();
    const resultProduct = await Product.findByPk(product.id, { include: ['images', 'tags', 'attribute_values', 'variants']}); // 상세 정보 포함 반환
    res.status(201).json(resultProduct);

  } catch (err) {
    await t.rollback();
    console.error("상품 생성 실패:", err);
    if (err.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ message: "고유 제약 조건 위반입니다 (예: SKU 중복)." });
    }
    res.status(400).json({ message: err.message || "상품 생성 중 오류가 발생했습니다." });
  }
});


// 상품 수정 (관리자 또는 상품 소유 판매자)
// PATCH /api/products/:product_id
/* 요청 바디 예시 (수정할 필드만 포함)
{
  "name": "업데이트된 티셔츠",
  "base_price": 26000,
  "tags_to_add": ["신상"], // 추가할 태그 이름 배열
  "tags_to_remove": ["여름"], // 제거할 태그 이름 배열 (또는 ID 배열)
  "images_to_add": [{ "image_url": "new_image.jpg", "image_type": "DETAIL" }],
  "images_to_delete": ["image_id_to_delete_uuid"], // 삭제할 ProductImage ID 배열
  "attributes_to_update": [ // 기존 ProductAttributeValue ID로 값 업데이트 또는 새로 추가
    { "product_attribute_value_id": "uuid_pav", "value": "네이비" }, // 기존 값 업데이트
    { "attribute_name": "핏", "value": "오버핏" } // 새로운 속성값 추가
  ],
  "attributes_to_delete": ["uuid_pav_to_delete"], // 삭제할 ProductAttributeValue ID 배열
  "variants_to_update": [ // 기존 ProductVariant ID로 업데이트
    { "variant_id": "TSHIRT-RED-M-uuid", "price": 25500, "stock_quantity": 45 }
  ],
  "variants_to_add": [ // 새로운 Variant 추가 (생성 API와 유사한 구조)
    { "sku": "TSHIRT-BLUE-M", "price": 26000, "stock_quantity": 20, "option_values": [...] }
  ],
  "variants_to_delete": ["TSHIRT-RED-L-uuid"] // 삭제할 ProductVariant ID 배열 (소프트 삭제 권장)
}
*/
router.patch("/:product_id", authenticate, requireAdminOrOwningSeller, async (req, res) => {
  const { product_id } = req.params;
  const t = await sequelize.transaction();

  try {
    const product = await Product.findByPk(product_id, { transaction: t });
    if (!product) {
      await t.rollback();
      return res.status(404).json({ message: "상품을 찾을 수 없습니다." });
    }

    // 1. Product 기본 정보 업데이트
    const {
        name, description, base_price, category_id, is_business_only, // Product 필드
        tags_to_add, tags_to_remove,                                 // Tag 관리
        images_to_add, images_to_update, images_to_delete,           // Image 관리
        attributes_to_add, attributes_to_update, attributes_to_delete, // AttributeValue 관리
        variants_to_add, variants_to_update, variants_to_delete      // Variant 관리
    } = req.body;

    const productUpdateData = {};
    if (name !== undefined) productUpdateData.name = name;
    if (description !== undefined) productUpdateData.description = description;
    if (base_price !== undefined) productUpdateData.base_price = base_price;
    if (category_id !== undefined) {
        const newCategory = await Category.findByPk(category_id, {transaction:t});
        if(!newCategory){
            await t.rollback();
            return res.status(400).json({message: "새로 지정하려는 카테고리가 존재하지 않습니다."});
        }
        productUpdateData.category_id = category_id;
    }
    if (is_business_only !== undefined) productUpdateData.is_business_only = is_business_only;

    if (Object.keys(productUpdateData).length > 0) {
        await product.update(productUpdateData, { transaction: t });
        if(productUpdateData.category_id) product.category_id = productUpdateData.category_id;
    }

    // 2. Tag 업데이트
    if (tags_to_add && Array.isArray(tags_to_add)) {
        const tagInstances = [];
        for (const tagName of tags_to_add) {
            const [tagInstance] = await Tag.findOrCreate({ where: { name: tagName.trim() }, defaults: {name: tagName.trim()}, transaction: t});
            tagInstances.push(tagInstance);
        }
        if (tagInstances.length > 0) await product.addTags(tagInstances, { transaction: t });
    }
    if (tags_to_remove && Array.isArray(tags_to_remove)) { // 태그 이름 또는 ID로 제거 가능
        const tagsToRemove = await Tag.findAll({ where: { name: { [Op.in]: tags_to_remove } }, transaction: t}); // 이름으로 가정
        if (tagsToRemove.length > 0) await product.removeTags(tagsToRemove, { transaction: t });
    }

    // 3. Image 업데이트
    if (images_to_delete && Array.isArray(images_to_delete)) {
        await ProductImage.destroy({ where: { id: { [Op.in]: images_to_delete }, product_id: product.id }, transaction: t});
    }
    if (images_to_add && Array.isArray(images_to_add)) {
        const imageCreations = images_to_add.map(img => ({ ...img, product_id: product.id }));
        await ProductImage.bulkCreate(imageCreations, { transaction: t });
    }
    if (images_to_update && Array.isArray(images_to_update)) { // 예: 순서 변경, alt_text 변경
        for (const imgData of images_to_update) {
            if (imgData.id) {
                await ProductImage.update(
                    { order: imgData.order, alt_text: imgData.alt_text, image_url: imgData.image_url, image_type: imgData.image_type },
                    { where: { id: imgData.id, product_id: product.id }, transaction: t }
                );
            }
        }
    }


    // 4. AttributeValue 업데이트
    if(attributes_to_delete && Array.isArray(attributes_to_delete)) {
        await ProductAttributeValue.destroy({ where: { id: {[Op.in]: attributes_to_delete}, product_id: product.id }, transaction:t});
    }
    if(attributes_to_add && Array.isArray(attributes_to_add)) { // 생성과 동일한 로직
        const attributeValueCreations = [];
        for (const attr of attributes_to_add) {
            let attributeInstance;
            if (attr.attribute_id) { attributeInstance = await Attribute.findByPk(attr.attribute_id, { transaction: t });}
            else if (attr.attribute_name) { [attributeInstance] = await Attribute.findOrCreate({ where: { name: attr.attribute_name }, defaults: { name: attr.attribute_name, data_type: attr.data_type || AttributeDataType.TEXT }, transaction: t });}
            if (attributeInstance && attr.value !== undefined) {
              attributeValueCreations.push({ product_id: product.id, attribute_id: attributeInstance.id, value: String(attr.value) });
              if (product.category_id && attributeInstance.id) {
                await CategoryAttribute.findOrCreate({
                  where: { category_id: product.category_id, attribute_id: attributeInstance.id },
                  defaults: { category_id: product.category_id, attribute_id: attributeInstance.id },
                  transaction: t
                });
              }
            }
        }
        if (attributeValueCreations.length > 0) await ProductAttributeValue.bulkCreate(attributeValueCreations, { transaction: t });
    }
    if(attributes_to_update && Array.isArray(attributes_to_update)) {
        for(const attrVal of attributes_to_update) {
            if(attrVal.product_attribute_value_id && attrVal.value !== undefined){
                await ProductAttributeValue.update({value: String(attrVal.value)}, {where: {id: attrVal.product_attribute_value_id, product_id: product.id}, transaction:t});
            }
        }
    }


    // 5. Variant 업데이트, 추가, 삭제
    // 삭제 (Soft delete: is_active = false 또는 ProductVariant에 deleted_at 추가)
    if (variants_to_delete && Array.isArray(variants_to_delete)) {
        await ProductVariant.update({ is_active: false }, { where: { id: { [Op.in]: variants_to_delete }, product_id: product.id }, transaction: t });
        // 또는 await ProductVariant.destroy({ where: { id: {[Op.in]: variants_to_delete}, product_id: product.id }, transaction:t }); (하드 삭제)
    }
    // 추가 (상품 생성 시 Variant 추가 로직과 유사)
    if (variants_to_add && Array.isArray(variants_to_add)) {
        for (const variantData of variants_to_add) { /* ... 상품 생성 시 Variant 추가 로직 ... */
            const newVariant = await ProductVariant.create({ product_id: product.id, ...variantData /* sku, price, stock_quantity */ }, {transaction:t});
            if (variantData.option_values && Array.isArray(variantData.option_values)) {
                for (const optValData of variantData.option_values) { /* ... 옵션값 연결 로직 ... */
                    let pOpt, pOptVal;
                    if (optValData.option_id) pOpt = await ProductOption.findByPk(optValData.option_id, {transaction:t});
                    else if (optValData.option_name) [pOpt] = await ProductOption.findOrCreate({where:{name:optValData.option_name}, defaults:{name:optValData.option_name}, transaction:t});

                    if (optValData.product_option_value_id) pOptVal = await ProductOptionValue.findByPk(optValData.product_option_value_id, {transaction:t});
                    else if (optValData.value_name && pOpt) [pOptVal] = await ProductOptionValue.findOrCreate({where:{product_option_id:pOpt.id, value: optValData.value_name}, defaults:{product_option_id:pOpt.id, value:optValData.value_name}, transaction:t});

                    if(pOpt && pOptVal) await ProductVariantOptionValue.create({variant_id: newVariant.id, product_option_id: pOpt.id, product_option_value_id: pOptVal.id}, {transaction:t});
                }
            }
        }
    }
    // 업데이트
    if (variants_to_update && Array.isArray(variants_to_update)) {
        for (const variantData of variants_to_update) {
            if (variantData.variant_id) {
                const variantUpdateData = {};
                if (variantData.sku !== undefined) variantUpdateData.sku = variantData.sku;
                if (variantData.price !== undefined) variantUpdateData.price = variantData.price;
                if (variantData.stock_quantity !== undefined) variantUpdateData.stock_quantity = variantData.stock_quantity;
                if (variantData.is_active !== undefined) variantUpdateData.is_active = variantData.is_active;
                // 옵션 조합 변경은 더 복잡: 기존 PVOV 삭제 후 새로 추가해야 할 수 있음. 여기서는 단순 필드 업데이트만.
                if (Object.keys(variantUpdateData).length > 0) {
                    await ProductVariant.update(variantUpdateData, { where: { id: variantData.variant_id, product_id: product.id }, transaction: t });
                }
            }
        }
    }


    await t.commit();
    const resultProduct = await Product.findByPk(product_id, { include: ['images', 'tags', 'attribute_values', 'variants']});
    res.json(resultProduct);

  } catch (err) {
    await t.rollback();
    console.error(`상품(ID: ${product_id}) 수정 실패:`, err);
    if (err.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ message: "고유 제약 조건 위반입니다 (예: SKU 또는 상품명 중복)." });
    }
    res.status(400).json({ message: err.message || "상품 수정 중 오류가 발생했습니다." });
  }
});


// 상품 삭제 (관리자 또는 상품 소유 판매자) - Soft Delete
// DELETE /api/products/:product_id
router.delete("/:product_id", authenticate, requireAdminOrOwningSeller, async (req, res) => {
  const { product_id } = req.params;
  const t = await sequelize.transaction();
  try {
    const product = await Product.findByPk(product_id, { transaction: t });
    if (!product) {
      await t.rollback();
      return res.status(404).json({ message: "상품을 찾을 수 없습니다." });
    }

    // 1. Product 소프트 삭제 (deleted_at 필드 업데이트)
    // Product 모델에 paranoid: true 옵션이 있다면 .destroy()가 자동으로 soft delete 처리
    // 수동으로 deleted_at을 관리한다면: await product.update({ deleted_at: new Date() }, { transaction: t });
    await product.destroy({ transaction: t }); // Sequelize paranoid 모드 사용 시

    // 2. 연결된 ProductVariant들도 비활성화 또는 소프트 삭제 (정책에 따라)
    await ProductVariant.update(
        { is_active: false /* 또는 deleted_at: new Date() - ProductVariant도 paranoid 모델이라면 */ },
        { where: { product_id: product.id }, transaction: t }
    );

    // 다른 연결된 엔티티(ProductImage, ProductAttributeValue, ProductTag 등)는
    // 상품이 soft delete 되어도 보통 유지합니다. 필요시 함께 삭제/비활성화.

    await t.commit();
    res.status(200).json({ message: `상품(ID: ${product_id})이 (소프트) 삭제되었습니다.` });

  } catch (err) {
    await t.rollback();
    console.error(`상품(ID: ${product_id}) 삭제 실패:`, err);
    res.status(500).json({ message: "상품 삭제 중 오류가 발생했습니다." });
  }
});

module.exports = router;