package com.example.ecommerce.dto;

import lombok.Data;

@Data
public class ProductVariantDTO {
	private int id;
	private int productId;
	private String sku;
    private String displayName;
	private int price;
	private int stockQuantity;
	private Boolean isActive;
	// 예: "색상:빨강 / 사이즈:XL" 과 같은 조합 정보 문자열
	private String optionCombination;
}