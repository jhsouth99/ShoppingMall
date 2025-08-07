package com.example.ecommerce.dto;

import java.util.Date;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@AllArgsConstructor
@NoArgsConstructor
@ToString
public class SearchProductDTO {

    @Getter @Setter
    int id, sellerId, categoryId;

    @Getter @Setter
    String name, description, detailedContent, isBusinessOnly, isDiscounted;

    @Getter @Setter
    int viewCount, soldCount;

    @Getter @Setter
    double basePrice;

    @Getter @Setter
    Date createdAt, updatedAt, deletedAt, discountStart, discountEnd;

    @Getter @Setter
    String imageUrl, altText;

    @Getter @Setter
    private Integer discountRate;

    @Getter @Setter
    private Integer discountAmount;

    @Getter @Setter
    private Integer maxDiscountAmountP;

    @Getter @Setter
    private Integer maxDiscountAmountF;

    @Getter @Setter
    private Integer discountPrice;

    @Getter @Setter
    Boolean isGroupPurchase;

    @Getter @Setter
    private Integer groupPrice;         // 공동구매 가격
}
