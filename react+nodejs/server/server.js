const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database.js');
const productRoutes = require('./routes/productRoutes.js');
const userRoutes = require('./routes/userRoutes.js');
const categoryRoutes = require('./routes/categoryRoutes.js');
const reviewRoutes = require('./routes/reviewRoutes.js');
const cartRoutes = require('./routes/cartRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const shouldSeed = true;

require('./models');

app.use(cors());
app.use(express.json());

// 라우트 등록
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', reviewRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);

// DB 연결 및 서버 시작
(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ DB 연결 성공');
    // 모델에 맞춰 테이블 생성 (운영 시에는 migration 사용 권장)
    sequelize.sync({ force: shouldSeed }).then(async () => {
      if (shouldSeed) {
        await require('./config/seed.js')(); // 함수로 내보냈다면
      }
      app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
    });
  } catch (err) {
    console.error('❌ DB 연결 실패', err);
  }
})();
