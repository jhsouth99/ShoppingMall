package com.example.ecommerce.dto;

import lombok.Data;

@Data
public class CategoryAttributeDTO {
    private int categoryId;
    private int attributeId;
    private String attributeName;
    private String dataType;
    private boolean isRequired;
    private int displayOrder;
}
