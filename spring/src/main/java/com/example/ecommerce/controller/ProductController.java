package com.example.ecommerce.controller;

import com.example.ecommerce.dto.*;
import com.example.ecommerce.service.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Controller
@RequiredArgsConstructor
public class ProductController {

    Logger logger = LoggerFactory.getLogger(ProductController.class);

    private final ObjectMapper objectMapper;
    private final ProductService productService;
    private final PromotionService promotionService;
    private final CouponService couponService;
    private final GroupBuyService groupBuyService;
    private final QnAService qnaService;
    private final CartService cartService;

    @GetMapping("/products/{productId}")
    public String viewProduct(@AuthenticationPrincipal UserDTO userDTO, @PathVariable("productId") Integer productId, Model model) {
        ProductDetailDTO product = productService.getProductDetails(productId);
        model.addAttribute("product", product);

        // 로그인한 사용자의 위시리스트 상태 확인
        {
            boolean isWished = false;
            if (userDTO != null) {
                isWished = productService.isWishlistItem(userDTO.getId(), productId);
            }
            model.addAttribute("isWished", isWished);
        }

        // 프로모션 정보 조회 추가
        List<PromotionDetailDTO> activePromotions = promotionService.getActivePromotionsByProductId(productId);
        model.addAttribute("activePromotions", activePromotions);

        // 사용자별 사용 가능한 쿠폰 조회 추가
        if (userDTO != null) {
            List<UserCouponDTO> availableCoupons = couponService.getAvailableCouponsForProduct(userDTO.getId(), productId);
            model.addAttribute("availableCoupons", availableCoupons);

            // 찜 상태 확인
            boolean isWished = productService.isWishlistItem(userDTO.getId(), productId);
            model.addAttribute("isWished", isWished);
        }

        // 공동구매 정보 조회
        List<GroupBuyDTO> allGroupBuys = groupBuyService.getGroupBuysByProductId(productId);

        // 활성화된 공동구매만 필터링 (ACTIVE, PENDING 상태)
        List<GroupBuyDTO> activeGroupBuys = allGroupBuys.stream()
                .filter(gb -> "ACTIVE".equals(gb.getStatus()) || "PENDING".equals(gb.getStatus()))
                .collect(Collectors.toList());

        // 공동구매 정보를 모델에 추가
        model.addAttribute("groupBuys", allGroupBuys);
        model.addAttribute("activeGroupBuys", activeGroupBuys);

        // 첫 번째 활성 공동구매를 대표 공동구매로 설정 (버튼에 표시용)
        if (!activeGroupBuys.isEmpty()) {
            model.addAttribute("groupBuyInfo", activeGroupBuys.get(0));
        }


        // 최저가 variant 정보 추가
        if (product.getVariants() != null && !product.getVariants().isEmpty()) {
            // 재고가 있는 활성 variant 중에서 최저가 찾기
            ProductVariantDTO minPriceVariant = product.getVariants().stream()
                    .filter(v -> v.getIsActive() && v.getStockQuantity() > 0)
                    .min(Comparator.comparing(ProductVariantDTO::getPrice))
                    .orElse(null);

            if (minPriceVariant != null) {
                model.addAttribute("minPriceVariant", minPriceVariant);

                // 최저가 variant의 옵션 조합 파싱
                Map<String, String> defaultOptions = parseOptionCombination(minPriceVariant.getOptionCombination());
                model.addAttribute("defaultOptions", defaultOptions);
            }
        }

        // 관련 상품 정보
        List<ProductDetailDTO> relatedProduct = productService.getRelatedProductList(productId);
        System.out.println("관련 상품 개수: " + relatedProduct.size());
        model.addAttribute("relPro", relatedProduct);

        // 상품 가격 정보 조회(할인적용가)
        ProductDetailDTO productPrice = productService.getProductPrice(productId);
        model.addAttribute("proPrice", productPrice);

        return "product-detail";
    }

    // 옵션 조합 문자열을 파싱하는 헬퍼 메소드 추가
    private Map<String, String> parseOptionCombination(String optionCombination) {
        Map<String, String> options = new HashMap<>();
        if (optionCombination != null && !optionCombination.isEmpty()) {
            String[] combinations = optionCombination.split(" / ");
            for (String combo : combinations) {
                String[] parts = combo.split(":");
                if (parts.length == 2) {
                    options.put(parts[0].trim(), parts[1].trim());
                }
            }
        }
        return options;
    }

    @GetMapping("/api/wishlist/check")
    @ResponseBody
    public ResponseEntity<?> checkWishlist(
            @AuthenticationPrincipal UserDTO userDTO, Integer productId) {
        return ResponseEntity.ok(Map.of("success", true, "isWished", productService.isWishlistItem(userDTO.getId(), productId)));
    }

    @PostMapping("/api/wishlist/toggle")
    @ResponseBody
    public ResponseEntity<?> toggleWishlist(
            @AuthenticationPrincipal UserDTO userDTO, Integer productId) {
        return ResponseEntity.ok(Map.of("success", true, "isWished", productService.toggleWishlist(userDTO.getId(), productId)));
    }


    // 상품 문의 등록
    @PostMapping("/api/productId/{productId}/qnas")
    @PreAuthorize("isAuthenticated()")
    @ResponseBody
    public ResponseEntity<String> registerQna(
            @PathVariable Integer productId,
            @RequestBody QnADTO qnaDTO,
            @AuthenticationPrincipal UserDTO user) {

        try {
            // 입력값 검증
            if (qnaDTO.getTitle() == null || qnaDTO.getTitle().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("제목을 입력해주세요.");
            }

            if (qnaDTO.getQuestion() == null || qnaDTO.getQuestion().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("문의 내용을 입력해주세요.");
            }

            if (qnaDTO.getTitle().length() > 100) {
                return ResponseEntity.badRequest().body("제목은 100자 이하로 입력해주세요.");
            }

            if (qnaDTO.getQuestion().length() > 1000) {
                return ResponseEntity.badRequest().body("문의 내용은 1000자 이하로 입력해주세요.");
            }

            // 상품 존재 여부 확인
            ProductDetailDTO product = productService.getProductDetails(productId);
            if (product == null) {
                return ResponseEntity.badRequest().body("존재하지 않는 상품입니다.");
            }

            // QnA 저장
            qnaService.saveQna(productId, qnaDTO, user);

            return ResponseEntity.ok("등록 완료");

        } catch (Exception e) {
            // 로그 출력
            System.err.println("QnA 등록 오류: " + e.getMessage());
            e.printStackTrace();

            return ResponseEntity.internalServerError().body("등록 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    // 장바구니에 상품 저장
    @PostMapping("/api/productId/{productId}/cart/add")
    @PreAuthorize("isAuthenticated()")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> registCartItem(
            @RequestParam("productVariantId") Integer productVariantId,
            @RequestParam("quantity") Integer quantity,
            @AuthenticationPrincipal UserDTO user){

        try {
            // 중복 상품 검색
            boolean isDuplicate = cartService.isProductVariantInCart(productVariantId, user);

            Map<String, Object> response = new HashMap<String, Object>();

            if( isDuplicate ){ // 중복 상품 존재할 경우
                response.put("success", false);
                response.put("message", "장바구니에 이미 같은 품목이 존재합니다. 수량 변경은 장바구니 페이지에서 해주세요.");
                response.put("isDuplicate", true);

                return ResponseEntity.ok(response);

            }else {
                // 장바구니 등록
                cartService.registCartItem(productVariantId, quantity, user);

                response.put("success", true);
                response.put("message", "장바구니에 추가되었습니다.");

                return ResponseEntity.ok(response);
            }




        } catch (Exception e) {
            // 에러 응답
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "장바구니 추가 중 오류가 발생했습니다: " + e.getMessage());

            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }


    /**
     * 판매자의 상품 목록을 조회합니다. (페이징 및 검색 포함)
     */
    @GetMapping("/api/seller/products")
    @ResponseBody
    public ResponseEntity<PageResult<ProductSummaryDTO>> getProducts(
            @AuthenticationPrincipal UserDTO seller,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status) {
        PageResult<ProductSummaryDTO> result = productService.getProducts(seller.getId(), page, size, keyword, status);
        return ResponseEntity.ok(result);
    }

    /**
     * 특정 상품의 상세 정보를 조회합니다. (수정 모달용)
     */
    @GetMapping("/api/seller/products/{productId}")
    @ResponseBody
    public ResponseEntity<ProductDetailDTO> getProductDetails(
            @AuthenticationPrincipal UserDTO seller,
            @PathVariable int productId) {
        try {
            ProductDetailDTO product = productService.getProductDetails(productId);
            return ResponseEntity.ok(product);
        } catch(SecurityException e) {
            return ResponseEntity.status(403).build(); // Forbidden
        }
    }

    /**
     * 새 상품을 등록합니다. (개선된 이미지 타입 처리)
     */
    @PostMapping("/api/seller/products")
    @ResponseBody
    public ResponseEntity<?> createProduct(
            @AuthenticationPrincipal UserDTO seller,
            @RequestParam(value = "productData") String productDataJson,
            @RequestParam(value = "images", required = false) List<MultipartFile> images,
            @RequestParam(value = "imageTypes", required = false) String imageTypesJson) {

        try {
            // JSON 문자열을 ProductDetailDTO 객체로 변환
            ProductDetailDTO productData = objectMapper.readValue(productDataJson, ProductDetailDTO.class);

            productData.setSellerId(seller.getId());

            // 이미지 파일 처리 및 상품 생성
            int newProductId = productService.createProduct(productData, images, imageTypesJson);

            logger.info("상품 등록 완료: productId={}, sellerId={}, imageCount={}",
                    newProductId, seller.getId(), images != null ? images.size() : 0);

            return ResponseEntity.ok(Map.of("productId", newProductId, "success", true));

        } catch (Exception e) {
            logger.error("상품 등록 중 오류 발생", e);
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "상품 등록에 실패했습니다: " + e.getMessage()));
        }
    }

    /**
     * 기존 상품 정보를 수정합니다. (이미지 순서 처리 개선)
     */
    @PutMapping(value = "/api/seller/products/{productId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseBody
    public ResponseEntity<Map<String, Object>> updateProduct(
            @AuthenticationPrincipal UserDTO seller,
            @PathVariable int productId,
            @RequestParam("productData") String productDataJson,
            @RequestParam(value = "images", required = false) List<MultipartFile> images,
            @RequestParam(value = "imageTypes", required = false) String imageTypesJson) {

        try {
            // JSON 문자열을 ProductDetailDTO 객체로 변환
            ProductDetailDTO productData = objectMapper.readValue(productDataJson, ProductDetailDTO.class);

            // 이미지 파일 처리 및 상품 수정
            productService.updateProduct(seller.getId(), productId, productData, images, imageTypesJson);

            logger.info("상품 수정 완료: productId={}, sellerId={}, imageCount={}",
                    productId, seller.getId(), images != null ? images.size() : 0);

            return ResponseEntity.ok(Map.of("success", true, "message", "상품이 성공적으로 수정되었습니다."));

        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "권한이 없습니다."));
        } catch (Exception e) {
            logger.error("상품 수정 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "상품 수정에 실패했습니다: " + e.getMessage()));
        }
    }

    /**
     * 상품 이미지 순서를 재정렬합니다.
     */
    @PutMapping("/api/seller/products/{productId}/images/reorder")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> reorderProductImages(
            @AuthenticationPrincipal UserDTO seller,
            @PathVariable int productId,
            @RequestBody List<Map<String, Object>> imageOrderData) {

        try {
            ProductDetailDTO product = productService.getProductDetails(productId);
            if (product == null || product.getSellerId() != seller.getId()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "해당 상품에 대한 권한이 없습니다."));
            }

            // 이미지 순서 업데이트
            productService.updateProductImageOrder(productId, imageOrderData);

            logger.info("이미지 순서 재정렬 완료: productId={}, sellerId={}, imageCount={}",
                    productId, seller.getId(), imageOrderData.size());

            return ResponseEntity.ok(Map.of("success", true, "message", "이미지 순서가 업데이트되었습니다."));

        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "권한이 없습니다."));
        } catch (Exception e) {
            logger.error("이미지 순서 재정렬 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "이미지 순서 업데이트에 실패했습니다."));
        }
    }

    /**
     * 상품 이미지 타입을 자동으로 재조정합니다.
     */
    @PutMapping("/api/seller/products/{productId}/images/auto-reorder")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> autoReorderProductImages(
            @AuthenticationPrincipal UserDTO seller,
            @PathVariable int productId) {

        try {
            // 상품 소유권 확인
            ProductDetailDTO product = productService.getProductDetails(productId);
            if (product == null || product.getSellerId() != seller.getId()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "해당 상품에 대한 권한이 없습니다."));
            }

            // 이미지 타입 자동 재조정
            productService.reorderImageTypes(productId);

            logger.info("이미지 타입 자동 재조정 완료: productId={}, sellerId={}", productId, seller.getId());

            return ResponseEntity.ok(Map.of("success", true, "message", "이미지 타입이 자동으로 재조정되었습니다."));

        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "권한이 없습니다."));
        } catch (Exception e) {
            logger.error("이미지 타입 자동 재조정 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "이미지 타입 재조정에 실패했습니다."));
        }
    }

    /**
     * 특정 상품의 개별 이미지를 삭제합니다.
     */
    @DeleteMapping("/api/seller/products/{productId}/images/{imageId}")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> deleteProductImage(
            @AuthenticationPrincipal UserDTO seller,
            @PathVariable int productId,
            @PathVariable String imageId) {
        try {
            // 이미지 소유권 확인 및 삭제
            boolean deleted = productService.deleteProductImage(seller.getId(), productId, imageId);

            if (deleted) {
                return ResponseEntity.ok(Map.of("success", true, "message", "이미지가 삭제되었습니다."));
            } else {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "이미지 삭제에 실패했습니다."));
            }

        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("success", false, "message", "권한이 없습니다."));
        } catch (Exception e) {
            logger.error("이미지 삭제 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "서버 오류가 발생했습니다."));
        }
    }

    /**
     * 상품을 삭제합니다. (Soft Delete)
     */
    @DeleteMapping("/api/seller/products/{productId}")
    @ResponseBody
    public ResponseEntity<Void> deleteProduct(
            @AuthenticationPrincipal UserDTO seller,
            @PathVariable int productId) {
        productService.deleteProduct(seller.getId(), productId);
        return ResponseEntity.ok().build();
    }

    /**
     * 특정 상품의 변형(옵션) 목록을 조회합니다. (교환 옵션 선택용)
     */
    @GetMapping("/api/products/{productId}/variants")
    @ResponseBody
    public ResponseEntity<List<ProductVariantDTO>> getProductVariants(
            @PathVariable int productId) {
        List<ProductVariantDTO> variants = productService.getVariantsByProductId(productId);
        return ResponseEntity.ok(variants);
    }

}
