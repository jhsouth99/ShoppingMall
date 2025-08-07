package com.example.ecommerce.controller;

import com.example.ecommerce.dto.CouponDTO;
import com.example.ecommerce.dto.PageResult;
import com.example.ecommerce.dto.UserCouponDTO;
import com.example.ecommerce.dto.UserDTO;
import com.example.ecommerce.service.CouponService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@Controller
@RequiredArgsConstructor
public class CouponController {

    private final CouponService couponService;

    @GetMapping("/api/user/coupons")
    @ResponseBody
    public List<UserCouponDTO> getMyCoupons(@AuthenticationPrincipal(expression = "id") int userId) {
        return couponService.getAvailableCoupons(userId, null);
    }

    @PostMapping("/api/user/coupons")
    @ResponseBody
    public ResponseEntity<Map<String, String>> registerCoupon(
            @RequestBody Map<String, String> payload,
            @AuthenticationPrincipal(expression = "id") int userId) {

        String couponCode = payload.get("couponCode");
        if (couponCode == null || couponCode.isBlank()) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", "쿠폰 번호를 입력해주세요."));
        }

        boolean success = couponService.registerCoupon(userId, couponCode);

        if (success) {
            return ResponseEntity.ok(Collections.singletonMap("message", "쿠폰이 성공적으로 등록되었습니다."));
        } else {
            return ResponseEntity.status(409).body(Collections.singletonMap("message", "이미 등록되었거나 유효하지 않은 쿠폰입니다."));
        }
    }

    /**
     * 특정 쿠폰의 상세 정보를 조회합니다.
     */
    @GetMapping("/api/seller/coupons/{couponId}")
    @ResponseBody
    public ResponseEntity<CouponDTO> getCouponDetails(
            @AuthenticationPrincipal UserDTO seller,
            @PathVariable int couponId) {
        CouponDTO coupon = couponService.getCouponDetails(seller.getId(), couponId);
        if (coupon == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(coupon);
    }

    /**
     * 판매자가 새 쿠폰을 생성합니다.
     */
    @PostMapping("/api/seller/coupons")
    @ResponseBody
    public ResponseEntity<?> createCoupon(
            @AuthenticationPrincipal UserDTO seller,
            @RequestBody CouponDTO couponData) {
        int newCouponId = couponService.createCoupon(seller.getId(), couponData);
        return ResponseEntity.ok(Map.of("couponId", newCouponId));
    }

    /**
     * 판매자가 자신이 생성한 쿠폰을 수정합니다.
     */
    @PutMapping("/api/seller/coupons/{couponId}")
    @ResponseBody
    public ResponseEntity<Void> updateCoupon(
            @AuthenticationPrincipal UserDTO seller,
            @PathVariable int couponId,
            @RequestBody CouponDTO couponData) {
        try {
            couponService.updateCoupon(seller.getId(), couponId, couponData);
            return ResponseEntity.ok().build();
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }

    /**
     * 판매자가 조회 가능한 쿠폰 목록을 가져옵니다. (본인 생성 + 관리자 생성)
     */
    @GetMapping("/api/seller/coupons")
    @ResponseBody
    public ResponseEntity<PageResult<CouponDTO>> getCoupons(
            @AuthenticationPrincipal UserDTO seller,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageResult<CouponDTO> result = couponService.getCoupons(seller.getId(), page, size);
        return ResponseEntity.ok(result);
    }

    /**
     * 모든 쿠폰 목록을 조회합니다 (관리자용)
     */
    @GetMapping("/api/admin/coupons")
    @ResponseBody
    public ResponseEntity<PageResult<CouponDTO>> getAllCoupons(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(defaultValue = "") String status) {

        // 관리자는 모든 쿠폰을 조회할 수 있으므로 sellerId를 0으로 전달
        PageResult<CouponDTO> result = couponService.getCoupons(0, page, size, keyword, status);
        return ResponseEntity.ok(result);
    }

    /**
     * 특정 쿠폰의 상세 정보를 조회합니다
     */
    @GetMapping("/api/admin/coupons/{couponId}")
    @ResponseBody
    public ResponseEntity<CouponDTO> getCouponDetails(@PathVariable int couponId) {
        CouponDTO coupon = couponService.getCouponDetails(0, couponId);
        if (coupon == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(coupon);
    }

    /**
     * 새로운 쿠폰을 생성합니다
     */
    @PostMapping("/api/admin/coupons")
    @ResponseBody
    public ResponseEntity<CouponDTO> createCoupon(@RequestBody CouponDTO couponDTO) {
        try {
            // 관리자가 생성하는 쿠폰은 creator_id를 null로 설정 (전역 쿠폰)
            couponDTO.setCreatorId(null);
            int couponId = couponService.createCoupon(0, couponDTO);

            // 생성된 쿠폰 정보 반환
            CouponDTO createdCoupon = couponService.getCouponDetails(0, couponId);
            return new ResponseEntity<>(createdCoupon, HttpStatus.CREATED);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    /**
     * 기존 쿠폰 정보를 수정합니다
     */
    @PutMapping("/api/admin/coupons/{couponId}")
    @ResponseBody
    public ResponseEntity<CouponDTO> updateCoupon(@PathVariable int couponId, @RequestBody CouponDTO couponDTO) {
        try {
            couponService.updateCoupon(0, couponId, couponDTO);
            CouponDTO updatedCoupon = couponService.getCouponDetails(0, couponId);
            return ResponseEntity.ok(updatedCoupon);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    /**
     * 쿠폰을 비활성화합니다 (실제 삭제가 아닌 상태 변경)
     */
    @DeleteMapping("/api/admin/coupons/{couponId}")
    @ResponseBody
    public ResponseEntity<Void> deleteCoupon(@PathVariable int couponId) {
        try {
            // 쿠폰을 비활성화 상태로 변경
            CouponDTO coupon = couponService.getCouponDetails(0, couponId);
            if (coupon == null) {
                return ResponseEntity.notFound().build();
            }

            coupon.setIsActive(false);
            couponService.updateCoupon(0, couponId, coupon);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

}
