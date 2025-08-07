package com.example.ecommerce.dto;

import java.time.LocalDateTime;
import java.util.Date;

import com.example.ecommerce.dto.enums.OrderStatus;
import com.example.ecommerce.dto.enums.RefundStatus;
import com.fasterxml.jackson.annotation.JsonFormat;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@AllArgsConstructor
@NoArgsConstructor
@Getter @Setter
@ToString
public class GroupBuyParticipantDTO {

    int id, groupBuyId, userId, variantId, quantity, orderId, shippingAddressId, paidAmount;
    
    String status, delivReqMsgSnapshot, userName, groupBuyName, orderNo, displayName;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm", shape = JsonFormat.Shape.STRING)
    Date joinedAt, createdAt, updatedAt, paidAt;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm", shape = JsonFormat.Shape.STRING)
    LocalDateTime endDate;
	private OrderStatus orderStatus;
	private RefundStatus refundStatus;

    private int productId;
    private String productName;
    private String productImageUrl;
    private String optionCombination;
    private int originalPrice; // 상품의 원래 가격 (할인 전)
    private int finalPrice;    // 공동구매 단가 (할인 후)
    private int currentParticipants;
    private int targetParticipants;
    private String recipientName;
    private String recipientPhone;
    private String recipientAddress;
    private String recipientAddressDetail;
    private String recipientZipcode;
    private String recipientDelivReqType;
    private String recipientDelivReqMsg;
    private String paymentMethod;
    private int subTotalAmount;
    private int shippingFee;
    private int finalAmount;
    private int promotionDiscountAmount = 0; // 공동구매는 프로모션 없으므로 0으로 초기화
    private int couponDiscountAmount = 0;    // 공동구매는 쿠폰 없으므로 0으로 초기화
    private int totalDiscountAmount = 0;
    private int currentQuantity;
    private int targetQuantity;
    private String gbStatus;
}