package com.example.ecommerce.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
public class OrderResponseDTO {
    // === 공통 응답 필드 ===
    private String orderType; // "SINGLE", "MULTI", "GROUPBUY"
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss", shape = JsonFormat.Shape.STRING)
    private LocalDateTime orderDate;
    private String paymentMethod;
    private String recipientName;
    private String recipientAddress;

    // === 단일 주문 응답 필드 ===
    private Integer orderId;
    private String orderNo;
    private Integer finalAmount;
    private String status;
    private String productName;
    private String productImageUrl;
    private Integer quantity;
    private String estimatedDeliveryDate;

    // === 다중 주문 응답 필드 ===
    private String orderGroupId;
    private List<OrderCompleteInfo> orders;
    private Integer totalAmount;
    private Integer totalItemCount;
    private Integer orderCount;

    // === 공동구매 응답 필드 ===
    private String groupBuyName;
    private String groupBuyStatus;
    private Integer currentParticipants;
    private Integer targetParticipants;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss", shape = JsonFormat.Shape.STRING)
    private LocalDateTime endDate;
    private Integer groupBuyParticipantId;

    // === 내부 클래스 ===
    @Data
    public static class OrderCompleteInfo {
        private Integer orderId;
        private String orderNo;
        private String productName;
        private String productImageUrl;
        private Integer quantity;
        private Integer finalAmount;
    }

    // === 유틸리티 메서드 ===

    /**
     * 단일 주문 응답 생성
     */
    public static OrderResponseDTO forSingleOrder(Integer orderId, String orderNo, String productName,
                                                  String productImageUrl, Integer quantity, Integer finalAmount) {
        OrderResponseDTO dto = new OrderResponseDTO();
        dto.setOrderType("SINGLE");
        dto.setOrderId(orderId);
        dto.setOrderNo(orderNo);
        dto.setProductName(productName);
        dto.setProductImageUrl(productImageUrl);
        dto.setQuantity(quantity);
        dto.setFinalAmount(finalAmount);
        return dto;
    }

    /**
     * 다중 주문 응답 생성
     */
    public static OrderResponseDTO forMultiOrder(String orderGroupId, List<OrderCompleteInfo> orders,
                                                 Integer totalAmount, Integer totalItemCount) {
        OrderResponseDTO dto = new OrderResponseDTO();
        dto.setOrderType("MULTI");
        dto.setOrderGroupId(orderGroupId);
        dto.setOrders(orders);
        dto.setTotalAmount(totalAmount);
        dto.setTotalItemCount(totalItemCount);
        dto.setOrderCount(orders.size());
        return dto;
    }

    /**
     * 공동구매 응답 생성
     */
    public static OrderResponseDTO forGroupBuy(String groupBuyName, String groupBuyStatus,
                                               Integer currentParticipants, Integer targetParticipants) {
        OrderResponseDTO dto = new OrderResponseDTO();
        dto.setOrderType("GROUPBUY");
        dto.setGroupBuyName(groupBuyName);
        dto.setGroupBuyStatus(groupBuyStatus);
        dto.setCurrentParticipants(currentParticipants);
        dto.setTargetParticipants(targetParticipants);
        return dto;
    }
}