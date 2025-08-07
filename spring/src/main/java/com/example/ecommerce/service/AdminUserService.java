package com.example.ecommerce.service;

import com.example.ecommerce.dao.AdminUserDAO;
import com.example.ecommerce.dto.*;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RequiredArgsConstructor
public class AdminUserService {

    private static final Logger logger = LoggerFactory.getLogger(AdminUserService.class);

    private final AdminUserDAO adminUserDAO;

    /**
     * 사용자 목록 조회 (페이징)
     */
    @Transactional(readOnly = true)
    public PageResult<UserSummaryDTO> getUserList(int page, int size, String keyword, String status) {
        int offset = (page - 1) * size;

        Map<String, Object> params = new HashMap<>();
        params.put("offset", offset);
        params.put("size", size);
        params.put("keyword", keyword);
        params.put("status", status);

        List<UserSummaryDTO> users = adminUserDAO.getUserList(params);
        int totalCount = adminUserDAO.getUserCount(params);

        return new PageResult<>(users, totalCount, page, size);
    }

    /**
     * 사용자 상세 정보 조회
     */
    @Transactional(readOnly = true)
    public UserDetailDTO getUserDetail(int userId) {
        UserDetailDTO userDetail = adminUserDAO.getUserDetail(userId);
        if (userDetail == null) {
            throw new IllegalArgumentException("존재하지 않는 사용자입니다.");
        }

        // 사용자 역할 조회
        List<String> roles = adminUserDAO.getUserRoles(userId);
        userDetail.setRoles(roles);

        // 배송지 정보 조회
        List<ShippingAddressDTO> shippingAddresses = adminUserDAO.getUserShippingAddresses(userId);
        userDetail.setShippingAddresses(shippingAddresses);

        return userDetail;
    }

    /**
     * 사용자 정지
     */
    @Transactional
    public void suspendUser(int userId, String reason, int adminId) {
        Map<String, Object> params = new HashMap<>();
        params.put("userId", userId);
        params.put("reason", reason);
        params.put("adminId", adminId);

        int result = adminUserDAO.suspendUser(params);
        if (result == 0) {
            throw new RuntimeException("사용자 정지 처리에 실패했습니다.");
        }

        logger.info("사용자 정지 처리 완료 - 사용자 ID: {}, 사유: {}, 처리자: {}", userId, reason, adminId);
    }

    /**
     * 사용자 정지 해제
     */
    @Transactional
    public void resumeUser(int userId, int adminId) {
        Map<String, Object> params = new HashMap<>();
        params.put("userId", userId);
        params.put("adminId", adminId);

        int result = adminUserDAO.resumeUser(params);
        if (result == 0) {
            throw new RuntimeException("사용자 정지 해제 처리에 실패했습니다.");
        }

        logger.info("사용자 정지 해제 처리 완료 - 사용자 ID: {}, 처리자: {}", userId, adminId);
    }

    /**
     * 사용자 계정 해지
     */
    @Transactional
    public void terminateUser(int userId, String reason, int adminId) {
        Map<String, Object> params = new HashMap<>();
        params.put("userId", userId);
        params.put("reason", reason);
        params.put("adminId", adminId);

        int result = adminUserDAO.terminateUser(params);
        if (result == 0) {
            throw new RuntimeException("사용자 계정 해지 처리에 실패했습니다.");
        }

        logger.info("사용자 계정 해지 처리 완료 - 사용자 ID: {}, 사유: {}, 처리자: {}", userId, reason, adminId);
    }

    /**
     * 신고 목록 조회 (페이징)
     */
    @Transactional(readOnly = true)
    public PageResult<ReportSummaryDTO> getReportList(int page, int size, String keyword, String status, String reportType) {
        int offset = (page - 1) * size;

        Map<String, Object> params = new HashMap<>();
        params.put("offset", offset);
        params.put("size", size);
        params.put("keyword", keyword);
        params.put("status", status);
        params.put("reportType", reportType);

        List<ReportSummaryDTO> reports = adminUserDAO.getReportList(params);
        int totalCount = adminUserDAO.getReportCount(params);

        return new PageResult<>(reports, totalCount, page, size);
    }

    /**
     * 신고 상세 정보 조회
     */
    @Transactional(readOnly = true)
    public ReportDetailDTO getReportDetail(int reportId) {
        ReportDetailDTO reportDetail = adminUserDAO.getReportDetail(reportId);
        if (reportDetail == null) {
            throw new IllegalArgumentException("존재하지 않는 신고입니다.");
        }

        return reportDetail;
    }

    /**
     * 신고 처리
     */
    @Transactional
    public void processReport(int reportId, String status, String actionTaken, int adminId) {
        Map<String, Object> params = new HashMap<>();
        params.put("reportId", reportId);
        params.put("status", status);
        params.put("actionTaken", actionTaken);
        params.put("processedBy", adminId);

        int result = adminUserDAO.processReport(params);
        if (result == 0) {
            throw new RuntimeException("신고 처리에 실패했습니다.");
        }

        logger.info("신고 처리 완료 - 신고 ID: {}, 상태: {}, 조치: {}, 처리자: {}",
                reportId, status, actionTaken, adminId);
    }

    /**
     * 미처리 신고 수 조회
     */
    @Transactional(readOnly = true)
    public int getPendingReportCount() {
        return adminUserDAO.getPendingReportCount();
    }

    /**
     * 사용자 통계 조회
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getUserStatistics() {
        Map<String, Object> statistics = new HashMap<>();

        // 전체 사용자 수
        Map<String, Object> allUsersParams = new HashMap<>();
        allUsersParams.put("offset", 0);
        allUsersParams.put("size", 1);
        statistics.put("totalUsers", adminUserDAO.getUserCount(allUsersParams));

        // 활성 사용자 수
        Map<String, Object> activeUsersParams = new HashMap<>();
        activeUsersParams.put("offset", 0);
        activeUsersParams.put("size", 1);
        activeUsersParams.put("status", "active");
        statistics.put("activeUsers", adminUserDAO.getUserCount(activeUsersParams));

        // 정지된 사용자 수
        Map<String, Object> suspendedUsersParams = new HashMap<>();
        suspendedUsersParams.put("offset", 0);
        suspendedUsersParams.put("size", 1);
        suspendedUsersParams.put("status", "suspended");
        statistics.put("suspendedUsers", adminUserDAO.getUserCount(suspendedUsersParams));

        // 미처리 신고 수
        statistics.put("pendingReports", getPendingReportCount());

        return statistics;
    }
}

