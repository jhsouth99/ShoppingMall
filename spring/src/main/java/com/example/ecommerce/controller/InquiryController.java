package com.example.ecommerce.controller;

import com.example.ecommerce.dto.InquiryDTO;
import com.example.ecommerce.dto.PageResult;
import com.example.ecommerce.dto.UserDTO;
import com.example.ecommerce.service.InquiryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Controller
@RequiredArgsConstructor
public class InquiryController {
    private final InquiryService inquiryService;


    /**
     * 사용자 1:1 문의 목록 조회
     */
    @GetMapping("/api/user/inquiries")
    @ResponseBody
    public PageResult<InquiryDTO> getUserInquiries(
            @AuthenticationPrincipal UserDTO user,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {

        return inquiryService.getUserInquiries(user.getId(), page, size);
    }

    /**
     * 판매자와 관련된 1:1 문의 목록을 조회합니다.
     */
    @GetMapping("/api/seller/inquiries")
    @ResponseBody
    public ResponseEntity<PageResult<InquiryDTO>> getInquiries(
            @AuthenticationPrincipal UserDTO seller,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status) {
        PageResult<InquiryDTO> result = inquiryService.getSellerInquiries(seller.getId(), page, size, keyword, status);
        return ResponseEntity.ok(result);
    }

    /**
     * 특정 1:1 문의에 답변을 등록합니다.
     */
    @PostMapping("/api/seller/inquiries/{inquiryId}/reply")
    @ResponseBody
    public ResponseEntity<Void> replyToInquiry(
            @AuthenticationPrincipal UserDTO seller,
            @PathVariable int inquiryId,
            @RequestBody Map<String, String> payload) {

        String answer = payload.get("answer");
        if (answer == null || answer.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        try {
            // inquiryService.replyToInquiry(seller.getId(), inquiryId, answer);
            // 임시로 성공 응답 반환 (InquiryService 구현 후 주석 해제)
            return ResponseEntity.ok().build();
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }

}
