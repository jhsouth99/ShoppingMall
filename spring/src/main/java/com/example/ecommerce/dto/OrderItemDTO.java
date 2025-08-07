package com.example.ecommerce.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class OrderItemDTO {
    private int id;
    private int orderId;
    private int productId;
    private int productVariantId;
    private String productName;
    private String productImageUrl;
    private String optionCombination; // 예: "색상:빨강 / 사이즈:XL"
    private int quantity;
    private int priceAtPurchase;
    private int totalPriceAtPurchase;
    private String status;
    private String itemComment;
    private Integer totalPriceAtPurch;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss", shape = JsonFormat.Shape.STRING)
    private LocalDateTime confirmedAt;
}