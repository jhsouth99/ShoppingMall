package com.example.ecommerce.controller;

import com.example.ecommerce.dto.PageResult;
import com.example.ecommerce.dto.ReportDetailDTO;
import com.example.ecommerce.dto.ReportSummaryDTO;
import com.example.ecommerce.dto.UserDTO;
import com.example.ecommerce.service.AdminUserService;
import com.example.ecommerce.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Controller
@RequiredArgsConstructor
public class ReportController {

    private final UserService userService;
    private final AdminUserService adminUserService;

    /**
     * 신고 목록 조회
     */
    @GetMapping("/api/admin/reports")
    @ResponseBody
    public ResponseEntity<PageResult<ReportSummaryDTO>> getReportList(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(defaultValue = "") String status,
            @RequestParam(defaultValue = "") String reportType) {

        PageResult<ReportSummaryDTO> result = adminUserService.getReportList(page, size, keyword, status, reportType);
        return ResponseEntity.ok(result);
    }

    /**
     * 신고 상세 정보 조회
     */
    @GetMapping("/api/admin/reports/{reportId}")
    @ResponseBody
    public ResponseEntity<ReportDetailDTO> getReportDetail(@PathVariable int reportId) {
        try {
            ReportDetailDTO reportDetail = adminUserService.getReportDetail(reportId);
            return ResponseEntity.ok(reportDetail);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * 신고 처리
     */
    @PostMapping("/api/admin/reports/{reportId}/process")
    @ResponseBody
    public ResponseEntity<Map<String, String>> processReport(
            @PathVariable int reportId,
            @RequestBody Map<String, String> request,
            Authentication authentication) {

        try {
            String status = request.get("status");
            String actionTaken = request.get("actionTaken");

            if (status == null || (
                    !status.equals("REVIEWING") && !status.equals("RESOLVED") && !status.equals("REJECTED"))) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "올바른 처리 상태를 선택해주세요."));
            }

            UserDTO currentUser = (UserDTO) authentication.getPrincipal();
            adminUserService.processReport(reportId, status, actionTaken, currentUser.getId());

            String message = status.equals("RESOLVED") ? "신고가 처리되었습니다." : status.equals("REJECTED") ? "신고가 거절되었습니다." : "신고가 처리 중으로 바뀌었습니다.";
            return ResponseEntity.ok(Map.of("message", message));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "신고 처리 중 오류가 발생했습니다."));
        }
    }

}
