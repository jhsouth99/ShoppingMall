package com.example.ecommerce.dto;

import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class OrderRequestDTO {
    // === 단일 상품 주문 필드 ===
    private Integer productId;
    private Integer variantId;
    private Integer quantity;
    private Integer originalPrice;
    private Integer finalPrice;
    private Integer appliedPromotionId;
    private String appliedCouponCode;
    private Integer promotionDiscount;
    private Integer couponDiscount;
    private String itemComment; // 상품 옵션에 대한 추가 요청사항

    // === 다중 상품 주문 필드 ===
    private List<OrderItemRequestDTO> orderItems;
    private Integer totalAmount;

    // === 공동구매 관련 필드 ===
    private Integer groupBuyId;

    // === 주문 실행 정보 (배송지 등) ===
    private String recipientName;
    private String recipientPhone;
    private String recipientAddress;
    private String recipientAddressDetail;
    private String recipientZipcode;
    private String recipientDelivReqType;
    private String recipientDelivReqMsg;
    private String paymentMethod;
    private Integer finalAmount;
    private Integer shippingAddressId; // 기존 배송지 선택 시
    private Integer shippingCost;

    private String orderType;
    private Map<String, Object> paymentInfo;

    // === 유틸리티 메서드 ===

    /**
     * 단일 상품 주문인지 확인
     */
    public boolean isSingleOrder() {
        return productId != null && (orderItems == null || orderItems.isEmpty());
    }

    /**
     * 다중 상품 주문인지 확인
     */
    public boolean isMultiOrder() {
        return orderItems != null && !orderItems.isEmpty();
    }

    /**
     * 공동구매 주문인지 확인
     */
    public boolean isGroupBuyOrder() {
        return groupBuyId != null;
    }

    /**
     * 주문 타입 반환
     */
    public String getOrderType() {
        if (isGroupBuyOrder()) return "GROUPBUY";
        if (isMultiOrder()) return "MULTI";
        return "SINGLE";
    }
}