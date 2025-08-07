package com.example.ecommerce.dto;

import lombok.Data;

import java.util.Date;

@Data
public class CartItemDTO {
    // 장바구니 기본 정보
    private int userId;
    private int productVariantId;
    private int quantity;
    private Date addedAt;

    // 상품 기본 정보
    private int productId;
    private String productName;
    private String description;

    // 가격 정보
    private Integer price;
    private double basePrice;           // 상품 기본 가격 (참조용)
    private double variantPrice;        // 변형 상품 가격 (실제 판매 가격)
    private double unitPrice;           // 단위 가격 (variantPrice와 동일)
    private double totalPrice;          // 총 가격 (단위가격 * 수량)

    // 할인 정보
    private Boolean isDiscounted;       // 할인 여부
    private String discountType;        // 할인 타입 (PERCENTAGE, FIXED_AMOUNT)
    private double discountValue;       // 할인 값
    private double maxDiscountAmount;   // 최대 할인 금액
    private double discountedUnitPrice; // 할인된 단위 가격
    private double discountedTotalPrice; // 할인된 총 가격
    private double discountAmount;      // 실제 할인 금액

    // 옵션 정보
    private String optionInfo;          // 옵션 정보 (예: "색상: 파랑 / 사이즈: M")

    // 판매자 정보
    private int sellerId;
    private String businessName;        // 판매자명

    // 배송 정보
    private int shippingMethodId;
    private String shippingMethodName;
    private double shippingCost;        // 배송비
    private double costOverride;        // 배송비 오버라이드
    private double finalShippingCost;   // 최종 배송비

    // 상품 상태
    private String isActive;            // 상품 활성화 상태
    private int stockQuantity;          // 재고 수량

    // 이미지 정보
    private String thumbnailUrl;        // 대표 이미지
    private String altText;             // 이미지 대체 텍스트

    // 계산된 필드들

    /**
     * 최종 단위 가격을 반환 (할인이 적용된 경우 할인된 가격, 아니면 variant 가격)
     */
    public double getFinalUnitPrice() {
        return isDiscounted ? discountedUnitPrice : variantPrice;
    }

    /**
     * 최종 총 가격을 반환 (할인이 적용된 경우 할인된 총 가격, 아니면 기본 총 가격)
     */
    public double getFinalTotalPrice() {
        return isDiscounted ? discountedTotalPrice : totalPrice;
    }

    /**
     * 구매 불가능 상품인지 확인
     */
    public boolean isUnavailable() {
        return "N".equals(isActive) || stockQuantity <= 0;
    }

    /**
     * 할인율을 계산하여 반환 (백분율)
     */
    public double getDiscountRate() {
        if (!isDiscounted || variantPrice <= 0) {
            return 0.0;
        }
        return (discountAmount / variantPrice) * 100;
    }

    /**
     * 옵션에 따른 가격 차이를 반환 (variant 가격 - 기본 가격)
     */
    public double getOptionPriceDifference() {
        return variantPrice - basePrice;
    }

    /**
     * 옵션에 따른 추가 비용이 있는지 확인
     */
    public boolean hasOptionSurcharge() {
        return variantPrice > basePrice;
    }

    /**
     * 옵션에 따른 할인이 있는지 확인 (variant 가격이 기본 가격보다 낮은 경우)
     */
    public boolean hasOptionDiscount() {
        return variantPrice < basePrice;
    }


}
