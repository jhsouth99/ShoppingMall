// calculateShippingFee.js (별도 파일 또는 orderRoutes.js 상단에 위치)

const { Product, ProductVariant, User, SellerShippingMethod, ShippingMethod, ShippingAddress, ProductVariantShippingMethod } = require('../../models'); // 실제 모델 경로
const { Op } = require('sequelize');

// --- 배송비 설정 (DB 또는 설정 파일에서 관리하는 것이 이상적) ---
const PLATFORM_DEFAULT_SHIPPING_FEE = 3000; // 플랫폼 기본 배송비
const PLATFORM_FREE_SHIPPING_THRESHOLD = 50000; // 플랫폼 전체 무료배송 기준액

// 지역별 추가 배송비 (예시)
const REGIONAL_SURCHARGES = [
    { type: 'JEJU', keywords: ['제주', '제주시', '서귀포시'], zipcode_ranges: [{start: 63000, end: 63644}], surcharge: 3000 },
    { type: 'ISLAND_MOUNTAIN', keywords: ['울릉도', '백령도', '도서', '산간'], zipcode_ranges: [], surcharge: 5000 }, // 더 구체적인 zipcode_ranges 필요
];

function getRegionalSurcharge(shippingAddressInstance) {
    if (!shippingAddressInstance) return 0;

    for (const region of REGIONAL_SURCHARGES) {
        // 우편번호 범위 체크
        if (region.zipcode_ranges && region.zipcode_ranges.length > 0) {
            const zipcode = parseInt(shippingAddressInstance.zipcode);
            if (!isNaN(zipcode)) {
                for (const range of region.zipcode_ranges) {
                    if (zipcode >= range.start && zipcode <= range.end) {
                        return region.surcharge;
                    }
                }
            }
        }
        // 키워드 체크 (주소에 특정 단어 포함 여부)
        if (region.keywords && region.keywords.length > 0) {
            for (const keyword of region.keywords) {
                if (shippingAddressInstance.address.includes(keyword)) {
                    return region.surcharge;
                }
            }
        }
    }
    return 0; // 추가금 없음
}

async function calculateShippingFee(
    orderItemsWithDetails, // [{ product_variant_id, quantity, seller_id, variant_price_after_discount, (다른 필요한 정보) }]
                           // variant_price_after_discount: 개별 아이템의 할인이 이미 적용된 단가
    globalSubTotalAmountAfterDiscount, // 전체 주문의 할인 후 상품 총액 (모든 판매자 상품 합산)
    shippingAddressId,
    transaction
) {
    // 1. 플랫폼 전체 무료 배송 조건 확인
    if (globalSubTotalAmountAfterDiscount >= PLATFORM_FREE_SHIPPING_THRESHOLD) {
        return 0; // 플랫폼 전체 무료 배송
    }

    // 2. 상품들을 판매자별로 그룹화
    const itemsBySeller = {};
    for (const item of orderItemsWithDetails) {
        // orderItemsWithDetails에 seller_id가 포함되어 있어야 함.
        // 만약 없다면 여기서 ProductVariant -> Product를 통해 조회 필요.
        // const variant = await ProductVariant.findByPk(item.product_variant_id, { include: [{model: Product, as: 'product'}]});
        // const sellerId = variant.product.seller_id;
        const sellerId = item.seller_id; // item 객체에 seller_id가 미리 포함되어 있다고 가정

        if (!itemsBySeller[sellerId]) {
            itemsBySeller[sellerId] = {
                items: [],
                subTotalAfterDiscount: 0, // 이 판매자 상품들의 할인 후 소계
                // 판매자별 배송 정책을 DB에서 가져올 수 있음 (예: seller.free_shipping_threshold)
                seller_free_shipping_threshold: null // 예: 30000 (DB에서 조회)
            };
        }
        itemsBySeller[sellerId].items.push(item);
        itemsBySeller[sellerId].subTotalAfterDiscount += item.variant_price_after_discount * item.quantity;
    }

    let totalCalculatedShippingFee = 0;

    // 3. 각 판매자 그룹별 배송비 계산
    for (const sellerId in itemsBySeller) {
        const sellerGroup = itemsBySeller[sellerId];
        let sellerGroupShippingFee = 0;

        // 3a. 판매자 자체 무료 배송 조건 확인 (예시: 판매자가 설정한 무료배송 기준액이 있다면)
        // 이 정보는 User(Seller) 모델이나 BusinessProfile 등에 저장되어 있을 수 있음.
        // const sellerProfile = await User.findByPk(sellerId, { include: ['businessProfile'] });
        // const sellerFreeShippingThreshold = sellerProfile?.businessProfile?.free_shipping_threshold;
        const sellerFreeShippingThreshold = sellerGroup.seller_free_shipping_threshold; // 미리 조회된 값 사용 가정

        if (sellerFreeShippingThreshold && sellerGroup.subTotalAfterDiscount >= sellerFreeShippingThreshold) {
            sellerGroupShippingFee = 0; // 해당 판매자 상품 그룹은 무료 배송
        } else {
            // 3b. 상품별 특수 배송비 확인 (ProductVariantShippingMethod)
            let maxProductSpecificFee = 0;
            let hasProductSpecificFee = false;
            for (const item of sellerGroup.items) {
                const pvsm = await ProductVariantShippingMethod.findOne({
                    where: { product_variant_id: item.product_variant_id },
                    include: [{ model: ShippingMethod, as: 'shipping_method' }],
                    transaction
                });
                if (pvsm) {
                    hasProductSpecificFee = true;
                    const cost = pvsm.cost_override !== null ? parseFloat(pvsm.cost_override) : parseFloat(pvsm.shipping_method.cost);
                    if (cost > maxProductSpecificFee) {
                        maxProductSpecificFee = cost;
                    }
                    // 정책: 상품별 배송비가 여러 개일 경우 합산할지, 가장 큰 값을 택할지 등. 여기서는 가장 큰 값으로.
                }
            }

            if (hasProductSpecificFee) {
                sellerGroupShippingFee = maxProductSpecificFee;
            } else {
                // 3c. 판매자의 기본 배송 방법 비용 사용
                const sellerShippingConfig = await SellerShippingMethod.findOne({
                    where: { seller_id: sellerId, is_default: true },
                    include: [{ model: ShippingMethod, as: 'shipping_method' }],
                    transaction
                });

                if (sellerShippingConfig) {
                    if (sellerShippingConfig.cost_override !== null) {
                        sellerGroupShippingFee = parseFloat(sellerShippingConfig.cost_override);
                    } else if (sellerShippingConfig.shipping_method && sellerShippingConfig.shipping_method.cost !== null) {
                        sellerGroupShippingFee = parseFloat(sellerShippingConfig.shipping_method.cost);
                    } else {
                        sellerGroupShippingFee = PLATFORM_DEFAULT_SHIPPING_FEE; // 판매자 설정 없으면 플랫폼 기본
                    }
                } else {
                    sellerGroupShippingFee = PLATFORM_DEFAULT_SHIPPING_FEE; // 판매자 설정 없으면 플랫폼 기본
                }
            }
        }
        totalCalculatedShippingFee += sellerGroupShippingFee;
    }

    // 4. 최종 계산된 배송비에 지역별 추가금 적용
    let regionalSurcharge = 0;
    if (shippingAddressId && totalCalculatedShippingFee > 0) { // 배송비가 0이면 추가금도 0
        const shippingAddressInstance = await ShippingAddress.findByPk(shippingAddressId, { transaction });
        if (shippingAddressInstance) {
            regionalSurcharge = getRegionalSurcharge(shippingAddressInstance);
        }
    }

    return totalCalculatedShippingFee + regionalSurcharge;
}

module.exports = calculateShippingFee; // 다른 파일에서 사용하기 위해 export