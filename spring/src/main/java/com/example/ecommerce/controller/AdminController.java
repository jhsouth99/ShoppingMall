package com.example.ecommerce.controller;

import com.example.ecommerce.dto.*;
import com.example.ecommerce.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

@Controller
@RequiredArgsConstructor
public class AdminController {

    private final DashboardService dashboardService;

    @GetMapping("/admin/mypage")
    public String getView() {
        return "admin";
    }

    @GetMapping("/api/admin/dashboard-summary")
    @ResponseBody
    public ResponseEntity<AdminDashboardSummaryDTO> getDashboardSummary() {
        AdminDashboardSummaryDTO summary = dashboardService.getAdminDashboardSummary();
        return ResponseEntity.ok(summary);
    }
}