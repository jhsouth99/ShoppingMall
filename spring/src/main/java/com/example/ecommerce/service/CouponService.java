package com.example.ecommerce.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.ecommerce.dao.CouponDAO;
import com.example.ecommerce.dto.CouponDTO;
import com.example.ecommerce.dto.PageResult;
import com.example.ecommerce.dto.UserCouponDTO;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CouponService {

    private final CouponDAO couponDAO;

    @Transactional(readOnly = true)
    public List<UserCouponDTO> getAvailableCoupons(int userId, Integer totalAmount) {
        List<UserCouponDTO> coupons = couponDAO.findAvailableCouponsByUserId(userId);
        if (totalAmount == null) {
            return coupons;
        } else {
            return coupons.stream().filter(
                    c -> c.getMinPurchaseAmount() == null || c.getMinPurchaseAmount() >= totalAmount
            ).collect(Collectors.toList());
        }
    }

    @Transactional
    public boolean registerCoupon(int userId, String couponCode) {
        // 1. 이미 등록된 쿠폰인지 확인
        Map<String, Object> params = new HashMap<>();
        params.put("userId", userId);
        params.put("couponCode", couponCode);

        int count = couponDAO.countUserCoupon(params);
        if (count > 0) {
            // 이미 등록된 쿠폰
            return false;
        }

        // 2. 쿠폰 등록 시도
        int result = couponDAO.insertUserCoupon(params);

        // INSERT가 성공하면 (유효한 쿠폰 코드가 존재하면) 1을 반환
        return result > 0;
    }

    @Transactional(readOnly = true)
    public PageResult<CouponDTO> getCoupons(int sellerId, int page, int size) {
        return getCoupons(sellerId, page, size, "", "");
    }

    @Transactional(readOnly = true)
    public PageResult<CouponDTO> getCoupons(int sellerId, int page, int size, String keyword, String status) {
        int offset = (page > 0) ? (page - 1) * size : 0;
        Map<String, Object> params = new HashMap<>();
        params.put("sellerId", sellerId);
        params.put("offset", offset);
        params.put("size", size);
        params.put("keyword", keyword);
        params.put("status", status);

        List<CouponDTO> content;
        int totalElements;

        // sellerId가 0이면 관리자로 간주하여 모든 쿠폰 조회
        if (sellerId == 0) {
            content = couponDAO.findAllCoupons(params);
            totalElements = couponDAO.countAllCoupons(params);
        } else {
            content = couponDAO.findCouponsByCreator(params);
            totalElements = couponDAO.countCouponsByCreator(params);
        }

        return new PageResult<>(content, totalElements, page, size);
    }

    @Transactional(readOnly = true)
    public CouponDTO getCouponDetails(int sellerId, int couponId) {
        // sellerId가 0이면 관리자로 간주
        if (sellerId == 0) {
            return couponDAO.findCouponByIdForAdmin(couponId);
        } else {
            return couponDAO.findCouponById(Map.of("sellerId", sellerId, "couponId", couponId));
        }
    }

    @Transactional
    public int createCoupon(int sellerId, CouponDTO couponData) {
        // sellerId가 0이면 관리자가 생성하는 전역 쿠폰 (creator_id = null)
        if (sellerId == 0) {
            couponData.setCreatorId(null);
        } else {
            couponData.setCreatorId(sellerId);
        }

        // 기본값 설정
        if (couponData.getIsActive() == null) {
            couponData.setIsActive(true);
        }
        if (couponData.getCurrentUsageCount() == null) {
            couponData.setCurrentUsageCount(0);
        }

        couponDAO.insertCoupon(couponData);
        return couponData.getId();
    }

    @Transactional
    public void updateCoupon(int sellerId, int couponId, CouponDTO couponData) {
        couponData.setId(couponId);

        // sellerId가 0이면 관리자로 간주
        if (sellerId == 0) {
            couponData.setCreatorId(null);
        } else {
            couponData.setCreatorId(sellerId);
        }

        int updatedRows = couponDAO.updateCoupon(couponData);
        if (updatedRows == 0) {
            throw new SecurityException("수정 권한이 없거나 존재하지 않는 쿠폰입니다.");
        }
    }

    @Transactional(readOnly = true)
    public List<CouponDTO> getAvailableCouponsForPromotion(int sellerId, Integer excludePromotionId) {
        Map<String, Object> params = new HashMap<>();
        params.put("sellerId", sellerId);
        params.put("excludePromotionId", excludePromotionId);
        return couponDAO.findAvailableCouponsForPromotion(params);
    }

    /**
     * 쿠폰 비활성화 (소프트 삭제)
     */
    @Transactional
    public void deactivateCoupon(int sellerId, int couponId) {
        CouponDTO coupon = getCouponDetails(sellerId, couponId);
        if (coupon == null) {
            throw new IllegalArgumentException("존재하지 않는 쿠폰입니다.");
        }

        coupon.setIsActive(false);
        updateCoupon(sellerId, couponId, coupon);
    }

    /**
     * 특정 상품에 사용 가능한 사용자의 쿠폰 목록을 조회합니다.
     */
    public List<UserCouponDTO> getAvailableCouponsForProduct(int userId, Integer productId) {
        Map<String, Object> params = new HashMap<>();
        params.put("userId", userId);
        params.put("productId", productId);
        params.put("currentDate", new Date());

        return couponDAO.findAvailableCouponsForProduct(params);
    }

    /**
     * 쿠폰이 적용된 할인 가격을 계산합니다.
     */
    public Integer calculateCouponDiscount(Integer originalPrice, UserCouponDTO coupon) {
        if ("PERCENTAGE".equals(coupon.getDiscountType())) {
            return (originalPrice * coupon.getDiscountValue()) / 100;
        } else if ("FIXED_AMOUNT".equals(coupon.getDiscountType())) {
            return Math.min(coupon.getDiscountValue(), originalPrice);
        }
        return 0;
    }

    /**
     * 쿠폰 사용 가능 여부를 확인합니다.
     */
    public boolean isValidCouponForProduct(UserCouponDTO coupon, Integer productPrice) {
        // 최소 구매 금액 조건 확인
        if (coupon.getMinPurchaseAmount() != null &&
                productPrice < coupon.getMinPurchaseAmount()) {
            return false;
        }

        // 유효 기간 확인
        if (coupon.getValidTo() != null && LocalDate.now().isAfter(coupon.getValidTo())) {
            return false;
        }

        return true;
    }

    @Transactional
    public void setUserCouponUsed(int userId, String appliedCouponCode) {
        CouponDTO coupon = couponDAO.findCouponByCode(appliedCouponCode);
        couponDAO.setUserCouponUsedAtNowByUserIdAndCouponId(userId, coupon.getId());
    }
}