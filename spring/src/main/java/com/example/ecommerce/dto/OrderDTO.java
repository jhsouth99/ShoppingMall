package com.example.ecommerce.dto;

import com.example.ecommerce.dto.enums.RefundStatus;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class OrderDTO {
    // 주문 기본 정보
    private int id;
    private Integer orderId;
    private String orderNo;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss", shape = JsonFormat.Shape.STRING)
    private LocalDateTime createdAt;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss", shape = JsonFormat.Shape.STRING)
    private LocalDateTime updatedAt;
    private String status;
    private Integer totalPriceAtPurch;
    private List<RefundDTO> refunds;
    private Integer totalItemCount;

    // 구매자 정보
    private int userId;
    private String username;
    private String customerName;

    // 배송지 정보
    private String recipientName;
    private String recipientPhone;
    private String recipientAddress;
    private String recipientAddressDetail;
    private String recipientZipcode;
    private String recipientDelivReqType;
    private String recipientDelivReqMsg;
    private int shippingFee;

    // 금액 정보 (Integer → int로 변경하여 기본값 0 보장)
    private int finalAmount;
    private int subTotalAmount = 0;
    private int couponDiscountAmount = 0;
    private int promotionDiscountAmount = 0;
    private int totalDiscountAmount = 0;

    // 주문 상품 목록
    private List<OrderItemDTO> items;

    // 결제 정보
    private PaymentDTO payment;

    // 배송 정보
    private ShipmentDTO shippingInfo;
    private Boolean isGroupBuy;

    // 단일 상품 주문용 필드들 (checkout.jsp에서 사용)
    private Integer productId;
    private Integer productVariantId;
    private Integer quantity;
    private String productName;
    private String productImageUrl;
    private String optionCombination;
    private int originalPrice = 0;  // 할인 전 가격
    private int finalPrice = 0;     // 최종 가격 (할인 후)
    private int totalAmount = 0;    // 수량을 곱한 총 금액

    // 공동구매용 필드들 (checkout.jsp에서 사용)
    private Integer groupBuyId;
    private String groupBuyName;
    private int groupPrice = 0;     // 공동구매 단가
    private int currentQuantity = 0;  // 현재 참여 수량
    private int targetQuantity = 0;   // 목표 수량

    // 할인 관련 필드들
    private String appliedCouponCode;   // 적용된 쿠폰 코드
    private Integer appliedPromotionId; // 적용된 프로모션 ID
    private String paymentMethod;       // 결제 방법

    private String orderGroupId;
}