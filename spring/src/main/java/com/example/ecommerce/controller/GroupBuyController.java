package com.example.ecommerce.controller;

import com.example.ecommerce.dto.*;
import com.example.ecommerce.service.GroupBuyService;
import com.example.ecommerce.service.OrderService;
import com.example.ecommerce.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Controller
@RequiredArgsConstructor
public class GroupBuyController {

    Logger logger = LoggerFactory.getLogger(GroupBuyController.class);

    private final GroupBuyService groupBuyService;
    private final OrderService orderService;
    private final ProductService productService;

    // 공동구매
    @GetMapping("/api/user/orders/groupbuys")
    @ResponseBody
    public PageResult<GroupBuyParticipantDTO> getGroupBuyOrders(
            @AuthenticationPrincipal UserDTO principal,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue="1") int page,
            @RequestParam(defaultValue="10") int size) {

        return orderService.getGroupBuyOrders(principal.getId(), status, page, size);
    }

    // 공동구매
    @GetMapping("/api/user/orders/groupbuy")
    @ResponseBody
    public GroupBuyDTO getGroupBuyOrders(
            @RequestParam int gbId) {

        return groupBuyService.getGroupBuyDetails(gbId);
    }

    // 내가 참여한 공동구매(진행 상태)
    @GetMapping("/api/user/orders/group-buys/participated")
    @ResponseBody
    public PageResult<GroupBuyParticipantDTO> getParticipatedGroupBuys(
            @AuthenticationPrincipal UserDTO principal,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {

        return groupBuyService.getParticipatedGroupBuys(principal.getId(), page, size);
    }

    /**
     * 모든 공동구매 목록을 조회합니다.
     */
    @GetMapping("/api/admin/group-buys")
    @ResponseBody
    public ResponseEntity<PageResult<GroupBuyDTO>> getAllGroupBuys(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam String keyword,
            @RequestParam String status) {
        PageResult<GroupBuyDTO> result = groupBuyService.getAllGroupBuys(page, size, keyword, status);
        return ResponseEntity.ok(result);
    }

    /**
     * 판매자의 공동구매 목록을 조회합니다.
     */
    @GetMapping("/api/seller/group-buys")
    @ResponseBody
    public ResponseEntity<PageResult<GroupBuyDTO>> getGroupBuys(
            @AuthenticationPrincipal UserDTO seller,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status) {
        PageResult<GroupBuyDTO> result = groupBuyService.getGroupBuys(seller.getId(), page, size, keyword, status);
        return ResponseEntity.ok(result);
    }

    /**
     * 새 공동구매를 생성합니다.
     */
    @PostMapping("/api/seller/group-buys")
    @ResponseBody
    public ResponseEntity<?> createGroupBuy(
            @AuthenticationPrincipal UserDTO seller,
            @RequestBody GroupBuyDTO groupBuyData) {
        groupBuyData.setSellerId(seller.getId());
        logger.debug("Created group buy {}", groupBuyData);
        int newGroupBuyId = groupBuyService.createGroupBuy(groupBuyData);
        return ResponseEntity.ok(Map.of("groupBuyId", newGroupBuyId));
    }

    /**
     * 기존 공동구매 정보를 수정합니다.
     */
    @PutMapping("/api/seller/group-buys/{groupBuyId}")
    @ResponseBody
    public ResponseEntity<Void> updateGroupBuy(
            @AuthenticationPrincipal UserDTO seller,
            @PathVariable int groupBuyId,
            @RequestBody GroupBuyDTO groupBuyData) {
        groupBuyService.updateGroupBuy(seller.getId(), groupBuyId, groupBuyData);
        return ResponseEntity.ok().build();
    }

    /**
     * 특정 공동구매의 참여자 목록을 조회합니다.
     */
    @GetMapping("/api/seller/group-buys/{groupBuyId}/participants")
    @ResponseBody
    public ResponseEntity<List<GroupBuyParticipantDTO>> getGroupBuyParticipants(
            @AuthenticationPrincipal UserDTO seller,
            @PathVariable int groupBuyId) {
        List<GroupBuyParticipantDTO> participants = groupBuyService.getGroupBuyParticipants(seller.getId(), groupBuyId);
        return ResponseEntity.ok(participants);
    }

    /**
     * 공동구매 생성을 위한 대상 상품 변형 목록을 조회합니다.
     */
    @GetMapping("/api/seller/group-buy-target-variants")
    @ResponseBody
    public ResponseEntity<List<ProductVariantDTO>> getGroupBuyableVariants(
            @AuthenticationPrincipal UserDTO seller) {
        List<ProductVariantDTO> variants = productService.getGroupBuyableVariants(seller.getId());
        logger.info(variants.toString());
        return ResponseEntity.ok(variants);
    }

}
