package com.example.ecommerce.dto;

import lombok.Data;

@Data
public class SellerNotificationSettingsDTO {
    private int sellerId;
    private Boolean notifyNewOrder;
    private Boolean notifyGbStatus;
    private Boolean notifyLowStock;
    private Boolean notifySettlement;
    private Boolean notifyNewInquiry;
}