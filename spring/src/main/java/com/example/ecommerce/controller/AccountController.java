package com.example.ecommerce.controller;

import com.example.ecommerce.dto.*;
import com.example.ecommerce.service.*;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpSession;
import java.util.List;
import java.util.Map;

@Controller
@RequiredArgsConstructor
public class AccountController {

    Logger logger = LoggerFactory.getLogger(AccountController.class);

    private final UserService userService;
    private final AdminUserService adminUserService;
    private final ShippingAddressService shippingAddressService;
    private final AgreementService agreementService;
    private final SellerInfoService sellerInfoService;
    private final ShipmentService shipmentService;

    /**
     * 현재 로그인한 사용자의 계정을 탈퇴(비활성화) 처리합니다.
     */
    @DeleteMapping("/api/account")
    @ResponseBody
    public ResponseEntity<?> deactivateAccount(
            @AuthenticationPrincipal UserDTO user,
            @RequestBody Map<String, String> payload,
            HttpSession session) {

        String password = payload.get("password");
        if (password == null || password.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "비밀번호를 입력해주세요."));
        }

        try {
            userService.deactivateUser(user.getId(), password);
            session.invalidate(); // 현재 세션 무효화
            return ResponseEntity.ok(Map.of("message", "회원 탈퇴가 정상적으로 처리되었습니다."));
        } catch (SecurityException e) {
            e.printStackTrace();
            return ResponseEntity.status(403).body(Map.of("message", e.getMessage())); // 403 Forbidden
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("message", "처리 중 오류가 발생했습니다."));
        }
    }

    /* 목록 */
    @GetMapping("/api/user/shipping-addresses")
    @ResponseBody
    public List<ShippingAddressDTO> list(@AuthenticationPrincipal UserDTO user, HttpSession session) {
        return shippingAddressService.list(user.getId());
    }

    /* 단건 */
    @GetMapping("/api/user/shipping-addresses/{id}")
    @ResponseBody
    public ShippingAddressDTO detail(@PathVariable int id, @AuthenticationPrincipal UserDTO user) {
        return shippingAddressService.detail(user.getId(), id);
    }

    /* 신규 등록 */
    @PostMapping("/api/user/shipping-addresses")
    @ResponseStatus(HttpStatus.CREATED)
    @ResponseBody
    public int create(@RequestBody ShippingAddressDTO dto, @AuthenticationPrincipal UserDTO user) {
        dto.setUserId(user.getId());
        return shippingAddressService.create(dto);
    }

    /* 수정 */
    @PutMapping("/api/user/shipping-addresses/{id}")
    @ResponseBody
    public void update(@PathVariable int id, @RequestBody ShippingAddressDTO dto,
                       @AuthenticationPrincipal UserDTO user) {
        shippingAddressService.update(user.getId(), id, dto);
    }

    /* 삭제 */
    @DeleteMapping("/api/user/shipping-addresses/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @ResponseBody
    public void delete(@PathVariable int id, @AuthenticationPrincipal UserDTO user) {
        shippingAddressService.delete(user.getId(), id);
    }

    /* 기본 배송지 설정 */
    @PutMapping("/api/user/shipping-addresses/{id}/default")
    @ResponseBody
    public void makeDefault(@PathVariable int id, @AuthenticationPrincipal UserDTO user) {
        shippingAddressService.makeDefault(user.getId(), id);
    }

    /** 마케팅 정보 수신 동의 저장(동의/철회) */
    @PutMapping("/api/user/marketing-consents")
    public ResponseEntity<Void> saveConsent(@RequestBody MarketingConsentDTO reqDTO,
                                            @AuthenticationPrincipal(expression = "id") int userId) {
        agreementService.saveOrUpdateConsents(userId, reqDTO);
        return ResponseEntity.ok().build();
    }

    /** 마케팅 정보 수신 동의 조회 */
    @GetMapping("/api/user/marketing-consents")
    public ResponseEntity<MarketingConsentDTO> getConsent(@AuthenticationPrincipal(expression = "id") int userId) {
        return ResponseEntity.ok(agreementService.getConsents(userId));
    }

    // 소셜 계정 목록 조회
    @GetMapping("/api/user/social-accounts")
    @ResponseBody
    public List<OAuthAttributesDTO> getSocialAccounts(@AuthenticationPrincipal UserDTO user) {
        return userService.getUserSocialAccounts(user.getId());
    }

    // 소셜 계정 연동 해제
    @DeleteMapping("/api/user/social-accounts/{provider}")
    @ResponseBody
    public ResponseEntity<?> unlinkSocialAccount(
            @PathVariable String provider,
            @AuthenticationPrincipal UserDTO user) {

        try {
            userService.unlinkSocialAccount(user.getId(), provider.toUpperCase());
            return ResponseEntity.ok(Map.of("success", true, "message", "연동이 해제되었습니다."));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", e.getMessage()));
        } catch (Exception e) {
            logger.error("소셜 계정 연동 해제 중 오류", e);
            return ResponseEntity.status(500)
                    .body(Map.of("success", false, "message", "연동 해제 중 오류가 발생했습니다."));
        }
    }


    /**
     * 현재 로그인한 판매자의 프로필 정보를 조회합니다.
     */
    @GetMapping("/api/seller/profile")
    @ResponseBody
    public ResponseEntity<SellerInfoDTO> getSellerInfo(@AuthenticationPrincipal UserDTO seller) {
        SellerInfoDTO sellerInfo = sellerInfoService.getSellerInfo(seller.getId());
        if (sellerInfo == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(sellerInfo);
    }

    /**
     * 현재 로그인한 판매자의 프로필 정보를 수정합니다.
     */
    @PutMapping("/api/seller/profile")
    @ResponseBody
    public ResponseEntity<Void> updateSellerInfo(
            @AuthenticationPrincipal UserDTO seller,
            @RequestBody SellerInfoDTO sellerInfoData) {

        sellerInfoService.updateSellerInfo(seller.getId(), sellerInfoData);
        return ResponseEntity.ok().build();
    }

    /**
     * 판매자의 배송 방법 목록을 조회합니다.
     */
    @GetMapping("/api/seller/shipping-methods")
    @ResponseBody
    public ResponseEntity<List<ShippingMethodDTO>> getShippingMethods(@AuthenticationPrincipal UserDTO seller) {
        try {
            List<ShippingMethodDTO> shippingMethods = shipmentService.getShippingMethodsBySeller(seller.getId());
            return ResponseEntity.ok(shippingMethods);
        } catch (Exception e) {
            logger.error("배송 방법 목록 조회 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }


    /**
     * 사용자 목록 조회
     */
    @GetMapping("/api/admin/users")
    @ResponseBody
    public ResponseEntity<PageResult<UserSummaryDTO>> getUserList(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(defaultValue = "") String status) {

        PageResult<UserSummaryDTO> result = adminUserService.getUserList(page, size, keyword, status);
        return ResponseEntity.ok(result);
    }

    /**
     * 사용자 상세 정보 조회
     */
    @GetMapping("/api/admin/users/{userId}")
    @ResponseBody
    public ResponseEntity<UserDetailDTO> getUserDetail(@PathVariable int userId) {
        try {
            UserDetailDTO userDetail = adminUserService.getUserDetail(userId);
            return ResponseEntity.ok(userDetail);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * 사용자 정지
     */
    @PostMapping("/api/admin/users/{userId}/suspend")
    @ResponseBody
    public ResponseEntity<Map<String, String>> suspendUser(
            @PathVariable int userId,
            @RequestBody Map<String, String> request,
            Authentication authentication) {

        try {
            String reason = request.get("reason");
            if (reason == null || reason.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "정지 사유를 입력해주세요."));
            }

            // 현재 관리자 ID 가져오기
            UserDTO currentUser = (UserDTO) authentication.getPrincipal();

            adminUserService.suspendUser(userId, reason.trim(), currentUser.getId());
            return ResponseEntity.ok(Map.of("message", "사용자가 정지되었습니다."));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "정지 처리 중 오류가 발생했습니다."));
        }
    }

    /**
     * 사용자 정지 해제
     */
    @PostMapping("/api/admin/users/{userId}/resume")
    @ResponseBody
    public ResponseEntity<Map<String, String>> resumeUser(
            @PathVariable int userId,
            Authentication authentication) {

        try {
            UserDTO currentUser = (UserDTO) authentication.getPrincipal();
            adminUserService.resumeUser(userId, currentUser.getId());
            return ResponseEntity.ok(Map.of("message", "사용자 정지가 해제되었습니다."));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "정지 해제 처리 중 오류가 발생했습니다."));
        }
    }

    /**
     * 사용자 계정 해지
     */
    @PostMapping("/api/admin/users/{userId}/terminate")
    @ResponseBody
    public ResponseEntity<Map<String, String>> terminateUser(
            @PathVariable int userId,
            @RequestBody Map<String, String> request,
            Authentication authentication) {

        try {
            String reason = request.get("reason");
            if (reason == null || reason.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "해지 사유를 입력해주세요."));
            }

            UserDTO currentUser = (UserDTO) authentication.getPrincipal();
            adminUserService.terminateUser(userId, reason.trim(), currentUser.getId());
            return ResponseEntity.ok(Map.of("message", "사용자 계정이 해지되었습니다."));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "계정 해지 처리 중 오류가 발생했습니다."));
        }
    }

    /**
     * 사용자 통계 조회
     */
    @GetMapping("/api/admin/users/statistics")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getUserStatistics() {
        Map<String, Object> statistics = adminUserService.getUserStatistics();
        return ResponseEntity.ok(statistics);
    }

}
