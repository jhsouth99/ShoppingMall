package com.example.ecommerce.dto;

import lombok.Data;

@Data
public class ProcessReturnRequestDTO {
    private String action; // 처리할 작업 유형 (예: "ACCEPT_PICKUP", "COMPLETE_EXCHANGE")
    private String type;
    
    // 각 작업에 필요한 추가 데이터
    private String pickupCarrier;
    private String pickupTrackingNo;
    private String inspectionResult;
    private String inspectionMemo;
    private String exchangeCarrier;
    private String exchangeTrackingNo;
}