package com.example.ecommerce.service;

import com.example.ecommerce.dao.AfterSalesDAO;
import com.example.ecommerce.dao.OrderDAO;
import com.example.ecommerce.dao.ReturnDAO;
import com.example.ecommerce.dto.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AfterSalesService {

    private final AfterSalesDAO afterSalesDAO;
    private final OrderDAO orderDAO;
    private final ReturnDAO returnDAO;

    /**
     * 새로운 반품/교환 요청을 생성합니다.
     */
    @Transactional
    public int createReturnRequest(int sellerId, Map<String, Object> request) {
        // 1. 주문 유효성 검사 (해당 판매자의 주문인지 확인)
        int orderId = (Integer) request.get("orderId");
        boolean isValidOrder = returnDAO.validateSellerOrder(sellerId, orderId);
        if (!isValidOrder) {
            throw new SecurityException("해당 주문에 대한 권한이 없습니다.");
        }

        // 2. 반품/교환 요청 기본 정보 생성
        Map<String, Object> returnRequestParams = new HashMap<>();
        returnRequestParams.put("orderId", orderId);
        returnRequestParams.put("requestType", request.get("requestType"));
        returnRequestParams.put("customerReason", request.get("customerReason"));
        returnRequestParams.put("customerComment", request.get("customerComment"));
        returnRequestParams.put("status", "REQUESTED");

        int returnRequestId = returnDAO.insertReturnRequest(returnRequestParams);

        // 3. 반품/교환 요청 항목들 생성
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> items = (List<Map<String, Object>>) request.get("items");

        for (Map<String, Object> item : items) {
            // orderItemId null 체크 추가
            Object orderItemIdObj = item.get("orderItemId");
            if (orderItemIdObj == null) {
                throw new IllegalArgumentException("주문 항목 ID가 누락되었습니다.");
            }

            int orderItemId;
            try {
                orderItemId = (Integer) orderItemIdObj;
            } catch (ClassCastException e) {
                throw new IllegalArgumentException("주문 항목 ID 형식이 올바르지 않습니다: " + orderItemIdObj);
            }

            // 주문 항목 유효성 검사
            boolean isValidOrderItem = returnDAO.validateOrderItem(orderId, orderItemId);
            if (!isValidOrderItem) {
                throw new IllegalArgumentException("유효하지 않은 주문 항목입니다. orderItemId: " + orderItemId);
            }

            Map<String, Object> itemParams = new HashMap<>();
            itemParams.put("requestId", returnRequestId);
            itemParams.put("orderItemId", orderItemId);
            itemParams.put("itemType", item.get("itemType"));
            itemParams.put("quantity", item.get("quantity"));
            itemParams.put("reasonCode", item.get("reasonCode"));
            itemParams.put("reasonDetail", item.get("reasonDetail"));
            itemParams.put("newVariantId", item.get("newVariantId")); // 교환인 경우만 값이 있음

            returnDAO.insertReturnRequestItem(itemParams);
        }

        // 4. 상태 이력 추가
        Map<String, Object> historyParams = new HashMap<>();
        historyParams.put("requestId", returnRequestId);
        historyParams.put("statusFrom", null);
        historyParams.put("statusTo", "REQUESTED");
        historyParams.put("changedBy", null); // 고객이 요청한 경우
        returnDAO.insertReturnStatusHistory(historyParams);

        // ✅ 5. 관련 주문 항목들의 상태를 업데이트 (새로 추가)
        for (Map<String, Object> item : items) {
            int orderItemId = (Integer) item.get("orderItemId");
            returnDAO.updateOrderItemStatusForReturn(orderItemId, "RETURN_REQUESTED");
        }

        return returnRequestId;
    }

    @Transactional(readOnly = true)
    public PageResult<ReturnDTO> getReturns(int sellerId, int page, int size, String keyword, String status) {
        // DAO 호출 및 PageResult 생성 로직 (이전 답변들과 동일)
        int offset = (page > 0) ? (page - 1) * size : 0;
        Map<String, Object> params = new HashMap<>();
        params.put("sellerId", sellerId);
        params.put("offset", offset);
        params.put("size", size);
        params.put("keyword", keyword);
        params.put("status", status);
        List<ReturnDTO> content = returnDAO.findReturnsBySellerId(params);
        int total = returnDAO.countReturnsBySellerId(params);
        return new PageResult<>(content, total, page, size);
    }

    @Transactional(readOnly = true)
    public ReturnDTO getReturnDetails(int sellerId, int returnId) {
        return returnDAO.findReturnDetailsById(Map.of("sellerId", sellerId, "returnId", returnId));
    }

    @Transactional
    public void processReturnRequest(int sellerId, int returnId, ProcessReturnRequestDTO request) {
        // 1. 요청 유효성 검사 (해당 판매자의 요청이 맞는지 등)
        ReturnDTO currentRequest = getReturnDetails(sellerId, returnId);
        if (currentRequest == null) {
            throw new IllegalArgumentException("존재하지 않거나 처리 권한이 없는 요청입니다.");
        }

        Map<String, Object> params = new HashMap<>();
        params.put("returnId", returnId);

        // 2. 요청 액션에 따른 상태 분기 처리
        switch (request.getAction()) {
            case "ACCEPT_PICKUP":
                params.put("status", "IN_TRANSIT"); // 상태: 수거중
                params.put("pickupCarrier", request.getPickupCarrier());
                params.put("pickupTrackingNo", request.getPickupTrackingNo());
                break;
            case "MARK_AS_RECEIVED":
                params.put("status", "RECEIVED"); // 상태: 입고완료
                break;
            case "COMPLETE_INSPECTION":
                params.put("status", "INSPECTION_COMPLETED"); // 상태: 검수완료 (DB 제약조건에 맞춤)
                params.put("inspectionResult", request.getInspectionResult());
                break;
            case "COMPLETE_REFUND":
                params.put("status", "COMPLETED"); // 상태: 처리완료(환불)
                // TODO: 실제 환불 처리 로직 호출 (PG 연동)
                break;
            case "COMPLETE_EXCHANGE":
                params.put("status", "COMPLETED"); // 상태: 처리완료(교환)
                // TODO: 교환 상품에 대한 새 배송(Shipment) 정보 생성 및 저장
                // shipmentService.createExchangeShipment(returnId, request.getExchangeCarrier(), request.getExchangeTrackingNo());
                break;
            case "REJECT":
                params.put("status", "REJECTED"); // 상태: 반려
                break;
            default:
                throw new IllegalArgumentException("알 수 없는 처리 요청입니다. 액션: " + request.getAction());
        }

        returnDAO.updateReturnStatus(params);
    }

    /**
     * 반품/교환 요청 생성
     */
    @Transactional
    public AfterSalesRequestDTO createAfterSalesRequest(AfterSalesRequestDTO requestDTO) {
        log.info("반품/교환 요청 생성 시작 - 주문 ID: {}, 타입: {}", requestDTO.getOrderId(), requestDTO.getRequestType());

        try {
            // 1. 요청 기본 정보 설정
            requestDTO.setCreatedAt(LocalDateTime.now());
            requestDTO.setUpdatedAt(LocalDateTime.now());

            // 2. 반품/교환 요청 생성
            afterSalesDAO.insertAfterSalesRequest(requestDTO);
            System.out.println(afterSalesDAO.findAfterSalesRequestById(requestDTO.getId()));
            requestDTO.setRequestNo(afterSalesDAO.findAfterSalesRequestById(requestDTO.getId()).getRequestNo());

            // 3. 주문 아이템들을 반품/교환 항목으로 추가
            if (requestDTO.getItems() == null || requestDTO.getItems().isEmpty()) {
                List<OrderItemDTO> orderItems = orderDAO.findOrderItemsByOrderId(requestDTO.getOrderId());

                for (OrderItemDTO orderItem : orderItems) {
                    // 모든 주문 아이템을 반품/교환 대상으로 추가 (실제로는 사용자가 선택한 항목만)
                    AfterSalesRequestItemDTO itemDTO = new AfterSalesRequestItemDTO();
                    itemDTO.setRequestId(requestDTO.getId());
                    itemDTO.setOrderItemId(orderItem.getId());
                    itemDTO.setItemType(determineItemType(requestDTO.getRequestType()));
                    itemDTO.setQuantity(orderItem.getQuantity());
                    itemDTO.setReasonCode(requestDTO.getCustomerReason());
                    itemDTO.setReasonDetail(requestDTO.getCustomerComment());

                    afterSalesDAO.insertAfterSalesRequestItem(itemDTO);
                }
            } else {
                for (AfterSalesRequestItemDTO itemDTO : requestDTO.getItems()) {
                    itemDTO.setRequestId(requestDTO.getId());
                    afterSalesDAO.insertAfterSalesRequestItem(itemDTO);
                }
            }

            log.info("반품/교환 요청 생성 완료 - 요청 ID: {}, 요청번호: {}", requestDTO.getId(), requestDTO.getRequestNo());
            return requestDTO;

        } catch (Exception e) {
            log.error("반품/교환 요청 생성 중 오류 발생", e);
            throw new RuntimeException("반품/교환 요청 생성 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }

    /**
     * 사용자의 반품/교환 요청 목록 조회
     */
    @Transactional(readOnly = true)
    public PageResult<AfterSalesRequestDTO> getUserAfterSalesRequests(int userId, int page, int size) {
        int offset = (page - 1) * size;

        List<AfterSalesRequestDTO> requests = afterSalesDAO.findAfterSalesRequestsByUserId(userId, offset, size);
        int total = afterSalesDAO.countAfterSalesRequestsByUserId(userId);

        return new PageResult<>(requests, total, page, size);
    }

    /**
     * 반품/교환 요청 상세 조회
     */
    @Transactional(readOnly = true)
    public AfterSalesRequestDTO getAfterSalesRequestDetail(int requestId, int userId) {
        AfterSalesRequestDTO request = afterSalesDAO.findAfterSalesRequestById(requestId);

        if (request == null) {
            throw new IllegalArgumentException("존재하지 않는 반품/교환 요청입니다.");
        }

        if (request.getUserId() != userId) {
            throw new SecurityException("해당 요청에 대한 권한이 없습니다.");
        }

        // 요청 항목들 조회
        List<AfterSalesRequestItemDTO> items = afterSalesDAO.findAfterSalesRequestItems(requestId);
        request.setItems(items);

        // 상태 히스토리 조회
        List<AfterSalesStatusHistoryDTO> history = afterSalesDAO.findAfterSalesStatusHistory(requestId);
        request.setStatusHistory(history);

        return request;
    }

    /**
     * 반품/교환 요청 상태 업데이트
     */
    @Transactional
    public void updateAfterSalesRequestStatus(int requestId, String newStatus, Integer processedBy, String comment) {
        log.info("반품/교환 요청 상태 업데이트 - 요청 ID: {}, 새 상태: {}", requestId, newStatus);

        try {
            AfterSalesRequestDTO request = afterSalesDAO.findAfterSalesRequestById(requestId);
            if (request == null) {
                throw new IllegalArgumentException("존재하지 않는 반품/교환 요청입니다.");
            }

            String oldStatus = request.getStatus();

            // 상태 업데이트
            afterSalesDAO.updateAfterSalesRequestStatus(requestId, newStatus, processedBy);

            // 상태별 추가 처리
            handleStatusSpecificActions(requestId, newStatus, processedBy);

            log.info("반품/교환 요청 상태 업데이트 완료 - 요청 ID: {}, {} -> {}", requestId, oldStatus, newStatus);

        } catch (Exception e) {
            log.error("반품/교환 요청 상태 업데이트 중 오류 발생", e);
            throw new RuntimeException("상태 업데이트 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }

    /**
     * 반품/교환 요청 취소
     */
    @Transactional
    public void cancelAfterSalesRequest(int requestId, int userId) {
        AfterSalesRequestDTO request = afterSalesDAO.findAfterSalesRequestById(requestId);

        if (request == null) {
            throw new IllegalArgumentException("존재하지 않는 반품/교환 요청입니다.");
        }

        if (request.getUserId() != userId) {
            throw new SecurityException("해당 요청에 대한 권한이 없습니다.");
        }

        // 취소 가능한 상태인지 확인
        if (!canBeCancelled(request.getStatus())) {
            throw new IllegalStateException("현재 상태에서는 취소할 수 없습니다.");
        }

        // 요청 취소
        afterSalesDAO.updateAfterSalesRequestStatus(requestId, "CANCELLED", userId);
    }

    // ========== 보조 메서드들 ==========

    /**
     * 요청 타입에 따른 아이템 타입 결정
     */
    private String determineItemType(String requestType) {
        switch (requestType) {
            case "RETURN":
                return "RETURN";
            case "EXCHANGE":
                return "EXCHANGE";
            case "RETURN_EXCHANGE":
                // 실제로는 사용자가 각 아이템별로 선택하지만, 여기서는 기본값으로 RETURN 설정
                return "RETURN";
            default:
                throw new IllegalArgumentException("알 수 없는 요청 타입: " + requestType);
        }
    }

    /**
     * 상태별 추가 처리 로직
     */
    private void handleStatusSpecificActions(int requestId, String newStatus, Integer processedBy) {
        switch (newStatus) {
            case "APPROVED":
                // 승인 시 픽업 스케줄링
                schedulePickup(requestId);
                break;
            case "COMPLETED":
                // 완료 시 환불 처리나 교환 상품 발송
                processCompletion(requestId);
                break;
            case "REJECTED":
                // 거부 시 고객에게 알림
                notifyRejection(requestId);
                break;
        }
    }

    /**
     * 픽업 스케줄링
     */
    private void schedulePickup(int requestId) {
        // 실제로는 택배사 API 연동하여 픽업 예약
        log.info("픽업 스케줄링 처리 - 요청 ID: {}", requestId);

        // 픽업 정보 업데이트 (예시)
        afterSalesDAO.updatePickupInfo(requestId, 1, generateTrackingNumber());
    }

    /**
     * 완료 처리
     */
    private void processCompletion(int requestId) {
        // 환불 처리나 교환 상품 발송 로직
        log.info("완료 처리 - 요청 ID: {}", requestId);

        AfterSalesRequestDTO request = afterSalesDAO.findAfterSalesRequestById(requestId);
        List<AfterSalesRequestItemDTO> items = afterSalesDAO.findAfterSalesRequestItems(requestId);

        for (AfterSalesRequestItemDTO item : items) {
            if (item.isReturn() && item.isApproved()) {
                // 환불 처리
                processRefund(item);
            } else if (item.isExchange() && item.isApproved()) {
                // 교환 상품 발송
                processExchange(item);
            }
        }
    }

    /**
     * 거부 알림
     */
    private void notifyRejection(int requestId) {
        // 고객에게 거부 사유 알림
        log.info("거부 알림 처리 - 요청 ID: {}", requestId);
    }

    /**
     * 환불 처리
     */
    private void processRefund(AfterSalesRequestItemDTO item) {
        // 실제 환불 로직 구현
        log.info("환불 처리 - 아이템 ID: {}, 금액: {}", item.getId(), item.getRefundAmount());
    }

    /**
     * 교환 처리
     */
    private void processExchange(AfterSalesRequestItemDTO item) {
        // 교환 상품 발송 로직 구현
        log.info("교환 처리 - 아이템 ID: {}, 새 상품 ID: {}", item.getId(), item.getNewVariantId());
    }

    /**
     * 취소 가능 여부 확인
     */
    private boolean canBeCancelled(String status) {
        return "REQUESTED".equals(status) || "APPROVED".equals(status);
    }

    /**
     * 운송장 번호 생성
     */
    private String generateTrackingNumber() {
        return "AS" + System.currentTimeMillis();
    }
}