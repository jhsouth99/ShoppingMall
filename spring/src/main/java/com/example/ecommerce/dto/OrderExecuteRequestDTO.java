package com.example.ecommerce.dto;

import lombok.Data;

import java.util.Map;

@Data
public class OrderExecuteRequestDTO {
    private String orderType;
    private Integer shippingAddressId;
    private String recipientName;
    private String recipientPhone;
    private String recipientAddress;
    private String recipientAddressDetail;
    private String recipientZipcode;
    private String recipientDelivReqType;
    private String recipientDelivReqMsg;
    private String paymentMethod;
    private String appliedCouponCode;
    private Integer finalAmount;
    private Integer subTotalAmount;
    private Integer shippingFee;
    private Integer couponDiscount;
    private Map<String, Object> paymentInfo;
}
