package com.example.ecommerce.dto;

import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

@Data
public class UserCouponDTO {
	private int			userId;
	private int         couponId;
	private String		couponCode;
	private String		name;
	private String		discountType; // PERCENTAGE | FIXED
	private int			discountValue;
	@JsonFormat(pattern = "yyyy-MM-dd", shape = JsonFormat.Shape.STRING)
	private LocalDate	issuedAt;
	@JsonFormat(pattern = "yyyy-MM-dd", shape = JsonFormat.Shape.STRING)
	private LocalDate	validFrom;
	@JsonFormat(pattern = "yyyy-MM-dd", shape = JsonFormat.Shape.STRING)
	private LocalDate	validTo;

	private String applicable; // 'Y' 또는 'N' - 현재 상품에 적용 가능 여부
	private Integer minPurchaseAmount; // 최소 구매 금액
}