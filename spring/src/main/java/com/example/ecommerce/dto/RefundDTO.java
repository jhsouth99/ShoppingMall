package com.example.ecommerce.dto;

import com.example.ecommerce.dto.enums.RefundReason;
import com.example.ecommerce.dto.enums.RefundStatus;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class RefundDTO {
    private Integer id;
    private String refundNo;
    private Integer orderId;
    private Integer paymentId;
    private Integer prodItemsTotalAmount;
    private Integer shippingFeeDeduction;
    private Integer otherDeductions;
    private Integer finalRefundAmount;
    private RefundReason refundReason;
    private String refundReasonDetail;
    private RefundStatus status;
    private LocalDateTime requestedAt;
    private LocalDateTime processedAt;
    private Integer processedBy;
    private String transactionId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // 조인된 정보
    private String orderNo;
    private String processedByName;

    // 환불 항목 목록
    private List<RefundItemDTO> refundItems;

    // 계산된 필드들
    public Integer getTotalDeduction() {
        Integer shipping = shippingFeeDeduction != null ? shippingFeeDeduction : 0;
        Integer other = otherDeductions != null ? otherDeductions : 0;
        return shipping + other;
    }

    public boolean isProcessed() {
        return status == RefundStatus.COMPLETED || status == RefundStatus.REJECTED;
    }

    public boolean canCancel() {
        return status == RefundStatus.REQUESTED || status == RefundStatus.APPROVED;
    }
}