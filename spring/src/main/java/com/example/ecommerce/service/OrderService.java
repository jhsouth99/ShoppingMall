package com.example.ecommerce.service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;

import com.example.ecommerce.controller.OrderController;
import com.example.ecommerce.dao.*;
import com.example.ecommerce.dto.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final PromotionDAO promotionDAO;
    private final CouponDAO couponDAO;
    Logger logger = LoggerFactory.getLogger(OrderController.class);

    private final OrderDAO orderDAO;
    private final ShippingAddressDAO shippingAddressDAO;
    private final UserDAO userDAO;
    private final GroupBuyDAO groupBuyDAO;
    private final RefundDAO refundDAO;

    // ========== 기존 조회 메서드들 (유지) ==========

    @Transactional(readOnly = true)
    public PageResult<OrderSummaryDTO> getSingleOrders(int userId, String status, int page, int size) {
        int offset = (page - 1) * size;
        List<OrderSummaryDTO> orders = orderDAO.findSingleOrders(userId, status, offset, size);
        for (OrderSummaryDTO order : orders) {
            List<OrderItemDTO> orderItems = orderDAO.findOrderItemsByOrderId(order.getId());
            for (OrderItemDTO orderItem : orderItems) {
                orderItem.setOrderId(order.getId());
            }
            order.setOrderItems(orderItems);
        }
        int total = orderDAO.countSingleOrders(userId, status);
        return new PageResult<>(orders, total, page, size);
    }

    @Transactional(readOnly = true)
    public PageResult<GroupBuyParticipantDTO> getGroupBuyOrders(int userId, String status, int page, int size) {
        int offset = (page - 1) * size;
        List<GroupBuyParticipantDTO> list = orderDAO.findGroupBuyOrders(userId, status, offset, size);
        int total = orderDAO.countGroupBuyOrders(userId, status);
        return new PageResult<>(list, total, page, size);
    }

    @Transactional(readOnly = true)
    public PageResult<OrderSummaryDTO> getOrders(int sellerId, int page, int size, String keyword, String status, String startDate, String endDate) {
        int offset = (page > 0) ? (page - 1) * size : 0;
        Map<String, Object> params = new HashMap<>();
        params.put("sellerId", sellerId);
        params.put("offset", offset);
        params.put("size", size);
        params.put("keyword", keyword);
        params.put("status", status);
        params.put("startDate", startDate);
        params.put("endDate", endDate);

        List<OrderSummaryDTO> content = orderDAO.findOrdersBySellerId(params);
        int totalElements = orderDAO.countOrdersBySellerId(params);

        return new PageResult<>(content, totalElements, page, size);
    }

    @Transactional
    public boolean updateOrderStatus(int sellerId, String orderNo, String newStatus) {
        Map<String, Object> params = Map.of(
                "sellerId", sellerId,
                "orderNo", orderNo,
                "status", newStatus
        );
        int updatedRows = orderDAO.updateOrderStatus(params);
        return updatedRows > 0;
    }

    @Transactional
    public boolean createShipment(int sellerId, String orderNo, String courier, String trackingNumber) {
        boolean statusUpdated = updateOrderStatus(sellerId, orderNo, "SHIPPED");
        if (!statusUpdated) {
            throw new IllegalStateException("주문 상태를 변경할 수 없습니다.");
        }

        Integer orderId = orderDAO.findOrderIdByOrderNo(orderNo);
        if (orderId == null) {
            throw new IllegalArgumentException("존재하지 않는 주문번호입니다.");
        }

        ShipmentDTO shipment = new ShipmentDTO();
        shipment.setOrderId(orderId);
        shipment.setCarrierNameSnapshot(courier);
        shipment.setTrackingNumber(trackingNumber);
        shipment.setStatus("SHIPPED");
        shipment.setCost(0);
        shipment.setShippingMethodId(1);

        int insertedRows = orderDAO.insertShipment(shipment);
        return insertedRows > 0;
    }

    @Transactional(readOnly = true)
    public OrderDTO getOrderDetailsWithSellerId(int sellerId, String orderNo) {
        OrderDTO orderDetails = orderDAO.findOrderDetailsByOrderNo(orderNo);

        orderDetails.setItems(orderDAO.findOrderItemsByOrderId(orderDetails.getId()));

        if (orderDetails == null) {
            throw new IllegalArgumentException("요청한 주문 정보를 찾을 수 없습니다.");
        }

        boolean hasSellerProducts = orderDAO.hasSellerProductsInOrder(sellerId, orderDetails.getId());

        if (!hasSellerProducts) {
            throw new SecurityException("해당 주문에 접근할 권한이 없습니다. 판매자 ID: " + sellerId + ", 주문번호: " + orderNo);
        }

        return orderDetails;
    }

    @Transactional(readOnly = true)
    public OrderDTO getOrderDetailForUser(int userId, String orderNo) {
        OrderDTO orderDetail = orderDAO.findOrderDetailByOrderNo(orderNo);

        if (orderDetail == null || orderDetail.getUserId() != userId) {
            throw new IllegalArgumentException("해당 주문을 찾을 수 없거나 접근 권한이 없습니다.");
        }

        // 주문 ID를 사용해 주문 상품 목록을 조회합니다.
        List<OrderItemDTO> items = orderDAO.findOrderItemsByOrderId(orderDetail.getId());

        // 조회된 상품 목록을 orderDetail 객체에 설정합니다.
        orderDetail.setItems(items);

        ShipmentDTO shippingInfo = orderDAO.findShippingInfoByOrderNo(orderNo);
        if (shippingInfo != null) {
            orderDetail.setShippingInfo(shippingInfo);
        }

        return orderDetail;
    }

    @Transactional(readOnly = true)
    public OrderDTO getOrderDetails(String orderNo) {
        OrderDTO orderDetail = orderDAO.findOrderDetailsByOrderNo(orderNo);
        orderDetail.setRefunds(refundDAO.findRefundsByOrderNo(orderNo));

        if (orderDetail == null) {
            throw new IllegalArgumentException("해당 주문을 찾을 수 없습니다: " + orderNo);
        }

        List<OrderItemDTO> items = orderDAO.findOrderItemsByOrderId(orderDetail.getId());
        orderDetail.setItems(items);

        ShipmentDTO shippingInfo = orderDAO.findShippingInfoByOrderNo(orderNo);
        if (shippingInfo != null) {
            orderDetail.setShippingInfo(shippingInfo);
        }

        return orderDetail;
    }

    // ========== 새로운 주문 플로우 메서드들 ==========

    /**
     * 장바구니 아이템들을 OrderRequestDTO로 변환
     */
    @Transactional(readOnly = true)
    public OrderRequestDTO createOrderRequestFromCart(int userId, List<Integer> cartItemIds) {
        log.info("장바구니 아이템을 주문 요청으로 변환 - 사용자: {}, 아이템: {}", userId, cartItemIds);

        List<CartItemDTO> selectedItems = orderDAO.findCartItemsByIds(userId, cartItemIds);

        if (selectedItems.isEmpty()) {
            throw new IllegalArgumentException("유효하지 않은 장바구니 아이템입니다.");
        }

        OrderRequestDTO multiOrder = new OrderRequestDTO();
        List<OrderItemRequestDTO> orderItems = new ArrayList<>();
        int totalAmount = 0;

        for (CartItemDTO cartItem : selectedItems) {
            OrderItemRequestDTO orderItem = new OrderItemRequestDTO();
            orderItem.setProductId(cartItem.getProductId());
            orderItem.setProductVariantId(cartItem.getProductVariantId());
            orderItem.setQuantity(cartItem.getQuantity());
            orderItem.setPrice(cartItem.getPrice());
            orderItem.setShippingCost((int) cartItem.getShippingCost());
            orderItem.setSellerId(orderDAO.findProductSellerId(orderItem.getProductId()));

            orderItems.add(orderItem);
            totalAmount += (int) (cartItem.getPrice() * cartItem.getQuantity() + cartItem.getShippingCost());
        }

        multiOrder.setOrderItems(orderItems);
        multiOrder.setTotalAmount(totalAmount);

        return multiOrder;
    }

    /**
     * 주문서 작성을 위한 기본 데이터 조회 (1단계: 주문서 작성)
     */
    @Transactional(readOnly = true)
    public OrderDTO getCheckoutFormData(int userId, OrderRequestDTO pendingOrder) {
        log.info("주문서 작성 데이터 조회 - 사용자: {}, 주문 타입: {}", userId, pendingOrder.getOrderType());

        OrderDTO checkoutData = new OrderDTO();
        checkoutData.setUserId(userId);

        // 사용자의 기본 배송지 조회
        ShippingAddressDTO defaultAddress = orderDAO.findDefaultShippingAddress(userId);
        if (defaultAddress != null) {
            checkoutData.setRecipientName(defaultAddress.getRecipientName());
            checkoutData.setRecipientPhone(defaultAddress.getRecipientPhone());
            checkoutData.setRecipientAddress(defaultAddress.getAddress());
            checkoutData.setRecipientAddressDetail(defaultAddress.getAddressDetail());
            checkoutData.setRecipientZipcode(defaultAddress.getZipcode());
        }

        int shippingFee = 0;

        // 주문 아이템 정보 조회 및 설정
        if (pendingOrder.isMultiOrder()) {
            // 다중 상품 주문
            List<OrderItemDTO> items = new ArrayList<>();
            int totalAmount = 0;

            for (OrderItemRequestDTO orderItem : pendingOrder.getOrderItems()) {
                OrderItemDTO itemDetail = orderDAO.findOrderItemConfirmData(orderItem);
                if (itemDetail != null) {
                    // 각 상품의 이미지 URL 조회
                    String itemImageUrl = orderDAO.findProductMainImageUrl(itemDetail.getProductId());
                    itemDetail.setProductImageUrl(itemImageUrl != null ? itemImageUrl : "/images/default-product.jpg");

                    items.add(itemDetail);
                    totalAmount += itemDetail.getTotalPriceAtPurchase();
                }
            }

            checkoutData.setItems(items);
            checkoutData.setSubTotalAmount(totalAmount);
            checkoutData.setTotalAmount(totalAmount);

            // 할인 정보 가져오기 (Null 체크 포함)
            int promotionDiscount = calculateMultiOrderPromotionDiscount(pendingOrder);
            int couponDiscount = pendingOrder.getCouponDiscount() != null ? pendingOrder.getCouponDiscount() : 0;
            int totalDiscount = promotionDiscount + couponDiscount;

            // 배송비 계산
            int itemsShippingCostSum = getMultiOrderShippingCost(pendingOrder);
            shippingFee = calculateShippingFee(checkoutData.getSubTotalAmount(), itemsShippingCostSum);
            checkoutData.setShippingFee(shippingFee);

            checkoutData.setPromotionDiscountAmount(promotionDiscount);
            checkoutData.setCouponDiscountAmount(couponDiscount);
            checkoutData.setTotalDiscountAmount(totalDiscount);
        } else {
            // 단일 상품 주문
            OrderItemRequestDTO singleItem = new OrderItemRequestDTO();
            singleItem.setProductId(pendingOrder.getProductId());
            singleItem.setProductVariantId(pendingOrder.getVariantId());
            singleItem.setQuantity(pendingOrder.getQuantity());

            // 상품 가격 조회
            ProductVariantDTO variant = orderDAO.findProductVariantById(pendingOrder.getVariantId());
            if (variant == null) {
                throw new IllegalArgumentException("존재하지 않는 상품 변형입니다.");
            }

            singleItem.setPrice(variant.getPrice());

            OrderItemDTO itemDetail = orderDAO.findOrderItemConfirmData(singleItem);
            if (itemDetail != null) {
                checkoutData.setItems(List.of(itemDetail));

                // checkout.jsp에서 사용할 단일 상품 정보 설정
                checkoutData.setProductId(pendingOrder.getProductId());
                checkoutData.setProductVariantId(pendingOrder.getVariantId());
                checkoutData.setQuantity(pendingOrder.getQuantity());
                checkoutData.setProductName(itemDetail.getProductName());
                checkoutData.setOptionCombination(itemDetail.getOptionCombination());
                checkoutData.setOriginalPrice(variant.getPrice());
                checkoutData.setFinalPrice(variant.getPrice());

                // 상품 이미지 URL 조회
                String productImageUrl = orderDAO.findProductMainImageUrl(pendingOrder.getProductId());
                checkoutData.setProductImageUrl(productImageUrl != null ? productImageUrl : "/images/default-product.jpg");

                int totalAmount = variant.getPrice() * pendingOrder.getQuantity();
                checkoutData.setSubTotalAmount(totalAmount);
                checkoutData.setTotalAmount(totalAmount);
            }

            // 할인 정보 가져오기 (Null 체크 포함)
            int promotionDiscount = calculateSingleOrderPromotionDiscount(pendingOrder);
            int couponDiscount = pendingOrder.getCouponDiscount() != null ? pendingOrder.getCouponDiscount() : 0;
            int totalDiscount = promotionDiscount + couponDiscount;

            // 배송비 계산
            int itemsShippingCostSum = pendingOrder.getShippingCost();
            shippingFee = calculateShippingFee(checkoutData.getSubTotalAmount(), itemsShippingCostSum);
            checkoutData.setShippingFee(shippingFee);
            checkoutData.setPromotionDiscountAmount(promotionDiscount);
            checkoutData.setCouponDiscountAmount(couponDiscount);
            checkoutData.setTotalDiscountAmount(totalDiscount);
        }

        // 최종 금액 계산
        int finalAmount = checkoutData.getSubTotalAmount() + shippingFee - checkoutData.getTotalDiscountAmount();
        checkoutData.setFinalAmount(finalAmount);

        return checkoutData;
    }

    private int getSingleOrderShippingCost(OrderRequestDTO pendingOrder) {
        return pendingOrder.getShippingCost();
    }

    private int getMultiOrderShippingCost(OrderRequestDTO pendingOrder) {
        int result = 0;
        Map<Integer, Set<OrderItemRequestDTO>> map = new HashMap<>();
        for (OrderItemRequestDTO orderItem : pendingOrder.getOrderItems()) {
            if (map.containsKey(orderItem.getSellerId())) {
                map.get(orderItem.getSellerId()).add(orderItem);
            } else {
                map.put(orderItem.getSellerId(), new HashSet<>(List.of(orderItem)));
            }
        }
        for (Integer sellerId : map.keySet()) {
            Set<OrderItemRequestDTO> orderItems = map.get(sellerId);
            int maxShippingCost = 0;
            for (OrderItemRequestDTO orderItem : orderItems) {
                int t = orderItem.getShippingCost();
                if (t == 0) {
                    maxShippingCost = t;
                    break;
                }
                if (t > maxShippingCost) {
                    maxShippingCost = t;
                }
            }
            result +=  maxShippingCost;
        }
        return result;
    }

    /**
     * 예상 금액 계산 (쿠폰 조회용)
     */
    @Transactional(readOnly = true)
    public int calculateEstimatedAmount(OrderRequestDTO pendingOrder) {
        if (pendingOrder.isMultiOrder()) {
            return pendingOrder.getTotalAmount();
        } else {
            ProductVariantDTO variant = orderDAO.findProductVariantById(pendingOrder.getVariantId());
            return variant.getPrice() * pendingOrder.getQuantity();
        }
    }

    /**
     * 공동구매 주문서 작성 데이터 조회
     */
    @Transactional(readOnly = true)
    public OrderDTO getGroupBuyCheckoutData(int userId, GroupBuyJoinRequestDTO pendingGroupBuy) {
        log.info("공동구매 주문서 데이터 조회 - 사용자: {}, 공동구매: {}", userId, pendingGroupBuy.getGroupBuyId());

        GroupBuyDTO groupBuy = orderDAO.findGroupBuyById(pendingGroupBuy.getGroupBuyId());
        if (groupBuy == null) {
            throw new IllegalArgumentException("존재하지 않는 공동구매입니다.");
        }

        if (!"ACTIVE".equals(groupBuy.getStatus())) {
            throw new IllegalStateException("참여할 수 없는 공동구매입니다.");
        }

        // 상품 정보 조회
        ProductVariantDTO variant = orderDAO.findProductVariantById(groupBuy.getProductVariantId());
        if (variant == null) {
            throw new IllegalArgumentException("공동구매 상품 정보를 찾을 수 없습니다.");
        }

        // 상품 기본 정보 조회
        OrderItemRequestDTO singleItem = new OrderItemRequestDTO();
        singleItem.setProductId(variant.getProductId());
        singleItem.setProductVariantId(groupBuy.getProductVariantId());
        singleItem.setQuantity(pendingGroupBuy.getQuantity());
        singleItem.setPrice(groupBuy.getGroupPrice());

        OrderItemDTO itemDetail = orderDAO.findOrderItemConfirmData(singleItem);

        // 사용자의 기본 배송지 조회
        ShippingAddressDTO defaultAddress = orderDAO.findDefaultShippingAddress(userId);

        OrderDTO checkoutData = new OrderDTO();
        checkoutData.setUserId(userId);

        if (defaultAddress != null) {
            checkoutData.setRecipientName(defaultAddress.getRecipientName());
            checkoutData.setRecipientPhone(defaultAddress.getRecipientPhone());
            checkoutData.setRecipientAddress(defaultAddress.getAddress());
            checkoutData.setRecipientAddressDetail(defaultAddress.getAddressDetail());
            checkoutData.setRecipientZipcode(defaultAddress.getZipcode());
        }

        // 공동구매 상품 정보 설정
        checkoutData.setProductId(variant.getProductId());
        checkoutData.setProductVariantId(groupBuy.getProductVariantId());
        checkoutData.setQuantity(pendingGroupBuy.getQuantity());
        checkoutData.setProductName(itemDetail.getProductName());
        checkoutData.setOptionCombination(itemDetail.getOptionCombination());
        checkoutData.setOriginalPrice(variant.getPrice()); // 원가
        checkoutData.setFinalPrice(groupBuy.getGroupPrice()); // 공동구매가

        // 공동구매 정보 설정
        checkoutData.setGroupBuyId(pendingGroupBuy.getGroupBuyId());
        checkoutData.setGroupBuyName(groupBuy.getName());
        checkoutData.setGroupPrice(groupBuy.getGroupPrice());
        checkoutData.setCurrentQuantity(groupBuy.getCurrentQuantity());
        checkoutData.setTargetQuantity(groupBuy.getTargetQuantity());

        // 상품 이미지 URL 조회
        String productImageUrl = orderDAO.findProductMainImageUrl(variant.getProductId());
        checkoutData.setProductImageUrl(productImageUrl != null ? productImageUrl : "/images/default-product.jpg");

        // 금액 계산
        int totalAmount = groupBuy.getGroupPrice() * pendingGroupBuy.getQuantity();
        checkoutData.setSubTotalAmount(totalAmount);
        checkoutData.setTotalAmount(totalAmount);

        // 공동구매는 일반적으로 무료배송
        checkoutData.setShippingFee(0);
        checkoutData.setFinalAmount(totalAmount);

        return checkoutData;
    }

    /**
     * 주문 실행 (최종 결제 및 주문 생성)
     */
    @Transactional
    public OrderDTO executeOrder(int userId, OrderRequestDTO pendingOrder) {
        log.info("주문 실행 - 사용자: {}, 주문 타입: {}", userId, pendingOrder.getOrderType());

        try {
            // 1. 주문 생성
            OrderDTO order = createOrder(userId, pendingOrder);

            // 2. 주문 아이템들 생성
            createOrderItems(order.getId(), pendingOrder);

            // 3. 결제 처리
            PaymentDTO payment = processPayment(order, pendingOrder.getPaymentMethod());

            // 4. 결제 상세 정보 처리 (결제 방법별 추가 정보)
            if (pendingOrder.getPaymentInfo() != null) {
                processPaymentDetails(payment, pendingOrder.getPaymentInfo(), pendingOrder.getPaymentMethod());
                // 결제 정보 업데이트
                orderDAO.updatePayment(payment);
            }

            // 5. 재고 차감
            updateProductStocks(pendingOrder);

            // 6. 주문 상태를 PAID로 변경
            orderDAO.updateOrderStatusById(order.getId(), "PAID");

            log.info("주문 실행 완료 - 주문번호: {}", order.getOrderNo());
            return order;

        } catch (Exception e) {
            e.printStackTrace();
            log.error("주문 실행 중 오류 발생", e);
            throw new RuntimeException("주문 처리 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    @Transactional
    public void executeGroupBuy(GroupBuyParticipantDTO participantDTO) {
        try {
            // 1. 주문 생성
            OrderDTO order = createOrderFromGroupBuyParticipant(participantDTO);
            participantDTO.setOrderId(order.getId());

            // 2. 공동구매 참여자 생성 (기존 메소드 시그니처 사용)
            createGroupBuyParticipant(participantDTO);

            processGroupBuyPayment(participantDTO, order.getId());

        } catch (Exception e) {
            log.error("공동구매 실행 중 오류 발생", e);
            throw new RuntimeException("공동구매 처리 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }

    /**
     * 개별 주문 아이템 구매 확정
     */
    @Transactional
    public void confirmOrderItem(int customerId, String orderNo, int orderItemId) {
        // 1. 주문 및 주문 아이템 유효성 검사
        OrderDTO order = orderDAO.findOrderDetailsByOrderNo(orderNo);
        if (order == null) {
            throw new IllegalArgumentException("주문을 찾을 수 없습니다.");
        }
        if (order.getUserId() != customerId) {
            throw new SecurityException();
        }

        OrderItemDTO orderItem = null;
        List<OrderItemDTO> orderItems = orderDAO.findOrderItemsByOrderId(order.getId());
        if (orderItems == null ||  orderItems.isEmpty()) {
            throw new IllegalArgumentException("주문 아이템을 찾을 수 없습니다.");
        }
        for (OrderItemDTO orderItemIter : orderItems) {
            if (orderItemIter.getId() == orderItemId) {
                orderItem = orderItemIter;
                break;
            }
        }
        if (orderItem == null) {
            throw new IllegalArgumentException("주문 아이템을 찾을 수 없습니다.");
        }

        // 2. 구매 확정 가능 상태 확인
        if (!orderItem.getStatus().equals("DELIVERED")) {
            throw new IllegalStateException("배송 완료된 상품만 구매 확정할 수 있습니다.");
        }

        if (orderItem.getConfirmedAt() != null) {
            throw new IllegalStateException("이미 구매 확정된 상품입니다.");
        }

        // 3. 구매 확정 처리
        orderDAO.setOrderItemConfirmed(orderItemId);

        // 4. 판매자 정산 처리 (필요시)
        // settlementService.processOrderItemSettlement(orderItemId);

        logger.info("주문 아이템 구매 확정 완료: orderNo={}, orderItemId={}, customerId={}",
                orderNo, orderItemId, customerId);
    }

    private OrderDTO createOrderFromGroupBuyParticipant(GroupBuyParticipantDTO participant) {
        OrderDTO order = new OrderDTO();

        // 주문 기본 정보 설정
        order.setUserId(participant.getUserId());
        //order.setOrderNo(generateOrderNo());
        order.setProductVariantId(participant.getVariantId());
        order.setRecipientName(participant.getRecipientName());
        order.setRecipientPhone(participant.getRecipientPhone());
        order.setRecipientAddress(participant.getRecipientAddress());
        order.setRecipientAddressDetail(participant.getRecipientAddressDetail());
        order.setRecipientZipcode(participant.getRecipientZipcode());
        order.setRecipientDelivReqType(participant.getRecipientDelivReqType());
        order.setRecipientDelivReqMsg(participant.getRecipientDelivReqMsg());

        // 금액 정보 설정
        order.setSubTotalAmount(participant.getPaidAmount());
        order.setShippingFee(0); // 공동구매는 무료배송
        order.setCouponDiscountAmount(0);
        order.setPromotionDiscountAmount(0);
        order.setTotalDiscountAmount(0);
        order.setFinalAmount(participant.getPaidAmount());

        order.setStatus("PAID"); // 공동구매는 이미 결제완료 상태

        System.out.println(order);
        // 주문 생성
        orderDAO.insertOrder(order);
        String orderNo = orderDAO.findOrderNoById(order.getId());
        order.setOrderNo(orderNo);

        // 주문 항목 생성
        OrderItemDTO orderItem = new OrderItemDTO();
        orderItem.setOrderId(order.getId());
        orderItem.setProductVariantId(groupBuyDAO.findGroupBuyDetails(participant.getGroupBuyId()).getProductVariantId());
        orderItem.setQuantity(participant.getQuantity());
        orderItem.setPriceAtPurchase(participant.getFinalPrice());
        orderItem.setTotalPriceAtPurch(participant.getPaidAmount());
        orderItem.setStatus("CONFIRMED");

        System.out.println(participant);
        System.out.println(orderItem);
        orderDAO.insertOrderItem(order.getId(), orderItem);

        return order;
    }

    private PaymentDTO createPaymentFromParticipant(GroupBuyParticipantDTO participant, int orderId) {
        PaymentDTO payment = new PaymentDTO();

        payment.setOrderId(orderId);
        payment.setPaymentMethodType(participant.getPaymentMethod());
        payment.setAmount(participant.getPaidAmount());
        payment.setStatus("COMPLETED");
        payment.setPaidAt(LocalDateTime.now());

        // 결제 세부 정보 설정
        setPaymentDetails(payment, participant.getPaymentMethod());

        return payment;
    }

    // 모바일 페이 결제수단
    private static final String[] MOBILE_PAYMENTS = {
            "SamsungPay", "KakaoPay", "NaverPay", "LGPay"
    };

    private static final Random RANDOM = new Random();

    // 할부 옵션 (일시불 포함)
    private static final String[] INSTALLMENTS = {
            "일시불", "2개월", "3개월", "6개월", "9개월", "12개월"
    };

    // 카드사 목록
    private static final String[] CARD_COMPANIES = {
            "삼성카드", "신한카드", "현대카드", "KB국민카드", "하나카드", "롯데카드", "BC카드"
    };

    private String getRandomMobilePayment() {
        return MOBILE_PAYMENTS[RANDOM.nextInt(MOBILE_PAYMENTS.length)];
    }

    private String getRandomInstallment() {
        return INSTALLMENTS[RANDOM.nextInt(INSTALLMENTS.length)];
    }

    private String getRandomCardCompany() {
        return CARD_COMPANIES[RANDOM.nextInt(CARD_COMPANIES.length)];
    }

    @Transactional(readOnly = true)
    public GroupBuyParticipantDTO getGroupBuyCompleteData(int userId, Integer participantId) {
        GroupBuyParticipantDTO participant = orderDAO.findGroupBuyParticipantById(participantId);
        if (participant == null || participant.getUserId() != userId) {
            throw new IllegalArgumentException("공동구매 정보를 찾을 수 없습니다.");
        }
        GroupBuyDTO gb = groupBuyDAO.findGroupBuyByGroupBuyPartId(participantId);
        participant.setTargetQuantity(gb.getTargetQuantity());
        participant.setCurrentQuantity(gb.getCurrentQuantity());
        return participant;
    }

    // ========== 보조 메서드들 ==========

    private int calculateShippingFee(int totalAmount, int itemsShippingCostSum) {
        return itemsShippingCostSum;
    }

    private OrderDTO createOrder(int userId, OrderRequestDTO pendingOrder) {
        OrderDTO order = new OrderDTO();
        order.setUserId(userId);
        //order.setOrderNo(generateOrderNo());

        // 배송지 정보 설정
        if (pendingOrder.getShippingAddressId() != null) {
            ShippingAddressDTO address = orderDAO.findShippingAddressById(pendingOrder.getShippingAddressId());
            if (address != null) {
                order.setRecipientName(address.getRecipientName());
                order.setRecipientPhone(address.getRecipientPhone());
                order.setRecipientAddress(address.getAddress());
                order.setRecipientAddressDetail(address.getAddressDetail());
                order.setRecipientZipcode(address.getZipcode());
            }
        } else {
            order.setRecipientName(pendingOrder.getRecipientName());
            order.setRecipientPhone(pendingOrder.getRecipientPhone());
            order.setRecipientAddress(pendingOrder.getRecipientAddress());
            order.setRecipientAddressDetail(pendingOrder.getRecipientAddressDetail());
            order.setRecipientZipcode(pendingOrder.getRecipientZipcode());
        }

        order.setRecipientDelivReqType(pendingOrder.getRecipientDelivReqType());
        order.setRecipientDelivReqMsg(pendingOrder.getRecipientDelivReqMsg());

        // 금액 계산
        int subTotalAmount = pendingOrder.isMultiOrder() ?
                calculateMultiOrderAmount(pendingOrder) :
                calculateSingleOrderAmount(pendingOrder);

        int itemsShippingCostSum = pendingOrder.isMultiOrder() ?
                getMultiOrderShippingCost(pendingOrder) : getSingleOrderShippingCost(pendingOrder);
        int shippingFee = calculateShippingFee(subTotalAmount, itemsShippingCostSum);

        // 할인 정보 가져오기 (Null 체크 포함)
        int promotionDiscount = pendingOrder.isMultiOrder() ?
                calculateMultiOrderPromotionDiscount(pendingOrder) :
                calculateSingleOrderPromotionDiscount(pendingOrder);
        int couponDiscount = 0;
        String appliedCouponCode = pendingOrder.getAppliedCouponCode();
        if (appliedCouponCode != null && !appliedCouponCode.isEmpty()) {
            CouponDTO coupon = couponDAO.findCouponByCode(appliedCouponCode);
            if (coupon.getDiscountType().equals("PERCENTAGE")) {
                couponDiscount = (int) ((subTotalAmount - promotionDiscount) * coupon.getDiscountValue() / 100.0);
            }
            else {
                couponDiscount = coupon.getDiscountValue();
            }
        }
        int totalDiscount = promotionDiscount + couponDiscount;
        if (totalDiscount > subTotalAmount) {
            totalDiscount = subTotalAmount;
        }

        order.setSubTotalAmount(subTotalAmount);
        order.setShippingFee(shippingFee);

        // 할인 관련 필드 설정
        order.setPromotionDiscountAmount(promotionDiscount);
        order.setCouponDiscountAmount(couponDiscount);
        order.setTotalDiscountAmount(totalDiscount);

        // 최종 결제 금액에 할인 반영
        order.setFinalAmount(subTotalAmount + shippingFee - totalDiscount);

        order.setStatus("PENDING");

        if (order.getRecipientDelivReqType() == null) {
            order.setRecipientDelivReqType("NONE");
        }

        orderDAO.insertOrder(order);
        String orderNo = orderDAO.findOrderNoById(order.getId());
        order.setOrderNo(orderNo);
        return order;
    }

    private void createOrderItems(int orderId, OrderRequestDTO pendingOrder) {
        if (pendingOrder.isMultiOrder()) {
            // 다중 상품
            for (OrderItemRequestDTO item : pendingOrder.getOrderItems()) {
                OrderItemDTO orderItem = new OrderItemDTO();
                orderItem.setProductId(item.getProductId());
                orderItem.setProductVariantId(item.getProductVariantId());
                orderItem.setQuantity(item.getQuantity());
                orderItem.setPriceAtPurchase(item.getPrice());
                orderItem.setTotalPriceAtPurchase(item.getPrice() * item.getQuantity());

                orderDAO.insertOrderItem(orderId, orderItem);
            }
        } else {
            // 단일 상품
            ProductVariantDTO variant = orderDAO.findProductVariantById(pendingOrder.getVariantId());

            OrderItemDTO orderItem = new OrderItemDTO();
            orderItem.setProductId(pendingOrder.getProductId());
            orderItem.setProductVariantId(pendingOrder.getVariantId());
            orderItem.setQuantity(pendingOrder.getQuantity());
            orderItem.setPriceAtPurchase(variant.getPrice());
            orderItem.setTotalPriceAtPurchase(variant.getPrice() * pendingOrder.getQuantity());

            orderDAO.insertOrderItem(orderId, orderItem);
        }
    }

    private int calculateSingleOrderAmount(OrderRequestDTO orderRequest) {
        ProductVariantDTO variant = orderDAO.findProductVariantById(orderRequest.getVariantId());
        return variant.getPrice() * orderRequest.getQuantity();
    }

    private int calculateMultiOrderAmount(OrderRequestDTO orderRequest) {
        int sum = 0;
        for (OrderItemRequestDTO item : orderRequest.getOrderItems()) {
            ProductVariantDTO variant = orderDAO.findProductVariantById(item.getProductVariantId());
            sum += variant.getPrice() * item.getQuantity();
        }
        return sum;
    }

    private int calculateSingleOrderPromotionDiscount(OrderRequestDTO pendingOrder) {
        int maxDiscountAmount = 0;
        ProductVariantDTO variant = orderDAO.findProductVariantById(pendingOrder.getVariantId());
        List<PromotionDTO> promotions = promotionDAO.findPromotionsByProductId(variant.getProductId());
        for (PromotionDTO promotion : promotions) {
            if (promotion.getIsActive() == true
                    && promotion.getStartDate().isBefore(LocalDateTime.now())
                    && promotion.getEndDate().isAfter(LocalDateTime.now())) {
                if (promotion.getDiscountType().equals("PERCENTAGE")) {
                    int discountAmount = (int) (promotion.getDiscountValue() * variant.getPrice() / 100.0);
                    if (promotion.getMaxDiscountAmount() != null && discountAmount > promotion.getMaxDiscountAmount()) {
                        discountAmount = promotion.getMaxDiscountAmount();
                    }
                    if (discountAmount > maxDiscountAmount) {
                        maxDiscountAmount = discountAmount;
                    }
                } else if (promotion.getDiscountType().equals("FIXED_AMOUNT")) {
                    int discountAmount = promotion.getDiscountValue();
                    if (promotion.getMaxDiscountAmount() != null && discountAmount > promotion.getMaxDiscountAmount()) {
                        discountAmount = promotion.getMaxDiscountAmount();
                    }
                    if (discountAmount > maxDiscountAmount) {
                        maxDiscountAmount = discountAmount;
                    }
                }
            }
        }
        return maxDiscountAmount * pendingOrder.getQuantity();
    }

    private int calculateMultiOrderPromotionDiscount(OrderRequestDTO pendingOrder) {
        int sumMaxDiscountAmount = 0;
        for (OrderItemRequestDTO item : pendingOrder.getOrderItems()) {
            int maxDiscountAmount = 0;
            ProductVariantDTO variant = orderDAO.findProductVariantById(item.getProductVariantId());
            List<PromotionDTO> promotions = promotionDAO.findPromotionsByProductId(variant.getProductId());
            for (PromotionDTO promotion : promotions) {
                if (promotion.getIsActive() == true
                        && promotion.getStartDate().isBefore(LocalDateTime.now())
                        && promotion.getEndDate().isAfter(LocalDateTime.now())) {
                    if (promotion.getDiscountType().equals("PERCENTAGE")) {
                        int discountAmount = (int) (promotion.getDiscountValue() * variant.getPrice() / 100.0);
                        if (promotion.getMaxDiscountAmount() != null && discountAmount > promotion.getMaxDiscountAmount()) {
                            discountAmount = promotion.getMaxDiscountAmount();
                        }
                        if (discountAmount > maxDiscountAmount) {
                            maxDiscountAmount = discountAmount;
                        }
                    } else if (promotion.getDiscountType().equals("FIXED_AMOUNT")) {
                        int discountAmount = promotion.getDiscountValue();
                        if (promotion.getMaxDiscountAmount() != null && discountAmount > promotion.getMaxDiscountAmount()) {
                            discountAmount = promotion.getMaxDiscountAmount();
                        }
                        if (discountAmount > maxDiscountAmount) {
                            maxDiscountAmount = discountAmount;
                        }
                    }
                }
            }
            sumMaxDiscountAmount += maxDiscountAmount * item.getQuantity();
        }
        return sumMaxDiscountAmount;
    }

    private GroupBuyParticipantDTO createGroupBuyParticipant(int userId, GroupBuyJoinRequestDTO pendingGroupBuy, GroupBuyExecuteRequestDTO executeRequest) {
        GroupBuyParticipantDTO participant = new GroupBuyParticipantDTO();
        participant.setGroupBuyId(pendingGroupBuy.getGroupBuyId());
        participant.setUserId(userId);
        participant.setQuantity(pendingGroupBuy.getQuantity());

        GroupBuyDTO groupBuy = orderDAO.findGroupBuyById(pendingGroupBuy.getGroupBuyId());
        int totalAmount = groupBuy.getGroupPrice() * pendingGroupBuy.getQuantity();
        participant.setPaidAmount(totalAmount);

        participant.setStatus("PAID");

        participant.setRecipientName(executeRequest.getRecipientName());
        participant.setRecipientPhone(executeRequest.getRecipientPhone());
        participant.setRecipientAddress(executeRequest.getRecipientAddress());
        participant.setRecipientAddressDetail(executeRequest.getRecipientAddressDetail());
        participant.setRecipientZipcode(executeRequest.getRecipientZipcode());
        participant.setRecipientDelivReqType(executeRequest.getRecipientDelivReqType());
        participant.setRecipientDelivReqMsg(executeRequest.getRecipientDelivReqMsg());

        if (participant.getRecipientPhone() == null || participant.getRecipientPhone().trim().isEmpty()) {
            // 사용자 정보에서 전화번호 가져오기
            UserDTO user = userDAO.findById(participant.getUserId());
            participant.setRecipientPhone(user.getPhone() != null ? user.getPhone() : "010-0000-0000");
        }

        if (participant.getRecipientName() == null || participant.getRecipientName().trim().isEmpty()) {
            // 사용자 정보에서 이름 가져오기
            UserDTO user = userDAO.findById(participant.getUserId());
            participant.setRecipientName(user.getName() != null ? user.getName() : "미입력");
        }

        if (participant.getRecipientAddress() == null || participant.getRecipientAddress().trim().isEmpty()) {
            participant.setRecipientAddress("배송지 미입력");
        }

        if (participant.getRecipientZipcode() == null || participant.getRecipientZipcode().trim().isEmpty()) {
            participant.setRecipientZipcode("00000");
        }

        if (participant.getRecipientDelivReqType() == null || participant.getRecipientDelivReqType().trim().isEmpty()) {
            participant.setRecipientDelivReqType("NONE");
        }
        orderDAO.insertGroupBuyParticipant(participant);
        return participant;
    }

    private PaymentDTO processPayment(OrderDTO order, String paymentMethod) {
        PaymentDTO payment = new PaymentDTO();
        payment.setOrderId(order.getId());
        payment.setPaymentMethodType(paymentMethod);
        payment.setAmount(order.getFinalAmount());
        payment.setStatus("COMPLETED");
        payment.setPaidAt(LocalDateTime.now());

        orderDAO.insertPayment(payment);
        return payment;
    }

    private PaymentDTO processGroupBuyPayment(GroupBuyParticipantDTO participant, String paymentMethod) {
        PaymentDTO payment = new PaymentDTO();
        payment.setGroupBuyParticipantId(participant.getId());
        payment.setPaymentMethodType(paymentMethod);
        payment.setAmount(participant.getPaidAmount());
        payment.setStatus("COMPLETED");
        payment.setPaidAt(LocalDateTime.now());

        orderDAO.insertGroupBuyPayment(payment);
        return payment;
    }

    private void updateProductStocks(OrderRequestDTO pendingOrder) {
        if (pendingOrder.isMultiOrder()) {
            for (OrderItemRequestDTO item : pendingOrder.getOrderItems()) {
                orderDAO.decreaseProductStock(item.getProductVariantId(), item.getQuantity());
            }
        } else {
            orderDAO.decreaseProductStock(pendingOrder.getVariantId(), pendingOrder.getQuantity());
        }
    }

    private void updateGroupBuyCurrentQuantity(Integer groupBuyId, int quantity) {
        orderDAO.increaseGroupBuyQuantity(groupBuyId, quantity);
    }

    private String generateOrderNo() {
        return "ORD" + System.currentTimeMillis();
    }

    /**
     * 결제 정보 상세 처리 (결제 방법별 추가 정보 저장)
     */
    private void processPaymentDetails(PaymentDTO payment, Map<String, Object> paymentInfo, String paymentMethod) {
        if (paymentInfo == null || paymentInfo.isEmpty()) {
            return;
        }

        // 결제 방법별 상세 정보 처리
        switch (paymentMethod) {
            case "CREDIT_CARD":
                processCreditCardPayment(payment, paymentInfo);
                break;
            case "BANK_TRANSFER":
                processBankTransferPayment(payment, paymentInfo);
                break;
            case "VIRTUAL_ACCOUNT":
                processVirtualAccountPayment(payment, paymentInfo);
                break;
            case "MOBILE_PAYMENT":
                processMobilePayment(payment, paymentInfo);
                break;
        }
    }

    /**
     * 신용카드 결제 처리
     */
    private void processCreditCardPayment(PaymentDTO payment, Map<String, Object> paymentInfo) {
        // 실제로는 PG사 API 연동
        // 여기서는 시뮬레이션

        String cardNumber = (String) paymentInfo.get("cardNumber");
        String cardholderName = (String) paymentInfo.get("cardholderName");

        // 카드 번호 마스킹
        String maskedCardNumber = maskCardNumber(cardNumber);

        // 승인번호 생성 (실제로는 PG사에서 받음)
        String approvalNumber = generateApprovalNumber();

        payment.setApprovalNumber(approvalNumber);
        payment.setCardCompany(getCardCompany(cardNumber));
        payment.setPaymentDetails(String.format("카드결제 - %s (**** **** **** %s)",
                cardholderName, maskedCardNumber.substring(maskedCardNumber.length() - 4)));
    }

    /**
     * 계좌이체 결제 처리
     */
    private void processBankTransferPayment(PaymentDTO payment, Map<String, Object> paymentInfo) {
        String bankName = (String) paymentInfo.get("bankName");
        String accountHolder = (String) paymentInfo.get("accountHolder");

        // 거래번호 생성
        String transactionId = generateTransactionId();

        payment.setTransactionId(transactionId);
        payment.setPaymentDetails(String.format("계좌이체 - %s (%s)", bankName, accountHolder));
    }

    /**
     * 가상계좌 결제 처리
     */
    private void processVirtualAccountPayment(PaymentDTO payment, Map<String, Object> paymentInfo) {
        String depositorName = (String) paymentInfo.get("depositorName");

        // 가상계좌 발급 (실제로는 PG사 API 연동)
        String virtualAccount = generateVirtualAccount();

        payment.setPaymentDetails(String.format("가상계좌 - %s (입금자: %s)", virtualAccount, depositorName));
        payment.setStatus("PENDING"); // 가상계좌는 입금 대기 상태
    }

    /**
     * 휴대폰 결제 처리
     */
    private void processMobilePayment(PaymentDTO payment, Map<String, Object> paymentInfo) {
        String carrier = (String) paymentInfo.get("carrier");
        String mobileNumber = (String) paymentInfo.get("mobileNumber");
        String ownerName = (String) paymentInfo.get("ownerName");

        // 휴대폰번호 마스킹
        String maskedNumber = maskPhoneNumber(mobileNumber);

        // 승인번호 생성
        String approvalNumber = generateApprovalNumber();

        payment.setApprovalNumber(approvalNumber);
        payment.setPaymentDetails(String.format("휴대폰결제 - %s %s (%s)", carrier, maskedNumber, ownerName));
    }

    /**
     * 카드번호 마스킹
     */
    private String maskCardNumber(String cardNumber) {
        if (cardNumber == null || cardNumber.length() < 4) {
            return "****";
        }
        return "**** **** **** " + cardNumber.substring(cardNumber.length() - 4);
    }

    /**
     * 휴대폰번호 마스킹
     */
    private String maskPhoneNumber(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.length() < 4) {
            return "***-****-****";
        }
        return phoneNumber.substring(0, 3) + "-****-" + phoneNumber.substring(phoneNumber.length() - 4);
    }

    /**
     * 카드사 판별
     */
    private String getCardCompany(String cardNumber) {
        if (cardNumber == null || cardNumber.length() < 4) {
            return "UNKNOWN";
        }

        String prefix = cardNumber.substring(0, 4);

        // 간단한 카드사 판별 로직 (실제로는 더 복잡)
        if (prefix.startsWith("4")) return "VISA";
        if (prefix.startsWith("5")) return "MASTERCARD";
        if (prefix.startsWith("35")) return "JCB";
        if (prefix.startsWith("62")) return "UNIONPAY";

        return "DOMESTIC"; // 국내 카드사
    }

    /**
     * 승인번호 생성
     */
    private String generateApprovalNumber() {
        return "APP" + System.currentTimeMillis();
    }

    /**
     * 거래번호 생성
     */
    private String generateTransactionId() {
        return "TXN" + System.currentTimeMillis();
    }

    /**
     * 가상계좌 번호 생성
     */
    private String generateVirtualAccount() {
        // 실제로는 PG사에서 발급받은 가상계좌 번호
        return "3020000" + String.format("%07d", (int)(Math.random() * 10000000));
    }


    // 기존 createGroupBuyParticipant 메소드 사용 (시그니처 변경 없음)
    public void createGroupBuyParticipant(GroupBuyParticipantDTO participant) {
        try {
            // 필수 배송 정보가 없는 경우 기본값 설정
            setDefaultDeliveryInfo(participant);

            // 공동구매 참여자 정보 저장
            orderDAO.insertGroupBuyParticipant(participant);

        } catch (Exception e) {
            log.error("공동구매 참여자 생성 중 오류 발생", e);
            throw new RuntimeException("공동구매 참여 처리 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }

    // 공동구매 성공 여부 확인
    private boolean isGroupBuySuccessful(int groupBuyId) {
        try {
            Boolean result = orderDAO.isGroupBuySuccessful(groupBuyId);
            return result != null && result;
        } catch (Exception e) {
            log.error("공동구매 성공 여부 확인 중 오류 발생", e);
            return false;
        }
    }

    // 공동구매 참여자의 order_id 업데이트
    private void updateGroupBuyParticipantOrderId(int participantId, int orderId) {
        try {
            Map<String, Object> params = new HashMap<>();
            params.put("id", participantId);
            params.put("orderId", orderId);

            orderDAO.updateGroupBuyParticipantOrderId(params);

        } catch (Exception e) {
            log.error("공동구매 참여자 주문 ID 업데이트 중 오류 발생", e);
            throw new RuntimeException("참여자 정보 업데이트 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }

    // 공동구매 결제 처리 (성공 시)
    private void processGroupBuyPayment(GroupBuyParticipantDTO participant, int orderId) {
        try {
            PaymentDTO payment = createPaymentFromParticipant(participant, orderId);
            orderDAO.insertPayment(payment);
            System.out.println("!!!!!!!" + payment);

        } catch (Exception e) {
            log.error("공동구매 결제 처리 중 오류 발생", e);
            throw new RuntimeException("결제 처리 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }

    // 공동구매 실패 시 결제 처리 (환불 등)
    private void processGroupBuyFailurePayment(GroupBuyParticipantDTO participant) {
        try {
            // 공동구매 실패 시 환불 처리
            log.info("공동구매 실패로 인한 환불 처리: 참여자 ID = {}", participant.getId());

            // 참여자 상태를 REFUNDED로 변경
            participant.setStatus("REFUNDED");
            orderDAO.updateGroupBuyParticipantStatus(participant);

            // 실제 환불 처리는 결제 서비스나 별도 환불 로직에서 처리
            // 여기서는 상태만 변경

        } catch (Exception e) {
            log.error("공동구매 실패 결제 처리 중 오류 발생", e);
            throw new RuntimeException("환불 처리 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }

    // 배송 정보 기본값 설정
    private void setDefaultDeliveryInfo(GroupBuyParticipantDTO participant) {
        try {
            if (participant.getRecipientPhone() == null || participant.getRecipientPhone().trim().isEmpty()) {
                UserDTO user = userDAO.findById(participant.getUserId());
                participant.setRecipientPhone(user.getPhone() != null ? user.getPhone() : "010-0000-0000");
            }

            if (participant.getRecipientName() == null || participant.getRecipientName().trim().isEmpty()) {
                UserDTO user = userDAO.findById(participant.getUserId());
                participant.setRecipientName(user.getName() != null ? user.getName() : "미입력");
            }

            if (participant.getRecipientAddress() == null || participant.getRecipientAddress().trim().isEmpty()) {
                participant.setRecipientAddress("배송지 미입력");
            }

            if (participant.getRecipientZipcode() == null || participant.getRecipientZipcode().trim().isEmpty()) {
                participant.setRecipientZipcode("00000");
            }

            if (participant.getRecipientDelivReqType() == null || participant.getRecipientDelivReqType().trim().isEmpty()) {
                participant.setRecipientDelivReqType("NONE");
            }

        } catch (Exception e) {
            log.error("배송 정보 기본값 설정 중 오류 발생", e);
            // 기본값 설정 실패 시에도 진행하되 로그만 남김
        }
    }

    private void setPaymentDetails(PaymentDTO payment, String paymentMethod) {
        // 결제 방법별 세부 정보 설정
        switch (paymentMethod) {
            case "CREDIT_CARD":
                payment.setCardCompany("신한카드");
                payment.setInstallmentMonths("일시불");
                payment.setCardIssuer(payment.getCardCompany());
                break;
            case "BANK_TRANSFER":
                payment.setCardCompany(null);
                payment.setInstallmentMonths(null);
                break;
            case "MOBILE_PAYMENT":
                payment.setCardCompany("카카오페이");
                payment.setInstallmentMonths(null);
                break;
        }

        // 승인번호와 거래 ID 생성
        payment.setApprovalNumber(String.valueOf(System.currentTimeMillis() % 100000000));
        payment.setTransactionId("TXN" + System.currentTimeMillis());
        payment.setPaymentDetails(paymentMethod + " 결제 완료");
    }

    @Transactional
    public void confirmOrder(String orderNo) {
        OrderDTO order = orderDAO.findOrderDetailsByOrderNo(orderNo);
        orderDAO.setOrderConfirmed(order.getId());
        List<OrderItemDTO> orderItems = orderDAO.findOrderItemsByOrderId(order.getId());
        for (OrderItemDTO orderItem : orderItems) {
            orderDAO.setOrderItemConfirmed(orderItem.getId());
        }
//        List<GroupBuyParticipantDTO> participants = orderDAO.findGroupBuyParticipantByOrderId(order.getId());
//        for (GroupBuyParticipantDTO participant : participants) {
//            orderDAO.setGroupBuyPartConfirmed(participant.getId());
//        }
    }

    @Transactional(readOnly = true)
    public Integer findShippingCost(Integer productId) {
        return orderDAO.findShippingCost(productId);
    }
}