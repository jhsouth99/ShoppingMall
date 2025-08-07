package com.example.ecommerce.dto;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

@Data
public class SellerInfoDTO {
	private int userId;
	private String contactPersonName;
	private String contactNumber;
	private String storeName;
	private String businessNumber;
	@JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss", shape = JsonFormat.Shape.STRING)
	private LocalDateTime verifiedAt;
	// ... 정산 계좌 정보 필드 추가 가능
}