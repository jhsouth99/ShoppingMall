package com.example.ecommerce.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ProductImageDTO {
    private String id;
    private int productId;
    private String imageUrl;
    private String altText;
    private String imageType;
    private int displayOrder;
    private long fileSize;
    private String mimeType;
    private String originalFilename;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}