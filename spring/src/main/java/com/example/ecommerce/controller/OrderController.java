package com.example.ecommerce.controller;

import com.example.ecommerce.dto.*;
import com.example.ecommerce.service.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import javax.servlet.http.HttpSession;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;

@Controller
@RequiredArgsConstructor
@Slf4j
public class OrderController {

    Logger logger = LoggerFactory.getLogger(OrderController.class);

    private final FileUploadService fileUploadService;
    private final OrderService orderService;
    private final CartService cartService;
    private final CouponService couponService;
    private final ShippingAddressService shippingAddressService;
    private final GroupBuyService groupBuyService;
    private final AfterSalesService afterSalesService;
    private final ReviewService reviewService;

    /**
     * 주문 상세 정보 조회
     */
    @GetMapping("/api/user/orders/{orderNo}/detail")
    @ResponseBody
    public ResponseEntity<OrderDTO> getOrderDetail(
            @PathVariable String orderNo,
            @AuthenticationPrincipal UserDTO user) {

        try {
            OrderDTO orderDetail = orderService.getOrderDetailForUser(user.getId(), orderNo);
            return ResponseEntity.ok(orderDetail);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/api/orders/{orderNo}/confirm")
    @ResponseBody
    public ResponseEntity<?> confirmOrder(@AuthenticationPrincipal UserDTO userDTO, @PathVariable String orderNo) {
        if (orderService.getOrderDetailForUser(userDTO.getId(), orderNo) == null) {
            return ResponseEntity.notFound().build();
        }
        orderService.confirmOrder(orderNo);
        return ResponseEntity.ok().build();
    }

    /**
     * 단일 상품 구매 - 주문서 작성 페이지로 이동
     */
    @PostMapping("/order/create")
    public String createSingleOrder(@ModelAttribute OrderRequestDTO orderRequest,
                                    @AuthenticationPrincipal UserDTO userDTO,
                                    HttpSession session,
                                    RedirectAttributes redirectAttributes) {

        if (userDTO == null) {
            redirectAttributes.addAttribute("returnUrl", "/order/create");
            return "redirect:/login";
        }

        try {
            // 단일 상품 주문 유효성 검사
            validateSingleOrderRequest(orderRequest);

            // 주문 타입 설정
            orderRequest.setOrderType("SINGLE");

            // 배송비
            orderRequest.setShippingCost(orderService.findShippingCost(orderRequest.getProductId()));

            // 세션에 주문 정보 임시 저장
            session.setAttribute("pendingOrder", orderRequest);

            log.info("단일 상품 주문 생성 - 사용자: {}, 상품: {}, 수량: {}",
                    userDTO.getId(), orderRequest.getProductId(), orderRequest.getQuantity());

            return "redirect:/order/checkout";

        } catch (IllegalArgumentException e) {
            log.info("단일 상품 주문 생성 실패: {}", e.getMessage());
            redirectAttributes.addFlashAttribute("error", e.getMessage());
            return "redirect:/products/" + orderRequest.getProductId();
        } catch (Exception e) {
            log.info("단일 상품 주문 생성 중 예상치 못한 오류: ", e);
            redirectAttributes.addFlashAttribute("error", "주문 처리 중 오류가 발생했습니다. 다시 시도해주세요.");
            return "redirect:/products/" + orderRequest.getProductId();
        }
    }

    /**
     * 장바구니에서 다중 상품 구매 - 주문서 작성 페이지로 이동
     */
    @PostMapping("/order/create/cart")
    public String createCartOrder(@RequestParam("cartItemIds") List<Integer> cartItemIds,
                                  @AuthenticationPrincipal UserDTO userDTO,
                                  HttpSession session,
                                  RedirectAttributes redirectAttributes) {

        if (userDTO == null) {
            redirectAttributes.addAttribute("returnUrl", "/cart");
            return "redirect:/login";
        }

        try {
            if (cartItemIds == null || cartItemIds.isEmpty()) {
                throw new IllegalArgumentException("선택된 상품이 없습니다.");
            }

            // 선택된 장바구니 아이템들을 OrderRequestDTO로 변환
            OrderRequestDTO multiOrderRequest = orderService.createOrderRequestFromCart(userDTO.getId(), cartItemIds);
            multiOrderRequest.setOrderType("MULTI");

            session.setAttribute("pendingOrder", multiOrderRequest);
            session.setAttribute("selectedCartItemIds", cartItemIds);

            log.info("장바구니 주문 생성 - 사용자: {}, 아이템 수: {}",
                    userDTO.getId(), cartItemIds.size());

            return "redirect:/order/checkout";

        } catch (IllegalArgumentException e) {
            log.error("장바구니 주문 생성 실패: {}", e.getMessage());
            redirectAttributes.addFlashAttribute("error", e.getMessage());
            return "redirect:/cart";
        } catch (Exception e) {
            log.error("장바구니 주문 생성 중 예상치 못한 오류: ", e);
            redirectAttributes.addFlashAttribute("error", "주문 처리 중 오류가 발생했습니다. 다시 시도해주세요.");
            return "redirect:/cart";
        }
    }

    /**
     * 공동구매 주문 생성 - 주문서 작성 페이지로 이동
     */
    @PostMapping("/order/create/groupbuy")
    public String createGroupBuyOrder(@ModelAttribute GroupBuyJoinRequestDTO joinRequest,
                                      @AuthenticationPrincipal UserDTO userDTO,
                                      HttpSession session,
                                      RedirectAttributes redirectAttributes) {

        if (userDTO == null) {
            redirectAttributes.addAttribute("returnUrl", "/groupbuy/" + joinRequest.getGroupBuyId());
            return "redirect:/login";
        }

        try {
            // 공동구매 참여 유효성 검사
            validateGroupBuyRequest(joinRequest);

            // 세션에 공동구매 정보 임시 저장
            session.setAttribute("pendingGroupBuy", joinRequest);

            log.info("공동구매 주문 생성 - 사용자: {}, 공동구매: {}, 수량: {}",
                    userDTO.getId(), joinRequest.getGroupBuyId(), joinRequest.getQuantity());

            return "redirect:/order/checkout";

        } catch (IllegalArgumentException e) {
            log.error("공동구매 주문 생성 실패: {}", e.getMessage());
            redirectAttributes.addFlashAttribute("error", e.getMessage());
            return "redirect:/groupbuy/" + joinRequest.getGroupBuyId();
        } catch (Exception e) {
            log.error("공동구매 주문 생성 중 예상치 못한 오류: ", e);
            redirectAttributes.addFlashAttribute("error", "공동구매 처리 중 오류가 발생했습니다. 다시 시도해주세요.");
            return "redirect:/groupbuy/" + joinRequest.getGroupBuyId();
        }
    }

    /**
     * 주문서 작성 페이지 (통합 - 단일/다중/공동구매)
     */
    @GetMapping("/order/checkout")
    public String checkoutForm(HttpSession session,
                               @AuthenticationPrincipal UserDTO userDTO,
                               Model model,
                               RedirectAttributes redirectAttributes) {

        if (userDTO == null) {
            return "redirect:/login";
        }

        // 세션에서 주문 정보 가져오기
        OrderRequestDTO pendingOrder = (OrderRequestDTO) session.getAttribute("pendingOrder");
        GroupBuyJoinRequestDTO pendingGroupBuy = (GroupBuyJoinRequestDTO) session.getAttribute("pendingGroupBuy");

        if (pendingOrder == null && pendingGroupBuy == null) {
            redirectAttributes.addFlashAttribute("error", "주문 정보가 없습니다.");
            log.error("주문서 작성 페이지 오류: null");
            return "redirect:/";
        }

        try {
            String orderType;
            OrderDTO checkoutData;

            if (pendingGroupBuy != null) {
                // 공동구매 주문서
                orderType = "groupbuy";
                checkoutData = orderService.getGroupBuyCheckoutData(userDTO.getId(), pendingGroupBuy);
            } else {
                // 일반 주문서 (단일/다중)
                orderType = pendingOrder.isMultiOrder() ? "multi" : "single";
                checkoutData = orderService.getCheckoutFormData(userDTO.getId(), pendingOrder);
            }
            ObjectMapper objectMapper = new ObjectMapper();
            objectMapper.writeValue(System.out, checkoutData);

            // 사용자의 배송지 목록 조회
            List<ShippingAddressDTO> addresses = shippingAddressService.list(userDTO.getId());

            // 사용 가능한 쿠폰 조회 (공동구매가 아닌 경우)
            List<UserCouponDTO> availableCoupons = new ArrayList<>();
            if (!"groupbuy".equals(orderType)) {
                int estimatedAmount = pendingOrder != null ?
                        orderService.calculateEstimatedAmount(pendingOrder) : 0;
                if (estimatedAmount > 0) {
                    availableCoupons = couponService.getAvailableCoupons(userDTO.getId(), estimatedAmount);
                }
            }

            // 모델에 데이터 추가
            model.addAttribute("checkoutData", checkoutData);
            model.addAttribute("orderType", orderType);
            model.addAttribute("shippingAddresses", addresses);
            model.addAttribute("availableCoupons", availableCoupons);

            log.info("주문서 작성 페이지 로드 - 사용자: {}, 주문타입: {}", userDTO.getId(), orderType);

            return "order/checkout";

        } catch (Exception e) {
            log.error("주문서 작성 페이지 오류: ", e);
            redirectAttributes.addFlashAttribute("error", "주문서 작성 중 오류가 발생했습니다.");
            return "redirect:/";
        }
    }

    /**
     * 주문 실행 (결제 처리 및 주문 생성) - AJAX 요청
     */
    @PostMapping("/order/execute")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> executeOrder(@RequestBody OrderExecuteRequestDTO executeRequest,
                                                            HttpSession session,
                                                            @AuthenticationPrincipal UserDTO userDTO) {
        Map<String, Object> response = new HashMap<>();

        if (userDTO == null) {
            response.put("success", false);
            response.put("message", "로그인이 필요합니다.");
            return ResponseEntity.ok(response);
        }

        try {
            // 세션에서 주문 정보 가져오기
            OrderRequestDTO pendingOrder = (OrderRequestDTO) session.getAttribute("pendingOrder");
            GroupBuyJoinRequestDTO pendingGroupBuy = (GroupBuyJoinRequestDTO) session.getAttribute("pendingGroupBuy");

            if (pendingOrder == null && pendingGroupBuy == null) {
                response.put("success", false);
                response.put("message", "주문 정보가 없습니다.");
                return ResponseEntity.ok(response);
            }

            if (pendingGroupBuy != null) {
                // 공동구매 실행
                GroupBuyExecuteRequestDTO groupBuyExecuteRequest = createGroupBuyExecuteRequest(executeRequest);

                // GroupBuyParticipantDTO 생성
                GroupBuyParticipantDTO participantDTO = createGroupBuyParticipantDTO(userDTO.getId(), pendingGroupBuy, groupBuyExecuteRequest);

                // 공동구매 실행 - 올바른 시그니처로 호출
                orderService.executeGroupBuy(participantDTO);

                // 세션 정리
                cleanupOrderSession(session);

                response.put("success", true);
                response.put("orderNo", "GB" + participantDTO.getId()); // 공동구매용 주문번호
                response.put("participantId", participantDTO.getId());

                log.info("공동구매 실행 완료 - 사용자: {}, 참여자ID: {}", userDTO.getId(), participantDTO.getId());

            } else {
                // 실행 요청에서 주문 정보 업데이트
                updateOrderWithExecuteRequest(pendingOrder, null, executeRequest);

                // 일반 주문 실행
                OrderDTO result = orderService.executeOrder(userDTO.getId(), pendingOrder);
                if (pendingOrder.getAppliedCouponCode() != null)
                    couponService.setUserCouponUsed(userDTO.getId(), pendingOrder.getAppliedCouponCode());

                // 장바구니 아이템 삭제 (다중 주문인 경우)
                if (pendingOrder.isMultiOrder()) {
                    List<Integer> selectedCartItemIds = (List<Integer>) session.getAttribute("selectedCartItemIds");
                    if (selectedCartItemIds != null && !selectedCartItemIds.isEmpty()) {
                        cartService.removeCartItems(userDTO.getId(), selectedCartItemIds);
                    }
                }

                // 세션 정리
                cleanupOrderSession(session);

                response.put("success", true);
                response.put("orderNo", result.getOrderNo());
                response.put("orderId", result.getId());

                log.info("주문 실행 완료 - 사용자: {}, 주문번호: {}", userDTO.getId(), result.getOrderNo());
            }

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            e.printStackTrace();
            log.error("주문 실행 중 오류 발생", e);
            response.put("success", false);
            response.put("message", "주문 처리 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.ok(response);
        }
    }

    /**
     * GroupBuyParticipantDTO 생성
     */
    private GroupBuyParticipantDTO createGroupBuyParticipantDTO(int userId, GroupBuyJoinRequestDTO pendingGroupBuy, GroupBuyExecuteRequestDTO executeRequest) {
        // 공동구매 정보 조회
        GroupBuyDTO groupBuy = groupBuyService.getGroupBuyDetails(pendingGroupBuy.getGroupBuyId());
        if (groupBuy == null) {
            throw new IllegalArgumentException("존재하지 않는 공동구매입니다.");
        }

        GroupBuyParticipantDTO participant = new GroupBuyParticipantDTO();
        participant.setGroupBuyId(pendingGroupBuy.getGroupBuyId());
        participant.setUserId(userId);
        participant.setQuantity(pendingGroupBuy.getQuantity());

        // 결제 금액 계산
        int totalAmount = groupBuy.getGroupPrice() * pendingGroupBuy.getQuantity();
        participant.setPaidAmount(totalAmount);
        participant.setStatus("PAID");

        System.out.println(executeRequest);
        System.out.println(pendingGroupBuy);

        // 배송지 정보 설정
        participant.setRecipientName(executeRequest.getRecipientName());
        participant.setRecipientPhone(executeRequest.getRecipientPhone());
        participant.setRecipientAddress(executeRequest.getRecipientAddress());
        participant.setRecipientAddressDetail(executeRequest.getRecipientAddressDetail());
        participant.setRecipientZipcode(executeRequest.getRecipientZipcode());
        participant.setRecipientDelivReqType(executeRequest.getRecipientDelivReqType());
        participant.setRecipientDelivReqMsg(executeRequest.getRecipientDelivReqMsg());

        // 결제 정보 설정
        participant.setPaymentMethod(executeRequest.getPaymentMethod());

        // 기타 금액 정보 설정 (사이드바용)
        participant.setSubTotalAmount(totalAmount);
        participant.setShippingFee(0); // 공동구매는 무료배송
        participant.setFinalAmount(totalAmount);

        return participant;
    }

    /**
     * 주문 완료 페이지
     */
    @GetMapping("/order/complete/{orderNo}")
    public String orderComplete(@PathVariable String orderNo,
                                @AuthenticationPrincipal UserDTO userDTO,
                                Model model,
                                RedirectAttributes redirectAttributes) {

        if (userDTO == null) {
            return "redirect:/login";
        }

        try {
            OrderDTO completeData;
            String orderType;
            GroupBuyParticipantDTO groupBuyData = null;

            // 공동구매 주문번호인지 확인 (GB로 시작)
            if (orderNo.startsWith("GB")) {
                Integer participantId = Integer.parseInt(orderNo.substring(2));
                groupBuyData = orderService.getGroupBuyCompleteData(userDTO.getId(), participantId);

                // GroupBuyParticipantDTO를 OrderDetailDTO로 변환 (완료 페이지 호환성을 위해)
                completeData = convertGroupBuyToOrderDetail(groupBuyData);
                orderType = "groupbuy";
            } else {
                completeData = orderService.getOrderDetailForUser(userDTO.getId(), orderNo);
                orderType = completeData.getIsGroupBuy() ? "groupbuy" :
                        (completeData.getItems().size() > 1 ? "multi" : "single");
            }

            model.addAttribute("completeData", completeData);
            model.addAttribute("orderType", orderType);
            model.addAttribute("groupBuyData", groupBuyData);

            log.info("주문 완료 페이지 로드 - 사용자: {}, 주문번호: {}", userDTO.getId(), orderNo);

            return "order/complete";

        } catch (Exception e) {
            log.error("주문 완료 페이지 오류: ", e);
            redirectAttributes.addFlashAttribute("error", "주문 정보를 찾을 수 없습니다.");
            return "redirect:/user/orders";
        }
    }

    /**
     * 사용 가능한 쿠폰 조회 (AJAX)
     */
    @GetMapping("/api/order/coupons/available")
    @ResponseBody
    public ResponseEntity<List<UserCouponDTO>> getAvailableCoupons(
            @RequestParam Integer totalAmount,
            @AuthenticationPrincipal UserDTO userDTO) {

        if (userDTO == null) {
            return ResponseEntity.ok(Collections.emptyList());
        }

        try {
            List<UserCouponDTO> availableCoupons = couponService.getAvailableCoupons(userDTO.getId(), totalAmount);
            return ResponseEntity.ok(availableCoupons);
        } catch (Exception e) {
            log.error("사용 가능한 쿠폰 조회 오류: ", e);
            return ResponseEntity.ok(Collections.emptyList());
        }
    }

    /**
     * 배송지 목록 조회 (AJAX)
     */
    @GetMapping("/api/order/addresses")
    @ResponseBody
    public ResponseEntity<List<ShippingAddressDTO>> getShippingAddresses(@AuthenticationPrincipal UserDTO userDTO) {

        if (userDTO == null) {
            return ResponseEntity.ok(Collections.emptyList());
        }

        try {
            List<ShippingAddressDTO> addresses = shippingAddressService.list(userDTO.getId());
            return ResponseEntity.ok(addresses);
        } catch (Exception e) {
            log.error("배송지 목록 조회 오류: ", e);
            return ResponseEntity.ok(Collections.emptyList());
        }
    }

    /**
     * 주문 취소 (AJAX)
     */
    @PostMapping("/api/orders/{orderNo}/cancel")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> cancelOrder(@PathVariable String orderNo,
                                                           @AuthenticationPrincipal UserDTO userDTO) {
        Map<String, Object> response = new HashMap<>();

        if (userDTO == null) {
            response.put("success", false);
            response.put("message", "로그인이 필요합니다.");
            return ResponseEntity.ok(response);
        }

        try {
            boolean result = cancelOrderByOrderNo(userDTO.getId(), orderNo);

            if (result) {
                response.put("success", true);
                response.put("message", "주문이 취소되었습니다.");
            } else {
                response.put("success", false);
                response.put("message", "주문 취소에 실패했습니다.");
            }

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("주문 취소 오류: ", e);
            response.put("success", false);
            response.put("message", "주문 취소 중 오류가 발생했습니다.");
            return ResponseEntity.ok(response);
        }
    }

    // ===== 유틸리티 메서드들 =====

    /**
     * 단일 상품 주문 요청 유효성 검사
     */
    private void validateSingleOrderRequest(OrderRequestDTO orderRequest) {
        if (orderRequest.getProductId() == null) {
            throw new IllegalArgumentException("상품 ID가 필요합니다.");
        }
        if (orderRequest.getQuantity() == null || orderRequest.getQuantity() <= 0) {
            throw new IllegalArgumentException("유효한 수량을 입력해주세요.");
        }
        if (orderRequest.getVariantId() == null) {
            throw new IllegalArgumentException("상품 옵션을 선택해주세요.");
        }
    }

    /**
     * 공동구매 요청 유효성 검사
     */
    private void validateGroupBuyRequest(GroupBuyJoinRequestDTO joinRequest) {
        if (joinRequest.getGroupBuyId() == null) {
            throw new IllegalArgumentException("공동구매 ID가 필요합니다.");
        }
        if (joinRequest.getQuantity() == null || joinRequest.getQuantity() <= 0) {
            throw new IllegalArgumentException("유효한 수량을 입력해주세요.");
        }
    }

    /**
     * 실행 요청으로 주문 정보 업데이트
     */
    private void updateOrderWithExecuteRequest(OrderRequestDTO pendingOrder, GroupBuyJoinRequestDTO pendingGroupBuy, OrderExecuteRequestDTO executeRequest) {
        if (pendingOrder != null) {
            // 배송지 정보 업데이트
            if (executeRequest.getShippingAddressId() != null && executeRequest.getShippingAddressId() > 0) {
                ShippingAddressDTO address = shippingAddressService.getAddressById(executeRequest.getShippingAddressId());
                if (address != null) {
                    pendingOrder.setRecipientName(address.getRecipientName());
                    pendingOrder.setRecipientPhone(address.getRecipientPhone());
                    pendingOrder.setRecipientAddress(address.getAddress());
                    pendingOrder.setRecipientAddressDetail(address.getAddressDetail());
                    pendingOrder.setRecipientZipcode(address.getZipcode());
                }
            } else {
                pendingOrder.setRecipientName(executeRequest.getRecipientName());
                pendingOrder.setRecipientPhone(executeRequest.getRecipientPhone());
                pendingOrder.setRecipientAddress(executeRequest.getRecipientAddress());
                pendingOrder.setRecipientAddressDetail(executeRequest.getRecipientAddressDetail());
                pendingOrder.setRecipientZipcode(executeRequest.getRecipientZipcode());
            }

            pendingOrder.setShippingAddressId(executeRequest.getShippingAddressId());
            pendingOrder.setRecipientDelivReqType(executeRequest.getRecipientDelivReqType());
            pendingOrder.setRecipientDelivReqMsg(executeRequest.getRecipientDelivReqMsg());
            pendingOrder.setPaymentMethod(executeRequest.getPaymentMethod());
            pendingOrder.setAppliedCouponCode(executeRequest.getAppliedCouponCode());
            pendingOrder.setFinalAmount(executeRequest.getFinalAmount());
        }
    }

    /**
     * 공동구매 실행 요청 생성
     */
    private GroupBuyExecuteRequestDTO createGroupBuyExecuteRequest(OrderExecuteRequestDTO executeRequest) {
        GroupBuyExecuteRequestDTO groupBuyExecuteRequest = new GroupBuyExecuteRequestDTO();

        // 배송지 정보 복사
        if (executeRequest.getShippingAddressId() != null && executeRequest.getShippingAddressId() > 0) {
            ShippingAddressDTO address = shippingAddressService.getAddressById(executeRequest.getShippingAddressId());
            if (address != null) {
                groupBuyExecuteRequest.setRecipientName(address.getRecipientName());
                groupBuyExecuteRequest.setRecipientPhone(address.getRecipientPhone());
                groupBuyExecuteRequest.setRecipientAddress(address.getAddress());
                groupBuyExecuteRequest.setRecipientAddressDetail(address.getAddressDetail());
                groupBuyExecuteRequest.setRecipientZipcode(address.getZipcode());
            }
        } else {
            groupBuyExecuteRequest.setRecipientName(executeRequest.getRecipientName());
            groupBuyExecuteRequest.setRecipientPhone(executeRequest.getRecipientPhone());
            groupBuyExecuteRequest.setRecipientAddress(executeRequest.getRecipientAddress());
            groupBuyExecuteRequest.setRecipientAddressDetail(executeRequest.getRecipientAddressDetail());
            groupBuyExecuteRequest.setRecipientZipcode(executeRequest.getRecipientZipcode());
        }

        groupBuyExecuteRequest.setShippingAddressId(executeRequest.getShippingAddressId());
        groupBuyExecuteRequest.setRecipientDelivReqType(executeRequest.getRecipientDelivReqType());
        groupBuyExecuteRequest.setRecipientDelivReqMsg(executeRequest.getRecipientDelivReqMsg());
        groupBuyExecuteRequest.setPaymentMethod(executeRequest.getPaymentMethod());

        return groupBuyExecuteRequest;
    }

    /**
     * 공동구매 데이터를 주문 완료 페이지용으로 변환
     */
    private OrderDTO convertGroupBuyToOrderDetail(GroupBuyParticipantDTO groupBuyData) {
        OrderDTO orderDetail = new OrderDTO();

        orderDetail.setUserId(groupBuyData.getUserId());
        orderDetail.setOrderNo("GB" + groupBuyData.getId());
        orderDetail.setCreatedAt(LocalDateTime.from(groupBuyData.getJoinedAt().toInstant().atZone(ZoneId.systemDefault())));
        orderDetail.setStatus("PAID");
        orderDetail.setIsGroupBuy(true);

        orderDetail.setRecipientName(groupBuyData.getRecipientName());
        orderDetail.setRecipientPhone(groupBuyData.getRecipientPhone());
        orderDetail.setRecipientAddress(groupBuyData.getRecipientAddress());
        orderDetail.setRecipientAddressDetail(groupBuyData.getRecipientAddressDetail());
        orderDetail.setRecipientZipcode(groupBuyData.getRecipientZipcode());
        orderDetail.setRecipientDelivReqMsg(groupBuyData.getRecipientDelivReqMsg());

        orderDetail.setFinalAmount(groupBuyData.getPaidAmount());
        orderDetail.setSubTotalAmount(groupBuyData.getPaidAmount());
        orderDetail.setShippingFee(0);

        // 공동구매 관련 정보
        orderDetail.setGroupBuyId(groupBuyData.getGroupBuyId());
        orderDetail.setGroupBuyName(groupBuyData.getGroupBuyName());
        orderDetail.setProductName(groupBuyData.getProductName());
        orderDetail.setProductImageUrl(groupBuyData.getProductImageUrl());
        orderDetail.setQuantity(groupBuyData.getQuantity());

        return orderDetail;
    }

    /**
     * 주문 취소 처리 (주문번호 기준)
     */
    private boolean cancelOrderByOrderNo(int userId, String orderNo) {
        try {
            // 공동구매 주문인지 확인
            if (orderNo.startsWith("GB")) {
                Integer participantId = Integer.parseInt(orderNo.substring(2));
                GroupBuyParticipantDTO participant = orderService.getGroupBuyCompleteData(userId, participantId);

                if (participant == null) {
                    return false;
                }

                // 공동구매 취소 로직 (구현 필요)
                // return groupBuyService.cancelParticipation(participantId);
                return false; // 공동구매는 일반적으로 취소 불가
            } else {
                // 일반 주문 취소
                OrderDTO orderDetail = orderService.getOrderDetailForUser(userId, orderNo);

                if (orderDetail == null) {
                    return false;
                }

                // 취소 가능한 상태인지 확인
                if (!"PENDING".equals(orderDetail.getStatus()) && !"PAID".equals(orderDetail.getStatus())) {
                    return false;
                }

                // 주문 상태를 CANCELLED로 변경
                return orderService.updateOrderStatus(0, orderNo, "CANCELLED");
            }

        } catch (Exception e) {
            log.error("주문 취소 처리 중 오류: ", e);
            return false;
        }
    }

    /**
     * 세션 정리 (주문 완료 후)
     */
    private void cleanupOrderSession(HttpSession session) {
        session.removeAttribute("pendingOrder");
        session.removeAttribute("pendingGroupBuy");
        session.removeAttribute("groupBuyExecuteRequest");
        session.removeAttribute("selectedCartItemIds");

        log.debug("주문 관련 세션 정리 완료");
    }

///  추가
    /**
     * 개별 주문 아이템 구매 확정
     */
    @PostMapping("/api/orders/{orderNo}/items/{orderItemId}/confirm")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> confirmOrderItem(
            @PathVariable String orderNo,
            @PathVariable int orderItemId,
            @AuthenticationPrincipal UserDTO user) {

        try {
            orderService.confirmOrderItem(user.getId(), orderNo, orderItemId);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "구매가 확정되었습니다."
            ));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "권한이 없습니다."));
        } catch (Exception e) {
            logger.error("주문 아이템 구매 확정 실패: orderNo={}, orderItemId={}", orderNo, orderItemId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "서버 오류가 발생했습니다."));
        }
    }

    /**
     * 개별 주문 아이템 반품/교환 신청
     */
    @PostMapping(value = "/api/after-sales/item-requests", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseBody
    public ResponseEntity<Map<String, Object>> createItemAfterSalesRequest(
            @AuthenticationPrincipal UserDTO userDTO,
            @RequestParam String orderNo,
            @RequestParam int orderItemId,
            @RequestParam String requestType,
            @RequestParam String reason,
            @RequestParam String detail,
            @RequestParam(value = "images", required = false) List<MultipartFile> images) {

        try {
            // 주문 번호 존재 유무 확인
            OrderDTO order = orderService.getOrderDetails(orderNo);
            if (order.getUserId() != userDTO.getId()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("success", false, "message", "해당 주문에 대한 권한이 없습니다."));
            }

            // 주문 번호 검증
            OrderItemDTO orderItemDTO = null;
            for (OrderItemDTO orderItemDTOIter : order.getItems()) {
                if (orderItemDTOIter.getId() == orderItemId) {
                    orderItemDTO = orderItemDTOIter;
                    break;
                }
            }
            if (orderItemDTO == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("success", false, "message", "주문 번호가 틀렸습니다."));
            }

            if (!"DELIVERED".equals(orderItemDTO.getStatus())) {
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "message", "배송완료된 주문만 반품/교환 신청이 가능합니다."));
            }

            // 반품/교환 신청 DTO 생성
            AfterSalesRequestDTO requestDTO = new AfterSalesRequestDTO();
            requestDTO.setOrderId(order.getId());
            requestDTO.setUserId(userDTO.getId());
            requestDTO.setOrderNo(orderNo);
            AfterSalesRequestItemDTO afterSalesRequestItemDTO = new AfterSalesRequestItemDTO();
            afterSalesRequestItemDTO.setOrderItemId(orderItemId);
            afterSalesRequestItemDTO.setItemType(requestType);
            afterSalesRequestItemDTO.setQuantity(orderItemDTO.getQuantity());
            afterSalesRequestItemDTO.setReasonCode(reason);
            afterSalesRequestItemDTO.setReasonDetail(detail);
            afterSalesRequestItemDTO.setProductName(orderItemDTO.getProductName());
            requestDTO.setItems(List.of(afterSalesRequestItemDTO));
            requestDTO.setRequestType(requestType);
            requestDTO.setCustomerReason(reason);
            requestDTO.setCustomerComment(detail);
            requestDTO.setStatus("REQUESTED");

            // 4. 이미지 업로드 처리
            if (images != null && !images.isEmpty()) {
                List<String> imageUrls = fileUploadService.uploadAfterSalesImages(images);
                requestDTO.setCustomerImages(String.join(",", imageUrls));
            }

            // 반품/교환 신청 처리
            AfterSalesRequestDTO createdRequest = afterSalesService.createAfterSalesRequest(requestDTO);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "반품/교환 요청이 접수되었습니다.",
                    "requestId", createdRequest.getId(),
                    "requestNo", createdRequest.getRequestNo()
            ));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "권한이 없습니다."));
        } catch (Exception e) {
            logger.error("반품/교환 신청 실패: orderNo={}, orderItemId={}", orderNo, orderItemId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "서버 오류가 발생했습니다."));
        }
    }

    /**
     * 주문 아이템별 리뷰 작성 가능 여부 확인 (기존 메서드 수정)
     */
    @GetMapping("/api/orders/{orderNo}/items/{orderItemId}/review-availability")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> checkOrderItemReviewAvailability(
            @AuthenticationPrincipal UserDTO userDTO,
            @PathVariable String orderNo,
            @PathVariable int orderItemId) {

        try {
            // 주문 번호 존재 유무 확인
            OrderDTO order = orderService.getOrderDetails(orderNo);
            if (order.getUserId() != userDTO.getId()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("success", false, "message", "해당 주문에 대한 권한이 없습니다."));
            }

            // 주문 번호 검증
            OrderItemDTO orderItemDTO = null;
            for (OrderItemDTO orderItemDTOIter : order.getItems()) {
                if (orderItemDTOIter.getId() == orderItemId) {
                    orderItemDTO = orderItemDTOIter;
                    break;
                }
            }
            if (orderItemDTO == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("success", false, "message", "주문 번호가 틀렸습니다."));
            }

            ReviewDTO existingReview = reviewService.findReviewForOrderItem(orderItemId);

            return ResponseEntity.ok(Map.of(
                    "existingReview", existingReview
            ));

        } catch (Exception e) {
            logger.error("리뷰 작성 가능 여부 확인 중 오류 발생: orderItemId={}", orderItemId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "서버 오류가 발생했습니다."));
        }
    }

    @GetMapping("/api/orders/{orderNo}/detail")
    @ResponseBody
    public ResponseEntity<OrderDTO> checkOrderDetail(
            @AuthenticationPrincipal UserDTO userDTO,
            @PathVariable String orderNo
    ) {
        OrderDTO order = orderService.getOrderDetails(orderNo);
        if (order == null) {
            return ResponseEntity.notFound().build();
        }
        if (order.getUserId() != userDTO.getId()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(order);
    }

    /**
     * 모든 주문 목록을 조회합니다.
     */
    @GetMapping("/api/admin/orders")
    @ResponseBody
    public ResponseEntity<PageResult<OrderSummaryDTO>> getAllOrders(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam String keyword,
            @RequestParam String status) {
        PageResult<OrderSummaryDTO> result = orderService.getOrders(0, page, size, keyword, status, null, null);
        return ResponseEntity.ok(result);
    }

    /**
     * 특정 주문의 상세 정보를 조회합니다.
     */
    @GetMapping("/api/admin/orders/{orderNo}")
    @ResponseBody
    public ResponseEntity<OrderDTO> getOrderDetails(@PathVariable String orderNo) {
        OrderDTO details = orderService.getOrderDetails(orderNo);
        return ResponseEntity.ok(details);
    }

    /**
     * 판매자의 주문 목록을 조회합니다.
     */
    @GetMapping("/api/seller/orders")
    @ResponseBody
    public ResponseEntity<PageResult<OrderSummaryDTO>> getOrders(
            @AuthenticationPrincipal UserDTO seller,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        PageResult<OrderSummaryDTO> result = orderService.getOrders(seller.getId(), page, size, keyword, status, startDate, endDate);
        return ResponseEntity.ok(result);
    }

    /**
     * 특정 주문의 상태를 변경합니다. (예: 배송 준비)
     */
    @PutMapping("/api/seller/orders/{orderNo}/status")
    @ResponseBody
    public ResponseEntity<Void> updateOrderStatus(
            @AuthenticationPrincipal UserDTO seller,
            @PathVariable String orderNo,
            @RequestBody Map<String, String> payload) {
        String newStatus = payload.get("status");
        orderService.updateOrderStatus(seller.getId(), orderNo, newStatus);
        return ResponseEntity.ok().build();
    }

    // 단독 구매 조회
    @GetMapping("/api/user/orders/single")
    @ResponseBody
    public PageResult<OrderSummaryDTO> getSingleOrders(
            @AuthenticationPrincipal UserDTO principal,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue="1") int page,
            @RequestParam(defaultValue="10") int size) {

        return orderService.getSingleOrders(principal.getId(), status, page, size);
    }

    /**
     * 특정 주문의 상세 정보를 조회합니다.
     */
    @GetMapping("/api/seller/orders/{orderNo}")
    @ResponseBody
    public ResponseEntity<OrderDTO> getOrderDetails(
            @AuthenticationPrincipal UserDTO seller,
            @PathVariable String orderNo) {
        try {
            OrderDTO orderDetails = orderService.getOrderDetailsWithSellerId(seller.getId(), orderNo);
            return ResponseEntity.ok(orderDetails);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * 특정 주문에 대한 배송(송장) 정보를 생성합니다.
     */
    @PostMapping("/api/seller/orders/{orderNo}/shipment")
    @ResponseBody
    public ResponseEntity<Void> createShipment(
            @AuthenticationPrincipal UserDTO seller,
            @PathVariable String orderNo,
            @RequestBody Map<String, String> payload) {
        orderService.createShipment(seller.getId(), orderNo, payload.get("courier"), payload.get("trackingNumber"));
        return ResponseEntity.ok().build();
    }

}