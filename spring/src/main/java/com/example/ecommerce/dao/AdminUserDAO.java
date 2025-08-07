package com.example.ecommerce.dao;

import com.example.ecommerce.dto.*;
import lombok.RequiredArgsConstructor;
import org.apache.ibatis.session.SqlSession;

import java.util.List;
import java.util.Map;

@RequiredArgsConstructor
public class AdminUserDAO {

    private final SqlSession sqlSession;

    public List<UserSummaryDTO> getUserList(Map<String, Object> params) {
        return sqlSession.selectList("admin_user.getUserList", params);
    }

    public int getUserCount(Map<String, Object> params) {
        return sqlSession.selectOne("admin_user.getUserCount", params);
    }

    public UserDetailDTO getUserDetail(int userId) {
        return sqlSession.selectOne("admin_user.getUserDetail", userId);
    }

    public List<String> getUserRoles(int userId) {
        return sqlSession.selectList("admin_user.getUserRoles", userId);
    }

    public List<ShippingAddressDTO> getUserShippingAddresses(int userId) {
        return sqlSession.selectList("admin_user.getUserShippingAddresses", userId);
    }

    public int suspendUser(Map<String, Object> params) {
        return sqlSession.update("admin_user.suspendUser", params);
    }

    public int resumeUser(Map<String, Object> params) {
        return sqlSession.update("admin_user.resumeUser", params);
    }

    public int terminateUser(Map<String, Object> params) {
        return sqlSession.update("admin_user.terminateUser", params);
    }

    public List<ReportSummaryDTO> getReportList(Map<String, Object> params) {
        return sqlSession.selectList("admin_user.getReportList", params);
    }

    public int getReportCount(Map<String, Object> params) {
        return sqlSession.selectOne("admin_user.getReportCount", params);
    }

    public ReportDetailDTO getReportDetail(int reportId) {
        return sqlSession.selectOne("admin_user.getReportDetail", reportId);
    }

    public int processReport(Map<String, Object> params) {
        return sqlSession.update("admin_user.processReport", params);
    }

    public int getPendingReportCount() {
        return sqlSession.selectOne("admin_user.getPendingReportCount");
    }
}