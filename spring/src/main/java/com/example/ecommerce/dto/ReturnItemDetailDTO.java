package com.example.ecommerce.dto;

import lombok.Data;

@Data
public class ReturnItemDetailDTO {
    private Integer productId;
    private String productName;
    private String productOption;
    private int quantity;
    private String reasonCode;
}