package com.example.ecommerce.service;

import org.springframework.transaction.annotation.Transactional;

import com.example.ecommerce.dao.DashboardDAO;
import com.example.ecommerce.dto.AdminDashboardSummaryDTO;
import com.example.ecommerce.dto.SellerDashboardSummaryDTO;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class DashboardService {

	private final DashboardDAO dashboardDAO;

	public SellerDashboardSummaryDTO getDashboardSummary(int sellerId) {
		// 현재는 DAO를 직접 호출하지만, 추후 복잡한 계산이나 여러 DAO 조합이 필요할 경우
		// 이 서비스 계층에서 로직을 구현합니다.
		return dashboardDAO.getSellerDashboardSummary(sellerId);
	}

	public String getStoreName(int sellerId) {
		return dashboardDAO.getSellerStoreName(sellerId);
	}
	
    @Transactional(readOnly = true)
    public AdminDashboardSummaryDTO getAdminDashboardSummary() {
        return dashboardDAO.getAdminDashboardSummary();
    }
}