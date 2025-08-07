package com.example.ecommerce.dao;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.ibatis.session.SqlSession;

import com.example.ecommerce.dto.*;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class OrderDAO {

	private final SqlSession sqlSession;

	// ========== 기존 조회 메서드들 ==========

	public List<OrderSummaryDTO> findSingleOrders(int userId, String status, int offset, int limit) {
		Map<String, Object> map = new HashMap<>();
		map.put("userId", userId);
		map.put("status", status);
		map.put("offset", offset);
		map.put("limit", limit);
		return sqlSession.selectList("order.findSingleOrdersSummary", map);
	}

	public List<GroupBuyParticipantDTO> findGroupBuyOrders(int userId, String status, int offset, int limit) {
		Map<String, Object> map = new HashMap<>();
		map.put("userId", userId);
		map.put("status", status);
		map.put("offset", offset);
		map.put("limit", limit);
		return sqlSession.selectList("order.findGroupBuyOrdersSummary", map);
	}

	public int countSingleOrders(int userId, String status) {
		Map<String, Object> map = new HashMap<>();
		map.put("userId", userId);
		map.put("status", status);
		return sqlSession.selectOne("order.countSingleOrders", map);
	}

	public int countGroupBuyOrders(int userId, String status) {
		Map<String, Object> map = new HashMap<>();
		map.put("userId", userId);
		map.put("status", status);
		return sqlSession.selectOne("order.countGroupBuyOrders", map);
	}

	public List<OrderSummaryDTO> findOrdersBySellerId(Map<String, Object> params) {
		return sqlSession.selectList("order.findOrdersBySellerId", params);
	}

	public int countOrdersBySellerId(Map<String, Object> params) {
		return sqlSession.selectOne("order.countOrdersBySellerId", params);
	}

	public int updateOrderStatus(Map<String, Object> params) {
		return sqlSession.update("order.updateOrderStatus", params);
	}

	public int insertShipment(ShipmentDTO shipment) {
		return sqlSession.insert("order.insertShipment", shipment);
	}

	public Integer findOrderIdByOrderNo(String orderNo) {
		return sqlSession.selectOne("order.findOrderIdByOrderNo", orderNo);
	}

	public OrderDTO findOrderDetailsByOrderNo(String orderNo) {
		return sqlSession.selectOne("order.findOrderDetailsByOrderNo", orderNo);
	}

	public OrderDTO findOrderDetailByOrderNo(String orderNo) {
		return sqlSession.selectOne("order.findOrderDetailByOrderNo", orderNo);
	}

	public ShipmentDTO findShippingInfoByOrderNo(String orderNo) {
		return sqlSession.selectOne("order.findShippingInfoByOrderNo", orderNo);
	}

	public boolean hasSellerProductsInOrder(int sellerId, int orderId) {
		Integer count = sqlSession.selectOne("order.countSellerProductsInOrder", Map.of("sellerId", sellerId, "orderId", orderId));
		return count != null && count > 0;
	}
	public List<OrderItemDTO> findOrderItemsByOrderId(int orderId) {
		return sqlSession.selectList("order.findOrderItemsByOrderId", orderId);
	}
	// ========== 주문 생성 관련 메서드들 ==========

	/**
	 * 장바구니 아이템들을 ID로 조회
	 */
	public List<CartItemDTO> findCartItemsByIds(int userId, List<Integer> cartItemIds) {
		Map<String, Object> params = Map.of("userId", userId, "cartItemIds", cartItemIds);
		return sqlSession.selectList("order.findCartItemsByIds", params);
	}

	/**
	 * 사용자의 기본 배송지 조회
	 */
	public ShippingAddressDTO findDefaultShippingAddress(int userId) {
		return sqlSession.selectOne("order.findDefaultShippingAddress", userId);
	}

	/**
	 * 배송지 ID로 배송지 정보 조회
	 */
	public ShippingAddressDTO findShippingAddressById(Integer addressId) {
		return sqlSession.selectOne("order.findShippingAddressById", addressId);
	}

	/**
	 * 주문 아이템 확인 데이터 조회 (상품명, 가격 등)
	 */
	public OrderItemDTO findOrderItemConfirmData(OrderItemRequestDTO orderItem) {
		return sqlSession.selectOne("order.findOrderItemConfirmData", orderItem);
	}

	/**
	 * 상품 메인 이미지 URL 조회
	 */
	public String findProductMainImageUrl(Integer productId) {
		return sqlSession.selectOne("order.findProductMainImageUrl", productId);
	}

	/**
	 * 공동구매 정보 조회
	 */
	public GroupBuyDTO findGroupBuyById(Integer groupBuyId) {
		return sqlSession.selectOne("order.findGroupBuyById", groupBuyId);
	}

	/**
	 * 상품 변형 정보 조회
	 */
	public ProductVariantDTO findProductVariantById(Integer variantId) {
		return sqlSession.selectOne("order.findProductVariantById", variantId);
	}

	/**
	 * 주문 생성
	 */
	public int insertOrder(OrderDTO order) {
		return sqlSession.insert("order.insertOrder", order);
	}

	/**
	 * 주문 아이템 생성
	 */
	public int insertOrderItem(int orderId, OrderItemDTO orderItem) {
		Map<String, Object> params = Map.of("orderId", orderId, "orderItem", orderItem);
		return sqlSession.insert("order.insertOrderItem", params);
	}

	/**
	 * 결제 정보 생성
	 */
	public int insertPayment(PaymentDTO payment) {
		return sqlSession.insert("order.insertPayment", payment);
	}

	/**
	 * 공동구매 참여자 생성
	 */
	public int insertGroupBuyParticipant(GroupBuyParticipantDTO participant) {
		return sqlSession.insert("order.insertGroupBuyParticipant", participant);
	}

	/**
	 * 공동구매 결제 정보 생성
	 */
	public int insertGroupBuyPayment(PaymentDTO payment) {
		return sqlSession.insert("order.insertGroupBuyPayment", payment);
	}

	/**
	 * 주문 상태 업데이트 (ID 기준)
	 */
	public int updateOrderStatusById(int orderId, String status) {
		Map<String, Object> params = Map.of("orderId", orderId, "status", status);
		return sqlSession.update("order.updateOrderStatusById", params);
	}

	/**
	 * 상품 재고 차감
	 */
	public int decreaseProductStock(Integer variantId, int quantity) {
		Map<String, Object> params = Map.of("variantId", variantId, "quantity", quantity);
		return sqlSession.update("order.decreaseProductStock", params);
	}

	/**
	 * 공동구매 현재 수량 증가
	 */
	public int increaseGroupBuyQuantity(Integer groupBuyId, int quantity) {
		Map<String, Object> params = Map.of("groupBuyId", groupBuyId, "quantity", quantity);
		return sqlSession.update("order.increaseGroupBuyQuantity", params);
	}

	/**
	 * 공동구매 참여자 정보 조회
	 */
	public GroupBuyParticipantDTO findGroupBuyParticipantById(Integer participantId) {
		return sqlSession.selectOne("order.findGroupBuyParticipantById", participantId);
	}

	/**
	 * 결제 정보 업데이트
	 */
	public int updatePayment(PaymentDTO payment) {
		return sqlSession.update("order.updatePayment", payment);
	}

	// 공동구매 성공 여부 확인
	public Boolean isGroupBuySuccessful(int groupBuyId) {
		return sqlSession.selectOne("order.isGroupBuySuccessful", groupBuyId);
	}

	// 공동구매 참여자의 order_id 업데이트
	public int updateGroupBuyParticipantOrderId(Map<String, Object> params) {
		return sqlSession.update("order.updateGroupBuyParticipantOrderId", params);
	}

	// 공동구매 참여자 상태 업데이트
	public int updateGroupBuyParticipantStatus(GroupBuyParticipantDTO participant) {
		return sqlSession.update("order.updateGroupBuyParticipantStatus", participant);
	}

	public void setOrderConfirmed(int orderId) {
		sqlSession.update("order.setOrderConfirmed", orderId);
	}

	public void setOrderItemConfirmed(int id) {
		sqlSession.update("order.setOrderItemConfirmed", id);
	}

	public String findOrderNoById(int id) {
		return sqlSession.selectOne("order.findOrderNoById", id);
	}

	public int findShippingCost(Integer productId) {
		return sqlSession.selectOne("order.findShippingCost", productId);
	}

	public Integer findProductSellerId(Integer productId) {
		return sqlSession.selectOne("order.findProductSellerId", productId);
	}
}