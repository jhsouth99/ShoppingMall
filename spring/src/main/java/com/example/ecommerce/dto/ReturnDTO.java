package com.example.ecommerce.dto;

import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

@Data
public class ReturnDTO {
    private int id;
    private String returnNo;
    private int orderId;
    private String orderNo;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss", shape = JsonFormat.Shape.STRING)
    private LocalDateTime requestDate;
    private String type; // "반품" 또는 "교환"
    private String status;
    private String customerName;
    private String customerReason;
    private String customerComment;

    // 요청 상품 목록
    private List<ReturnItemDetailDTO> items;

    // 처리 정보
    private String pickupCarrier;
    private String pickupTrackingNo;
    private String inspectionResult; // PASS, FAIL
    private String inspectionMemo;

    // 교환 전용 필드
    private String newShipmentId; // 교환 상품 발송 정보
    private String exchangeCarrier;
    private String exchangeTrackingNo;

    // 상품 요약 정보 (리스트 페이지용)
    private String productSummary;

    // 타입 구분을 위한 헬퍼 메서드
    public boolean isReturn() {
        return "반품".equals(this.type);
    }

    public boolean isExchange() {
        return "교환".equals(this.type);
    }
}