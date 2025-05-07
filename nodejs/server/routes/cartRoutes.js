const express = require("express");
const { Op } = require("sequelize");
const authenticate = require("../middleware/auth");
const CartItem = require("../models/CartItem");
const Product = require("../models/Product");

const router = express.Router();

// 내 장바구니 목록 조회
// GET /api/cart
router.get("/", authenticate, async (req, res) => {
  try {
    const items = await CartItem.findAll({
      where: { user_id: req.user.id },
      include: [
        {
          model: Product,
          as: "product",
          attributes: ["id", "name", "price", "discount", "shipping_fee"],
        },
      ],
      order: [["added_at", "DESC"]],
    });
    res.json(items);
  } catch (err) {
    console.error("장바구니 조회 실패", err);
    res.status(500).json({ message: "장바구니 조회 실패" });
  }
});

// 장바구니에 상품 추가 또는 수량 업데이트
// POST /api/cart
// body: { product_id: number, quantity: number }
router.post("/", authenticate, async (req, res) => {
  const userId = req.user.id;
  const { product_id, quantity } = req.body;

  if (!product_id || !quantity || quantity <= 0) {
    return res
      .status(400)
      .json({ message: "product_id와 quantity(>0)를 입력하세요." });
  }

  try {
    // 이미 장바구니에 있으면 수량 합산
    let item = await CartItem.findOne({
      where: { user_id: userId, product_id },
    });

    if (item) {
      item.quantity += parseInt(quantity, 10);
      await item.save();
      return res.json(item);
    }

    // 없으면 새로 생성
    item = await CartItem.create({
      user_id: userId,
      product_id,
      quantity,
    });

    res.status(201).json(item);
  } catch (err) {
    console.error("장바구니 추가 실패", err);
    res.status(500).json({ message: "장바구니 추가 실패" });
  }
});

// 장바구니에서 특정 아이템 삭제
// DELETE /api/cart/:itemId
router.delete("/:itemId", authenticate, async (req, res) => {
  try {
    const itemIds = req.params.itemIds
      .split(",")
      .map((id) => parseInt(id, 10))
      .filter((id) => !isNaN(id));

    if (itemIds.length === 0) {
      return res
        .status(400)
        .json({ message: "삭제할 장바구니 아이템 ID를 입력하세요." });
    }

    const deletedCount = await CartItem.destroy({
      where: {
        id: { [Op.in]: itemIds },
        user_id: req.user.id,
      },
    });

    if (!deletedCount) {
      return res
        .status(404)
        .json({ message: "삭제된 장바구니 아이템이 없습니다." });
    }

    res.status(204).json({ deleted: deletedCount });
  } catch (err) {
    console.error("장바구니 삭제 실패", err);
    res.status(500).json({ message: "장바구니 삭제 실패" });
  }
});

module.exports = router;
