const sequelize = require('./database');
const bcrypt = require('bcrypt');
const { User, Category, Product, Seller } = require('../models'); // index.js에서 export 필요요

async function seed() {
  try {
    // DB 동기화 (테이블 생성)
    await sequelize.sync({ force: true }); // 개발 환경에서만 사용!

    // 1. 사용자 생성
    const user = await User.create({
      username: 'testuser',
      password: await bcrypt.hash('1234', 10),
      name: '홍길동',
      phone: '010-1234-5678',
      user_type: 'individual'
    });

    const sellerUser = await User.create({
      username: 'seller1',
      password: await bcrypt.hash('1234', 10),
      name: '김판매',
      user_type: 'business'
    });

    const seller = await Seller.create({
      user_id: sellerUser.id,
      store_name: '판매자스토어',
      is_approved: true
    });

    // 2. 카테고리 생성
    const clothing = await Category.create({ name: '의류' });
    const food = await Category.create({ name: '식품' });
    const electronics = await Category.create({ name: '전자기기' });

    const shoes = await Category.create({ name: '신발', parent_id: clothing.id });
    const outers = await Category.create({ name: '외투', parent_id: clothing.id });
    const tops = await Category.create({ name: '상의', parent_id: clothing.id });
    const bottoms = await Category.create({ name: '하의', parent_id: clothing.id });

    const meat = await Category.create({ name: '고기', parent_id: food.id });
    const snacks = await Category.create({ name: '과자', parent_id: food.id });

    const computer = await Category.create({ name: '컴퓨터', parent_id: electronics.id });
    const mobile = await Category.create({ name: '모바일기기', parent_id: electronics.id });
    const camera = await Category.create({ name: '카메라', parent_id: electronics.id });

    // 3. 상품 생성
    const product = await Product.create({
      name: '프리미엄 운동화',
      price: 129000,
      stock: 50,
      seller_id: seller.id
    });

    // 4. 상품 카테고리 연결
    await product.addCategories([clothing, shoes]);

    console.log('✅ 시드 데이터 삽입 완료');
    //process.exit(); // Node 종료
  } catch (err) {
    console.error('❌ 시드 실패:', err);
    //process.exit(1);
  }
};

module.exports = seed;
