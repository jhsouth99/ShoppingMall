// seed.js

const sequelize = require("./database"); // Sequelize 인스턴스
// Faker.js (선택 사항 - 더 현실적인 대량 데이터 생성 시)
// const { faker } = require('@faker-js/faker/locale/ko');

// models/index.js에서 모든 모델을 가져온다고 가정
const {
  User, UserRole, BusinessProfile, Category, Product,
  Attribute, ProductAttributeValue, CategoryAttribute,
  ProductVariant, ProductOption, ProductOptionValue, ProductVariantOptionValue,
  ProductImage, Tag,
  Order, OrderItem, Payment, Shipment,
  Review, ReviewImage,
  QnA, ShippingMethod,
  ShippingAddress, Carrier, PromotionProduct,
  Coupon, PromotionCondition, Promotion, UserCoupon, Refund, RefundItem, Notice
} = require("../models");

// enums.js (객체 형태로 가정)
const {
  RoleType, AttributeDataType, ProductImageType, OrderStatus, OrderItemStatus,
  PaymentMethodType, PaymentStatus, ShipmentStatus, RefundReasonType, RefundStatus,
  DiscountType,
  PromotionType,
  PromotionConditionType,
  CardIssuer
  // PromotionType 등 필요에 따라 추가
} = require("../enums");
const { Op } = require("sequelize/lib/sequelize");

calculateShippingFee = require("../routes/modules/calculateShippingFee");
applyPromotionsAndCoupons = require("../routes/modules/discountCalculator");

async function seed() {
  const t = await sequelize.transaction();
  console.log("시딩 작업 시작 (트랜잭션 시작됨)...");

  try {
    console.log("데이터베이스 동기화 (force: true)...");
    await sequelize.sync({ force: true, transaction: t });
    console.log("데이터베이스 동기화 완료.");

    // --- 1. 사용자 및 역할 생성 --- (이전과 동일)
    console.log("사용자 계정 생성 시작...");
    const usersToCreate = [];
    for (let i = 1; i <= 50; i++) {
      usersToCreate.push({
        username: `buyer${String(i).padStart(3, '0')}`,
        password: `buyerpass${i}!`,
        name: `구매자${i} (${i % 5 === 0 ? '김' : i % 5 === 1 ? '이' : i % 5 === 2 ? '박' : i % 5 === 3 ? '최' : '정'}철수)`,
        phone: `010-${String(1000 + i).padStart(4, '0')}-${String(5000 + i).padStart(4, '0')}`,
        email: `buyer${String(i).padStart(3, '0')}@example.com`,
        roles: [RoleType.BUYER_INDIVIDUAL]
      });
    }
    for (let i = 1; i <= 50; i++) {
      usersToCreate.push({
        username: `seller${String(i).padStart(3, '0')}`,
        password: `sellerpass${i}!`,
        name: `판매자${i} (주식회사 훌륭상점${i})`,
        phone: `010-${String(6000 + i).padStart(4, '0')}-${String(1000 + i).padStart(4, '0')}`,
        email: `seller${String(i).padStart(3, '0')}@example.com`,
        roles: [RoleType.SELLER],
        businessProfile: {
          business_name: `훌륭상점 ${i}호점`,
          biz_number: `${String(100 + i).padStart(3, '0')}-${String(10 + i).padStart(2, '0')}-${String(10000 + i).padStart(5, '0')}`,
          verified_at: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 60),
        }
      });
    }
    usersToCreate.push({
      username: "admin001", password: "adminpass!", name: "총관리자",
      phone: "010-0000-0001", email: "admin001@example.com",
      roles: [RoleType.ADMIN, RoleType.BUYER_INDIVIDUAL]
    });

    const createdUsers = [];
    for (const userData of usersToCreate) {
      const { roles, businessProfile, ...userFields } = userData;
      const user = await User.create(userFields, { transaction: t });
      if (roles && roles.length > 0) {
        for (const role of roles) {
          await UserRole.create({ user_id: user.id, role: role }, { transaction: t });
        }
      }
      if (businessProfile && user.id && roles.includes(RoleType.SELLER)) {
        await BusinessProfile.create({ user_id: user.id, ...businessProfile }, { transaction: t });
      }
      createdUsers.push(user);
    }
    const buyers = createdUsers.filter(u => usersToCreate.find(ud => ud.username === u.username).roles.includes(RoleType.BUYER_INDIVIDUAL));
    const sellers = createdUsers.filter(u => usersToCreate.find(ud => ud.username === u.username).roles.includes(RoleType.SELLER));
    console.log(`총 ${buyers.length}명의 구매자, ${sellers.length}명의 판매자, 및 관리자 생성 완료.`);


    // --- 2. 카테고리 생성 --- (이전과 동일)
    console.log("카테고리 생성 시작...");
    const categoriesData = [ /* ... 이전 답변의 categoriesData ... */
      { name: "패션의류/잡화", children: [
        { name: "여성의류", children: [
          { name: "티셔츠/탑" }, { name: "블라우스/셔츠" }, { name: "팬츠", children: [{name: "데님"}, {name: "슬랙스"}]}, { name: "스커트" }, { name: "아우터", children: [{name: "자켓"}, {name: "코트"}, {name: "패딩"}]}
        ]},
        { name: "남성의류", children: [
          { name: "티셔츠/맨투맨" }, { name: "셔츠" }, { name: "바지" }, { name: "아우터" }
        ]},
        { name: "패션잡화", children: [
          { name: "신발", children: [{name: "운동화"}, {name: "구두"}, {name: "샌들/슬리퍼"}] },
          { name: "가방" }, { name: "모자" }, { name: "주얼리/시계" }
        ]}
      ]},
      { name: "식품", children: [
        { name: "신선식품", children: [
          { name: "과일" }, { name: "채소" },
          { name: "정육/계란", children: [{name: "소고기"}, {name: "돼지고기"}, {name: "닭/오리고기"}, {name: "계란/알류"}] },
          { name: "수산물/건어물", children: [{name: "생선"}, {name: "해산물"}, {name: "건어물/해조류"}] },
          { name: "유제품", children: [{name: "우유/두유"}, {name: "치즈/버터"}, {name: "요거트"}] }
        ]},
        { name: "가공식품", children: [
          { name: "면류/통조림" }, { name: "냉동/간편식", children: [{name: "만두/피자"}, {name: "즉석밥/국"}] },
          { name: "간식/과자/빵", children: [{name: "과자/스낵"}, {name: "초콜릿/사탕"}, {name: "빵/디저트"}] }
        ]},
        { name: "음료/차/커피", children: [{name: "생수/탄산수"}, {name: "주스/음료"}, {name: "커피/차류"}] },
        { name: "건강식품" }
      ]},
      { name: "가전/디지털", children: [
        { name: "대형가전", children: [{name: "TV"}, {name: "냉장고"}, {name: "세탁기/건조기"}] },
        { name: "주방가전" },
        { name: "생활/미용가전" },
        { name: "컴퓨터/노트북", children: [{name: "노트북"}, {name: "데스크탑"}, {name: "모니터"}, {name: "주변기기"}] },
        { name: "모바일/태블릿", children: [{name: "스마트폰"}, {name: "태블릿"}] },
        { name: "카메라/음향기기", children: [{name: "카메라"}, {name: "스피커"}, {name: "헤드폰"}] }
      ]},
      { name: "뷰티", children: [
        { name: "스킨케어" }, { name: "메이크업" }, { name: "헤어/바디" }, { name: "향수" }
      ]},
      { name: "스포츠/레저", children: [
        { name: "스포츠의류/신발" }, { name: "헬스/요가" }, { name: "캠핑/등산" }, { name: "자전거/스키" }
      ]},
      { name: "가구/인테리어", children: [
        { name: "가구", children: [{name: "침대/매트리스"}, {name: "소파/거실장"}, {name: "책상/의자"}] },
        { name: "인테리어소품" }, { name: "조명" }, { name: "침구/커튼" }
      ]},
    ];
    const createdCategories = {};
    async function createCategoryRecursive(categoryData, parentId = null) {
      const category = await Category.create({ name: categoryData.name, parent_id: parentId }, { transaction: t });
      createdCategories[category.name] = category;
      if (categoryData.children && categoryData.children.length > 0) {
        for (const child of categoryData.children) {
          await createCategoryRecursive(child, category.id);
        }
      }
      return category;
    }
    for (const topCategory of categoriesData) {
      await createCategoryRecursive(topCategory);
    }
    console.log("카테고리 생성 완료.");


    // --- 3. 속성(Attribute) 정의 --- (이전과 동일)
    console.log("속성(Attribute) 생성 시작...");
    const attributesToCreate = [
        { name: '색상', data_type: AttributeDataType.TEXT }, { name: '사이즈', data_type: AttributeDataType.TEXT },
        { name: '소재', data_type: AttributeDataType.TEXT }, { name: '제조사', data_type: AttributeDataType.TEXT },
        { name: '유통기한', data_type: AttributeDataType.DATE }, { name: '칼로리', data_type: AttributeDataType.NUMBER },
        { name: '출시일', data_type: AttributeDataType.DATE }, { name: 'CPU', data_type: AttributeDataType.TEXT },
        { name: 'RAM', data_type: AttributeDataType.TEXT }, { name: '저장용량', data_type: AttributeDataType.TEXT },
        { name: '화면크기', data_type: AttributeDataType.TEXT }, { name: '해상도', data_type: AttributeDataType.TEXT },
        { name: '배터리용량', data_type: AttributeDataType.TEXT }, { name: '무게', data_type: AttributeDataType.TEXT },
        { name: '방수등급', data_type: AttributeDataType.TEXT }, { name: '성분', data_type: AttributeDataType.TEXT },
        { name: '용도', data_type: AttributeDataType.TEXT }, { name: '권장연령', data_type: AttributeDataType.TEXT },
        { name: '핏', data_type: AttributeDataType.TEXT }, { name: '굽높이', data_type: AttributeDataType.TEXT },
        { name: '원산지', data_type: AttributeDataType.TEXT }, { name: '중량', data_type: AttributeDataType.TEXT }, // 중복이지만 상품속성용
        { name: '당도', data_type: AttributeDataType.TEXT }, { name: '보관방법', data_type: AttributeDataType.TEXT },
        { name: '맛', data_type: AttributeDataType.TEXT }, // 중복이지만 상품속성용
        { name: '화소', data_type: AttributeDataType.TEXT }, { name: '광학줌', data_type: AttributeDataType.TEXT },
    ];
    const createdAttributes = {};
    for (const attrData of attributesToCreate) {
      const [attribute, created] = await Attribute.findOrCreate({
          where: { name: attrData.name },
          defaults: attrData,
          transaction: t
      });
      createdAttributes[attrData.name] = attribute;
    }
    console.log("속성(Attribute) 생성 완료.");


    // --- 4. 카테고리별 추천 속성 연결 (CategoryAttribute) --- (이전과 동일)
    console.log("카테고리-속성 연결(CategoryAttribute) 생성 시작...");
    const categoryAttributeLinks = [
        { categoryName: "티셔츠/탑", attributeNames: ["색상", "사이즈", "소재"] },
        { categoryName: "팬츠", attributeNames: ["색상", "사이즈", "소재", "핏"] },
        { categoryName: "아우터", attributeNames: ["색상", "사이즈", "소재", "방수등급"] },
        { categoryName: "운동화", attributeNames: ["색상", "사이즈", "소재", "굽높이"] },
        { categoryName: "구두", attributeNames: ["색상", "사이즈", "소재", "굽높이"] },
        { categoryName: "과일", attributeNames: ["원산지", "중량", "당도"] },
        { categoryName: "정육/계란", attributeNames: ["원산지", "중량", "보관방법", "유통기한"] },
        { categoryName: "과자/스낵", attributeNames: ["맛", "칼로리", "중량", "유통기한"] },
        { categoryName: "노트북", attributeNames: ["제조사", "CPU", "RAM", "저장용량", "화면크기", "무게", "출시일"] },
        { categoryName: "스마트폰", attributeNames: ["제조사", "저장용량", "화면크기", "배터리용량", "출시일"] },
        { categoryName: "카메라", attributeNames: ["제조사", "화소", "광학줌", "무게"] },
    ];
    for (const link of categoryAttributeLinks) {
        const category = createdCategories[link.categoryName];
        if (category) {
            for (const attrName of link.attributeNames) {
                const attribute = createdAttributes[attrName];
                if (attribute) {
                    await CategoryAttribute.findOrCreate({
                        where: { category_id: category.id, attribute_id: attribute.id },
                        defaults: { category_id: category.id, attribute_id: attribute.id },
                        transaction: t
                    });
                } else { console.warn(`CategoryAttribute 연결 실패: 속성 '${attrName}'을(를) 찾을 수 없습니다.`); }
            }
        } else { console.warn(`CategoryAttribute 연결 실패: 카테고리 '${link.categoryName}'을(를) 찾을 수 없습니다.`); }
    }
    console.log("카테고리-속성 연결(CategoryAttribute) 생성 완료.");

    // --- (신규) 배송사(Carrier) 및 배송 방법(ShippingMethod) 생성 ---
    console.log("배송사(Carrier) 및 배송 방법(ShippingMethod) 생성 시작...");

    // 배송사 데이터
    const carriersToCreate = [
      { name: "CJ대한통운", code: "CJ_LOGISTICS", tracking_url_format: "https://www.doortodoor.co.kr/parcel/doortodoor.do?fsp_action=PARC_ACT_002&fsp_cmd=retrieveInvNoACT&invc_no={TRACKING_NUMBER}" },
      { name: "롯데택배", code: "LOTTE_LOGISTICS", tracking_url_format: "https://www.lotteglogis.com/home/reservation/tracking/linkView?InvNo={TRACKING_NUMBER}" },
      { name: "한진택배", code: "HANJIN_LOGISTICS", tracking_url_format: "https://www.hanjin.co.kr/kor/CMS/DeliveryMgr/WaybillResult.do?mCode=MN038&schLang=KO&wblnumText2={TRACKING_NUMBER}" },
      { name: "우체국택배", code: "KOREA_POST", tracking_url_format: "https://service.epost.go.kr/trace.RetrieveDomRmgTraceList.comm?sid1={TRACKING_NUMBER}" },
      { name: "로젠택배", code: "LOGEN_LOGISTICS", tracking_url_format: "https://www.ilogen.com/web/personal/trace/{TRACKING_NUMBER}" },
      { name: "판매자직접배송", code: "SELLER_DIRECT" },
      { name: "오늘출발 새벽배송", code: "TODAY_DAWN" },
      { name: "퀵서비스", code: "QUICK_SVC" },
    ];
    const createdCarriers = {};
    for (const carrierData of carriersToCreate) {
      const carrier = await Carrier.create(carrierData, { transaction: t });
      createdCarriers[carrierData.code] = carrier;
    }
    console.log(`${Object.keys(createdCarriers).length}개의 배송사 생성 완료.`);

    // 배송 방법 데이터
    const shippingMethodsToCreate = [
      { name: "일반택배 (CJ대한통운)", carrier_code: "CJ_LOGISTICS", cost: 3000, estimated_days: "1-3일", is_active: true },
      { name: "일반택배 (롯데택배)", carrier_code: "LOTTE_LOGISTICS", cost: 3000, estimated_days: "1-3일", is_active: true },
      { name: "일반택배 (한진택배)", carrier_code: "HANJIN_LOGISTICS", cost: 3000, estimated_days: "1-3일", is_active: true },
      { name: "우체국택배", carrier_code: "KOREA_POST", cost: 4000, estimated_days: "1-2일", is_active: true },
      { name: "로젠택배", carrier_code: "LOGEN_LOGISTICS", cost: 3500, estimated_days: "1-3일", is_active: true },
      { name: "판매자 직접 배송", carrier_code: "SELLER_DIRECT", cost: 0, estimated_days: "판매자 문의", is_active: true }, // 비용은 판매자가 설정하거나 상품별로 다를 수 있음
      { name: "오늘출발 (새벽배송)", carrier_code: "TODAY_DAWN", cost: 5000, estimated_days: "다음날 새벽", is_active: true },
      { name: "퀵서비스 (착불)", carrier_code: "QUICK_SVC", cost: 0, estimated_days: "당일(2-4시간)", is_active: true }, // 비용은 착불 또는 별도 계산
      { name: "무료배송", cost: 0, estimated_days: "2-4일", is_active: true }, // 특정 조건 만족 시 사용될 수 있는 배송 방법
    ];

    const createdShippingMethods = [];
    for (const smData of shippingMethodsToCreate) {
      const carrier = smData.carrier_code ? createdCarriers[smData.carrier_code] : null;
      const shippingMethod = await ShippingMethod.create({
        name: smData.name,
        carrier_id: carrier ? carrier.id : null,
        cost: smData.cost,
        estimated_days: smData.estimated_days,
        is_active: smData.is_active,
      }, { transaction: t });
      createdShippingMethods.push(shippingMethod);
    }
    console.log(`${createdShippingMethods.length}개의 배송 방법 생성 완료.`);


    // --- 헬퍼 데이터 및 함수 --- (이전과 동일, 단 getOrCreateOption 수정)
    console.log("상품 생성을 위한 헬퍼 데이터 정의 시작...");
    const loremIpsum = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";
    function getRandomSubset(arr, count) { /* 이전과 동일 */
        const shuffled = [...arr].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, Math.min(count, shuffled.length));
    }
    function getRandomInt(min, max) { /* 이전과 동일 */
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    const placeholderImageBase = "https://source.unsplash.com/600x600/?";
    const imageKeywords = { /* 이전과 동일 */
        패션의류잡화: ["fashion", "style", "clothing", "accessory"], 여성의류: ["women-fashion", "dress", "blouse"], 남성의류: ["men-fashion", "suit", "shirt"],
        신발: ["sneakers", "boots", "sandals"], 가방:["bag", "handbag"],
        식품: ["food", "grocery", "fresh"], 신선식품: ["organic", "farm", "healthy-food"], 과일: ["apple", "banana", "berry"], 채소: ["vegetable", "green", "salad"], 정육계란: ["meat", "beef", "pork", "chicken", "egg"],
        가공식품: ["processed-food", "canned-food", "snack"], 간식과자빵: ["cookie", "chocolate", "bread"],
        가전디지털: ["electronics", "gadget", "tech"], 컴퓨터노트북: ["laptop", "computer", "desktop"], 모바일태블릿: ["phone", "tablet", "smart-device"],
        뷰티: ["cosmetics", "skincare", "makeup"], 스포츠레저: ["sports", "fitness", "outdoor"], 가구인테리어: ["furniture", "interior", "home-decor"],
    };
    let imageSeedCounter = 0;
    function getPlaceholderImageUrl(categoryName = "product") { /* 이전과 동일, categoryName으로 imageKeywords에서 가져오도록 수정 */
        const keywordsForCategory = Object.keys(imageKeywords).find(key => categoryName.includes(key));
        const keywords = imageKeywords[keywordsForCategory] || ["product", "item", "modern"];
        const keyword = keywords[imageSeedCounter % keywords.length];
        imageSeedCounter++;
        return `${placeholderImageBase}${keyword}&sig=${imageSeedCounter}`;
    }
    const commonTagsPool = ["신상품", "베스트", "추천상품", "오늘만특가", "MD픽", "인기", "무료배송", "사은품증정", "친환경", "핸드메이드", "시즌오프", "단독판매", "리미티드에디션"];
    const productSpecificAdjectives = ["프리미엄", "고급", "실용적인", "트렌디한", "유니크한", "가성비", "데일리", "전문가용", "입문자용", "한정판", "시그니처", "올인원", "컴팩트", "대용량", "클래식", "모던", "빈티지"];
    const productNounsByCategory = {
      // --- 패션의류/잡화 ---
      "티셔츠/탑": ["라운드넥 티셔츠", "브이넥 티셔츠", "헨리넥 티셔츠", "폴로 셔츠", "나시티", "긴팔티", "크롭탑"],
      "블라우스/셔츠": ["실크 블라우스", "면 셔츠", "오프숄더 블라우스", "정장 셔츠", "린넨 셔츠", "데님 셔츠", "체크 셔츠"],
      "데님": ["스키니진", "부츠컷 데님", "와이드 데님 팬츠", "데님 숏팬츠", "배기 데님", "일자핏 청바지"],
      "슬랙스": ["기본 슬랙스", "와이드 슬랙스", "부츠컷 슬랙스", "핀턱 슬랙스", "밴딩 슬랙스", "세미와이드 슬랙스"],
      "스커트": ["미니 스커트", "롱 스커트", "플리츠 스커트", "데님 스커트", "H라인 스커트", "머메이드 스커트"],
      "자켓": ["블레이저 자켓", "레더 자켓", "데님 자켓", "트위드 자켓", "바람막이 자켓", "숏자켓"],
      "코트": ["트렌치 코트", "울 코트", "캐시미어 코트", "롱 코트", "하프 코트", "더플 코트"],
      "패딩": ["숏패딩", "롱패딩", "경량 패딩 조끼", "후드 패딩", "덕다운 패딩", "구스다운 패딩"],
      "티셔츠/맨투맨": ["기본 반팔티", "프린팅 맨투맨", "오버핏 후드티", "PK티셔츠", "스웻셔츠", "그래픽 티셔츠"],
      "셔츠": ["옥스포드 셔츠", "린넨 셔츠", "체크 셔츠", "데님 셔츠", "스트라이프 셔츠", "차이나카라 셔츠"],
      "바지": ["면바지", "슬랙스", "카고 팬츠", "트레이닝 팬츠", "조거 팬츠", "치노 팬츠", "반바지"],
      "운동화": ["러닝화", "데일리 스니커즈", "캔버스화", "트레이닝화", "농구화", "테니스화"],
      "구두": ["로퍼", "더비 슈즈", "옥스포드화", "힐", "플랫 슈즈", "정장 구두"],
      "샌들/슬리퍼": ["스포츠 샌들", "쪼리", "슬라이드", "뮬", "에스파듀"],
      "가방": ["백팩", "숄더백", "토트백", "크로스백", "클러치백", "에코백", "여행용 캐리어"],
      "모자": ["볼캡", "버킷햇", "비니", "스냅백", "페도라"],
      "주얼리/시계": ["목걸이", "귀걸이", "반지", "팔찌", "발찌", "손목시계", "스마트워치"],

      // --- 식품 ---
      "과일": ["사과", "바나나", "딸기", "샤인머스캣", "수박", "오렌지", "포도", "망고", "체리", "블루베리", "복숭아", "배", "감귤"],
      "채소": ["양파", "감자", "상추", "토마토", "오이", "파프리카", "브로콜리", "버섯", "애호박", "당근", "마늘", "깻잎", "시금치"],
      "소고기": ["한우 등심", "한우 안심", "수입산 꽃등심", "차돌박이", "국거리 양지", "불고기용 설도", "스테이크용 채끝"],
      "돼지고기": ["국내산 삼겹살", "수입산 목살", "앞다리살 제육용", "갈비찜용 등갈비", "항정살", "가브리살"],
      "닭/오리고기": ["생닭볶음탕용", "훈제오리 슬라이스", "닭가슴살 스테이크", "토종닭백숙용", "닭다리살", "닭날개"],
      "계란/알류": ["유정란", "무항생제 계란", "메추리알", "오리알"],
      "생선": ["고등어", "갈치", "삼치", "임연수", "조기", "연어 필렛", "광어회"],
      "해산물": ["새우", "오징어", "낙지", "쭈꾸미", "전복", "가리비", "홍합", "꽃게"],
      "건어물/해조류": ["마른오징어", "멸치", "김", "미역", "다시마", "황태채"],
      "우유/두유": ["신선한 우유", "저지방 우유", "멸균 우유", "유기농 두유", "검은콩 두유", "아몬드 브리즈"],
      "치즈/버터": ["체다 슬라이스 치즈", "모짜렐라 치즈", "까망베르 치즈", "무염 버터", "가염 버터", "크림치즈"],
      "요거트": ["플레인 요거트", "그릭 요거트", "과일맛 요거트", "마시는 요거트"],
      "면류/통조림": ["라면 멀티팩", "스파게티면", "칼국수면", "참치 통조림", "꽁치 통조림", "스팸 클래식"],
      "만두/피자": ["고기만두", "김치만두", "냉동피자", "미니피자", "새우만두"],
      "즉석밥/국": ["햇반", "컵밥", "즉석 미역국", "즉석 된장찌개", "간편죽"],
      "과자/스낵": ["감자칩", "초코쿠키", "에너지바", "쌀과자", "팝콘", "나초칩", "빼빼로"],
      "초콜릿/사탕": ["밀크 초콜릿바", "다크 초콜릿", "막대사탕", "과일맛 젤리", "캐러멜"],
      "빵/디저트": ["식빵", "베이글", "크루아상", "케이크", "마카롱", "푸딩", "찹쌀떡"],
      "생수/탄산수": ["생수 2L", "미네랄 워터 500ml", "탄산수 플레인", "레몬 탄산수"],
      "주스/음료": ["오렌지 주스", "사과 주스", "이온 음료", "콜라", "사이다", "과일 스무디"],
      "커피/차류": ["아메리카노 원두", "믹스커피", "녹차 티백", "허브티", "캡슐커피"],
      "건강식품": ["홍삼정 스틱", "프로바이오틱스", "비타민C", "오메가3", "콜라겐 파우더"],

      // --- 가전/디지털 ---
      "TV": ["스마트 TV", "QLED TV", "OLED TV", "벽걸이 TV", "UHD TV"],
      "냉장고": ["양문형 냉장고", "4도어 냉장고", "김치냉장고", "미니 냉장고"],
      "세탁기/건조기": ["드럼 세탁기", "통돌이 세탁기", "의류 건조기", "워시타워"],
      "주방가전": ["전자레인지", "에어프라이어", "전기밥솥", "믹서기", "커피머신", "식기세척기", "인덕션"],
      "생활/미용가전": ["헤어드라이어", "공기청정기", "가습기", "전기면도기", "스팀다리미", "로봇청소기"],
      "노트북": ["게이밍 노트북", "울트라북", "2in1 노트북", "학생용 노트북", "맥북 에어", "맥북 프로"],
      "데스크탑": ["조립 PC", "일체형 PC", "미니 PC", "워크스테이션"],
      "모니터": ["게이밍 모니터", "와이드 모니터", "커브드 모니터", "휴대용 모니터"],
      "주변기기": ["기계식 키보드", "무선 마우스", "웹캠", "프린터", "USB 허브"],
      "모바일/태블릿": ["스마트폰", "태블릿PC", "웨어러블 워치", "블루투스 이어폰"],
      "카메라/음향기기": ["미러리스 카메라", "DSLR 카메라", "액션캠", "헤드폰", "블루투스 스피커", "사운드바"],

      // --- 뷰티 ---
      "스킨케어": ["수분크림", "토너", "에센스/세럼", "마스크팩", "선크림", "클렌징폼"],
      "메이크업": ["파운데이션", "쿠션팩트", "아이섀도우 팔레트", "립스틱/틴트", "마스카라", "아이라이너"],
      "헤어/바디": ["샴푸/린스", "헤어에센스", "바디워시", "바디로션", "핸드크림", "헤어왁스"],
      "향수": ["여성 향수", "남성 향수", "니치 향수", "룸스프레이"],

      // --- 스포츠/레저 ---
      "스포츠의류/신발": ["트레이닝 상의", "스포츠 레깅스", "러닝화", "축구화", "등산화"],
      "헬스/요가": ["덤벨/아령", "요가매트", "폼롤러", "헬스장갑", "프로틴 보충제"],
      "캠핑/등산": ["텐트", "침낭", "등산배낭", "캠핑의자", "랜턴", "코펠"],
      "자전거/스키": ["MTB자전거", "로드자전거", "자전거헬멧", "스키/보드복", "고글"],

      // --- 가구/인테리어 ---
      "침대/매트리스": ["싱글 침대 프레임", "퀸사이즈 매트리스", "라텍스 토퍼", "메모리폼 베개"],
      "소파/거실장": ["3인용 소파", "리클라이너 소파", "TV 거실장", "커피테이블"],
      "책상/의자": ["컴퓨터 책상", "게이밍 의자", "서재 책장", "사무용 의자"],
      "인테리어소품": ["디퓨저", "액자", "조화", "벽시계", "러그/카페트", "쿠션"],
      "조명": ["LED 스탠드", "무드등", "레일조명", "샹들리에"],
      "침구/커튼": ["차렵이불 세트", "암막커튼", "순면 베개커버", "호텔식 침구"],

      // 모든 카테고리에 대한 기본값
      "기타카테고리상품": ["다용도 아이템", "특별 기획 상품", "시즌 한정 제품", "멀티 제품", "기본 구성품"]
    };
    const categorySpecificTags = { /* 이전 답변의 내용 확장 */
        패션의류잡화: ["데일리룩", "오피스룩", "캐주얼", "스트릿패션", "여행룩", "면소재", "신축성", "오버핏", "슬림핏", "S/S시즌", "F/W시즌"],
        여성의류: ["페미닌", "러블리", "모던시크", "데이트룩", "하객룩"],
        남성의류: ["비즈니스캐주얼", "댄디룩", "워크웨어", "스포츠믹스", "남친룩"],
        식품: ["유기농", "무농약", "HACCP인증", "당일배송", "선물용", "아이들간식", "건강식", "저칼로리", "글루텐프리", "비건"],
        신선식품: ["산지직송", "제철", "오늘수확", "새벽배송"],
        가공식품: ["간편조리", "즉석섭취", "캠핑용", "자취생필수템"],
        가전디지털: ["최신기술", "고성능", "휴대용", "가성비", "전문가용", "입문용", "스마트홈", "에너지효율1등급"],
        컴퓨터노트북: ["고사양", "초경량", "학생용할인", "디자이너용", "개발자용"],
        모바일태블릿: ["대화면", "고화질카메라", "5G지원", "방수방진"],
        뷰티: ["수분촉촉", "피부진정", "커버력좋은", "자연유래성분", "비건화장품", "안티에이징", "미백효과"],
        스포츠레저: ["전문가용", "초보자용", "사계절용", "방수/방풍", "헬스용품", "요가매트", "등산스틱"],
        가구인테리어: ["북유럽스타일", "미니멀디자인", "DIY가구", "친환경소재", "1인가구", "신혼가구"],
    };
    const globalProductOptions = { /* 이전 답변의 내용 확장 (더 많은 값 추가) */
        "색상": ["빨강", "파랑", "초록", "검정", "흰색", "노랑", "분홍", "보라", "회색", "갈색", "네이비", "베이지", "아이보리", "카키", "와인", "민트", "오렌지", "골드", "실버", "크림", "차콜", "라벤더", "머스타드", "올리브그린"],
        "사이즈": ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "FREE", "85", "90", "95", "100", "105", "110", "115", "220mm", "225mm", "230mm", "235mm", "240mm", "245mm", "250mm", "255mm", "260mm", "265mm", "270mm", "275mm", "280mm", "285mm", "290mm"],
        "소재": ["면 100%", "오가닉 코튼", "폴리에스터 100%", "나일론", "레이온", "스판덱스 혼방", "린넨", "울", "캐시미어", "실크", "데님", "코듀로이", "가죽(천연)", "인조가죽(레더렛)", "기모안감", "메쉬", "고어텍스"],
        "용량": ["30ml", "50ml", "75ml", "100ml", "120ml", "150ml", "200ml", "250ml", "300ml", "400ml", "500ml", "750ml", "1L", "1.5L", "2L", "250g", "500g", "750g", "1kg", "1.5kg", "2kg", "3kg", "5kg", "10kg", "16GB", "32GB", "64GB", "128GB", "256GB", "512GB", "1TB", "2TB", "4TB"],
        "CPU": ["Intel Core i3", "Intel Core i5", "Intel Core i7", "Intel Core i9", "AMD Ryzen 3", "AMD Ryzen 5", "AMD Ryzen 7", "AMD Ryzen 9", "Apple M1", "Apple M2", "Apple M3", "Snapdragon Gen X", "Intel Ultra 5", "Intel Ultra 7"],
        "RAM": ["4GB DDR4", "8GB DDR4", "16GB DDR4", "32GB DDR4", "64GB DDR4", "8GB DDR5", "16GB DDR5", "32GB DDR5", "64GB DDR5", "12GB LPDDR5"],
        "맛": ["오리지널", "매운맛", "순한맛", "치즈맛", "갈릭맛", "어니언맛", "바베큐맛", "달콤한맛", "새콤한맛", "짭짤한맛", "과일맛", "초코맛", "딸기맛", "녹차맛", "인절미맛"],
        "포장단위": ["1개입", "2개입", "3개입", "4개입", "묶음(5개)", "묶음(6개)", "1팩", "1세트", "1박스(6개)", "1박스(10개)", "1박스(12개)", "1박스(20개)", "1박스(24개)", "벌크"],
        "중량": ["50g", "100g", "150g", "200g", "250g", "300g", "400g", "500g", "750g", "1kg", "1.2kg", "1.5kg", "2kg", "2.5kg", "3kg", "5kg"],
        "타입": ["기본형", "고급형", "전문가용", "여행용", "가정용", "업소용", "일반용", "학생용", "프로페셔널", "라이트", "미니", "표준형", "보급형", "슬림형"],
        "핏": ["슬림핏", "레귤러핏", "오버핏", "루즈핏", "스키니핏", "스트레이트핏", "부츠컷"],
        "굽높이": ["플랫(1cm 미만)", "낮은굽(1~3cm)", "미들힐(4~6cm)", "하이힐(7cm 이상)", "플랫폼"],
        "원산지": ["국내산", "수입산(미국)", "수입산(호주)", "수입산(중국)", "수입산(베트남)"],
        "보관방법": ["냉장보관", "냉동보관", "실온보관", "건조하고 서늘한 곳"],
        "화소": ["12MP", "24MP", "48MP", "50MP", "108MP", "200MP"],
        "광학줌": ["3배줌", "5배줌", "10배줌", "줌없음"],
        "방수등급": ["IPX4", "IPX7", "IP67", "IP68", "생활방수"],
        "권장연령": ["3세 이상", "7세 이상", "14세 이상", "성인용"],
        "화면크기": ["5인치", "6인치", "6.7인치", "10인치", "13인치", "15인치", "17인치", "24인치", "27인치", "32인치"],
        "해상도": ["HD", "FHD", "QHD", "4K UHD", "Retina"],
        "배터리용량": ["3000mAh", "4000mAh", "5000mAh", "6000mAh", "10000mAh"],
        "성분": ["천연성분", "유기농 성분", "무첨가물", "주요성분 표기"],
        "용도": ["일상용", "운동용", "업무용", "여행용", "선물용"]
    };
    let skuCounter = 1000;
    function generateSkuForVariant(productName, variantOptions) { /* 이전과 동일 */
        const namePart = productName.substring(0, Math.min(productName.length, 2)).toUpperCase().replace(/[^A-Z0-9]/g, '');
        const optionPart = variantOptions.map(opt => `${opt.optionName.substring(0,1)}${opt.optionValue.substring(0,Math.min(opt.optionValue.length,2))}`.toUpperCase().replace(/[^A-Z0-9]/g, '')).join('');
        skuCounter++;
        return `${namePart}${optionPart}-${String(skuCounter).padStart(4,'0')}`;
    }
    // 수정된 getOrCreateOption: productId를 인자로 받음
    async function getOrCreateOption(name, productId, transaction) {
        const [option] = await ProductOption.findOrCreate({
            where: { name: name, product_id: productId }, // 상품별 옵션이므로 product_id 조건 추가
            defaults: { name: name, product_id: productId },
            transaction
        });
        return option;
    }
    async function getOrCreateOptionValue(optionId, value, transaction) { /* 이전과 동일 */
        const [optionValue] = await ProductOptionValue.findOrCreate({
            where: { product_option_id: optionId, value: value },
            defaults: { product_option_id: optionId, value: value },
            transaction
        });
        return optionValue;
    }
    console.log("헬퍼 데이터 및 함수 정의 완료.");

    // --- 5. 상품 및 관련 데이터 대량 생성 ---
    console.log("상품 및 관련 데이터 대량 생성 시작 (총 200개 목표)...");
    const allLeafCategories = Object.values(createdCategories).filter(c =>
        !Object.values(createdCategories).some(other => other.parent_id === c.id)
    );
    if (allLeafCategories.length === 0) {
        console.error("상품을 할당할 최하위 카테고리가 없습니다.");
        await t.rollback(); return;
    }

    let productsCreatedCount = 0;
    const totalProductsToCreate = 200;

    for (let i = 0; i < totalProductsToCreate; i++) {
        // ... (상품 기본 정보 생성 로직은 이전 답변과 유사하게 유지) ...
        const randomAdjective = productSpecificAdjectives[getRandomInt(0, productSpecificAdjectives.length - 1)];
        const targetCategory = allLeafCategories[getRandomInt(0, allLeafCategories.length - 1)];
        let categoryNounsForProduct = productNounsByCategory[targetCategory.name];
        if (!categoryNounsForProduct && targetCategory.parent_id) {
            const parentCategoryName = Object.keys(createdCategories).find(key => createdCategories[key].id === targetCategory.parent_id);
            if (parentCategoryName) categoryNounsForProduct = productNounsByCategory[parentCategoryName];
        }
        if (!categoryNounsForProduct) categoryNounsForProduct = productNounsByCategory["기타카테고리상품"] || ["기본 상품"];


        const randomNoun = categoryNounsForProduct[getRandomInt(0, categoryNounsForProduct.length - 1)];

        const productName = `${randomAdjective} ${randomNoun} (${targetCategory.name}) #${i + 1}`;
        const productDescription = `${productName}. ${loremIpsum.substring(0, getRandomInt(150, 300))} 저희 ${targetCategory.name} 카테고리의 베스트셀러!`;
        const productBasePrice = getRandomInt(8, 800) * 1000;
        const currentSeller = sellers[i % sellers.length];

        const product = await Product.create({name: productName, description: productDescription, base_price: productBasePrice,
            category_id: targetCategory.id, seller_id: currentSeller.id,
            is_business_only: Math.random() < 0.1, view_count: getRandomInt(10, 10000),
            sold_count: getRandomInt(0, Math.floor(productBasePrice / 2000) + 5),
        }, { transaction: t });

        // ... (이미지, 태그, 속성값 생성 로직은 이전 답변과 유사하게 유지) ...
        // 이미지 (2-5개)
        const imageCount = getRandomInt(2, 5);
        const productImagesData = [];
        for (let j = 0; j < imageCount; j++) {
            productImagesData.push({
                product_id: product.id,
                image_url: getPlaceholderImageUrl(targetCategory.name.split('/')[0]), // 최상위 카테고리명으로 키워드 탐색
                image_type: j === 0 ? ProductImageType.THUMBNAIL : (j < 3 ? ProductImageType.DETAIL : ProductImageType.ZOOM),
                order: j + 1, alt_text: `${productName} 상세컷 ${j + 1}`
            });
        }
        if (productImagesData.length > 0) await ProductImage.bulkCreate(productImagesData, { transaction: t });

        // 태그 (3-7개)
        const productTags = getRandomSubset(commonTagsPool, getRandomInt(2, 4));
        let specificTagsForCategory = categorySpecificTags[targetCategory.name];
        if (!specificTagsForCategory && targetCategory.parent_id) {
             const parentCategoryName = Object.keys(createdCategories).find(key => createdCategories[key].id === targetCategory.parent_id);
             if(parentCategoryName) specificTagsForCategory = categorySpecificTags[parentCategoryName];
        }
        if (!specificTagsForCategory) specificTagsForCategory = [];
        productTags.push(...getRandomSubset(specificTagsForCategory, getRandomInt(1,3)));
        const tagInstances = [];
        for (const tagName of new Set(productTags)) { // 중복 태그 방지
            if (tagName && tagName.trim() !== '') { // 유효한 태그 이름만
                const [tag] = await Tag.findOrCreate({ where: { name: tagName.trim() }, defaults: { name: tagName.trim() }, transaction: t });
                tagInstances.push(tag);
            }
        }
        if (tagInstances.length > 0) await product.addTags(tagInstances, { transaction: t });

        // 상품 속성값
        const pavToCreate = [];
        const categoryAttributes = await CategoryAttribute.findAll({ where: {category_id: targetCategory.id}, include: [{model: Attribute, as: 'attribute'}], transaction:t });
        for (const catAttr of categoryAttributes) {
            const attribute = catAttr.attribute;
            if (attribute && globalProductOptions[attribute.name]) {
                const possibleValues = globalProductOptions[attribute.name];
                pavToCreate.push({ product_id: product.id, attribute_id: attribute.id, value: possibleValues[getRandomInt(0, possibleValues.length-1)] });
            } else if (attribute) {
                let value = `${attribute.name} 샘플 ${i}`;
                if (attribute.data_type === AttributeDataType.NUMBER) value = String(getRandomInt(10, 5000));
                else if (attribute.data_type === AttributeDataType.BOOLEAN) value = Math.random() < 0.7 ? 'true' : 'false';
                else if (attribute.data_type === AttributeDataType.DATE) value = new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 365 * 2).toISOString().split('T')[0];
                pavToCreate.push({ product_id: product.id, attribute_id: attribute.id, value });
            }
        }
        if (pavToCreate.length > 0) await ProductAttributeValue.bulkCreate(pavToCreate, { transaction: t, ignoreDuplicates: true });


        // ProductVariant 생성 로직 (getOrCreateOption에 product.id 전달)
        const numVariants = getRandomInt(1, 7);
        let variantOptionKeys = [];
        const mainCategoryNameForOptions = targetCategory.name.split('/')[0];
        if (["패션의류", "여성의류", "남성의류", "신발", "가방", "모자", "주얼리시계"].some(cat => mainCategoryNameForOptions.includes(cat) || targetCategory.name.includes(cat))) {
            variantOptionKeys = getRandomSubset(["색상", "사이즈", "소재", "핏", "굽높이"], getRandomInt(1,3));
        } else if (["가전", "컴퓨터", "모바일", "카메라"].some(cat => mainCategoryNameForOptions.includes(cat) || targetCategory.name.includes(cat))) {
            variantOptionKeys = getRandomSubset(["색상", "저장용량", "RAM", "CPU", "화면크기", "배터리용량"], getRandomInt(1,3));
        } else if (["식품", "신선식품", "가공식품", "음료", "건강식품"].some(cat => mainCategoryNameForOptions.includes(cat) || targetCategory.name.includes(cat))) {
            variantOptionKeys = getRandomSubset(["맛", "포장단위", "중량", "원산지"], getRandomInt(1,2));
        } else {
            variantOptionKeys = getRandomSubset(Object.keys(globalProductOptions), 1);
        }
        variantOptionKeys = variantOptionKeys.filter(key => globalProductOptions[key] && createdAttributes[key]); // globalProductOptions와 createdAttributes에 모두 있는 키만 사용

        const optionInstancesCache = {};
        const optionValueInstancesCache = {};

        const variantsToCreate = [];
        const createdVariantOptionCombos = new Set();

        if (variantOptionKeys.length > 0) {
            const allCombinations = [];
            const generateCombinations = async (currentIndex, currentCombination) => {
                if (currentIndex === variantOptionKeys.length) {
                    allCombinations.push([...currentCombination]); return;
                }
                const currentOptionKey = variantOptionKeys[currentIndex];
                if (!optionInstancesCache[currentOptionKey]) {
                    optionInstancesCache[currentOptionKey] = await getOrCreateOption(currentOptionKey, product.id, t); // product.id 전달
                }
                const optionInstance = optionInstancesCache[currentOptionKey];

                const possibleValues = globalProductOptions[currentOptionKey] || [];
                const selectedValues = getRandomSubset(possibleValues, getRandomInt(1, Math.min(possibleValues.length, 3)));

                for (const value of selectedValues) {
                    if (!optionValueInstancesCache[optionInstance.id]) optionValueInstancesCache[optionInstance.id] = {};
                    if (!optionValueInstancesCache[optionInstance.id][value]) {
                        optionValueInstancesCache[optionInstance.id][value] = await getOrCreateOptionValue(optionInstance.id, value, t);
                    }
                    const optionValueInstance = optionValueInstancesCache[optionInstance.id][value];

                    currentCombination.push({
                        optionName: currentOptionKey, optionValue: value,
                        product_option_id: optionInstance.id, product_option_value_id: optionValueInstance.id
                    });
                    await generateCombinations(currentIndex + 1, currentCombination);
                    currentCombination.pop();
                }
            };
            if(variantOptionKeys.length > 0) await generateCombinations(0, []); // await 추가

            const shuffledCombinations = getRandomSubset(allCombinations, numVariants * 2);

            for (const combo of shuffledCombinations) {
                if(variantsToCreate.length >= numVariants) break;
                const uniqueComboKey = combo.map(c => `${c.product_option_id}:${c.product_option_value_id}`).sort().join('-');
                if (createdVariantOptionCombos.has(uniqueComboKey) || combo.length === 0) continue;
                createdVariantOptionCombos.add(uniqueComboKey);
                variantsToCreate.push({
                  sku: generateSkuForVariant(productName.substring(0,8), combo.map(c => ({optionName:c.optionName, optionValue: c.optionValue}))),
                  price: productBasePrice + getRandomInt(-10, 20) * (productBasePrice > 100000 ? 1000 : 500),
                  stock_quantity: getRandomInt(0, 300),
                  is_active: Math.random() < 0.97,
                  optionLinks: combo.map(c => ({product_option_id: c.product_option_id, product_option_value_id: c.product_option_value_id}))
                }); // 이전과 동일
            }
        }
        // ... (나머지 Variant 생성 및 저장 로직은 이전 답변과 유사하게 유지, getOrCreateOption 호출 시 product.id 전달 확인) ...
        if (variantsToCreate.length === 0) { // 옵션 조합이 없거나, 단일 상품일 경우 기본 Variant 생성
            variantsToCreate.push({
                sku: generateSkuForVariant(productName.substring(0,8), [{optionName: "STD", optionValue:"DEF"}]),
                price: productBasePrice, stock_quantity: getRandomInt(10, 200), is_active: true, optionLinks: []
            });
        }

        for (const vtData of variantsToCreate) {
            if (vtData.price <= 0) vtData.price = getRandomInt(1,5) * 100;
            const variant = await ProductVariant.create({
                product_id: product.id, sku: vtData.sku, price: vtData.price,
                stock_quantity: vtData.stock_quantity, is_active: vtData.is_active,
            }, { transaction: t });

            const pvoValuesToCreate = vtData.optionLinks.map(link => ({
                variant_id: variant.id, product_option_id: link.product_option_id,
                product_option_value_id: link.product_option_value_id
            }));
            if (pvoValuesToCreate.length > 0) {
                await ProductVariantOptionValue.bulkCreate(pvoValuesToCreate, { transaction: t, ignoreDuplicates: true });
            }
        }

        productsCreatedCount++;
        if (productsCreatedCount % 20 === 0 || productsCreatedCount === totalProductsToCreate) console.log(`상품 ${productsCreatedCount}개 / ${totalProductsToCreate}개 및 관련 데이터 생성 완료...`);
    }
    console.log(`총 ${productsCreatedCount}개의 상품 및 관련 데이터 생성 완료 (최종).`);

    const allCreatedProducts = await Product.findAll({ attributes: ['id', 'name', 'base_price', 'category_id'], transaction: t });
    if (allCreatedProducts.length === 0) {
        console.warn("상품이 생성되지 않아 일부 프로모션(상품 할인 등)은 생성되지 않거나 제한됩니다.");
    }


    // --- (신규) 9. 쿠폰(Coupon) 데이터 생성 (약 30개) ---
    console.log("쿠폰 데이터 생성 시작...");
    const createdCoupons = [];
    const couponCodes = new Set(); // 유니크 코드 보장

    for (let i = 0; i < 30; i++) {
        let newCode;
        do {
            newCode = `SUMMER${getRandomInt(2024, 2025)}${String(i).padStart(3,'0')}${getRandomSubset(['SP','SALE','OFF','SAVE'],1)[0]}${getRandomInt(10,99)}`;
        } while (couponCodes.has(newCode));
        couponCodes.add(newCode);

        const discountType = Math.random() < 0.6 ? DiscountType.PERCENTAGE : DiscountType.FIXED_AMOUNT;
        const discountValue = discountType === DiscountType.PERCENTAGE ? getRandomInt(5, 30) : getRandomInt(1, 10) * 1000; // 5-30% 또는 1000-10000원
        const validDays = getRandomInt(30, 180); // 유효기간 30~180일
        const validFrom = new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * (validDays/2) ); // 유효기간 중간쯤부터 시작하거나 이미 시작
        const validTo = new Date(validFrom.getTime() + validDays * 24 * 60 * 60 * 1000);

        const coupon = await Coupon.create({
            code: newCode,
            discount_type: discountType,
            discount_value: discountValue,
            valid_from: Math.random() < 0.8 ? validFrom : null, // 20%는 시작일 없음
            valid_to: validTo,
            min_purchase_amount: Math.random() < 0.7 ? getRandomInt(2, 10) * 10000 : null, // 70% 확률로 최소구매금액(2~10만원)
            usage_limit_per_user: Math.random() < 0.5 ? 1 : null, // 50% 확률로 사용자당 1회
            total_usage_limit: Math.random() < 0.3 ? getRandomInt(50, 200) : null, // 30% 확률로 전체 사용량 제한
            is_active: Math.random() < 0.9, // 90% 활성
            // current_usage_count는 기본값 0
        }, { transaction: t });
        createdCoupons.push(coupon);
    }
    console.log(`총 ${createdCoupons.length}개의 쿠폰 생성 완료.`);


    // --- (신규) 10. 프로모션(Promotion) 데이터 생성 (약 70개, 쿠폰형 포함) ---
    console.log("프로모션 데이터 생성 시작...");
    const createdPromotions = [];
    const promotionNames = [
        "시즌오프 특가", "신규회원 환영", "주말 깜짝 할인", "가정의 달 특별전", "여름맞이 쿨세일",
        "블랙프라이데이 예고", "브랜드 위크", "타임딜", "N개 이상 구매시 추가할인", "리뷰 작성 이벤트"
    ];

    // 10a. 코드 쿠폰형 프로모션 (위에서 생성된 쿠폰과 연결)
    for (let i = 0; i < Math.min(createdCoupons.length, 20); i++) { // 생성된 쿠폰 중 최대 20개를 프로모션으로 연결
        const coupon = createdCoupons[i];
        const promotion = await Promotion.create({
            name: `${coupon.code} 쿠폰 프로모션 (${coupon.discount_type === DiscountType.PERCENTAGE ? coupon.discount_value + "%" : coupon.discount_value + "원"} 할인)`,
            description: `쿠폰 코드 '${coupon.code}'를 입력하고 특별 할인을 받으세요! 유효기간: ~${coupon.valid_to ? coupon.valid_to.toLocaleDateString() : '무기한'}`,
            promotion_type: PromotionType.CODE_COUPON,
            discount_type: coupon.discount_type,
            discount_value: coupon.discount_value,
            max_discount_amount: coupon.discount_type === DiscountType.PERCENTAGE ? Math.floor(parseFloat(coupon.discount_value) * getRandomInt(500, 2000)) : null, // %할인시 최대 할인액 (500~2000 * 할인율)
            start_date: coupon.valid_from || new Date(),
            end_date: coupon.valid_to,
            is_active: coupon.is_active,
            priority: 10, // 코드 쿠폰은 우선순위 높게
            coupon_id: coupon.id
        }, { transaction: t });

        // 코드 쿠폰 프로모션 조건 추가 (예: 최소 구매 금액)
        if (coupon.min_purchase_amount) {
            await PromotionCondition.create({
                promotion_id: promotion.id,
                condition_type: PromotionConditionType.MIN_PURCHASE_AMOUNT,
                decimal_value: coupon.min_purchase_amount
            }, { transaction: t });
        }
        createdPromotions.push(promotion);
    }

    // 10b. 기타 유형 프로모션 생성 (약 50개)
    const otherPromotionTypes = [PromotionType.CART_DISCOUNT, PromotionType.PRODUCT_DISCOUNT, PromotionType.SHIPPING_DISCOUNT, PromotionType.CARD_BENEFIT];
    for (let i = 0; i < 50; i++) {
        const promoType = otherPromotionTypes[i % otherPromotionTypes.length];
        const promoNameBase = promotionNames[i % promotionNames.length];
        const discountType = Math.random() < 0.5 ? DiscountType.PERCENTAGE : DiscountType.FIXED_AMOUNT;
        const discountValue = discountType === DiscountType.PERCENTAGE ? getRandomInt(5, 25) : getRandomInt(2, 15) * 1000;
        const activeDays = getRandomInt(7, 90);
        const startDate = new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * (activeDays - 5) ); // 최근 시작
        const endDate = new Date(startDate.getTime() + activeDays * 24 * 60 * 60 * 1000);

        const promotionData = {
            name: `${promoNameBase} - ${promoType} #${i+1}`,
            description: `${promoType} 특별 프로모션입니다. ${loremIpsum.substring(0,50)}`,
            promotion_type: promoType,
            discount_type: discountType,
            discount_value: discountValue,
            max_discount_amount: discountType === DiscountType.PERCENTAGE ? Math.floor(discountValue * getRandomInt(1000,3000)) : null,
            start_date: startDate,
            end_date: Math.random() < 0.8 ? endDate : null, // 20%는 종료일 없음
            is_active: Math.random() < 0.85, // 85% 활성
            priority: getRandomInt(0, 5)
        };
        const promotion = await Promotion.create(promotionData, { transaction: t });

        // 프로모션 조건 생성
        const conditionsToCreate = [];
        // 최소 구매 금액 조건 (50% 확률로 추가)
        if (Math.random() < 0.5) {
            conditionsToCreate.push({
                promotion_id: promotion.id,
                condition_type: PromotionConditionType.MIN_PURCHASE_AMOUNT,
                decimal_value: getRandomInt(3, 15) * 10000 // 3~15만원
            });
        }
        // 카드사 조건 (프로모션 타입이 CARD_BENEFIT 이거나 20% 확률로 추가)
        if (promoType === PromotionType.CARD_BENEFIT || Math.random() < 0.2) {
            conditionsToCreate.push({
                promotion_id: promotion.id,
                condition_type: PromotionConditionType.CARD_ISSUER,
                card_issuer_value: Object.values(CardIssuer)[getRandomInt(0, Object.values(CardIssuer).length - 1)]
            });
        }
        if (conditionsToCreate.length > 0) {
            await PromotionCondition.bulkCreate(conditionsToCreate, { transaction: t });
        }

        // 상품 할인 프로모션일 경우, 특정 상품 연결 (PromotionProduct)
        if (promoType === PromotionType.PRODUCT_DISCOUNT && allCreatedProducts.length > 0) {
            const numApplicableProducts = getRandomInt(1, Math.min(5, allCreatedProducts.length)); // 1~5개 상품에 적용
            const applicableProducts = getRandomSubset(allCreatedProducts, numApplicableProducts);
            const promotionProductsData = applicableProducts.map(p => ({
                promotion_id: promotion.id,
                product_id: p.id
            }));
            if (promotionProductsData.length > 0) {
                await PromotionProduct.bulkCreate(promotionProductsData, { transaction: t });
            }
        }
        createdPromotions.push(promotion);
    }
    console.log(`총 ${createdPromotions.length}개의 프로모션 생성 완료.`);


    // --- (신규) 11. 사용자 쿠폰 발급 (UserCoupon) 시뮬레이션 (약 100건) ---
    console.log("사용자 쿠폰 발급 시뮬레이션 시작...");
    const createdUserCoupons = [];
    const codeCouponsForIssuance = createdPromotions.filter(p => p.promotion_type === PromotionType.CODE_COUPON && p.coupon_id && p.is_active);

    if (codeCouponsForIssuance.length > 0 && buyers.length > 0) {
        for (let i = 0; i < 100; i++) {
            const targetPromotion = codeCouponsForIssuance[i % codeCouponsForIssuance.length];
            const targetUser = buyers[i % buyers.length];

            // 이미 발급받았는지 확인 (엄밀하게는 쿠폰별 사용자당 발급제한 체크 필요)
            const existingUserCoupon = await UserCoupon.findOne({
                where: { user_id: targetUser.id, coupon_id: targetPromotion.coupon_id },
                transaction: t
            });
            if (existingUserCoupon) continue; // 이미 있으면 스킵

            // 쿠폰의 총 사용량 및 사용자별 사용량 제한 확인 (간단히)
            const couponDetails = await Coupon.findByPk(targetPromotion.coupon_id, {transaction:t});
            if (!couponDetails || !couponDetails.is_active) continue;
            if (couponDetails.total_usage_limit && couponDetails.current_usage_count >= couponDetails.total_usage_limit) continue;
            // 사용자별 제한은 UserCoupon 생성 후 카운트해야 정확하나, 시딩에서는 단순화

            const userCouponData = {
                user_id: targetUser.id,
                coupon_id: targetPromotion.coupon_id,
                // used_at, order_id는 사용 시 업데이트
            };
            // UserCoupon 모델에 issued_at 또는 created_at이 자동생성되지 않는다면 명시적 추가
            if (UserCoupon.rawAttributes.issued_at) userCouponData.issued_at = new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 10); // 최근 10일 이내 발급


            const uc = await UserCoupon.create(userCouponData, { transaction: t });
            // 쿠폰 현재 사용량 증가 (리딤 시점으로 가정)
            await Coupon.increment('current_usage_count', { by: 1, where: { id: targetPromotion.coupon_id }, transaction: t });

            createdUserCoupons.push(uc);
            if (createdUserCoupons.length % 20 === 0) console.log(`사용자 쿠폰 ${createdUserCoupons.length}건 발급 완료...`);
        }
    }
    console.log(`총 ${createdUserCoupons.length}건의 사용자 쿠폰 발급 완료.`);

    // --- 6. 주문(Order) 및 관련 데이터 생성 ---
    // ... (이전 답변의 주문 생성 로직) ...
    // calculateShippingFee, applyPromotionsAndCoupons 함수는 seed.js 파일 하단에 정의된 임시 함수 사용
    console.log("주문 데이터 생성 시작...");
    const createdOrders = [];
    const allProductVariantsWithStock = await ProductVariant.findAll({
        where: { is_active: true, stock_quantity: { [Op.gte]: 1 } },
        include: [{model: Product, as: 'product', attributes:['seller_id', 'id', 'name']}], // product.name 포함
        limit: 1000,
        transaction: t
    });

    if (allProductVariantsWithStock.length === 0) {
        console.warn("주문 생성에 사용할 수 있는 활성 상품 Variant가 없습니다.");
    } else {
        const numOrdersToCreate = 200;
        const shippingMethods = await ShippingMethod.findAll({ where: {is_active: true}, transaction: t});
        if(shippingMethods.length === 0) {
            console.error("주문 생성에 사용할 배송 방법이 없습니다. ShippingMethod를 먼저 시딩하세요.");
            await t.rollback(); return;
        }


        for (let i = 0; i < numOrdersToCreate; i++) {
            const currentUser = buyers[i % buyers.length];
            let shippingAddress = await ShippingAddress.findOne({ where: {user_id: currentUser.id}, order:sequelize.literal('RAND()'), transaction:t});
            if (!shippingAddress) {
                shippingAddress = await ShippingAddress.create({
                    user_id: currentUser.id, name: `${currentUser.name}님의 기본배송지`, recipient_name: currentUser.name, phone: currentUser.phone,
                    address: `랜덤시 ${getRandomInt(1,100)}동 ${getRandomInt(1,500)}호`, city: "서울", zipcode: `0${getRandomInt(1000,9999)}`,
                    country: 'KR', is_default: true
                }, {transaction: t});
            }

            const numItemsInOrder = getRandomInt(1, 4);
            const orderItemsDataForCreation = [];
            let currentSubTotalAmount = 0;
            const tempOrderItemsForShippingCalc = [];
            const variantsInThisOrder = new Set();

            for (let j = 0; j < numItemsInOrder; j++) {
              let randomVariant;
              let attempts = 0;
              do {
                randomVariant = allProductVariantsWithStock[getRandomInt(0, allProductVariantsWithStock.length - 1)];
                attempts++;
              } while (randomVariant && variantsInThisOrder.has(randomVariant.id) && attempts < allProductVariantsWithStock.length * 2);

              if (!randomVariant || variantsInThisOrder.has(randomVariant.id) || randomVariant.stock_quantity <= 0) continue;

              const quantity = getRandomInt(1, Math.min(3, randomVariant.stock_quantity));
              // if (randomVariant.stock_quantity < quantity) continue; // 위에서 이미 체크

              variantsInThisOrder.add(randomVariant.id);
              const priceAtPurchase = parseFloat(randomVariant.price);
              const totalPriceAtPurchase = priceAtPurchase * quantity;
              currentSubTotalAmount += totalPriceAtPurchase;

              orderItemsDataForCreation.push({
                product_variant_id: randomVariant.id, quantity: quantity, price_at_purchase: priceAtPurchase,
                total_price_at_purchase: totalPriceAtPurchase, status: OrderItemStatus.PENDING,
                comment: Math.random() < 0.05 ? `빠른 배송 부탁드려요! #${j}` : null
              });
              if (randomVariant.product) { // seller_id 접근 전 확인
                tempOrderItemsForShippingCalc.push({ product_variant_id: randomVariant.id, quantity: quantity, seller_id: randomVariant.product.seller_id, variant_price_after_discount: priceAtPurchase});
              }


              // 시딩 시 실제 재고 차감 (동시성 고려 불필요)
              const variantToUpdate = allProductVariantsWithStock.find(v => v.id === randomVariant.id);
              if (variantToUpdate) variantToUpdate.stock_quantity -= quantity; // 메모리상 재고 우선 차감
            }

            if (orderItemsDataForCreation.length === 0) { i--; continue; }

            const tempDiscountInfo = await applyPromotionsAndCoupons(currentUser.id, tempOrderItemsForShippingCalc, currentSubTotalAmount, null, t);
            const tempShippingFee = await calculateShippingFee(tempOrderItemsForShippingCalc, tempDiscountInfo.finalAmountBeforeShipping, shippingAddress.id, t);
            const tempFinalAmount = tempDiscountInfo.finalAmountBeforeShipping + tempShippingFee;

            const orderDate = new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 180);
            const order = await Order.create({
              user_id: currentUser.id, recipient_name: shippingAddress.recipient_name, recipient_phone: shippingAddress.phone,
              recipient_address: shippingAddress.address, recipient_address_detail: shippingAddress.address_detail, recipient_zipcode: shippingAddress.zipcode,
              status: OrderStatus.PENDING, sub_total_amount: currentSubTotalAmount, shipping_fee: tempShippingFee,
              coupon_discount_amount: tempDiscountInfo.couponDiscountAmount, promotion_discount_amount: tempDiscountInfo.promotionDiscountAmount,
              total_discount_amount: tempDiscountInfo.totalDiscountAmount, final_amount: tempFinalAmount, created_at: orderDate
            }, { transaction: t });

            await OrderItem.bulkCreate( orderItemsDataForCreation.map(item => ({ ...item, order_id: order.id })), { transaction: t } );

            // ... (Payment, Shipment, 상태 업데이트 로직은 이전 답변과 동일하게 유지) ...
            const paymentStatusRoll = Math.random();
            let paymentStatusValue;
            if (paymentStatusRoll < 0.8) paymentStatusValue = PaymentStatus.COMPLETED;
            else if (paymentStatusRoll < 0.95) paymentStatusValue = PaymentStatus.PENDING;
            else paymentStatusValue = PaymentStatus.FAILED;

            const payment = await Payment.create({
                order_id: order.id, payment_method_type: Object.values(PaymentMethodType)[getRandomInt(0, Object.values(PaymentMethodType).length -1)],
                amount: order.final_amount, status: paymentStatusValue,
                paid_at: paymentStatusValue === PaymentStatus.COMPLETED ? new Date(orderDate.getTime() + getRandomInt(1,60) * 60000) : null,
                transaction_id: `SEED_TID_${order.id}_${Date.now()}`
            }, { transaction: t });

            if (paymentStatusValue === PaymentStatus.COMPLETED) {
                let orderTargetStatus = OrderStatus.PROCESSING;
                let itemTargetStatus = OrderItemStatus.PREPARING;

                if (Math.random() < 0.9) {
                    const shipmentStatusRoll = Math.random();
                    let shipmentStatusValue;
                    if(shipmentStatusRoll < 0.7) {
                        shipmentStatusValue = ShipmentStatus.DELIVERED;
                        orderTargetStatus = OrderStatus.DELIVERED;
                        itemTargetStatus = OrderItemStatus.DELIVERED;
                    } else {
                        shipmentStatusValue = ShipmentStatus.PICKED_UP;
                        orderTargetStatus = OrderStatus.SHIPPED;
                        itemTargetStatus = OrderItemStatus.SHIPPED;
                    }
                    const shippedAtDate = new Date(payment.paid_at.getTime() + getRandomInt(1,3) * 60 * 60 * 1000);
                    const shipment = await Shipment.create({
                        order_id: order.id, shipping_method_id: shippingMethods[i % shippingMethods.length].id,
                        cost: order.shipping_fee, tracking_number: `SEED_TRACK_${order.id}`, status: shipmentStatusValue,
                        shipped_at: shippedAtDate,
                        recipient_name: order.recipient_name, recipient_phone: order.recipient_phone, recipient_address: order.recipient_address,
                        recipient_address_detail: order.recipient_address_detail, recipient_zipcode: order.recipient_zipcode,
                    }, { transaction: t });
                }
                await order.update({ status: orderTargetStatus }, { transaction: t });
                await OrderItem.update({ status: itemTargetStatus }, {where: {order_id: order.id}, transaction:t});

            } else if (paymentStatusValue === PaymentStatus.FAILED) {
                 await order.update({ status: OrderStatus.CANCELLED }, { transaction: t });
                 await OrderItem.update({ status: OrderItemStatus.CANCELLED }, {where: {order_id: order.id}, transaction:t});
                 for(const oiData of orderItemsDataForCreation) { // 메모리상 재고 복구
                    const variantToRestore = allProductVariantsWithStock.find(v => v.id === oiData.product_variant_id);
                    if(variantToRestore) variantToRestore.stock_quantity += oiData.quantity;
                 }
            }
            createdOrders.push(order);
            if ((i + 1) % 20 === 0 || (i+1) === numOrdersToCreate) console.log(`주문 ${i + 1}개 생성 완료...`);
        }
    }
    console.log(`총 ${createdOrders.length}개의 주문 및 관련 데이터 생성 완료.`);


    // --- 7. 리뷰(Review) 및 관련 데이터 생성 ---
    // ... (이전 답변의 리뷰 생성 로직, ProductVariant include 시 Product as 'product'에 name 포함하도록) ...
    console.log("리뷰 데이터 생성 시작...");
    const createdReviews = [];
    const deliveredOrderItemsForReview = await OrderItem.findAll({
        where: { status: OrderItemStatus.DELIVERED },
        include: [
            {model: Order, as: 'order', attributes: ['user_id', 'created_at']},
            {model: ProductVariant, as: 'product_variant', include: [{model: Product, as: 'product', attributes: ['id', 'name']}]} // Product name 포함
        ],
        limit: 1000,
        transaction: t
    });

    if (deliveredOrderItemsForReview.length > 0) {
        const numReviewsToCreate = 200;
        for (let i = 0; i < numReviewsToCreate; i++) {
            const targetOrderItem = deliveredOrderItemsForReview[i % deliveredOrderItemsForReview.length];
            if(!targetOrderItem.order || !targetOrderItem.product_variant || !targetOrderItem.product_variant.product) continue;

            const existingReview = await Review.findOne({where: {user_id: targetOrderItem.order.user_id, product_id: targetOrderItem.product_variant.product.id, order_item_id: targetOrderItem.id }, transaction:t});
            if(existingReview) { continue; }

            const reviewDate = new Date(targetOrderItem.order.created_at.getTime() + (getRandomInt(3, 15) * 24 * 60 * 60 * 1000) );
            // Review 생성시 필드 채우기
            const createdReview = await Review.create({
                user_id: targetOrderItem.order.user_id,
                product_id: targetOrderItem.product_variant.product.id,
                order_item_id: targetOrderItem.id,
                rating: getRandomInt(3, 5),
                comment: `[${targetOrderItem.product_variant.product.name.substring(0,15)}...] 상품 리뷰입니다. ${loremIpsum.substring(0, getRandomInt(50, 200))} #${i+1}`,
                created_at: reviewDate
            }, { transaction: t });


            if (Math.random() < 0.4) { /* ... 이미지 생성 로직 ... */
                const numReviewImages = getRandomInt(1, 3);
                const reviewImagesData = [];
                for (let j = 0; j < numReviewImages; j++) {
                    reviewImagesData.push({
                        review_id: createdReview.id, image_url: getPlaceholderImageUrl('review'), order: j + 1
                    });
                }
                await ReviewImage.bulkCreate(reviewImagesData, { transaction: t });
            }
            createdReviews.push(createdReview); // review -> createdReview
            if ((i + 1) % 20 === 0 || (i+1) === numReviewsToCreate) console.log(`리뷰 ${i + 1}개 생성 완료...`);
        }
    }
    console.log(`총 ${createdReviews.length}개의 리뷰 생성 완료.`);


    // --- 8. QnA 및 관련 데이터 생성 ---
    // ... (이전 답변의 QnA 생성 로직, Product include 시 seller 정보 포함하도록) ...
    console.log("QnA 데이터 생성 시작...");
    const createdQnAs = [];
    const allProductsForQnA = await Product.findAll({ include:[{model: User, as: 'seller', attributes: ['id', 'name']}], limit: 1000, order: sequelize.literal('RAND()'), transaction:t }); // seller name 포함

    if (allProductsForQnA.length > 0 && buyers.length > 0) {
        const numQnAsToCreate = 200;
        for (let i = 0; i < numQnAsToCreate; i++) {
            const targetProduct = allProductsForQnA[i % allProductsForQnA.length];
            const asker = buyers[i % buyers.length];

            const questionDate = new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 60);
            // QnA 생성시 필드 채우기
            const createdQnA = await QnA.create({
                user_id: asker.id,
                product_id: targetProduct.id,
                seller_id: targetProduct.seller_id, // 수정: targetProduct.seller.id -> targetProduct.seller_id
                title: `[문의] ${targetProduct.name.substring(0,20)}... 재입고/배송 등 문의 #${i+1}`,
                question: `${loremIpsum.substring(getRandomInt(0,50), getRandomInt(100, 300))} 문의드립니다.`,
                is_secret: Math.random() < 0.25,
                questioned_at: questionDate,
            }, { transaction: t });

            if (Math.random() < 0.65 && targetProduct.seller_id) {
                await createdQnA.update({ // qna -> createdQnA
                    answer: `안녕하세요, ${targetProduct.seller.name}입니다. 문의주셔서 감사합니다. ${loremIpsum.substring(getRandomInt(0,30), getRandomInt(100,400))} 즐거운 쇼핑 되세요.`,
                    answered_at: new Date(questionDate.getTime() + getRandomInt(1,3) * 24 * 60 * 60 * 1000)
                }, { transaction: t });
            }
            createdQnAs.push(createdQnA); // qna -> createdQnA
            if ((i + 1) % 20 === 0 || (i+1) === numQnAsToCreate) console.log(`QnA ${i + 1}개 생성 완료...`);
        }
    }
    console.log(`총 ${createdQnAs.length}개의 QnA 생성 완료.`);

    // --- (신규) 12. 환불(Refund) 및 환불 아이템(RefundItem) 데이터 생성 (약 50건) ---
    console.log("환불 데이터 생성 시작...");
    const createdRefunds = [];
    // 환불 대상이 될 수 있는 주문들: 배송 완료 또는 배송 중이고, 결제가 완료된 주문
    const ordersEligibleForRefund = await Order.findAll({
        where: {
            status: { [Op.in]: [OrderStatus.DELIVERED, OrderStatus.SHIPPED] },
        },
        include: [
            { model: OrderItem, as: 'items', where: { status: { [Op.in]: [OrderItemStatus.DELIVERED, OrderItemStatus.SHIPPED] } }, required: true }, // 해당 상태의 아이템이 있는 주문만
            { model: Payment, as: 'payments', where: { status: PaymentStatus.COMPLETED }, required: true },
            { model: User, as: 'user', attributes: ['id', 'name']} // 주문자 정보 (환불 처리자 할당 시 참고용)
        ],
        limit: 100, // 환불 데이터 생성할 후보 주문 수
        order: sequelize.literal('RAND()'), // 랜덤하게 주문 선택
        transaction: t
    });

    const adminUserForProcessing = await User.findOne({
        include: [{model: UserRole, as: 'roles', where: {role: RoleType.ADMIN }}],
        transaction: t
    });

    if (ordersEligibleForRefund.length > 0 && adminUserForProcessing) {
      for (let i = 0; i < Math.min(ordersEligibleForRefund.length, 50); i++) { // 최대 50건 환불 데이터 생성
        const orderToRefund = ordersEligibleForRefund[i];
        if (!orderToRefund.items || orderToRefund.items.length === 0 || !orderToRefund.payments || orderToRefund.payments.length === 0) continue;

        const itemsToRefundInThisOrder = getRandomSubset(orderToRefund.items, getRandomInt(1, orderToRefund.items.length)); // 주문 내 일부 또는 전체 아이템 환불
        if (itemsToRefundInThisOrder.length === 0) continue;

        let productItemsTotalAmountForRefund = 0;
        const refundItemsData = [];

        for (const orderItem of itemsToRefundInThisOrder) {
          const refundQuantity = getRandomInt(1, orderItem.quantity); // 아이템의 일부 또는 전체 수량 환불
          const itemPriceAtRefundTime = parseFloat(orderItem.price_at_purchase);
          const itemTotalAmountForRefund = itemPriceAtRefundTime * refundQuantity;
          productItemsTotalAmountForRefund += itemTotalAmountForRefund;

          refundItemsData.push({
            // refund_id는 Refund 생성 후
            order_item_id: orderItem.id,
            quantity: refundQuantity,
            item_price_at_refund_time: itemPriceAtRefundTime,
            item_total_amount: itemTotalAmountForRefund,
          });
        }

        if (productItemsTotalAmountForRefund <= 0) continue;

        const refundReasonType = Object.values(RefundReasonType)[getRandomInt(0, Object.values(RefundReasonType).length - 1)];
        const refundStatusRoll = Math.random();
        let refundCurrentStatus;
        let processedAt = null;
        let processedBy = null;

        if (refundStatusRoll < 0.6) { // 60% 환불 완료
          refundCurrentStatus = RefundStatus.COMPLETED;
          processedAt = new Date(orderToRefund.updated_at.getTime() + getRandomInt(1, 5) * 24 * 60 * 60 * 1000); // 주문 업데이트 후 1~5일 이내 처리
          processedBy = adminUserForProcessing.id;
        } else if (refundStatusRoll < 0.85) { // 25% 환불 처리중 또는 승인
          refundCurrentStatus = Math.random() < 0.5 ? RefundStatus.PROCESSING : RefundStatus.APPROVED;
          processedAt = new Date(orderToRefund.updated_at.getTime() + getRandomInt(1, 2) * 24 * 60 * 60 * 1000);
          processedBy = adminUserForProcessing.id;
        } else { // 15% 환불 요청 상태 또는 거절
          refundCurrentStatus = Math.random() < 0.7 ? RefundStatus.REQUESTED : RefundStatus.REJECTED;
            if(refundCurrentStatus === RefundStatus.REJECTED){
              processedAt = new Date(orderToRefund.updated_at.getTime() + getRandomInt(1, 2) * 24 * 60 * 60 * 1000);
              processedBy = adminUserForProcessing.id;
            }
        }

        // 단순화를 위해 배송비 차감 등은 0으로 가정
        const shippingFeeDeduction = 0;
        const otherDeductions = 0;
        const finalRefundAmount = productItemsTotalAmountForRefund - shippingFeeDeduction - otherDeductions;

        const refund = await Refund.create({
          order_id: orderToRefund.id,
          payment_id: orderToRefund.payments[0].id, // 첫 번째 완료된 결제 건에 대한 환불로 가정
          product_items_total_amount: productItemsTotalAmountForRefund,
          shipping_fee_deduction: shippingFeeDeduction,
          other_deductions: otherDeductions,
          final_refund_amount: finalRefundAmount,
          refund_reason: refundReasonType,
          refund_reason_detail: refundCurrentStatus === RefundStatus.REJECTED ? "환불 규정 위반 (예시)" : (refundReasonType === RefundReasonType.ETC ? "기타 사유로 환불 요청합니다." : `${refundReasonType}으로 인한 환불 요청입니다.`),
          status: refundCurrentStatus,
          processed_at: processedAt,
          processed_by: processedBy,
          transaction_id: refundCurrentStatus === RefundStatus.COMPLETED ? `REFUND_TID_${Date.now()}_${i}` : null,
          // requested_at, created_at, updated_at은 자동 또는 기본값
        }, { transaction: t });

        await RefundItem.bulkCreate(
          refundItemsData.map(riData => ({ ...riData, refund_id: refund.id })),
          { transaction: t }
        );

        // 환불 완료 시 관련 데이터 업데이트
        if (refundCurrentStatus === RefundStatus.COMPLETED) {
          // 1. 주문 아이템 상태 변경 (RETURNED) 및 재고 복구
          for (const refItemData of refundItemsData) {
            await OrderItem.update(
              { status: OrderItemStatus.RETURNED },
              { where: { id: refItemData.order_item_id }, transaction: t }
            );
            const orderItemForStock = await OrderItem.findByPk(refItemData.order_item_id, {include: [{model: ProductVariant, as: 'product_variant'}], transaction:t});
            if(orderItemForStock && orderItemForStock.product_variant){
              await ProductVariant.increment('stock_quantity', {
                by: refItemData.quantity,
                where: { id: orderItemForStock.product_variant_id },
                transaction: t
              });
            }
          }

            // 2. 결제 상태 변경 (REFUNDED 또는 PARTIALLY_REFUNDED)
            // 주문 전체 금액과 최종 환불 금액을 비교하여 부분/전체 환불 결정
            const paymentToUpdate = await Payment.findByPk(orderToRefund.payments[0].id, {transaction:t});
            if (paymentToUpdate) {
              const isPartialRefund = parseFloat(paymentToUpdate.amount) > finalRefundAmount;
              await paymentToUpdate.update({
                status: isPartialRefund ? PaymentStatus.PARTIALLY_REFUNDED : PaymentStatus.REFUNDED
              }, { transaction: t });
            }


            // 3. 주문 전체 상태 변경 (모든 아이템이 반품 완료되면 주문도 RETURNED)
            const allOrderItems = await OrderItem.findAll({where: {order_id: orderToRefund.id}, transaction:t});
            const totalQuantityOrdered = allOrderItems.reduce((sum, item) => sum + item.quantity, 0);
            const totalQuantityReturnedOrCancelled = allOrderItems
                .filter(item => [OrderItemStatus.RETURNED, OrderItemStatus.CANCELLED].includes(item.status))
                .reduce((sum, item) => sum + item.quantity, 0);

            if (totalQuantityReturnedOrCancelled === totalQuantityOrdered) {
                // 모든 아이템이 반품/취소된 경우
                await Order.update({ status: OrderStatus.RETURNED }, { where: { id: orderToRefund.id }, transaction: t });
            } else if (totalQuantityReturnedOrCancelled > 0) {
                // 일부 아이템만 반품/취소된 경우 (그리고 아직 전체 반품/취소는 아님)
                await Order.update({ status: OrderStatus.PARTIALLY_RETURNED }, { where: { id: orderToRefund.id }, transaction: t });
            }
        }
        createdRefunds.push(refund);
          if (createdRefunds.length % 10 === 0) console.log(`환불 데이터 ${createdRefunds.length}건 생성 완료...`);
      }
    }
    console.log(`총 ${createdRefunds.length}건의 환불 데이터 생성 완료.`);


    // --- (신규) 13. 공지사항(Notice) 데이터 생성 (약 20건) ---
    console.log("공지사항 데이터 생성 시작...");
    const createdNotices = [];
    const noticeTitles = [
      "시스템 정기 점검 안내", "개인정보처리방침 개정 안내", "설 연휴 배송 안내", "추석 연휴 고객센터 운영 안내",
      "신규 서비스 오픈 이벤트", "여름 시즌 특별 할인 프로모션", "겨울 감사제 이벤트", "이용약관 변경 사전 안내",
      "서버 업데이트 작업 공지", "모바일 앱 출시 안내", "배송비 정책 변경 안내", "포인트 적립률 변경 안내",
      "고객센터 전화번호 변경 안내", "장애 발생 및 복구 안내", "피싱/스미싱 주의 안내", "우수회원 등급 정책 변경",
      "연말 감사 이벤트", "새해맞이 할인 행사", "사이트 리뉴얼 안내", "결제 시스템 점검 안내"
    ];

    if (adminUserForProcessing) { // 관리자 계정이 있어야 공지 생성 가능
      for (let i = 0; i < 20; i++) {
        const noticeDate = new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 365); // 최근 1년 이내 랜덤
        const notice = await Notice.create({
          title: `${noticeTitles[i % noticeTitles.length]} (#${i + 1})`,
          content: `안녕하세요, 고객 여러분. ${noticeTitles[i % noticeTitles.length]} 관련하여 안내 말씀드립니다. ${loremIpsum.substring(0, getRandomInt(300, 1000))} 감사합니다.`,
          admin_id: adminUserForProcessing.id,
          created_at: noticeDate,
          updated_at: noticeDate, // 생성 시에는 동일하게 설정
        }, { transaction: t });
        createdNotices.push(notice);
      }
    }
    console.log(`총 ${createdNotices.length}개의 공지사항 생성 완료.`);

    await t.commit();
    console.log("✅ 모든 시드 데이터 삽입 완료.");

  } catch (err) {
    await t.rollback();
    console.error("❌ 시드 데이터 삽입 중 심각한 오류 발생:", err);
    if (err.original || err.parent) { // 더 자세한 오류 정보 출력
        console.error("Original Error:", err.original || err.parent);
    }
  } finally {
    // sequelize.close();
  }
}

module.exports = seed;
