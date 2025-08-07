package com.example.ecommerce.controller;

import java.util.List;
import java.util.Map;

import javax.servlet.http.HttpSession;

import com.example.ecommerce.dto.*;
import com.example.ecommerce.service.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class SellerPageController {

	private static final Logger logger = LoggerFactory.getLogger(SellerPageController.class);
	// 필요한 모든 Service들을 주입받습니다.
	private final ObjectMapper objectMapper;
	private final DashboardService dashboardService;
	private final ProductService productService;
	private final GroupBuyService groupBuyService;
	private final OrderService orderService;
	private final AfterSalesService afterSalesService;
	private final PromotionService promotionService;
	private final CouponService couponService;
	private final SellerInfoService infoService;
	private final QnAService qnAService;
	private final ReviewService reviewService;
	private final InquiryService inquiryService;
	private final ShipmentService shipmentService;

	@GetMapping("/seller/mypage")
	public String view(@AuthenticationPrincipal UserDTO user, HttpSession session, Model model) {
		String storeName = dashboardService.getStoreName(user.getId());
		model.addAttribute("storeName", storeName);
		return "sellerpage";
	}

	/**
	 * 대시보드 요약 정보를 조회합니다.
	 */
	@GetMapping("/api/seller/dashboard-summary")
	@ResponseBody
	public ResponseEntity<SellerDashboardSummaryDTO> getDashboardSummary(
			@AuthenticationPrincipal UserDTO seller) {
		SellerDashboardSummaryDTO summary = dashboardService.getDashboardSummary(seller.getId());
		return ResponseEntity.ok(summary);
	}

}