package com.example.ecommerce.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class GroupBuyJoinRequestDTO {
    private Integer groupBuyId;
    private Integer productId;
    private Integer variantId;
    private Integer quantity;
    private String recipientName;
    private String recipientPhone;
    private String recipientAddress;
    private String recipientAddressDetail;
    private String recipientZipcode;
    private String recipientDelivReqType;
    private String recipientDelivReqMsg;
}
