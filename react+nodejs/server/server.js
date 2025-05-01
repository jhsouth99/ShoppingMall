const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database.js');
const productRoutes = require('./routes/productRoutes.js');

const app = express();
const PORT = process.env.PORT || 5000;

require('./models');

app.use(cors());
app.use(express.json());

// 라우트 등록
app.use('/api/products', productRoutes);

// DB 연결 및 서버 시작
(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ DB 연결 성공');
    // 모델에 맞춰 테이블 생성 (운영 시에는 migration 사용 권장)
    await sequelize.sync();  
    app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
  } catch (err) {
    console.error('❌ DB 연결 실패', err);
  }
})();
