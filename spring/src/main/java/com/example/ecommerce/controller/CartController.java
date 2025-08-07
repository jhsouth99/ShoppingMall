package com.example.ecommerce.controller;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import com.example.ecommerce.dto.CartItemDTO;
import com.example.ecommerce.dto.CartOptionDTO;
import com.example.ecommerce.dto.UserDTO;
import com.example.ecommerce.service.CartOptionService;
import com.example.ecommerce.service.CartService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Controller
@RequiredArgsConstructor
@RequestMapping("/cart")
public class CartController {
    
    private final CartService cartService;
    private final CartOptionService cartOptionService;
    
    /**
     * 장바구니 페이지 조회
     */
    @GetMapping
    public String cartPage(@AuthenticationPrincipal UserDTO user, Model model) {
        if (user == null) return "redirect:/login";

        int userId = user.getId();
        List<CartItemDTO> cartList = cartService.getCartItems(userId);
        Map<String, Object> cartSummary = cartService.calculateCartSummary(cartList);

        model.addAttribute("cartList", cartList);
        model.addAttribute("cartSummary", cartSummary);
        return "cart";
    }
    
    /**
     * 장바구니에 상품 추가
     */
    @PostMapping("/add")
    @ResponseBody
    public Map<String, Object> addToCart(@RequestParam("productVariantId") int productVariantId,
                                         @RequestParam("quantity") int quantity,
                                         @AuthenticationPrincipal UserDTO user) {
        if (user == null) return Map.of("success", false, "message", "로그인이 필요합니다.");

        try {
            boolean result = cartService.addToCart(user.getId(), productVariantId, quantity);
            return result
                    ? Map.of("success", true, "message", "장바구니에 추가되었습니다.")
                    : Map.of("success", false, "message", "장바구니 추가에 실패했습니다.");
        } catch (Exception e) {
            return Map.of("success", false, "message", e.getMessage());
        }
    }
    
    /**
     * 장바구니 상품 수량 변경
     */
    @PostMapping("/update")
    @ResponseBody
    public Map<String, Object> updateCartItem(@RequestParam("productVariantId") int productVariantId,
                                              @RequestParam("quantity") int quantity,
                                              @AuthenticationPrincipal UserDTO user) {
        if (user == null) return Map.of("success", false, "message", "로그인이 필요합니다.");

        try {
            boolean result = cartService.updateCartItem(user.getId(), productVariantId, quantity);
            return result
                    ? Map.of("success", true, "message", "수량이 변경되었습니다.")
                    : Map.of("success", false, "message", "수량 변경에 실패했습니다.");
        } catch (Exception e) {
            return Map.of("success", false, "message", e.getMessage());
        }
    }
    
    /**
     * 장바구니 상품 삭제
     */
    @PostMapping("/remove")
    @ResponseBody
    public Map<String, Object> removeCartItem(@RequestParam("productVariantId") int productVariantId,
                                              @AuthenticationPrincipal UserDTO user) {
        if (user == null) return Map.of("success", false, "message", "로그인이 필요합니다.");

        try {
            boolean result = cartService.removeCartItemByUserIdAndPVId(user.getId(), productVariantId);
            return result
                    ? Map.of("success", true, "message", "상품이 삭제되었습니다.")
                    : Map.of("success", false, "message", "상품 삭제에 실패했습니다.");
        } catch (Exception e) {
            return Map.of("success", false, "message", e.getMessage());
        }
    }
    
    /**
     * 선택된 장바구니 상품들 삭제
     */
    @PostMapping("/remove-selected")
    @ResponseBody
    public Map<String, Object> removeSelectedItems(@RequestParam("productVariantIds") List<Integer> productVariantIds,
                                                   @AuthenticationPrincipal UserDTO user) {
        if (user == null) return Map.of("success", false, "message", "로그인이 필요합니다.");

        try {
            boolean result = cartService.removeSelectedItems(user.getId(), productVariantIds);
            return result
                    ? Map.of("success", true, "message", "선택된 상품들이 삭제되었습니다.")
                    : Map.of("success", false, "message", "상품 삭제에 실패했습니다.");
        } catch (Exception e) {
            return Map.of("success", false, "message", e.getMessage());
        }
    }
    
    /**
     * 구매 불가능한 상품들 삭제
     */
    @PostMapping("/remove-unavailable")
    @ResponseBody
    public Map<String, Object> removeUnavailableItems(@AuthenticationPrincipal UserDTO user) {
        if (user == null) return Map.of("success", false, "message", "로그인이 필요합니다.");

        try {
            boolean result = cartService.removeUnavailableItems(user.getId());
            return result
                    ? Map.of("success", true, "message", "구매불가 상품들이 삭제되었습니다.")
                    : Map.of("success", false, "message", "상품 삭제에 실패했습니다.");
        } catch (Exception e) {
            return Map.of("success", false, "message", e.getMessage());
        }
    }
    
    /**
     * 장바구니 상품 개수 조회 (헤더용)
     */
    @GetMapping("/count")
    @ResponseBody
    public Map<String, Object> getCartCount(@AuthenticationPrincipal UserDTO user) {
        if (user == null) return Map.of("count", 0);

        int count = cartService.getCartItemCount(user.getId());
        return Map.of("count", count);
    }
    
    /**
     * 상품 옵션 정보 조회 (모달용)
     */
    @GetMapping("/options")
    @ResponseBody
    public ResponseEntity<CartOptionDTO.OptionSelectionResponse> getProductOptions(
            @RequestParam("productId") int productId,
            @RequestParam("variantId") int variantId,
            @AuthenticationPrincipal UserDTO user) {
        
        try {
            // 사용자 인증 확인
            if (user == null) {
                CartOptionDTO.OptionSelectionResponse response = new CartOptionDTO.OptionSelectionResponse();
                response.setSuccess(false);
                response.setMessage("로그인이 필요합니다.");
                return ResponseEntity.ok(response);
            }

            // 옵션 정보 조회
            CartOptionDTO.OptionSelectionResponse response = cartOptionService.getProductOptionsForModal(
                productId, variantId);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            e.printStackTrace();
            CartOptionDTO.OptionSelectionResponse response = new CartOptionDTO.OptionSelectionResponse();
            response.setSuccess(false);
            response.setMessage("옵션 정보 조회 중 오류가 발생했습니다.");
            return ResponseEntity.ok(response);
        }
    }


	/**
	 * 옵션 조합 변형 상품 가용성 확인
	 */
	@PostMapping("/checkVariantAvailability")
	@ResponseBody
	public ResponseEntity<CartOptionDTO.VariantAvailabilityResponse> checkVariantAvailability(
	        @RequestParam("productId") int productId,
	        @RequestParam("optionValueIds") List<Integer> optionValueIds,
	        @AuthenticationPrincipal UserDTO user) {
	    
	    try {
	        // 사용자 인증 확인
	        if (user == null) {
	            CartOptionDTO.VariantAvailabilityResponse response = new CartOptionDTO.VariantAvailabilityResponse();
	            response.setSuccess(false);
	            response.setMessage("로그인이 필요합니다.");
	            return ResponseEntity.ok(response);
	        }
	
	        // 입력값 검증
	        if (productId <= 0) {
	            CartOptionDTO.VariantAvailabilityResponse response = new CartOptionDTO.VariantAvailabilityResponse();
	            response.setSuccess(false);
	            response.setMessage("유효하지 않은 상품입니다.");
	            return ResponseEntity.ok(response);
	        }
	
	        if (optionValueIds == null || optionValueIds.isEmpty()) {
	            CartOptionDTO.VariantAvailabilityResponse response = new CartOptionDTO.VariantAvailabilityResponse();
	            response.setSuccess(false);
	            response.setMessage("옵션을 선택해주세요.");
	            return ResponseEntity.ok(response);
	        }
	
	        // null 값 필터링
	        List<Integer> filteredOptionValueIds = optionValueIds.stream()
	            .filter(Objects::nonNull)
	            .filter(id -> id > 0)
	            .collect(Collectors.toList());
	
	        if (filteredOptionValueIds.isEmpty()) {
	            CartOptionDTO.VariantAvailabilityResponse response = new CartOptionDTO.VariantAvailabilityResponse();
	            response.setSuccess(false);
	            response.setMessage("유효한 옵션을 선택해주세요.");
	            return ResponseEntity.ok(response);
	        }
	
	        CartOptionDTO.VariantAvailabilityResponse response = 
	            cartOptionService.checkVariantAvailability(productId, filteredOptionValueIds);
	        
	        return ResponseEntity.ok(response);
	        
	    } catch (Exception e) {
	        log.error("변형 상품 확인 중 오류 발생 - productId: {}, optionValueIds: {}", productId, optionValueIds, e);
	        CartOptionDTO.VariantAvailabilityResponse response = new CartOptionDTO.VariantAvailabilityResponse();
	        response.setSuccess(false);
	        response.setMessage("변형 상품 확인 중 오류가 발생했습니다.");
	        return ResponseEntity.ok(response);
	    }
	}
	
	/**
	 * 장바구니 아이템 옵션 변경
	 */
	@PostMapping("/updateCartItem")
	@ResponseBody
	public ResponseEntity<Map<String, Object>> updateCartItemOptions(
	        @RequestParam("productId") int productId,
	        @RequestParam("currentVariantId") int currentVariantId,
	        @RequestParam("optionValueIds") List<Integer> optionValueIds,
	        @RequestParam("quantity") int quantity,
	        @AuthenticationPrincipal UserDTO user) {
	    
	    try {
	        // 사용자 인증 확인
	        if (user == null) {
	            return ResponseEntity.ok(Map.of(
	                "success", false,
	                "message", "로그인이 필요합니다."
	            ));
	        }
	
	        // 입력값 검증
	        if (productId <= 0 || currentVariantId <= 0) {
	            return ResponseEntity.ok(Map.of(
	                "success", false,
	                "message", "유효하지 않은 상품 정보입니다."
	            ));
	        }
	
	        if (quantity <= 0) {
	            return ResponseEntity.ok(Map.of(
	                "success", false,
	                "message", "수량은 1개 이상이어야 합니다."
	            ));
	        }
	
	        if (optionValueIds == null || optionValueIds.isEmpty()) {
	            return ResponseEntity.ok(Map.of(
	                "success", false,
	                "message", "옵션을 선택해주세요."
	            ));
	        }
	
	        // null 값 필터링
	        List<Integer> filteredOptionValueIds = optionValueIds.stream()
	            .filter(Objects::nonNull)
	            .filter(id -> id > 0)
	            .collect(Collectors.toList());
	
	        if (filteredOptionValueIds.isEmpty()) {
	            return ResponseEntity.ok(Map.of(
	                "success", false,
	                "message", "유효한 옵션을 선택해주세요."
	            ));
	        }
	
	        // 장바구니 아이템 업데이트
	        boolean success = cartOptionService.updateCartItemOptions(
	            user.getId(), productId, currentVariantId, filteredOptionValueIds, quantity);
	        
	        if (success) {
	            return ResponseEntity.ok(Map.of(
	                "success", true,
	                "message", "장바구니가 업데이트되었습니다."
	            ));
	        } else {
	            return ResponseEntity.ok(Map.of(
	                "success", false,
	                "message", "장바구니 업데이트에 실패했습니다."
	            ));
	        }
	        
	    } catch (Exception e) {
	        log.error("장바구니 업데이트 중 오류 발생 - productId: {}, currentVariantId: {}, optionValueIds: {}", 
	                 productId, currentVariantId, optionValueIds, e);
	        return ResponseEntity.ok(Map.of(
	            "success", false,
	            "message", "장바구니 업데이트 중 오류가 발생했습니다."
	        ));
	    }
	}
}