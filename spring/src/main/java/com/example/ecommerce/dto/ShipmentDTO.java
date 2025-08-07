package com.example.ecommerce.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ShipmentDTO {
	private Integer id; // 기본 키 필드 추가
	private int orderId;
	private int shippingMethodId;
	private String carrier;
	private int cost;
	private String trackingNumber;
	private String carrierNameSnapshot;
	private String status; // 배송 상태
	private String recipientName;
	private String recipientPhone;
	private String recipientAddress;
	private String recipientAddressDetail;
	private String recipientZipcode;
	@JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss", shape = JsonFormat.Shape.STRING)
	private LocalDateTime shippedAt;
	@JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss", shape = JsonFormat.Shape.STRING)
	private LocalDateTime deliveredAt;
}