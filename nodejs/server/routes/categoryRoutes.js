// routes/categoryRoutes.js
const express = require("express");
const sequelize = require('../config/database');
const { Category, Product, UserRole } = require("../models"); // UserRole 추가 (관리자 권한 확인용)
const authenticate = require("../middleware/auth.js");
const { Op } = require("sequelize"); // Sequelize Op 사용
const { RoleType } = require('../enums'); // RoleType Enum

const router = express.Router();

// 관리자 권한 확인 미들웨어
async function requireAdmin(req, res, next) {
  // req.user.id 로 UserRole 테이블에서 ADMIN 역할 확인
  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: "인증되지 않은 사용자입니다." });
  }
  try {
    const userRoles = await UserRole.findAll({ where: { user_id: req.user.id } });
    const isAdmin = userRoles.some(userRole => userRole.role === 'ADMIN');
    console.log(userRoles);

    if (!isAdmin) {
      return res.status(403).json({ message: "관리자 권한이 필요합니다." });
    }
    next();
  } catch (error) {
    console.error("관리자 권한 확인 중 오류:", error);
    return res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
}

// 특정 카테고리의 조상 ID 리스트를 최상위까지 반환 (ID가 UUID 문자열이므로 + 제거)
async function getAncestorIds(categoryId) {
  const ancestors = [];
  let currentId = categoryId;
  while (currentId) {
    const category = await Category.findByPk(currentId);
    if (!category || !category.parent_id) break;
    ancestors.push(category.parent_id);
    currentId = category.parent_id;
  }
  return ancestors; // [parent_id, grandparent_id, ...]
}

// 특정 카테고리 및 그 모든 하위 카테고리 ID 리스트 반환 (재귀적)
async function getCategoryAndItsDescendantIds(categoryId) {
    const ids = [categoryId];
    const children = await Category.findAll({ where: { parent_id: categoryId } });
    for (const child of children) {
        ids.push(...await getCategoryAndItsDescendantIds(child.id));
    }
    return ids;
}


// 전체 카테고리 조회 (트리 구조로 반환)
router.get("/", async (req, res) => {
  try {
    const categories = await Category.findAll({
      order: [
        // parent_id가 NULL인 것을 먼저 오도록 처리 (MySQL 방식)
        // 방법 1: CASE 사용 또는 parent_id IS NULL DESC
        [sequelize.literal('`parent_id` IS NULL'), 'DESC'], // NULL이면 1, 아니면 0. DESC로 하면 NULL이 먼저 옴.
        ['parent_id', 'ASC'], // 그 다음 parent_id 오름차순
        ['name', 'ASC'],      // 마지막으로 이름 오름차순
      ],
    });

    const categoriesPlain = categories.map(cat => cat.get({ plain: true }));

    const map = {};
    categoriesPlain.forEach((cat) => {
      map[cat.id] = { ...cat, children: [] };
    });

    const tree = [];
    categoriesPlain.forEach((cat) => {
      if (cat.parent_id && map[cat.parent_id]) {
        map[cat.parent_id].children.push(map[cat.id]);
      } else if (!cat.parent_id) {
        tree.push(map[cat.id]);
      }
    });

    res.json(tree);
  } catch (err) {
    console.error("카테고리 조회 오류:", err);
    res.status(500).json({ message: "카테고리 조회에 실패했습니다." });
  }
});

// 카테고리 추가 (관리자 전용)
router.post("/", authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, parent_id = null } = req.body;
    if (!name) {
      return res.status(400).json({ message: "카테고리 이름을 입력하세요." });
    }
    // parent_id 유효성 검사 (선택 사항)
    if (parent_id) {
        const parentCategory = await Category.findByPk(parent_id);
        if (!parentCategory) {
            return res.status(400).json({ message: "존재하지 않는 부모 카테고리입니다." });
        }
    }
    const newCategory = await Category.create({ name, parent_id });
    res.status(201).json(newCategory);
  } catch (err) {
    console.error("카테고리 추가 오류:", err);
    if (err.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ message: "이미 존재하는 카테고리 이름이거나 제약 조건 위반입니다."});
    }
    res.status(500).json({ message: "카테고리 추가에 실패했습니다." });
  }
});

// 카테고리 이름 수정 & 부모 변경 (ID가 UUID 문자열이므로 + 제거)
// PATCH /api/categories/:id
router.patch("/:id", authenticate, requireAdmin, async (req, res) => {
  const categoryId = req.params.id; // 숫자 변환 제거
  const { name, parent_id } = req.body; // parent_id는 null일 수도 있음 (최상위로 변경 시)

  try {
    const category = await Category.findByPk(categoryId);
    if (!category) {
      return res.status(404).json({ message: "수정할 카테고리를 찾을 수 없습니다." });
    }

    // 자기 자신을 부모로 설정하는 것 방지
    if (parent_id !== undefined && categoryId === parent_id) {
        return res.status(400).json({ message: "자기 자신을 부모 카테고리로 설정할 수 없습니다." });
    }

    // 변경하려는 새 부모가 자신의 하위 카테고리인지 확인 (순환 참조 방지)
    if (parent_id) {
        const newParentCategory = await Category.findByPk(parent_id);
        if (!newParentCategory) {
            return res.status(400).json({ message: "새로운 부모 카테고리가 존재하지 않습니다." });
        }
        const descendantsOfCurrent = await getCategoryAndItsDescendantIds(categoryId);
        if (descendantsOfCurrent.includes(parent_id)) {
            return res.status(400).json({ message: "자신의 하위 카테고리를 부모로 설정할 수 없습니다." });
        }
    }


    const updateData = {};
    if (name !== undefined) {
      updateData.name = name;
    }
    if (parent_id !== undefined) { // parent_id가 명시적으로 전달된 경우 (null 포함)
      updateData.parent_id = parent_id; // null로 설정하면 최상위 카테고리가 됨
    }

    if (Object.keys(updateData).length > 0) {
        await category.update(updateData);
    }

    // 참고: Product.category_id는 직접 변경되지 않습니다.
    // 카테고리 구조 변경 시 상품의 카테고리 매핑을 어떻게 처리할지는 정책에 따라 결정해야 합니다.
    // 예를 들어, 특정 카테고리가 다른 곳으로 이동했을 때 해당 카테고리 상품들의 category_id를
    // 일괄적으로 변경하거나, 그대로 두거나 하는 등의 정책이 필요합니다.
    // 현재 코드는 카테고리 자체의 이름과 부모만 변경합니다.

    res.json(await Category.findByPk(categoryId)); // 변경된 카테고리 정보 반환
  } catch (err) {
    console.error(`카테고리(id: ${categoryId}) 수정 오류:`, err);
    if (err.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ message: "이미 존재하는 카테고리 이름이거나 제약 조건 위반입니다."});
    }
    res.status(500).json({ message: "카테고리 수정에 실패했습니다." });
  }
});

// 카테고리 삭제 (ID가 UUID 문자열이므로 + 제거)
// DELETE /api/categories/:id
router.delete("/:id", authenticate, requireAdmin, async (req, res) => {
  const categoryId = req.params.id; // 숫자 변환 제거

  try {
    const category = await Category.findByPk(categoryId);
    if (!category) {
      return res.status(404).json({ message: "삭제할 카테고리를 찾을 수 없습니다." });
    }

    // 1. 이 카테고리를 부모로 하는 자식 카테고리들의 parent_id를 null로 변경 (또는 상위로 이동)
    await Category.update({ parent_id: category.parent_id || null }, { where: { parent_id: categoryId } });

    // 2. 이 카테고리에 직접 할당된 상품들의 category_id를 null로 변경 (또는 다른 카테고리로 이동)
    //    또는 상품 삭제 정책에 따라 상품도 함께 삭제하거나, 판매 중지 처리 등을 할 수 있습니다.
    //    여기서는 category_id를 null로 설정합니다.
    await Product.update({ category_id: null }, { where: { category_id: categoryId } });

    // 3. 실제 카테고리 삭제
    await category.destroy();

    res.status(204).end();
  } catch (err) {
    console.error(`카테고리(id: ${categoryId}) 삭제 오류:`, err);
    res.status(500).json({ message: "카테고리 삭제에 실패했습니다." });
  }
});

module.exports = router;