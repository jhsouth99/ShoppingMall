package com.example.ecommerce.dto;

import lombok.Data;

@Data
public class PromotionConditionDTO {
    private int id;
    private int promotionId;
    private String conditionType;
    private String cardIssuerValue;
    private Integer decimalValue;
}