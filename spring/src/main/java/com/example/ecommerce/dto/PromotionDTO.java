package com.example.ecommerce.dto;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;

import lombok.Data;

@Data
public class PromotionDTO {
	private int id;
	private int creatorId;
	private String name;
	private String promotionType;
	private String discountType;
	private int discountValue;
	private Integer maxDiscountAmount;
	@JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm", shape = JsonFormat.Shape.STRING)
	private LocalDateTime startDate;
	@JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm", shape = JsonFormat.Shape.STRING)
	private LocalDateTime endDate;
	private Boolean isActive;
	private int priority;
	private Integer couponId;

	private String description;
	@JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm", shape = JsonFormat.Shape.STRING)
	private LocalDateTime createdAt;
	@JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm", shape = JsonFormat.Shape.STRING)
	private LocalDateTime updatedAt;
}