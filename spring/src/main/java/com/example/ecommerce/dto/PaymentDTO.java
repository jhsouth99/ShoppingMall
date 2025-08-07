package com.example.ecommerce.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class PaymentDTO {
    private Integer id;
    private Integer customerId;
    private Integer orderId;
    private Integer groupBuyParticipantId;
    private String paymentMethodType;
    private Integer amount;
    private String status;
    private String cardIssuer;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss", shape = JsonFormat.Shape.STRING)
    private LocalDateTime paidAt;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss", shape = JsonFormat.Shape.STRING)
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss", shape = JsonFormat.Shape.STRING)
    private LocalDateTime updatedAt;

    // 결제 방법별 상세 정보 (JSON으로 저장 가능)
    private String paymentDetails;

    // 결제 처리 관련 정보
    private String transactionId;
    private String approvalNumber;
    private String cardCompany;
    private String installmentMonths;

    // 환불 관련 정보
    private String refundStatus;
    private Integer refundAmount;
    private LocalDateTime refundAt;
    private String refundReason;
}