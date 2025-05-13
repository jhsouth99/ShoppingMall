// routes/userRoutes.js
const express = require("express");
const jwt =require('jsonwebtoken');
const bcrypt = require("bcrypt");
const { User, UserRole, ShippingAddress } = require('../models'); // UserRole 추가
const authenticate = require('../middleware/auth');
const { RoleType } = require('../enums'); // RoleType Enum 추가

require('dotenv').config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

// 회원가입
router.post("/register", async (req, res) => {
  const { username, name, password, phone, email } = req.body; // email 추가 (필수 필드)
  try {
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(409).json({ message: "이미 존재하는 아이디입니다." });
    }

    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
        return res.status(409).json({ message: "이미 사용중인 이메일입니다." });
    }

    const existingPhone = await User.findOne({ where: { phone } });
    if (existingPhone) {
        return res.status(409).json({ message: "이미 사용중인 전화번호입니다." });
    }


    // 비밀번호 정책 검사 (예시)
    // const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+=\-[\]{};':"\\|,.<>/?]).{8,}$/;
    // if (!passwordRegex.test(password)) {
    //   return res.status(400).json({ message: "비밀번호는 최소 8자 이상이며, 영문자, 숫자, 특수문자를 포함해야 합니다." });
    // }

    if (!password || password.length < 8) { // 간단한 길이 검사
        return res.status(400).json({ message: "비밀번호는 최소 8자 이상이어야 합니다." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      username,
      name,
      phone,
      email, // email 추가
      password: hashedPassword, // 해싱된 비밀번호 저장
      // user_type, role은 UserRole 테이블에서 관리
    });

    // 기본 역할로 BUYER_INDIVIDUAL 할당
    await UserRole.create({
      user_id: newUser.id,
      role: 'BUYER_INDIVIDUAL', // 기본 구매자 역할
    });

    res.status(201).json({ message: "회원가입이 완료되었습니다." });
  } catch (err) {
    console.error("회원가입 오류:", err);
    res.status(500).json({ message: "서버 오류로 회원가입에 실패했습니다." });
  }
});

// 로그인
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({
        where: { username },
        include: [{ model: UserRole, as: 'roles' }] // 사용자의 역할을 가져오기 위해 UserRole 포함
    });

    if (!user) {
      return res.status(401).json({ message: "존재하지 않는 사용자입니다." });
    }

    const isValid = await user.validatePassword(password); // User 모델에 validatePassword 메소드 필요
    if (!isValid) {
      return res.status(401).json({ message: "비밀번호가 틀렸습니다." });
    }

    // 사용자의 주요 역할 결정 (예: 여러 역할 중 첫 번째 또는 특정 우선순위 역할)
    // 여기서는 첫 번째 역할을 사용하거나, ADMIN > SELLER > BUYER 순으로 우선순위 부여 가능
    let primaryRole = null;
    if (user.roles && user.roles.length > 0) {
        const roles = user.roles.map(ur => ur.role);
        if (roles.includes(RoleType.ADMIN)) primaryRole = RoleType.ADMIN;
        else if (roles.includes(RoleType.SELLER)) primaryRole = RoleType.SELLER;
        else if (roles.includes(RoleType.BUYER_BUSINESS)) primaryRole = RoleType.BUYER_BUSINESS;
        else if (roles.includes(RoleType.BUYER_INDIVIDUAL)) primaryRole = RoleType.BUYER_INDIVIDUAL;
        else primaryRole = roles[0]; // 기본적으로 첫 번째 역할
    }


    const payload = {
      id: user.id,
      username: user.username,
      role: primaryRole, // UserRole에서 가져온 역할 정보
      // user_type은 JWT에 포함하지 않거나, role을 기반으로 결정
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    // 사용자 정보 반환 시 비밀번호 제외 및 역할 정보 포함
    const userResponse = {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        phone: user.phone,
        roles: user.roles ? user.roles.map(ur => ur.role) : [], // 모든 역할을 배열로 전달
        created_at: user.created_at,
    };

    res.json({ token, user: userResponse });
  } catch (err) {
    console.error("로그인 오류:", err);
    res.status(500).json({ message: "서버 오류로 로그인에 실패했습니다." });
  }
});

// 내 정보 조회 (인증 필요)
router.get("/me", authenticate, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password", "reset_token", "reset_token_expires_at"] }, // 제외할 필드 명시
      include: [{ model: UserRole, as: 'roles', attributes: ['role'] }] // 역할 정보 포함
    });
    if (!user) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }
    res.json(user);
  } catch (err) {
    console.error("내 정보 조회 오류:", err);
    res.status(500).json({ message: "서버 오류로 정보 조회에 실패했습니다." });
  }
});

// 내 배송주소 목록 조회
router.get("/addresses", authenticate, async (req, res) => {
  try {
    const addresses = await ShippingAddress.findAll({
      where: { user_id: req.user.id }, // 컬럼명 snake_case로 변경
      order: [['is_default', 'DESC'], ['created_at', 'DESC']] // 컬럼명 snake_case로 변경
    });
    res.json(addresses);
  } catch (err) {
    console.error("배송주소 조회 실패:", err);
    res.status(500).json({ message: "배송주소 조회에 실패했습니다." });
  }
});

// 내 배송주소 등록
router.post("/addresses", authenticate, async (req, res) => {
  const user_id = req.user.id; // snake_case로 변경
  const {
    name, // 배송지 별칭 (ShippingAddress 모델에 name 필드 추가했었음)
    recipient_name,
    phone,
    address,
    address_detail,
    zipcode,
    is_default = false
  } = req.body;

  if (!name || !recipient_name || !phone || !address || !zipcode) {
    return res.status(400).json({ message: "필수 배송정보(별칭, 수령인, 연락처, 주소, 우편번호)를 모두 입력하세요." });
  }

  try {
    if (is_default === true || is_default === 'true') { // 명시적으로 boolean 또는 문자열 'true' 확인
      await ShippingAddress.update(
        { is_default: false },
        { where: { user_id: user_id, is_default: true } }
      );
    }

    const newAddr = await ShippingAddress.create({
      user_id: user_id, // 컬럼명 snake_case
      name, // 배송지 별칭 추가
      recipient_name,
      phone,
      address,
      address_detail,
      zipcode,
      is_default
    });

    res.status(201).json(newAddr);
  } catch (err) {
    console.error("배송주소 등록 실패:", err);
    res.status(500).json({ message: "배송주소 등록에 실패했습니다." });
  }
});


// 내 배송주소 수정
// PUT /api/users/addresses/:addressId
router.put("/addresses/:addressId", authenticate, async (req, res) => {
    const user_id = req.user.id;
    const { addressId } = req.params;
    const {
        name,
        recipient_name,
        phone,
        address,
        address_detail,
        zipcode,
        is_default
    } = req.body;

    try {
        const shippingAddr = await ShippingAddress.findOne({ where: { id: addressId, user_id }});
        if (!shippingAddr) {
            return res.status(404).json({ message: "수정할 배송주소를 찾을 수 없습니다." });
        }

        // is_default가 true로 들어온 경우, 다른 기본 배송지를 false로 변경
        if (is_default === true || is_default === 'true') {
            await ShippingAddress.update(
                { is_default: false },
                { where: { user_id: user_id, is_default: true, id: { [require('sequelize').Op.ne]: addressId } } } // 현재 수정 건 제외
            );
        }

        const updatedAddr = await shippingAddr.update({
            name: name !== undefined ? name : shippingAddr.name,
            recipient_name: recipient_name !== undefined ? recipient_name : shippingAddr.recipient_name,
            phone: phone !== undefined ? phone : shippingAddr.phone,
            address: address !== undefined ? address : shippingAddr.address,
            address_detail: address_detail !== undefined ? address_detail : shippingAddr.address_detail,
            zipcode: zipcode !== undefined ? zipcode : shippingAddr.zipcode,
            is_default: is_default !== undefined ? is_default : shippingAddr.is_default,
        });

        res.json(updatedAddr);
    } catch (err) {
        console.error("배송주소 수정 실패:", err);
        res.status(500).json({ message: "배송주소 수정에 실패했습니다." });
    }
});

// 내 배송주소 삭제
// DELETE /api/users/addresses/:addressId
router.delete("/addresses/:addressId", authenticate, async (req, res) => {
    const user_id = req.user.id;
    const { addressId } = req.params;

    try {
        const shippingAddr = await ShippingAddress.findOne({ where: { id: addressId, user_id }});
        if (!shippingAddr) {
            return res.status(404).json({ message: "삭제할 배송주소를 찾을 수 없습니다." });
        }

        await shippingAddr.destroy();
        res.status(200).json({ message: "배송주소가 삭제되었습니다."});

    } catch (err) {
        console.error("배송주소 삭제 실패:", err);
        res.status(500).json({ message: "배송주소 삭제에 실패했습니다." });
    }
});


module.exports = router;