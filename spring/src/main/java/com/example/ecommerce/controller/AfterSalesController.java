package com.example.ecommerce.controller;

import com.example.ecommerce.dto.*;
import com.example.ecommerce.service.AfterSalesService;
import com.example.ecommerce.service.FileUploadService;
import com.example.ecommerce.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@Controller
@RequiredArgsConstructor
public class AfterSalesController {

    Logger logger = LoggerFactory.getLogger(AfterSalesController.class);

    private final FileUploadService fileUploadService;
    private final AfterSalesService afterSalesService;
    private final OrderService orderService;

    @PostMapping("/api/after-sales/requests")
    @ResponseBody
    public ResponseEntity<?> requestAfterSales(@AuthenticationPrincipal UserDTO userDTO,
                                               @RequestParam String orderNo,
                                               @RequestParam String requestType,
                                               @RequestParam String reason,
                                               @RequestParam(required = false) String detail,
                                               @RequestParam(required = false) List<MultipartFile> images) {
        try {
            // 1. 주문 정보 및 권한 확인
            OrderDTO order = orderService.getOrderDetails(orderNo);
            if (order.getUserId() != userDTO.getId()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("success", false, "message", "해당 주문에 대한 권한이 없습니다."));
            }

            // 2. 주문 상태 확인 (배송완료된 주문만 반품/교환 가능)
            if (!"DELIVERED".equals(order.getStatus())) {
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "message", "배송완료된 주문만 반품/교환 신청이 가능합니다."));
            }

            // 3. 반품/교환 요청 DTO 생성
            AfterSalesRequestDTO requestDTO = new AfterSalesRequestDTO();
            requestDTO.setOrderId(order.getId());
            requestDTO.setRequestType(requestType);
            requestDTO.setCustomerReason(reason);
            requestDTO.setCustomerComment(detail);
            requestDTO.setStatus("REQUESTED");

            // 4. 이미지 업로드 처리
            if (images != null && !images.isEmpty()) {
                List<String> imageUrls = fileUploadService.uploadAfterSalesImages(images);
                requestDTO.setCustomerImages(String.join(",", imageUrls));
            }

            // 5. 반품/교환 요청 생성
            AfterSalesRequestDTO createdRequest = afterSalesService.createAfterSalesRequest(requestDTO);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "반품/교환 요청이 접수되었습니다.",
                    "requestId", createdRequest.getId(),
                    "requestNo", createdRequest.getRequestNo()
            ));

        } catch (IllegalArgumentException e) {
            logger.warn("반품/교환 요청 실패 - 잘못된 요청: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", e.getMessage()));

        } catch (Exception e) {
            logger.error("반품/교환 요청 처리 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "요청 처리 중 오류가 발생했습니다."));
        }
    }


    /**
     * 사용자의 반품/교환 요청 목록 조회
     */
    @GetMapping("/api/after-sales/requests")
    @ResponseBody
    public ResponseEntity<PageResult<AfterSalesRequestDTO>> getUserAfterSalesRequests(
            @AuthenticationPrincipal UserDTO userDTO,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {

        try {
            PageResult<AfterSalesRequestDTO> result = afterSalesService.getUserAfterSalesRequests(
                    userDTO.getId(), page, size);
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            logger.error("반품/교환 요청 목록 조회 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * 반품/교환 요청 상세 조회
     */
    @GetMapping("/api/after-sales/requests/{requestId}")
    @ResponseBody
    public ResponseEntity<AfterSalesRequestDTO> getAfterSalesRequestDetail(
            @AuthenticationPrincipal UserDTO userDTO,
            @PathVariable int requestId) {

        try {
            AfterSalesRequestDTO request = afterSalesService.getAfterSalesRequestDetail(
                    requestId, userDTO.getId());
            return ResponseEntity.ok(request);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (Exception e) {
            logger.error("반품/교환 요청 상세 조회 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * 반품/교환 요청 취소
     */
    @DeleteMapping("/api/after-sales/requests/{requestId}")
    @ResponseBody
    public ResponseEntity<?> cancelAfterSalesRequest(
            @AuthenticationPrincipal UserDTO userDTO,
            @PathVariable int requestId) {

        try {
            afterSalesService.cancelAfterSalesRequest(requestId, userDTO.getId());
            return ResponseEntity.ok(Map.of("success", true, "message", "요청이 취소되었습니다."));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", e.getMessage()));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("success", false, "message", "권한이 없습니다."));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", e.getMessage()));
        } catch (Exception e) {
            logger.error("반품/교환 요청 취소 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "요청 처리 중 오류가 발생했습니다."));
        }
    }

    /**
     * 판매자가 새로운 반품/교환 요청을 생성합니다.
     */
    @PostMapping("/api/seller/returns/create")
    @ResponseBody
    public ResponseEntity<?> createReturnRequest(
            @AuthenticationPrincipal UserDTO seller,
            @RequestBody Map<String, Object> request) {
        try {
            int returnRequestId = afterSalesService.createReturnRequest(seller.getId(), request);
            return ResponseEntity.ok(Map.of("returnRequestId", returnRequestId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "권한이 없습니다."));
        }
    }

    /**
     * 판매자의 반품/교환 요청 목록을 조회합니다.
     */
    @GetMapping("/api/seller/returns")
    @ResponseBody
    public ResponseEntity<PageResult<ReturnDTO>> getReturns(
            @AuthenticationPrincipal UserDTO seller,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status) {
        PageResult<ReturnDTO> result = afterSalesService.getReturns(seller.getId(), page, size, keyword, status);
        return ResponseEntity.ok(result);
    }

    /**
     * 특정 반품/교환 요청의 상세 정보를 조회합니다.
     */
    @GetMapping("/api/seller/returns/{returnId}")
    @ResponseBody
    public ResponseEntity<ReturnDTO> getReturnDetails(
            @AuthenticationPrincipal UserDTO seller,
            @PathVariable int returnId) {
        ReturnDTO details = afterSalesService.getReturnDetails(seller.getId(), returnId);
        System.out.println(details);
        return ResponseEntity.ok(details);
    }

    /**
     * 특정 반품/교환 요청을 처리(상태 변경 등)합니다.
     */
    @PutMapping("/api/seller/returns/{returnId}")
    @ResponseBody
    public ResponseEntity<Void> processReturn(
            @AuthenticationPrincipal UserDTO seller,
            @PathVariable int returnId,
            @RequestBody ProcessReturnRequestDTO request) {
        afterSalesService.processReturnRequest(seller.getId(), returnId, request);
        return ResponseEntity.ok().build();
    }

}
