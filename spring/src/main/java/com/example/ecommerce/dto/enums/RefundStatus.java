package com.example.ecommerce.dto.enums;

public enum RefundStatus {
	NONE(""),        // 환불 없음
	REQUESTED("요청됨"),
	APPROVED("승인됨"),
	PROCESSING("처리중"),
	COMPLETED("완료됨"),
	REJECTED("거부됨"),
	CANCELLED("취소됨");

	private final String description;

	RefundStatus(String description) {
		this.description = description;
	}

	public String getDescription() {
		return description;
	}
}