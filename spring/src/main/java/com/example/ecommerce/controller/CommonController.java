package com.example.ecommerce.controller;

import com.example.ecommerce.dto.GroupBuyDTO;
import com.example.ecommerce.service.CarrierService;
import com.example.ecommerce.service.GroupBuyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.List;
import java.util.Map;

@Controller
@RequiredArgsConstructor
public class CommonController {
    private final CarrierService carrierService;
    private final GroupBuyService groupBuyService;

    /**
     * 활성화된 배송업체 목록을 조회합니다.
     * 판매자 페이지의 반품/교환 처리에서 사용됩니다.
     */
    @GetMapping("/api/carriers")
    @ResponseBody
    public ResponseEntity<List<Map<String, Object>>> getActiveCarriers() {
        try {
            List<Map<String, Object>> carriers = carrierService.getActiveCarriers();
            return ResponseEntity.ok(carriers);
        } catch (Exception e) {
            // 에러 발생 시 빈 리스트 반환하거나 에러 처리
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 관리자용 - 전체 배송업체 목록 조회 (활성/비활성 모두)
     */
    @GetMapping("/api/admin/carriers")
    @ResponseBody
    public ResponseEntity<List<Map<String, Object>>> getAllCarriers() {
        try {
            List<Map<String, Object>> carriers = carrierService.getAllCarriers();
            return ResponseEntity.ok(carriers);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }


    /**
     * 특정 공동구매의 상세 정보를 조회합니다. (수정 모달용)
     */
    @GetMapping("/api/seller/group-buys/{groupBuyId}")
    @ResponseBody
    public ResponseEntity<GroupBuyDTO> getGroupBuyDetails(
            @PathVariable int groupBuyId) {
        GroupBuyDTO groupBuy = groupBuyService.getGroupBuyDetails(groupBuyId);
        return ResponseEntity.ok(groupBuy);
    }

    /**
     * 특정 공동구매의 상세 정보를 조회합니다.
     */
    @GetMapping("/api/admin/group-buys/{groupBuyId}")
    @ResponseBody
    public ResponseEntity<GroupBuyDTO> getGroupBuyDetailsAdmin(@PathVariable int groupBuyId) {
        GroupBuyDTO details = groupBuyService.getGroupBuyDetails(groupBuyId);
        return ResponseEntity.ok(details);
    }

}