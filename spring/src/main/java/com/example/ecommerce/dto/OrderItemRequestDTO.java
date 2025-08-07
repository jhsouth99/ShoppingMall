package com.example.ecommerce.dto;

import lombok.Data;

@Data
public class OrderItemRequestDTO {
    private Integer productId;
    private Integer productVariantId;
    private Integer quantity;
    private Integer price;
    private String itemComment;
    private Integer shippingCost;
    private Integer sellerId;
}
