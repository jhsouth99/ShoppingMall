package com.example.ecommerce.dto;

import lombok.Data;

@Data
public class AdminDashboardSummaryDTO {
    private int todaySales;
    private int ongoingGroupBuys;
    private int newOrders;
    private int newUsersToday;
    private int unprocessedReports;
}