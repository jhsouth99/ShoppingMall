package com.example.ecommerce.dto;

import lombok.Data;

import java.util.Map;

@Data
public class GroupBuyExecuteRequestDTO {
    private String recipientName;
    private String recipientPhone;
    private String recipientAddress;
    private String recipientAddressDetail;
    private String recipientZipcode;
    private String recipientDelivReqType;
    private String recipientDelivReqMsg;
    private String paymentMethod;
    private Integer shippingAddressId;
    private Map<String, Object> paymentInfo;
}
