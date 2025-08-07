package com.example.ecommerce.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class AfterSalesRequestDTO {
    // 기본 정보
    private Integer id;
    private String requestNo;
    private Integer orderId;
    private String requestType; // RETURN, EXCHANGE, RETURN_EXCHANGE
    private String status; // REQUESTED, APPROVED, PICKUP_SCHEDULED, IN_TRANSIT, RECEIVED, INSPECTING, INSPECTION_COMPLETED, PROCESSING, COMPLETED, REJECTED, CANCELLED

    // 고객 요청 정보
    private String customerReason; // DEFECTIVE, SIZE_MISMATCH, COLOR_DIFFERENT, CHANGE_MIND, DAMAGED_SHIPPING, NOT_AS_DESCRIBED, QUALITY_ISSUE
    private String customerComment;
    private String customerImages; // 쉼표로 구분된 이미지 URL들

    // 픽업 정보
    private Integer pickupCarrierId;
    private String pickupTrackingNo;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss", shape = JsonFormat.Shape.STRING)
    private LocalDateTime pickupRequestedAt;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss", shape = JsonFormat.Shape.STRING)
    private LocalDateTime pickupCompletedAt;

    // 검수 정보
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss", shape = JsonFormat.Shape.STRING)
    private LocalDateTime receivedAt;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss", shape = JsonFormat.Shape.STRING)
    private LocalDateTime inspectedAt;
    private Integer inspectedBy;
    private String inspectionComment;

    // 완료 정보
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss", shape = JsonFormat.Shape.STRING)
    private LocalDateTime completedAt;
    private Integer processedBy;

    // 시간 정보
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss", shape = JsonFormat.Shape.STRING)
    private LocalDateTime createdAt;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss", shape = JsonFormat.Shape.STRING)
    private LocalDateTime updatedAt;

    // 주문 정보 (조인용)
    private String orderNo;
    private Integer userId;
    private String customerName;

    // 요청 항목들
    private List<AfterSalesRequestItemDTO> items;

    // 상태 히스토리
    private List<AfterSalesStatusHistoryDTO> statusHistory;

    // 편의 메서드들
    public boolean isReturn() {
        return "RETURN".equals(requestType) || "RETURN_EXCHANGE".equals(requestType);
    }

    public boolean isExchange() {
        return "EXCHANGE".equals(requestType) || "RETURN_EXCHANGE".equals(requestType);
    }

    public boolean isCompleted() {
        return "COMPLETED".equals(status);
    }

    public boolean isRejected() {
        return "REJECTED".equals(status);
    }

    public boolean isCancelled() {
        return "CANCELLED".equals(status);
    }
}