package com.example.ecommerce.service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.example.ecommerce.dao.ProductDAO;
import com.example.ecommerce.dto.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.transaction.annotation.Transactional;

import com.example.ecommerce.dao.PromotionDAO;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class PromotionService {

    private static final Logger logger = LoggerFactory.getLogger(PromotionService.class);
    private final PromotionDAO promotionDAO;
    private final ProductDAO productDAO;

    /**
     * 판매자가 조회 가능한 프로모션 목록을 가져옵니다. (페이징 포함)
     * @param sellerId 현재 로그인한 판매자의 ID
     * @param page 요청한 페이지 번호 (1부터 시작)
     * @param size 페이지 당 아이템 수
     * @return PageResult<PromotionDTO> 페이징 정보가 포함된 프로모션 목록
     */
    @Transactional(readOnly = true)
    public PageResult<PromotionDTO> getPromotionsBySellerId(int sellerId, int page, int size) {
        // 1. 데이터베이스 페이징을 위한 offset 계산 (JSP에서 page=1로 요청 시 offset=0)
        int offset = (page > 0) ? (page - 1) * size : 0;

        // 2. MyBatis Mapper에 전달할 파라미터들을 Map에 담습니다.
        Map<String, Object> params = new HashMap<>();
        params.put("sellerId", sellerId);
        params.put("offset", offset);
        params.put("size", size);

        // 3. DAO를 호출하여 현재 페이지에 해당하는 데이터 목록을 조회합니다.
        List<PromotionDTO> content = promotionDAO.findPromotionsByCreator(params);

        // 4. DAO를 호출하여 전체 데이터 개수를 조회합니다.
        int totalElements = promotionDAO.countPromotionsByCreator(params);

        // 5. 조회된 데이터와 페이징 정보를 PageResult 객체로 포장하여 반환합니다.
        // PageResult 생성자에서 totalPages, first, last 등의 값은 자동으로 계산됩니다.
        return new PageResult<>(content, totalElements, page, size);
    }
    
    @Transactional(readOnly = true)
    public PromotionDetailDTO getPromotionDetailsBySellerId(int sellerId, int promotionId) {
        return promotionDAO.findPromotionDetailsById(Map.of("sellerId", sellerId, "promotionId", promotionId));
    }
    
    @Transactional
    public int createPromotion(int sellerId, PromotionDetailDTO promoData) {
        promoData.setCreatorId(sellerId);
        promotionDAO.insertPromotion(promoData);
        int promotionId = promoData.getId();
        
        savePromotionDetails(promotionId, promoData);
        return promotionId;
    }

    @Transactional
    public void updatePromotion(int sellerId, int promotionId, PromotionDetailDTO promoData) {
        promoData.setId(promotionId);
        promoData.setCreatorId(sellerId);
        
        // 1. 프로모션 기본 정보 업데이트
        int updatedRows = promotionDAO.updatePromotion(promoData);
        if(updatedRows == 0) throw new SecurityException("수정 권한이 없거나 존재하지 않는 프로모션입니다.");

        // 2. 기존 조건 및 상품 연결 삭제
        promotionDAO.deleteConditionsByPromotionId(promotionId);
        promotionDAO.deleteProductsByPromotionId(promotionId);

        // 3. 새 조건 및 상품 연결 추가
        savePromotionDetails(promotionId, promoData);
    }

    /**
     * 할인된 상품 가격을 반환합니다.
     * @param productId 상품 ID
     * @return 할인된 가격
     */
    @Transactional(readOnly = true)
    public int getProductDiscountedPrice(Integer productId) {
        List<PromotionDTO> promotions = promotionDAO.findPromotionsByProductId(productId);
        ProductDetailDTO product = productDAO.findProductById(productId);

        if (promotions == null || promotions.isEmpty()) {
            // 적용된 프로모션이 없으면 원가 반환 (별도 ProductDAO에서 조회해야 함)
            return product.getBasePrice();
        }

        // 2. 원가격 조회 (Product 테이블에서)
        int originalPrice = product.getBasePrice();
        int maxDiscountAmount = 0;

        // 3. 현재 활성화된 프로모션 중에서 가장 할인 금액이 큰 것을 찾기
        for (PromotionDTO promotion : promotions) {
            // 프로모션이 활성화되어 있고 유효기간 내인지 확인
            if (promotion.getIsActive()
                    && promotion.getStartDate().isBefore(LocalDateTime.now())
                    && promotion.getEndDate().isAfter(LocalDateTime.now())) {
                int discountAmount;
                switch (promotion.getPromotionType()) {
                    case "PERCENTAGE":
                        discountAmount = (int) (originalPrice * (promotion.getDiscountValue() / 100.0));
                        break;
                    case "FIXED_AMOUNT":
                        discountAmount = promotion.getDiscountValue();
                        break;
                    case "BUY_X_GET_Y":
                        discountAmount = 0;
                        break;
                    default:
                        logger.warn("알 수 없는 할인 타입: {}", promotion.getDiscountType());
                        discountAmount = 0;
                        break;
                }
                // 최대 할인 금액 제한이 있는 경우 적용
                if (promotion.getMaxDiscountAmount() != null && promotion.getMaxDiscountAmount() > 0) {
                    maxDiscountAmount = Math.min(discountAmount, promotion.getMaxDiscountAmount());
                }
            }
        }

        // 4. 최종 할인된 가격 반환 (원가 - 최대 할인액)
        return Math.max(0, originalPrice - maxDiscountAmount);
    }

    // 생성과 수정에서 공통으로 사용될 상세 정보 저장 로직
    private void savePromotionDetails(int promotionId, PromotionDetailDTO promoData) {
        // 조건 저장
        if (promoData.getConditions() != null) {
            for (PromotionConditionDTO cond : promoData.getConditions()) {
                cond.setPromotionId(promotionId);
                promotionDAO.insertPromotionCondition(cond); // 기존 매퍼 재사용 가정
            }
        }
        // 적용 상품 저장
        if ("PRODUCT_DISCOUNT".equals(promoData.getPromotionType()) && promoData.getProductIds() != null) {
            for (Integer productId : promoData.getProductIds()) {
                promotionDAO.insertPromotionProductLink(Map.of("promotionId", promotionId, "productId", productId));
            }
        }
    }

    /**
     * 특정 상품에 적용 가능한 활성 프로모션 목록을 조회합니다.
     */
    public List<PromotionDetailDTO> getActivePromotionsByProductId(Integer productId) {
        Map<String, Object> params = new HashMap<>();
        params.put("productId", productId);
        params.put("currentDate", LocalDateTime.now());

        return promotionDAO.findActivePromotionsByProductId(params);
    }

    /**
     * 프로모션이 적용된 할인 가격을 계산합니다.
     */
    public Integer calculateDiscountedPrice(Integer originalPrice, List<PromotionDetailDTO> promotions) {
        if (promotions == null || promotions.isEmpty()) {
            return originalPrice;
        }

        Integer bestDiscountedPrice = originalPrice;

        for (PromotionDetailDTO promotion : promotions) {
            Integer discountedPrice = calculatePromotionDiscount(originalPrice, promotion);
            if (discountedPrice < bestDiscountedPrice) {
                bestDiscountedPrice = discountedPrice;
            }
        }

        return bestDiscountedPrice;
    }

    private Integer calculatePromotionDiscount(Integer originalPrice, PromotionDetailDTO promotion) {
        if ("PERCENTAGE".equals(promotion.getDiscountType())) {
            int discountAmount = (originalPrice * promotion.getDiscountValue()) / 100;

            // 최대 할인 금액 제한이 있는 경우
            if (promotion.getMaxDiscountAmount() != null &&
                    discountAmount > promotion.getMaxDiscountAmount()) {
                discountAmount = promotion.getMaxDiscountAmount();
            }

            return originalPrice - discountAmount;
        } else if ("FIXED_AMOUNT".equals(promotion.getDiscountType())) {
            return Math.max(0, originalPrice - promotion.getDiscountValue());
        }

        return originalPrice;
    }
}