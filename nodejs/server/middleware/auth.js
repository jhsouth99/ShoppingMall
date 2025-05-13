// middleware/auth.js
const jwt = require('jsonwebtoken');
require('dotenv').config(); // JWT_SECRET을 위해

module.exports = function (req, res, next) {
  const authHeader = req.header("Authorization");

  if (!authHeader) {
    return res.status(401).json({ message: '인증 헤더가 없습니다.' });
  }

  const parts = authHeader.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ message: '유효하지 않은 인증 헤더 형식입니다. "Bearer [token]" 형식을 사용하세요.' });
  }

  const token = parts[1];

  if (!token) {
    return res.status(401).json({ message: '토큰이 제공되지 않았습니다.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // decoded에는 JWT 생성 시 넣었던 payload가 들어있음
    // 예: { id: user.id, username: user.username, role: primaryRole }
    req.user = decoded; // req.user에 디코딩된 사용자 정보 할당
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: '토큰이 만료되었습니다.' });
    }
    return res.status(403).json({ message: '유효하지 않은 토큰입니다.' });
  }
};