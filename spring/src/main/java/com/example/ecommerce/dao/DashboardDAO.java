package com.example.ecommerce.dao;

import org.apache.ibatis.session.SqlSession;

import com.example.ecommerce.dto.AdminDashboardSummaryDTO;
import com.example.ecommerce.dto.SellerDashboardSummaryDTO;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class DashboardDAO {

	private final SqlSession sqlSession;

	public SellerDashboardSummaryDTO getSellerDashboardSummary(int sellerId) {
		return sqlSession.selectOne("dashboard.getSellerDashboardSummary", sellerId);
	}

	public String getSellerStoreName(int sellerId) {
		return sqlSession.selectOne("dashboard.getSellerStoreName", sellerId);
	}
	
    public AdminDashboardSummaryDTO getAdminDashboardSummary() {
        return sqlSession.selectOne("dashboard.getAdminDashboardSummary");
    }
}