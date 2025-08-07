package com.example.ecommerce.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class AfterSalesStatusHistoryDTO {
    private Integer id;
    private Integer requestId;
    private String statusFrom;
    private String statusTo;
    private Integer changedBy;
    private String changedByName; // 담당자명 (조인용)
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss", shape = JsonFormat.Shape.STRING)
    private LocalDateTime changedAt;
    private String commentText;

    // 상태 변경 사유나 설명을 위한 편의 메서드
    public String getStatusChangeDescription() {
        if (statusFrom == null) {
            return "요청 접수";
        }

        switch (statusTo) {
            case "APPROVED":
                return "반품/교환 승인";
            case "PICKUP_SCHEDULED":
                return "수거 예약 완료";
            case "IN_TRANSIT":
                return "수거 진행 중";
            case "RECEIVED":
                return "상품 수령 완료";
            case "INSPECTING":
                return "검수 진행 중";
            case "INSPECTION_COMPLETED":
                return "검수 완료";
            case "PROCESSING":
                return "처리 진행 중";
            case "COMPLETED":
                return "처리 완료";
            case "REJECTED":
                return "요청 거부";
            case "CANCELLED":
                return "요청 취소";
            default:
                return statusTo;
        }
    }
}