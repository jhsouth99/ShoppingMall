package com.example.ecommerce.dto;

import lombok.Data;

@Data
public class ReviewImageDTO {
    private String id;
    private Integer reviewId;
    private String imageUrl;
    private Integer displayOrder;
}