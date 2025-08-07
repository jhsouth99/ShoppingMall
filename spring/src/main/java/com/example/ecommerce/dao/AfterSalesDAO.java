package com.example.ecommerce.dao;

import com.example.ecommerce.dto.AfterSalesRequestDTO;
import com.example.ecommerce.dto.AfterSalesRequestItemDTO;
import com.example.ecommerce.dto.AfterSalesStatusHistoryDTO;
import lombok.RequiredArgsConstructor;
import org.apache.ibatis.session.SqlSession;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RequiredArgsConstructor
public class AfterSalesDAO {

    private final SqlSession sqlSession;

    /**
     * 반품/교환 요청 생성
     */
    public int insertAfterSalesRequest(AfterSalesRequestDTO requestDTO) {
        return sqlSession.insert("afterSales.insertAfterSalesRequest", requestDTO);
    }

    /**
     * 반품/교환 요청 항목 생성
     */
    public int insertAfterSalesRequestItem(AfterSalesRequestItemDTO itemDTO) {
        return sqlSession.insert("afterSales.insertAfterSalesRequestItem", itemDTO);
    }

    /**
     * 사용자별 반품/교환 요청 목록 조회
     */
    public List<AfterSalesRequestDTO> findAfterSalesRequestsByUserId(int userId, int offset, int limit) {
        Map<String, Object> params = new HashMap<>();
        params.put("userId", userId);
        params.put("offset", offset);
        params.put("limit", limit);
        return sqlSession.selectList("afterSales.findAfterSalesRequestsByUserId", params);
    }

    /**
     * 사용자별 반품/교환 요청 총 개수
     */
    public int countAfterSalesRequestsByUserId(int userId) {
        return sqlSession.selectOne("afterSales.countAfterSalesRequestsByUserId", userId);
    }

    /**
     * 반품/교환 요청 상세 조회
     */
    public AfterSalesRequestDTO findAfterSalesRequestById(int requestId) {
        return sqlSession.selectOne("afterSales.findAfterSalesRequestById", requestId);
    }

    /**
     * 반품/교환 요청 항목들 조회
     */
    public List<AfterSalesRequestItemDTO> findAfterSalesRequestItems(int requestId) {
        return sqlSession.selectList("afterSales.findAfterSalesRequestItems", requestId);
    }

    /**
     * 반품/교환 상태 히스토리 조회
     */
    public List<AfterSalesStatusHistoryDTO> findAfterSalesStatusHistory(int requestId) {
        return sqlSession.selectList("afterSales.findAfterSalesStatusHistory", requestId);
    }

    /**
     * 반품/교환 요청 상태 업데이트
     */
    public int updateAfterSalesRequestStatus(int requestId, String status, Integer processedBy) {
        Map<String, Object> params = new HashMap<>();
        params.put("requestId", requestId);
        params.put("status", status);
        params.put("processedBy", processedBy);
        return sqlSession.update("afterSales.updateAfterSalesRequestStatus", params);
    }

    /**
     * 픽업 정보 업데이트
     */
    public int updatePickupInfo(int requestId, int carrierId, String trackingNumber) {
        Map<String, Object> params = new HashMap<>();
        params.put("requestId", requestId);
        params.put("carrierId", carrierId);
        params.put("trackingNumber", trackingNumber);
        return sqlSession.update("afterSales.updatePickupInfo", params);
    }

    /**
     * 검수 결과 업데이트
     */
    public int updateInspectionResult(int itemId, String result, String comment, int approvedQuantity) {
        Map<String, Object> params = new HashMap<>();
        params.put("itemId", itemId);
        params.put("result", result);
        params.put("comment", comment);
        params.put("approvedQuantity", approvedQuantity);
        return sqlSession.update("afterSales.updateInspectionResult", params);
    }

    /**
     * 환불 정보 업데이트
     */
    public int updateRefundInfo(int itemId, int refundId, int refundAmount) {
        Map<String, Object> params = new HashMap<>();
        params.put("itemId", itemId);
        params.put("refundId", refundId);
        params.put("refundAmount", refundAmount);
        return sqlSession.update("afterSales.updateRefundInfo", params);
    }

    /**
     * 교환 배송 정보 업데이트
     */
    public int updateExchangeShipmentInfo(int itemId, int shipmentId) {
        Map<String, Object> params = new HashMap<>();
        params.put("itemId", itemId);
        params.put("shipmentId", shipmentId);
        return sqlSession.update("afterSales.updateExchangeShipmentInfo", params);
    }

    /**
     * 판매자별 반품/교환 요청 목록 조회 (관리자용)
     */
    public List<AfterSalesRequestDTO> findAfterSalesRequestsBySellerId(int sellerId, int offset, int limit, String status) {
        Map<String, Object> params = new HashMap<>();
        params.put("sellerId", sellerId);
        params.put("offset", offset);
        params.put("limit", limit);
        params.put("status", status);
        return sqlSession.selectList("afterSales.findAfterSalesRequestsBySellerId", params);
    }

    /**
     * 판매자별 반품/교환 요청 총 개수 (관리자용)
     */
    public int countAfterSalesRequestsBySellerId(int sellerId, String status) {
        Map<String, Object> params = new HashMap<>();
        params.put("sellerId", sellerId);
        params.put("status", status);
        return sqlSession.selectOne("afterSales.countAfterSalesRequestsBySellerId", params);
    }
}