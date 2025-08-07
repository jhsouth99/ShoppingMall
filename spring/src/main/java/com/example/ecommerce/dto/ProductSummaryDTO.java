package com.example.ecommerce.dto;

import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

@Data
public class ProductSummaryDTO {
	private int id;
	private String name;
	private String thumbnailUrl;
	private Integer basePrice;
	private Integer totalStock;
	private Integer viewCount;
	private Integer soldCount;
	private Boolean isBusinessOnly;
	private String status; // SELLING, SOLDOUT, DELETED
	@JsonFormat(pattern = "yyyy-MM-dd", shape = JsonFormat.Shape.STRING)
	private LocalDate createdAt;
	private int discountRate;
	private int discountPrice;
}