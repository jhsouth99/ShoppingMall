package com.example.ecommerce.dto;

import lombok.Data;

@Data
public class ProductOptionValueDTO {
	private int id;
	private int productOptionId;
	private String value; // 예: "빨강"
}