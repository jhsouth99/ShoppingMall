package com.example.ecommerce.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationSettingsDTO {
	private int		userId;
	private Boolean	gbEnd;
	private Boolean	gbSuccess;
	private Boolean	gbFail;
	private Boolean	orderShipped;
	private Boolean	refundUpdate;
	private Boolean	myGbUpdate;
}