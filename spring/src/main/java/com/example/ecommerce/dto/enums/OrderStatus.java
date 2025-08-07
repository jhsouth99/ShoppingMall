package com.example.ecommerce.dto.enums;

public enum OrderStatus {
	PENDING,              // 결제 대기
	PAID,                 // 결제 완료
	PREPARING,            // 배송 준비중
	SHIPPED,              // 배송중
	DELIVERED,            // 배송 완료
	CONFIRMED,            // 구매 확정
	CANCELLED,            // 취소
	REFUNDED,             // 환불 완료
	RETURN_REQUESTED,     // 반품 요청
	EXCHANGE_REQUESTED,   // 교환 요청
	PARTIAL_RETURN,       // 일부 반품
	PARTIAL_EXCHANGE      // 일부 교환
}
