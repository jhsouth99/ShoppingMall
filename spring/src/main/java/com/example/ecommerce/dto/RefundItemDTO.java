package com.example.ecommerce.dto;

import lombok.Data;

@Data
public class RefundItemDTO {
    private Integer id;
    private Integer refundId;
    private Integer orderItemId;
    private Integer quantity;
    private Integer itemPriceAtRefund;
    private Integer itemTotalAmount;

    // 조인된 정보
    private Integer productVariantId;
    private String productName;
    private String optionCombination;
    private String productImageUrl;

    // 계산된 필드
    public Integer getRefundAmount() {
        if (itemPriceAtRefund != null && quantity != null) {
            return itemPriceAtRefund * quantity;
        }
        return 0;
    }
}