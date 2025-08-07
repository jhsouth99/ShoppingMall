package com.example.ecommerce.controller;

import javax.servlet.http.HttpSession;

import com.example.ecommerce.dto.*;
import com.example.ecommerce.service.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import lombok.RequiredArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@Controller
@RequiredArgsConstructor
public class MyPageController {

	private static final Logger logger = LoggerFactory.getLogger(MyPageController.class);

	private final UserService userService;
	private final ShippingAddressService shippingAddressService;
	private final AgreementService agreementService;
	private final OrderService orderService;
	private final GroupBuyService groupBuyService;
	private final CouponService couponService;
    private final AfterSalesService afterSalesService;
	private final FileUploadService fileUploadService;

	@GetMapping("/mypage")
	public String getMyPage(Model model, @AuthenticationPrincipal UserDTO user) {
		// 1. 세션에서 현재 로그인한 사용자 정보 가져오기
		if (user == null) {
			// 로그인하지 않은 경우 로그인 페이지로 리디렉션
			return "redirect:/login";
		}

		// 2. 마이페이지 각 섹션에 필요한 데이터 조회
		// 기본 정보
		model.addAttribute("user", user);

		return "mypage";
	}


}