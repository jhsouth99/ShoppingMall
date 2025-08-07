package com.example.ecommerce.dto;

import java.util.List;
import lombok.Data;

/**
 * 장바구니 옵션 관련 DTO 모음
 */
public class CartOptionDTO {

    /**
     * 상품 옵션 DTO
     */
    @Data
    public static class ProductOption {
        private int id;
        private int productId;
        private String name;
        private String sku;
        private List<ProductOptionValue> optionValues;
    }

    /**
     * 상품 옵션 값 DTO
     */
    @Data
    public static class ProductOptionValue {
        private int id;
        private int productOptionId;
        private String valueText;
        private double priceAdjustment;
        private String isActive;
        private String commentNeeded;
    }

    /**
     * 현재 선택된 옵션 DTO
     */
    @Data
    public static class CurrentVariantOption {
        private int variantId;
        private int optionId;
        private String optionName;
        private int valueId;
        private String valueText;
        private double priceAdjustment;
    }

    /**
     * 상품 기본 정보 DTO
     */
    @Data
    public static class ProductBasicInfo {
        private Integer productId;
        private String productName;
        private Double basePrice;
        private String description;
        private String imageUrl;
        private String altText;
        private String variantSku;
    }

    /**
     * 현재 변형 상품 DTO
     */
    @Data
    public static class CurrentVariant {
        private int variantId;
        private String sku;
        private double price;
        private int stockQuantity;
        private String isActive;
        private List<CurrentVariantOption> optionValues;
    }

    /**
     * 선택된 옵션 DTO
     */
    @Data
    public static class SelectedOption {
        private int optionId;
        private int valueId;
    }

    /**
     * 옵션 선택 응답 DTO
     */
    @Data
    public static class OptionSelectionResponse {
        private boolean success;
        private String message;
        private ProductBasicInfo productInfo;
        private List<ProductOption> optionGroups;
        private CurrentVariant currentVariant;
    }

    /**
     * 변형 상품 가용성 응답 DTO
     */
    @Data
    public static class VariantAvailabilityResponse {
        private boolean success;
        private boolean available;
        private String message;
        private Integer variantId;
        private Integer stockQuantity;
    }

    /**
     * 장바구니 아이템 업데이트 요청 DTO
     */
    @Data
    public static class CartItemUpdateRequest {
        private int userId;
        private int currentVariantId;
        private int newVariantId;
        private int quantity;
        private List<SelectedOption> optionValues;
    }
}