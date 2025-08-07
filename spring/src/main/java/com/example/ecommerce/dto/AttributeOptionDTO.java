package com.example.ecommerce.dto;

import lombok.Data;

@Data
public class AttributeOptionDTO {
    /**
     * 옵션 ID
     */
    private int id;

    /**
     * 속성 ID
     */
    private int attributeId;

    /**
     * 옵션값
     */
    private String value;

    /**
     * 표시 순서
     */
    private int displayOrder;

    /**
     * 해당 옵션값을 가진 상품 수 (선택적으로 사용)
     */
    private Integer productCount;
}