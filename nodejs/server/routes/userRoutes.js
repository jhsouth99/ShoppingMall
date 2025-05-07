const express = require("express");
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authenticate = require('../middleware/auth');
const bcrypt = require("bcrypt");

require('dotenv').config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

// 회원가입
router.post("/register", async (req, res) => {
  const { username, password, email } = req.body;
  try {
    const user = await User.findOne({ where: { username } });
    if (user)
      return res.status(409).json({ message: "이미 존재하는 아이디입니다." });

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+=\-[\]{};':"\\|,.<>/?]).{8,}$/;

    if (!passwordRegex.test(password))
      return res.status(400).json( {message: "비밀번호는 최소 8자 이상이며, 영문자, 숫자, 특수문자를 포함해야 합니다." });

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);

    // 사용자 생성
    await User.create({
      username,
      email,
      password: hashedPassword,
    });

    // 성공 응답
    res.status(201).json({ message: "회원가입이 완료되었습니다." });
  } catch (err) {
    res.status(500).json({ message: "회원가입 실패" });
  }
});

// 로그인
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ where: { username } });
    if (!user)
      return res.status(401).json({ message: "존재하지 않는 사용자입니다." });

    const isValid = await user.validatePassword(password);
    if (!isValid)
      return res.status(401).json({ message: "비밀번호가 틀렸습니다." });

    const payload = {
      id: user.id,
      username: user.username,
      user_type: user.user_type,
      role: user.role,
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.json({ token, user: payload });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "로그인 실패" });
  }
});

// 내 정보 조회 (인증 필요)
router.get("/me", authenticate, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password"] },
    });
    if (!user)
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "정보 조회 실패" });
  }
});

module.exports = router;
