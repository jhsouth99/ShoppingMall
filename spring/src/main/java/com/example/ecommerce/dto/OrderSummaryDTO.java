package com.example.ecommerce.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.example.ecommerce.dto.enums.OrderStatus;
import com.example.ecommerce.dto.enums.RefundStatus;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter @Setter
@ToString
public class OrderSummaryDTO {
	private int id;
    private String orderNo;      // ORD20250625-00001
    private Integer productId;
    private String productName;
    private String productImageUrl;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss", shape = JsonFormat.Shape.STRING)
    private LocalDateTime orderDate;
    private Integer paidAmount;
    private OrderStatus orderStatus;
    private RefundStatus  refundStatus;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss", shape = JsonFormat.Shape.STRING)
	private LocalDateTime createdAt;
    private String username;
	private String customerName;
	private int quantity;
	private int finalAmount;
	private String recipientDelivReqMsg;
    private Boolean hasReturnRequest;
    private int reviewId;
    private Boolean reviewWritten;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss", shape = JsonFormat.Shape.STRING)
    private LocalDateTime confirmedAt;
    private List<OrderItemDTO> orderItems = new ArrayList<OrderItemDTO>();

    public Boolean getCanWriteReview() {
        if (reviewWritten == null) {
            return null;
        }
        return !reviewWritten;
    }
}