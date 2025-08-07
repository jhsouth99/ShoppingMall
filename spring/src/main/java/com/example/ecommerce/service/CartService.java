package com.example.ecommerce.service;

import com.example.ecommerce.dao.CartDAO;
import com.example.ecommerce.dao.ProductDAO;
import com.example.ecommerce.dto.CartItemDTO;
import com.example.ecommerce.dto.UserDTO;

import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RequiredArgsConstructor
public class CartService {
    // 장바구니 추가용
    private final ProductDAO productDAO;
    private final CartDAO cartDao;

    /**
     * 사용자의 장바구니 목록 조회
     */
    @Transactional(readOnly = true)
    public List<CartItemDTO> getCartItems(int userId) {
        List<CartItemDTO> cartItems = cartDao.selectCartItems(userId);

        // 각 아이템별로 가격 계산 (이미 SQL에서 계산되어 온 값들을 검증/보정)
        for (CartItemDTO item : cartItems) {
            validateAndAdjustItemPrices(item);
        }

        return cartItems;
    }

    /**
     * 장바구니 상품 수량 변경
     */
    public boolean updateCartItem(int userId, int productVariantId, int quantity) {
        if (quantity <= 0) {
            return removeCartItemByUserIdAndPVId(userId, productVariantId);
        }
        return cartDao.updateCartItemQuantity(userId, productVariantId, quantity) > 0;
    }

    public boolean removeCartItemByUserIdAndPVId(int userId, int productVariantId) {
        return cartDao.deleteCartItem(userId, productVariantId) > 0;
    }

    public boolean removeCartItems(int userId, List<Integer> selectedCartItemIds) {
        boolean success = true;
        for (Integer selectedCartItemId : selectedCartItemIds) {
            boolean t = cartDao.deleteCartItem(userId, selectedCartItemId) > 0;
            if (!t) {
                success = false;
            }
        }
        return success;
    }

    // 장바구니에 상품 추가
    public String registCartItem( Integer productVariantId, Integer quantity, UserDTO user ) {
        // 파라미터 맵 형태로 묶기
        Map<String, Object> params = new HashMap<String, Object>();
        params.put("productVariantId", productVariantId);
        params.put("quantity", quantity);
        params.put("userId", user.getId());

        productDAO.insertCartItem(params);

        return "등록 완료";
    }
    /**
     * 장바구니에 상품 추가
     */
    public boolean addToCart(int userId, int productVariantId, int quantity) {
        // 이미 장바구니에 있는지 확인
        CartItemDTO existingItem = cartDao.selectCartItem(userId, productVariantId);

        if (existingItem != null) {
            // 기존 수량에 추가
            int newQuantity = existingItem.getQuantity() + quantity;
            return cartDao.updateCartItemQuantity(userId, productVariantId, newQuantity) > 0;
        } else {
            // 새로 추가
            return cartDao.insertCartItem(userId, productVariantId, quantity) > 0;
        }
    }

    // 장바구니 중복 상품 검색
    public boolean isProductVariantInCart( Integer productVariantId, UserDTO user ) {
        Map<String, Object> params = new HashMap<String, Object>();
        params.put("productVariantId", productVariantId);
        params.put("userId", user.getId());

        int countCartItem = productDAO.selectCountCartItem(params);

        return countCartItem >= 1;
    }

    /**
     * 선택된 장바구니 상품들 삭제
     */
    public boolean removeSelectedItems(int userId, List<Integer> productVariantIds) {
        if (productVariantIds == null || productVariantIds.isEmpty()) {
            return false;
        }
        return cartDao.deleteSelectedCartItems(userId, productVariantIds) > 0;
    }

    /**
     * 주문 완료 후 선택된 장바구니 상품들 삭제 (cartItemIds 기준)
     */
    public boolean removeItems(int userId, List<Long> cartItemIds) {
        if (cartItemIds == null || cartItemIds.isEmpty()) {
            return false;
        }

        // Long 타입의 cartItemIds를 Integer 타입의 productVariantIds로 변환
        List<Integer> productVariantIds = cartItemIds.stream()
                .map(Long::intValue)
                .collect(Collectors.toList());

        return cartDao.deleteSelectedCartItems(userId, productVariantIds) > 0;
    }

    /**
     * 구매 불가능한 상품들 삭제
     */
    public boolean removeUnavailableItems(int userId) {
        return cartDao.deleteUnavailableCartItems(userId) > 0;
    }

    /**
     * 장바구니 상품 개수 조회
     */
    @Transactional(readOnly = true)
    public int getCartItemCount(int userId) {
        return cartDao.selectCartItemCount(userId);
    }

    /**
     * 장바구니 요약 정보 계산
     */
    @Transactional(readOnly = true)
    public Map<String, Object> calculateCartSummary(List<CartItemDTO> cartItems) {
        Map<String, Object> summary = new HashMap<>();

        // 구매 가능한 상품만 필터링
        List<CartItemDTO> availableItems = cartItems.stream()
                .filter(item -> !item.isUnavailable())
                .collect(Collectors.toList());

        // 총 상품 개수
        int totalItemCount = availableItems.stream()
                .mapToInt(CartItemDTO::getQuantity)
                .sum();

        // 총 상품 금액 (할인 적용)
        double totalProductAmount = availableItems.stream()
                .mapToDouble(CartItemDTO::getFinalTotalPrice)
                .sum();

        // 판매자별 배송비 계산
        double totalShippingCost = calculateTotalShippingCost(availableItems);

        // 최종 결제 금액
        double finalAmount = totalProductAmount + totalShippingCost;

        // 할인 금액 계산
        double totalDiscountAmount = availableItems.stream()
                .filter(item -> item.getIsDiscounted() != null && item.getIsDiscounted())
                .mapToDouble(item -> item.getDiscountAmount() * item.getQuantity())
                .sum();

        summary.put("totalItemCount", totalItemCount);
        summary.put("totalProductAmount", totalProductAmount);
        summary.put("totalShippingCost", totalShippingCost);
        summary.put("totalDiscountAmount", totalDiscountAmount);
        summary.put("finalAmount", finalAmount);
        summary.put("availableItemCount", availableItems.size());

        return summary;
    }

    /**
     * 개별 상품의 가격 검증 및 보정 (variant price 기반)
     */
    private void validateAndAdjustItemPrices(CartItemDTO item) {
        // SQL에서 이미 계산된 값들을 사용하되, 필요시 보정
        // unitPrice는 variantPrice와 동일해야 함
        if (item.getUnitPrice() == 0 && item.getVariantPrice() > 0) {
            item.setUnitPrice(item.getVariantPrice());
        }

        // totalPrice 검증
        double expectedTotalPrice = item.getVariantPrice() * item.getQuantity();
        if (Math.abs(item.getTotalPrice() - expectedTotalPrice) > 0.01) {
            item.setTotalPrice(expectedTotalPrice);
        }

        // 할인 적용 후 가격 검증
        if (item.getIsDiscounted() != null && item.getIsDiscounted()) {
            // 할인된 단위 가격이 0보다 작으면 0으로 설정
            if (item.getDiscountedUnitPrice() < 0) {
                item.setDiscountedUnitPrice(0);
                item.setDiscountedTotalPrice(0);
            }

            // 할인된 총 가격 재계산
            double expectedDiscountedTotal = item.getDiscountedUnitPrice() * item.getQuantity();
            if (Math.abs(item.getDiscountedTotalPrice() - expectedDiscountedTotal) > 0.01) {
                item.setDiscountedTotalPrice(expectedDiscountedTotal);
            }
        }
    }

    /**
     * 판매자별 총 배송비 계산
     */
    private double calculateTotalShippingCost(List<CartItemDTO> cartItems) {
        // 판매자별로 그룹화
        Map<Integer, List<CartItemDTO>> itemsBySeller = cartItems.stream()
                .collect(Collectors.groupingBy(CartItemDTO::getSellerId));

        double totalShippingCost = 0;

        // 각 판매자별로 배송비 계산 (판매자당 한 번만)
        for (List<CartItemDTO> sellerItems : itemsBySeller.values()) {
            if (!sellerItems.isEmpty()) {
                // 해당 판매자의 배송비 (첫 번째 상품의 배송비를 사용)
                CartItemDTO firstItem = sellerItems.get(0);
                totalShippingCost += firstItem.getFinalShippingCost();
            }
        }

        return totalShippingCost;
    }

}
