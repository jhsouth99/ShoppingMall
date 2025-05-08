const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = function (req, res, next) {
  const authHeader = req.header("Authorization");
  const token = authHeader?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: '토큰이 없습니다.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: '유효하지 않은 토큰입니다.' });
  }
};
