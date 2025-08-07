package com.example.ecommerce.dto;

import lombok.Data;

@Data
public class ShippingMethodDTO {
    private int sellerId;
    private String shippingMethodId;
    private String shippingMethodName;
    private String cost;
    private String costOverride;
    private Boolean isDefault;
    private Integer carrierId;
    private String carrierName;
    private String carrierCode;
    private String carrierLogoUrl;
}
