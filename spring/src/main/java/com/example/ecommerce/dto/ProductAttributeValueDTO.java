package com.example.ecommerce.dto;

import lombok.Data;

@Data
public class ProductAttributeValueDTO {
    private int attributeId;
    private String attributeName;
    private String value;
}
