package com.example.ecommerce.dao;

import com.example.ecommerce.dto.ReturnDTO;
import lombok.RequiredArgsConstructor;
import org.apache.ibatis.session.SqlSession;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

@Repository
@RequiredArgsConstructor
public class ReturnDAO {

    private final SqlSession sqlSession;

    /**
     * 주문이 해당 판매자의 것인지 검증
     */
    public boolean validateSellerOrder(int sellerId, int orderId) {
        Map<String, Object> params = Map.of("sellerId", sellerId, "orderId", orderId);
        Integer count = sqlSession.selectOne("return.validateSellerOrder", params);
        return count != null && count > 0;
    }

    /**
     * 주문 항목이 해당 주문에 속하는지 검증
     */
    public boolean validateOrderItem(int orderId, int orderItemId) {
        Map<String, Object> params = Map.of("orderId", orderId, "orderItemId", orderItemId);
        Integer count = sqlSession.selectOne("return.validateOrderItem", params);
        return count != null && count > 0;
    }

    /**
     * 새로운 반품/교환 요청을 삽입
     */
    public int insertReturnRequest(Map<String, Object> params) {
        sqlSession.insert("return.insertReturnRequest", params);
        return (Integer) params.get("returnRequestId");
    }

    /**
     * 반품/교환 요청 항목을 삽입
     */
    public int insertReturnRequestItem(Map<String, Object> params) {
        return sqlSession.insert("return.insertReturnRequestItem", params);
    }

    /**
     * 반품/교환 상태 이력을 삽입
     */
    public int insertReturnStatusHistory(Map<String, Object> params) {
        return sqlSession.insert("return.insertReturnStatusHistory", params);
    }

    /**
     * ✅ 주문 항목의 상태를 반품 요청으로 업데이트 (새로 추가)
     */
    public int updateOrderItemStatusForReturn(int orderItemId, String status) {
        Map<String, Object> params = Map.of("orderItemId", orderItemId, "status", status);
        return sqlSession.update("return.updateOrderItemStatusForReturn", params);
    }

    /**
     * 판매자의 반품/교환 목록을 통합 조회
     */
    public List<ReturnDTO> findReturnsBySellerId(Map<String, Object> params) {
        return sqlSession.selectList("return.findReturnsBySellerId", params);
    }

    /**
     * 판매자의 반품/교환 총 개수 조회
     */
    public int countReturnsBySellerId(Map<String, Object> params) {
        return sqlSession.selectOne("return.countReturnsBySellerId", params);
    }

    /**
     * 반품/교환 상세 정보 조회 (타입에 따라 다른 테이블 조회)
     */
    public ReturnDTO findReturnDetailsById(Map<String, Object> params) {
        return sqlSession.selectOne("return.findReturnDetailsById", params);
    }

    /**
     * 반품/교환 상태 업데이트 (타입에 따라 다른 테이블 업데이트)
     */
    public int updateReturnStatus(Map<String, Object> params) {
        return sqlSession.update("return.updateReturnStatus", params);
    }

    /**
     * 반품만 조회하는 메서드 (필요시)
     */
    public List<ReturnDTO> findReturnsBySellerIdOnly(Map<String, Object> params) {
        params.put("typeFilter", "반품");
        return sqlSession.selectList("return.findReturnsByType", params);
    }

    /**
     * 교환만 조회하는 메서드 (필요시)
     */
    public List<ReturnDTO> findExchangesBySellerIdOnly(Map<String, Object> params) {
        params.put("typeFilter", "교환");
        return sqlSession.selectList("return.findReturnsByType", params);
    }
}