package com.example.ecommerce.dto;

import java.util.List;
import lombok.Data;

@Data
public class ProductOptionDTO {
	private int id;
	private int productId;
	private String name; // 예: "색상"
	private List<ProductOptionValueDTO> values;
}