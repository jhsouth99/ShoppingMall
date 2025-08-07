package com.example.ecommerce.dto;

import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonFormat;

import lombok.Data;

@Data
public class CouponDTO {
	private int id;
	private Integer creatorId;
	private String code;
	private String name;
	private String discountType;
	private int discountValue;
	@JsonFormat(pattern = "yyyy-MM-dd", shape = JsonFormat.Shape.STRING)
	private LocalDate issueStartDate, issueEndDate, validTo;
	private Integer minPurchaseAmount;
	private Integer totalUsageLimit;
	private Integer usageLimitPerUser;
	private Integer currentUsageCount;
	private Boolean isActive;
}