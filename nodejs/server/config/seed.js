const sequelize = require("./database");
const bcrypt = require("bcrypt");
const { User, Category, Product, Seller, Attribute, ProductAttribute } = require("../models"); // index.js에서 export 필요요

async function seed() {
  try {
    // DB 동기화 (테이블 생성)
    await sequelize.sync({ force: true }); // 개발 환경에서만 사용!

    // 1. 사용자 생성
    const user = await User.create({
      username: "testuser",
      password: "1234",
      name: "홍길동",
      phone: "010-1234-5678",
      user_type: "individual",
    });

    const sellerUser = await User.create({
      username: "seller1",
      password: await bcrypt.hash("1234", 10),
      name: "김판매",
      user_type: "business",
    });

    const seller = await Seller.create({
      user_id: sellerUser.id,
      store_name: "판매자스토어",
      is_approved: true,
    });

    // 2. 카테고리 생성
    const clothing = await Category.create({ name: "의류" });
    const food = await Category.create({ name: "식품" });
    const electronics = await Category.create({ name: "전자기기" });

    const shoes = await Category.create({
      name: "신발",
      parent_id: clothing.id,
    });
    const outers = await Category.create({
      name: "외투",
      parent_id: clothing.id,
    });
    const tops = await Category.create({
      name: "상의",
      parent_id: clothing.id,
    });
    const bottoms = await Category.create({
      name: "하의",
      parent_id: clothing.id,
    });

    const meat = await Category.create({ name: "고기", parent_id: food.id });
    const snacks = await Category.create({ name: "과자", parent_id: food.id });

    const computer = await Category.create({
      name: "컴퓨터",
      parent_id: electronics.id,
    });
    const mobile = await Category.create({
      name: "모바일기기",
      parent_id: electronics.id,
    });
    const camera = await Category.create({
      name: "카메라",
      parent_id: electronics.id,
    });

    // 3. 상품 생성
    const runningShoes = await Product.create({
      name: "프리미엄 러닝화",
      price: 129000,
      stock: 50,
      seller_id: seller.id,
    });
    await runningShoes.addCategories([clothing, shoes]);

    const leatherJacket = await Product.create({
      name: "레더 자켓",
      price: 199000,
      stock: 20,
      seller_id: seller.id,
    });
    await leatherJacket.addCategories([clothing, outers]);
    const parka = await Product.create({
      name: "롱 파카",
      price: 159000,
      stock: 30,
      seller_id: seller.id,
    });
    await parka.addCategories([clothing, outers]);

    const denimPants = await Product.create({
      name: "데님 팬츠",
      price: 59000,
      stock: 40,
      seller_id: seller.id,
    });
    await denimPants.addCategories([clothing, bottoms]);

    const basicTee = await Product.create({
      name: "기본 티셔츠",
      price: 15000,
      stock: 100,
      seller_id: seller.id,
    });
    await basicTee.addCategories([clothing, tops]);

    const hoodie = await Product.create({
      name: "후드티",
      price: 35000,
      stock: 60,
      seller_id: seller.id,
    });
    await hoodie.addCategories([clothing, tops]);

    const gamingLaptop = await Product.create({
      name: "게이밍 노트북 X1",
      price: 1500000,
      stock: 15,
      seller_id: seller.id,
    });
    await gamingLaptop.addCategories([electronics, computer]);

    const ultrabook = await Product.create({
      name: "울트라북 Z5",
      price: 1800000,
      stock: 10,
      seller_id: seller.id,
    });
    await ultrabook.addCategories([electronics, computer]);

    const smartphone = await Product.create({
      name: "최신 스마트폰 Z",
      price: 1200000,
      stock: 25,
      seller_id: seller.id,
    });
    await smartphone.addCategories([electronics, mobile]);

    const tablet = await Product.create({
      name: "10인치 태블릿 A",
      price: 550000,
      stock: 18,
      seller_id: seller.id,
    });
    await tablet.addCategories([electronics, mobile]);

    // 4. EAV 속성 정의
    const attrExpiration = await Attribute.create({ name: 'expiration_date', data_type: 'date' });
    const attrCalories   = await Attribute.create({ name: 'calories', data_type: 'integer' });
    const attrRelease    = await Attribute.create({ name: 'release_date', data_type: 'date' });
    const attrManufacturer = await Attribute.create({ name: 'manufacturer', data_type: 'string' });
    const attrCPU         = await Attribute.create({ name: 'cpu', data_type: 'string' });

    // 5. 상품별 속성값 저장
    // 신발 (유통기한, 칼로리)
    await ProductAttribute.create({ product_id: runningShoes.id, attribute_id: attrExpiration.id, attribute_value: '2025-12-31' });
    await ProductAttribute.create({ product_id: runningShoes.id, attribute_id: attrCalories.id, attribute_value: '0' });

    // 외투 및 하의/상의는 속성 없음

    // 노트북 (출시일, 제조사, CPU)
    await ProductAttribute.create({ product_id: gamingLaptop.id, attribute_id: attrRelease.id, attribute_value: '2024-05-01' });
    await ProductAttribute.create({ product_id: gamingLaptop.id, attribute_id: attrManufacturer.id, attribute_value: 'TechCorp' });
    await ProductAttribute.create({ product_id: gamingLaptop.id, attribute_id: attrCPU.id, attribute_value: 'Intel i7' });

    await ProductAttribute.create({ product_id: ultrabook.id, attribute_id: attrRelease.id, attribute_value: '2024-02-15' });
    await ProductAttribute.create({ product_id: ultrabook.id, attribute_id: attrManufacturer.id, attribute_value: 'UltraTech' });
    await ProductAttribute.create({ product_id: ultrabook.id, attribute_id: attrCPU.id, attribute_value: 'Intel i5' });

    // 스마트폰 (출시일, 제조사)
    await ProductAttribute.create({ product_id: smartphone.id, attribute_id: attrRelease.id, attribute_value: '2024-08-10' });
    await ProductAttribute.create({ product_id: smartphone.id, attribute_id: attrManufacturer.id, attribute_value: 'PhoneMaker' });

    // 태블릿 (출시일, 제조사)
    await ProductAttribute.create({ product_id: tablet.id, attribute_id: attrRelease.id, attribute_value: '2023-11-20' });
    await ProductAttribute.create({ product_id: tablet.id, attribute_id: attrManufacturer.id, attribute_value: 'TabCo' });


    console.log("✅ 시드 데이터 삽입 완료");
    //process.exit(); // Node 종료
  } catch (err) {
    console.error("❌ 시드 실패:", err);
    //process.exit(1);
  }
}

module.exports = seed;
