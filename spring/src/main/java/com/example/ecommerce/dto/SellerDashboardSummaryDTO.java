package com.example.ecommerce.dto;

import lombok.Data;

@Data
public class SellerDashboardSummaryDTO {
	private long todaysSales;
	private int newOrdersCount;
	private int unansweredQnAsCount;
	private int lowStockItemsCount;
	private int newReturnRequestsCount;
}