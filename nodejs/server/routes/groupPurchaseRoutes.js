// server/routes/GroupPurchaseRoutes.js
const express   = require('express');
const { Op }    = require('sequelize');
const authenticate = require('../middleware/auth');
const Admin     = require('../models/Admin');
const Seller    = require('../models/Seller');
const Product   = require('../models/Product');
const GroupPurchase      = require('../models/GroupPurchase');
const GroupPurchaseOrder = require('../models/GroupPurchaseOrder');
const ShippingAddress    = require('../models/ShippingAddress');

const router = express.Router();

// 관리자 전용 확인
async function requireAdmin(req, res, next) {
  const admin = await Admin.findOne({ where: { user_id: req.user.id } });
  if (!admin) return res.status(403).json({ message: '관리자 전용 기능입니다.' });
  next();
}

// 판매자 전용 확인
async function requireSeller(req, res, next) {
  const seller = await Seller.findOne({ where: { user_id: req.user.id } });
  if (!seller) return res.status(403).json({ message: '판매자 전용 기능입니다.' });
  req.seller = seller;
  next();
}

// ─────────────────────────────────────────
// 1) 판매자: 공동구매 생성
// POST /api/group-purchases
router.post('/', authenticate, requireSeller, async (req, res) => {
  const { product_id, target_qty, discounted_price, deadline } = req.body;
  try {
    // 상품 소유 확인
    const product = await Product.findByPk(product_id);
    if (!product || product.seller_id !== req.seller.id) {
      return res.status(403).json({ message: '내 상품만으로 공동구매를 생성할 수 있습니다.' });
    }
    // 생성
    const gp = await GroupPurchase.create({
      product_id, target_qty, discounted_price, deadline
    });
    res.status(201).json(gp);
  } catch (err) {
    console.error('공동구매 생성 실패', err);
    res.status(500).json({ message: '공동구매 생성 실패' });
  }
});

// 2) 판매자: 내 공동구매 목록 조회
// GET /api/group-purchases/seller
router.get('/seller', authenticate, requireSeller, async (req, res) => {
  try {
    const gps = await GroupPurchase.findAll({
      include: [{ model: Product, as: 'product' }],
      where: { '$product.seller_id$': req.seller.id },
      order: [['created_at','DESC']]
    });
    res.json(gps);
  } catch (err) {
    console.error('내 공동구매 조회 실패', err);
    res.status(500).json({ message: '내 공동구매 조회 실패' });
  }
});

// 3) 판매자: 공동구매 수정
// PATCH /api/group-purchases/:id
router.patch('/:id', authenticate, requireSeller, async (req, res) => {
  try {
    const gp = await GroupPurchase.findByPk(req.params.id, {
      include: { model: Product, as: 'product' }
    });
    if (!gp || gp.product.seller_id !== req.seller.id) {
      return res.status(404).json({ message: '조회할 수 없는 공동구매입니다.' });
    }
    await gp.update(req.body);
    res.json(gp);
  } catch (err) {
    console.error('공동구매 수정 실패', err);
    res.status(500).json({ message: '공동구매 수정 실패' });
  }
});

// 4) 판매자: 공동구매 삭제
// DELETE /api/group-purchases/:id
router.delete('/:id', authenticate, requireSeller, async (req, res) => {
  try {
    const gp = await GroupPurchase.findByPk(req.params.id, {
      include: { model: Product, as: 'product' }
    });
    if (!gp || gp.product.seller_id !== req.seller.id) {
      return res.status(404).json({ message: '삭제할 공동구매가 없습니다.' });
    }
    await gp.destroy();
    res.status(204).end();
  } catch (err) {
    console.error('공동구매 삭제 실패', err);
    res.status(500).json({ message: '공동구매 삭제 실패' });
  }
});

// ─────────────────────────────────────────
// 5) 관리자: 전체 공동구매 조회
// GET /api/group-purchases
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const gps = await GroupPurchase.findAll({
      include: [{ model: Product, as: 'product' }],
      order: [['created_at','DESC']]
    });
    res.json(gps);
  } catch (err) {
    console.error('전체 공동구매 조회 실패', err);
    res.status(500).json({ message: '전체 공동구매 조회 실패' });
  }
});

// 6) 관리자: 성공 여부 업데이트
// PATCH /api/group-purchases/:id/status
router.patch('/:id/status', authenticate, requireAdmin, async (req, res) => {
  try {
    const gp = await GroupPurchase.findByPk(req.params.id);
    if (!gp) return res.status(404).json({ message: '존재하지 않는 공동구매입니다.' });
    gp.is_success = req.body.is_success === true;
    await gp.save();
    res.json(gp);
  } catch (err) {
    console.error('공동구매 상태 수정 실패', err);
    res.status(500).json({ message: '공동구매 상태 수정 실패' });
  }
});

// ─────────────────────────────────────────
// 7) 구매자: 공동구매 상세 조회
// GET /api/group-purchases/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const gp = await GroupPurchase.findByPk(req.params.id, {
      include: [
        { model: Product, as: 'product' },
        { 
          model: GroupPurchaseOrder, 
          as: 'orders',
          include: [{ model: ShippingAddress, as: 'shippingAddress'}]
        }
      ]
    });
    if (!gp) return res.status(404).json({ message: '공동구매를 찾을 수 없습니다.' });
    res.json(gp);
  } catch (err) {
    console.error('공동구매 상세 조회 실패', err);
    res.status(500).json({ message: '공동구매 상세 조회 실패' });
  }
});

// 8) 구매자: 공동구매 참여
// POST /api/group-purchases/:id/orders
router.post('/:id/orders', authenticate, async (req, res) => {
  const userId = req.user.id;
  const gpId = parseInt(req.params.id, 10);
  const { quantity, shipping_address_id } = req.body;

  try {
    const gp = await GroupPurchase.findByPk(gpId);
    if (!gp) return res.status(404).json({ message: '공동구매가 없습니다.' });
    if (new Date(gp.deadline) < new Date()) {
      return res.status(400).json({ message: '마감된 공동구매입니다.' });
    }

    const addr = await ShippingAddress.findOne({
      where: { id: shipping_address_id, user_id }
    });
    if (!addr) {
      return res.status(400).json({ message: '유효한 배송주소를 선택하세요.' });
    }

    // 참여 주문 생성
    const order = await GroupPurchaseOrder.create({
      group_purchase_id: gpId,
      user_id: userId,
      quantity,
      recipient_name:        addr.recipient_name,
      recipient_phone:       addr.phone,
      recipient_address:     addr.address,
      recipient_address_detail: addr.address_detail,
      recipient_zipcode:     addr.zipcode
    });

    // 현재 수량 갱신
    gp.current_qty += quantity;
    // 목표 달성 시 자동 성공 처리
    if (gp.current_qty >= gp.target_qty) gp.is_success = true;
    await gp.save();

    res.status(201).json(order);
  } catch (err) {
    console.error('공동구매 참여 실패', err);
    res.status(500).json({ message: '공동구매 참여 실패' });
  }
});

// 9) 구매자: 내가 참여한 공동구매 주문 목록
// GET /api/group-purchases/orders
router.get('/orders', authenticate, async (req, res) => {
  try {
    const orders = await GroupPurchaseOrder.findAll({
      where: { user_id: req.user.id },
      include: [
        { model: GroupPurchase, as: 'groupPurchase', include: [{ model: Product, as: 'product' }] }
      ],
      order: [['ordered_at','DESC']]
    });
    res.json(orders);
  } catch (err) {
    console.error('내 공동구매 주문 조회 실패', err);
    res.status(500).json({ message: '내 공동구매 주문 조회 실패' });
  }
});

// 10) 구매자: 공동구매 참여 취소
// POST /api/group-purchases/orders/:orderId/cancel
router.post('/orders/:orderId/cancel', authenticate, async (req, res) => {
  try {
    const o = await GroupPurchaseOrder.findByPk(req.params.orderId);
    if (!o || o.user_id !== req.user.id) {
      return res.status(404).json({ message: '참여 주문을 찾을 수 없습니다.' });
    }
    if (o.status !== 'pending') {
      return res.status(400).json({ message: '취소 가능한 상태가 아닙니다.' });
    }
    o.status = 'cancelled';
    await o.save();

    // 수량 롤백
    const gp = await GroupPurchase.findByPk(o.group_purchase_id);
    gp.current_qty = Math.max(0, gp.current_qty - o.quantity);
    await gp.save();

    res.json(o);
  } catch (err) {
    console.error('참여 주문 취소 실패', err);
    res.status(500).json({ message: '참여 주문 취소 실패' });
  }
});

module.exports = router;
