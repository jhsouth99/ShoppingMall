// routes/cartRoutes.js
const express = require("express");
const { Op } = require("sequelize");
const authenticate = require("../middleware/auth");
// CartItem 모델은 이미 User, ProductVariant와 관계가 설정되어 있음
const { CartItem, Product, ProductVariant, ProductOption, ProductOptionValue, User } = require("../models");
const sequelize = require('../config/database'); // 필요시 직접 사용
const ProductVariantOptionValue = require("../models/ProductVariantOptionValue");

const router = express.Router();

// 유틸: CartItem 인스턴스를 응답용 객체로 변환 (복합 PK 기준)
async function formatCartItemForResponse(cartItemInstance) {
  // cartItemInstance는 이미 ProductVariant를 eager loading 했다고 가정
  // 만약 아니라면, 여기서 다시 조회 필요
  if (!cartItemInstance || !cartItemInstance.product_variant) {
    const itemWithDetails = await CartItem.findOne({
        where: {
            user_id: cartItemInstance.user_id,
            product_variant_id: cartItemInstance.product_variant_id
        },
        include: [
            {
                model: ProductVariant,
                as: 'product_variant',
                include: [
                    {
                        model: Product,
                        as: 'product', // ProductVariant 모델에 Product (as: 'product') 관계 필요
                        include: [{
                            model: require('../models').ProductImage, // ProductImage 모델 직접 참조
                            as: 'images',
                            where: { image_type: require('../enums').ProductImageType.THUMBNAIL },
                            required: false,
                            limit: 1
                        }]
                    },
                    {
                        model: ProductVariantOptionValue,
                        as: 'option_values',
                        include: [{
                            model: ProductOptionValue,
                            as: 'product_option_value',
                            include: [{
                                model: ProductOption,
                                as: 'product_option'
                            }]
                        }]
                    }
                ]
            }
        ]
    });
    if (!itemWithDetails || !itemWithDetails.product_variant) return null;
    cartItemInstance = itemWithDetails;
  }


  const variant = cartItemInstance.product_variant;
  const product = variant.product;

  const selectedOptions = variant.option_values ? variant.option_values.map(ov => ({
    option_name: ov.product_option_value?.product_option?.name,
    value: ov.product_option_value?.value,
  })) : [];

  const unitPrice = parseFloat(variant.price);
  const discountAmount = 0; // 실제 할인 로직 필요
  const discountedUnitPrice = unitPrice - discountAmount;
  const subtotal = discountedUnitPrice * cartItemInstance.quantity;
  const shippingFeePerItem = 0; // 아이템별 배송비는 0으로 가정

  return {
    // cart_item_id 대신 복합키 정보 또는 variant_id를 주요 식별자로 사용 가능
    user_id: cartItemInstance.user_id, // 응답에 포함할 필요는 없을 수 있음
    product_id: product.id,
    product_name: product.name,
    variant_id: variant.id, // 클라이언트에서 아이템 식별 시 variant_id 사용 가능
    variant_sku: variant.sku,
    selected_options: selectedOptions,
    image_url: product.images && product.images.length > 0 ? product.images[0].image_url : null,
    quantity: cartItemInstance.quantity,
    unit_price: unitPrice,
    discounted_unit_price: discountedUnitPrice,
    subtotal: subtotal,
    added_at: cartItemInstance.added_at,
  };
}

// 내 장바구니 목록 조회
// GET /api/cart
router.get("/", authenticate, async (req, res) => {
  try {
    const cartItems = await CartItem.findAll({
      where: { user_id: req.user.id },
      include: [
        {
          model: ProductVariant,
          as: "product_variant",
          include: [
            {
              model: Product,
              as: "product",
              include: [{
                model: require('../models').ProductImage,
                as: 'images',
                where: { image_type: require('../enums').ProductImageType.THUMBNAIL },
                required: false,
                limit: 1
              }]
            },
            {
                model: ProductVariantOptionValue,
                as: 'option_values',
                include: [{
                    model: ProductOptionValue,
                    as: 'product_option_value',
                    include: [{
                        model: ProductOption,
                        as: 'product_option'
                    }]
                }]
            }
          ],
        },
      ],
      order: [["added_at", "DESC"]],
    });

    const formattedItems = await Promise.all(cartItems.map(item => formatCartItemForResponse(item)));
    const totalAmount = formattedItems.reduce((sum, item) => sum + (item ? item.subtotal : 0), 0);
    const totalShippingFee = formattedItems.length > 0 ? 3000 : 0; // 예시

    res.json({
        items: formattedItems.filter(item => item !== null),
        total_item_count: formattedItems.filter(item => item !== null).length,
        total_amount: totalAmount,
        // total_shipping_fee: totalShippingFee,
        // grand_total: totalAmount + totalShippingFee
    });
  } catch (err) {
    console.error("장바구니 조회 실패:", err);
    res.status(500).json({ message: "장바구니 조회에 실패했습니다." });
  }
});

// 장바구니에 상품 추가 또는 수량 업데이트
// POST /api/cart
// body: { product_variant_id: UUID, quantity: number }
router.post("/", authenticate, async (req, res) => {
  const user_id = req.user.id;
  const { product_variant_id, quantity } = req.body;

  if (!product_variant_id || !quantity || quantity < 1) {
    return res.status(400).json({ message: "상품 variant ID (product_variant_id)와 수량 (quantity >= 1)은 필수입니다." });
  }

  try {
    const productVariant = await ProductVariant.findByPk(product_variant_id, {
        include: [{model: Product, as: 'product'}]
    });
    if (!productVariant) {
      return res.status(404).json({ message: "존재하지 않는 상품 옵션(variant)입니다." });
    }

    let existingCartItem = await CartItem.findOne({
      where: { user_id: user_id, product_variant_id: product_variant_id },
    });

    const currentStock = productVariant.stock_quantity;

    let cartItemToFormat;
    let statusCode = 201;

    if (existingCartItem) {
      const newQuantity = existingCartItem.quantity + quantity;
      if (newQuantity > currentStock) {
        return res.status(400).json({ message: `현재 ${existingCartItem.quantity}개 담겨있습니다. 재고 수량(${currentStock}개)을 초과하여 추가할 수 없습니다.` });
      }
      existingCartItem.quantity = newQuantity;
      await existingCartItem.save();
      cartItemToFormat = existingCartItem;
      statusCode = 200;
    } else {
      if (quantity > currentStock) {
        return res.status(400).json({ message: `재고 수량(${currentStock}개)을 초과하여 담을 수 없습니다.` });
      }
      const newCartItem = await CartItem.create({
        user_id: user_id,
        product_variant_id: product_variant_id,
        quantity: quantity,
      });
      cartItemToFormat = newCartItem;
    }

    // 포맷팅을 위해 관계 다시 로드
    const finalCartItem = await CartItem.findOne({
        where: {user_id: cartItemToFormat.user_id, product_variant_id: cartItemToFormat.product_variant_id },
        include: [ /* formatCartItemForResponse에 필요한 include 내용과 동일하게 */
            {
                model: ProductVariant,
                as: 'product_variant',
                include: [
                    { model: Product, as: 'product', include: [{model: require('../models').ProductImage, as: 'images', where: { image_type: require('../enums').ProductImageType.THUMBNAIL }, required: false, limit: 1}] },
                    { model: ProductVariantOptionValue, as: 'option_values', include: [{ model: ProductOptionValue, as: 'product_option_value', include: [{ model: ProductOption, as: 'product_option'}]}]}
                ]
            }
        ]
    });

    const formattedItem = await formatCartItemForResponse(finalCartItem);
    res.status(statusCode).json(formattedItem);

  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError' || (err.original && err.original.code === 'ER_DUP_ENTRY') ) {
        // 이 경우는 findOne으로 먼저 체크하므로 거의 발생 안함.
        return res.status(409).json({ message: "이미 장바구니에 동일한 상품 옵션이 존재합니다. 수량을 변경해주세요."});
    }
    console.error("장바구니 추가/수정 실패:", err);
    res.status(500).json({ message: "장바구니 처리 중 오류가 발생했습니다." });
  }
});

// 장바구니에서 특정 아이템 삭제 (복합키 사용)
// 장바구니에서 특정 아이템 삭제 (복합키 사용)
// DELETE /api/cart?product_variant_id=1,2,3
router.delete("/", authenticate, async (req, res) => {
  let { product_variant_id } = req.query;
  const user_id = req.user.id;

  if (!product_variant_id) {
    return res
      .status(400)
      .json({ message: "삭제할 상품 variant ID를 query에 포함해야 합니다." });
  }

  // product_variant_id가 "1,2,3" 형태로 오면 배열로 변환
  // 혹은 ?product_variant_id=1&product_variant_id=2 형태로도 처리
  const ids = Array.isArray(product_variant_id)
    ? product_variant_id.map((id) => Number(id))
    : String(product_variant_id)
        .split(",")
        .map((id) => Number(id.trim()));

  try {
    const deletedCount = await CartItem.destroy({
      where: {
        user_id,
        product_variant_id: { [Op.in]: ids },  // ← Op.in 사용
      },
    });

    if (deletedCount === 0) {
      return res
        .status(404)
        .json({ message: "삭제할 아이템을 찾지 못했거나 이미 삭제되었습니다." });
    }

    res.status(200).json({
      message: `장바구니 아이템(variant_id: [${ids.join(",")}])이 삭제되었습니다.`,
      deleted_count: deletedCount,
    });
  } catch (err) {
    console.error("장바구니 아이템 삭제 실패:", err);
    res
      .status(500)
      .json({ message: "장바구니 아이템 삭제 중 오류가 발생했습니다." });
  }
});

// 장바구니에서 특정 아이템 삭제 (복합키 사용)
// DELETE /api/cart/:product_variant_id (해당 사용자의 특정 variant_id 아이템 삭제)
router.delete("/:product_variant_id", authenticate, async (req, res) => {
  const user_id = req.user.id;
  const { product_variant_id } = req.params;

  if (!product_variant_id) {
    return res.status(400).json({ message: "삭제할 상품 variant ID (product_variant_id)를 경로에 포함해야 합니다." });
  }

  try {
    const deletedCount = await CartItem.destroy({
      where: {
        user_id: user_id,
        product_variant_id: product_variant_id,
      },
    });

    if (deletedCount === 0) {
      return res.status(404).json({ message: "삭제할 아이템을 찾지 못했거나 이미 삭제되었습니다." });
    }

    res.status(200).json({ message: `장바구니 아이템(variant_id: ${product_variant_id})이 삭제되었습니다.`, deleted_count: deletedCount });
  } catch (err) {
    console.error("장바구니 아이템 삭제 실패:", err);
    res.status(500).json({ message: "장바구니 아이템 삭제 중 오류가 발생했습니다." });
  }
});

// 장바구니 아이템 수량 변경 (복합키 사용)
// PATCH /api/cart/:product_variant_id
// body: { quantity: number }
router.patch("/:product_variant_id", authenticate, async (req, res) => {
  const user_id = req.user.id;
  const { product_variant_id } = req.params;
  const { quantity } = req.body;

  if (!quantity || quantity < 1) {
    return res.status(400).json({ message: "수량 (quantity)은 1 이상이어야 합니다. (0이하이면 삭제 API 사용)" });
  }

  try {
    const cartItem = await CartItem.findOne({
      where: {
        user_id: user_id,
        product_variant_id: product_variant_id,
      },
      include: [
        {
          model: ProductVariant,
          as: "product_variant",
          // ProductVariant에 Product 정보가 필요하다면 여기서도 include
          include: [{ model: Product, as: 'product', include: [{model: require('../models').ProductImage, as: 'images', where: { image_type: require('../enums').ProductImageType.THUMBNAIL }, required: false, limit: 1}]}]
        }
      ]
    });

    if (!cartItem) {
      return res.status(404).json({ message: "수정할 장바구니 아이템을 찾을 수 없습니다." });
    }

    const productVariant = cartItem.product_variant;
    if (!productVariant) {
        return res.status(500).json({ message: "상품 정보를 찾을 수 없습니다."});
    }

    if (quantity > productVariant.stock_quantity) {
      return res.status(400).json({ message: `재고 수량(${productVariant.stock_quantity}개)을 초과하여 변경할 수 없습니다.` });
    }

    cartItem.quantity = quantity;
    await cartItem.save();

    // 포맷팅을 위해 관계 다시 로드 (또는 cartItem에 이미 로드된 product_variant 사용)
    const finalCartItem = await CartItem.findOne({
        where: {user_id: cartItem.user_id, product_variant_id: cartItem.product_variant_id },
        include: [ /* formatCartItemForResponse에 필요한 include 내용과 동일하게 */
             {
                model: ProductVariant,
                as: 'product_variant',
                include: [
                    { model: Product, as: 'product', include: [{model: require('../models').ProductImage, as: 'images', where: { image_type: require('../enums').ProductImageType.THUMBNAIL }, required: false, limit: 1}] },
                    { model: ProductVariantOptionValue, as: 'option_values', include: [{ model: ProductOptionValue, as: 'product_option_value', include: [{ model: ProductOption, as: 'product_option'}]}]}
                ]
            }
        ]
    });

    const formattedItem = await formatCartItemForResponse(finalCartItem);
    res.status(200).json(formattedItem);

  } catch (err) {
    console.error("장바구니 아이템 수량 변경 실패:", err);
    res.status(500).json({ message: "장바구니 아이템 수량 변경 중 오류가 발생했습니다." });
  }
});

module.exports = router;