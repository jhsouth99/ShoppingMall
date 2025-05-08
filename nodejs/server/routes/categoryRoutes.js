const express = require("express");
const Category = require("../models/Category");
const authenticate = require("../middleware/auth.js");
const Product = require("../models/Product.js");

const router = express.Router();

function requireAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "관리자 전용입니다." });
  }
  next();
}

// 특정 카테고리의 조상 ID 리스트를 최상위까지 반환
async function getAncestors(catId) {
  const ancestors = [];
  let cur = catId;
  while (true) {
    const cat = await Category.findByPk(cur);
    if (!cat || !cat.parent_id) break;
    ancestors.push(cat.parent_id);
    cur = cat.parent_id;
  }
  return ancestors;
}

// 전체 카테고리 조회 (트리 구조로 반환)
router.get("/", async (req, res) => {
  try {
    // 모든 카테고리 정보를 가져옵니다.
    const categories = await Category.findAll({
      raw: true,
      order: [
        ["parent_id", "ASC"],
        ["name", "ASC"],
      ],
    });

    // id -> 노드 매핑
    const map = {};
    categories.forEach((cat) => {
      map[cat.id] = { ...cat, children: [] };
    });

    // 트리 구축
    const tree = [];
    categories.forEach((cat) => {
      if (cat.parent_id && map[cat.parent_id]) {
        map[cat.parent_id].children.push(map[cat.id]);
      } else if (!cat.parent_id) {
        tree.push(map[cat.id]);
      }
    });

    res.json(tree);
  } catch (err) {
    console.error("카테고리 조회 오류:", err);
    res.status(500).json({ message: "카테고리 조회 실패" });
  }
});

// 카테고리 추가 (관리자 전용)
router.post("/", authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, parent_id = null } = req.body;
    // name 필수
    if (!name)
      return res.status(400).json({ message: "카테고리 이름을 입력하세요." });
    const newCategory = await Category.create({ name, parent_id });
    res.status(201).json(newCategory);
  } catch (err) {
    console.error("카테고리 추가 오류:", err);
    res.status(500).json({ message: "카테고리 추가 실패" });
  }
});

// 카테고리 이름 수정 & 부모 변경
router.patch("/:id", authenticate, requireAdmin, async (req, res) => {
  const id = +req.params.id;
  const { name, parent_id } = req.body;
  const category = await Category.findByPk(id);
  if (!category) return res.status(404).json({ message: "카테고리 없음" });

  // 이름 업데이트
  if (name != null) await category.update({ name });

  // 부모 변경
  if (parent_id !== undefined) {
    // --- 변경 전 부모·선조 목록 수집 ---
    const oldAncestors = await getAncestors(category.parentId);

    // --- 자식 카테고리 상품들 조회 ---
    const products = await Product.findAll({
      include: {
        model: Category,
        as: "categories",
        where: { id },
        attributes: [],
      },
    });

    // --- 기존 연결 제거 ---
    for (const p of products) {
      for (const anc of oldAncestors) {
        await p.removeCategory(anc);
      }
    }

    // --- 카테고리의 parent_id 업데이트 ---
    await category.update({ parent_id });

    // --- 새로운 부모·선조 목록 수집 ---
    const newAncestors = [];
    cur = parent_id;
    while (cur) {
      newAncestors.push(cur);
      const cat = await Category.findByPk(cur);
      cur = cat?.parent_id;
    }

    // --- 새로운 부모·선조 연결 ---
    for (const p of products) {
      for (const anc of newAncestors) {
        await p.addCategory(anc);
      }
    }
  }

  res.json(category);
});

// 2) 카테고리 삭제
router.delete("/:id", authenticate, requireAdmin, async (req, res) => {
  const id = +req.params.id;
  const category = await Category.findByPk(id);
  if (!category) return res.status(404).json({ message: "카테고리 없음" });

  // 이 카테고리의 조상들
  const ancestors = await getAncestors(id);

  // 이 카테고리에 속한 상품들
  const products = await Product.findAll({
    include: {
      model: Category,
      as: "categories",
      where: { id },
      attributes: [],
    },
  });

  // 상품들에서 이 카테고리 + 조상 카테고리 M:N 연결 제거
  for (const p of products) {
    await p.removeCategory(id);
    for (const ancId of ancestors) {
      await p.removeCategory(ancId);
    }
  }

  // 자식 카테고리 parent_id 해제
  await Category.update({ parent_id: null }, { where: { parent_id: id } });

  // 실제 삭제
  await category.destroy();

  res.status(204).end();
});

// 3) 특정 카테고리의 부모를 변경 (조상 M:N 연결 제거 & 추가)
router.post("/:id/parent", authenticate, requireAdmin, async (req, res) => {
  const childId = +req.params.id;
  const { parent_id } = req.body; // new parent or null
  const child = await Category.findByPk(childId);
  const parent = parent_id ? await Category.findByPk(parent_id) : null;
  if (!child) return res.status(404).json({ message: "자식 카테고리 없음" });
  if (parent_id && !parent)
    return res.status(404).json({ message: "부모 카테고리 없음" });

  // 변경 전 조상 리스트
  const oldAncestors = await getAncestors(childId);

  // child에 속한 상품들
  const products = await Product.findAll({
    include: {
      model: Category,
      as: "categories",
      where: { id: childId },
      attributes: [],
    },
  });

  // 상품들에서 기존 조상 M:N 연결 제거
  for (const p of products) {
    for (const ancId of oldAncestors) {
      await p.removeCategory(ancId);
    }
  }

  // child.parent_id 업데이트
  await child.update({ parent_id });

  // 새로운 조상 리스트
  const newAncestors = parent_id
    ? [parent_id, ...(await getAncestors(parent_id))]
    : [];

  // 상품들에 대해 새로운 조상 M:N 연결 추가
  for (const p of products) {
    for (const ancId of newAncestors) {
      await p.addCategory(ancId);
    }
  }

  res.json(child);
});

module.exports = router;
