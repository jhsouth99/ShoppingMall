package com.example.ecommerce.controller;

import com.example.ecommerce.dto.*;
import com.example.ecommerce.service.CouponService;
import com.example.ecommerce.service.ProductService;
import com.example.ecommerce.service.PromotionService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Controller
@RequiredArgsConstructor
public class PromotionContoller {
    Logger logger = LoggerFactory.getLogger(PromotionContoller.class);

    private final PromotionService promotionService;
    private final CouponService couponService;
    private final ProductService productService;

    /**
     * 프로모션에 연결 가능한 쿠폰 목록을 조회합니다.
     */
    @GetMapping("/api/seller/available-coupons-for-promotion")
    @ResponseBody
    public ResponseEntity<List<CouponDTO>> getAvailableCouponsForPromotion(
            @AuthenticationPrincipal UserDTO seller,
            @RequestParam(required = false) Integer excludePromotionId) {
        List<CouponDTO> coupons = couponService.getAvailableCouponsForPromotion(seller.getId(), excludePromotionId);
        return ResponseEntity.ok(coupons);
    }

    /**
     * 판매자가 조회 가능한 프로모션 목록을 가져옵니다.
     */
    @GetMapping("/api/seller/promotions")
    @ResponseBody
    public ResponseEntity<PageResult<PromotionDTO>> getPromotions(
            @AuthenticationPrincipal UserDTO seller,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageResult<PromotionDTO> result = promotionService.getPromotionsBySellerId(seller.getId(), page, size);
        return ResponseEntity.ok(result);
    }

    /**
     * 특정 프로모션의 상세 정보를 조회합니다.
     */
    @GetMapping("/api/seller/promotions/{promotionId}")
    @ResponseBody
    public ResponseEntity<PromotionDetailDTO> getPromotionDetails(
            @AuthenticationPrincipal UserDTO seller,
            @PathVariable int promotionId) {
        PromotionDetailDTO promotion = promotionService.getPromotionDetailsBySellerId(seller.getId(), promotionId);
        return ResponseEntity.ok(promotion);
    }

    /**
     * 새 프로모션을 생성합니다.
     */
    @PostMapping("/api/seller/promotions")
    @ResponseBody
    public ResponseEntity<?> createPromotion(
            @AuthenticationPrincipal UserDTO seller,
            @RequestBody PromotionDetailDTO promoData) {
        int newPromotionId = promotionService.createPromotion(seller.getId(), promoData);
        return ResponseEntity.ok(Map.of("promotionId", newPromotionId));
    }

    /**
     * 프로모션 정보를 수정합니다.
     */
    @PutMapping("/api/seller/promotions/{promotionId}")
    @ResponseBody
    public ResponseEntity<Void> updatePromotion(
            @AuthenticationPrincipal UserDTO seller,
            @PathVariable int promotionId,
            @RequestBody PromotionDetailDTO promoData) {
        promotionService.updatePromotion(seller.getId(), promotionId, promoData);
        return ResponseEntity.ok().build();
    }

    /**
     * 프로모션 적용 대상 상품 목록을 조회 (반환타입 Map으로 변경)
     */
    @GetMapping("/api/seller/promotion-target-products")
    @ResponseBody
    public ResponseEntity<List<Map<String, Object>>> getPromotionTargetProducts(
            @AuthenticationPrincipal UserDTO seller) {
        List<Map<String, Object>> products = productService.getTargetableProducts(seller.getId());
        return ResponseEntity.ok(products);
    }

}
