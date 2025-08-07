package com.example.ecommerce.dto;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

@Data
public class QnADTO {
	private int id;
	private int productId;
	private String productName;
	private int customerId;
	private String customerName;
	private String title;
	private String question;
	private String answer;
	private Boolean isSecret;
	private Boolean canView = true;
	@JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm", shape = JsonFormat.Shape.STRING)
	private LocalDateTime questionedAt;
	@JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm", shape = JsonFormat.Shape.STRING)
	private LocalDateTime answeredAt;

	@JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm", shape = JsonFormat.Shape.STRING)
	private LocalDateTime updatedAt;

	// 유효성 검사 메서드
	public boolean isValid() {
		return title != null && !title.trim().isEmpty() && title.length() <= 100 &&
				question != null && !question.trim().isEmpty() &&
				question.length() >= 10 && question.length() <= 1000;
	}
}