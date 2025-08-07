package com.example.ecommerce.dto.enums;

public enum RefundReason {
    CUSTOMER_REQUEST("고객 요청"),
    DEFECTIVE_PRODUCT("불량 상품"),
    DELIVERY_DELAY("배송 지연"),
    ORDER_CANCEL("주문 취소"),
    SIZE_MISMATCH("사이즈 불일치"),
    COLOR_DIFFERENT("색상 차이"),
    CHANGE_MIND("단순 변심"),
    DAMAGED_SHIPPING("배송 중 파손"),
    NOT_AS_DESCRIBED("상품 설명과 상이"),
    QUALITY_ISSUE("품질 문제"),
    AS_REQUEST("A/S 요청"),
    GROUP_BUY_FAILED("공동구매 실패"),
    GROUP_BUY_CANCELLED("공동구매 취소"),
    OTHER("기타");

    private final String description;

    RefundReason(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}