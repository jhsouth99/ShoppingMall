package com.example.ecommerce.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class AfterSalesRequestItemDTO {
    // 기본 정보
    private Integer id;
    private Integer requestId;
    private Integer orderItemId;
    private String itemType; // RETURN, EXCHANGE
    private Integer quantity;

    // 사유 정보
    private String reasonCode;
    private String reasonDetail;

    // 교환 관련 (교환 시에만 사용)
    private Integer newVariantId;
    private Integer priceDifference;

    // 검수 결과
    private String inspectionResult; // APPROVED, REJECTED, PARTIAL
    private String inspectionComment;
    private Integer approvedQuantity;

    // 환불 정보 (반품 시에만 사용)
    private Integer refundAmount;
    private Integer refundId;

    // 새 배송 정보 (교환 시에만 사용)
    private Integer newShipmentId;

    // 주문 아이템 정보 (조인용)
    private String productName;
    private String optionCombination;
    private String productImageUrl;
    private Integer originalPrice;
    private Integer originalQuantity;

    // 편의 메서드들
    public boolean isReturn() {
        return "RETURN".equals(itemType);
    }

    public boolean isExchange() {
        return "EXCHANGE".equals(itemType);
    }

    public boolean isApproved() {
        return "APPROVED".equals(inspectionResult);
    }

    public boolean isRejected() {
        return "REJECTED".equals(inspectionResult);
    }

    public boolean isPartiallyApproved() {
        return "PARTIAL".equals(inspectionResult);
    }
}