package com.example.ecommerce.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.example.ecommerce.dao.ProductDAO;
import org.springframework.transaction.annotation.Transactional;

import com.example.ecommerce.dao.GroupBuyDAO;
import com.example.ecommerce.dto.GroupBuyDTO;
import com.example.ecommerce.dto.GroupBuyParticipantDTO;
import com.example.ecommerce.dto.PageResult;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class GroupBuyService {

    private final GroupBuyDAO groupBuyDAO;
    private final ProductDAO productDAO;

    // ── 내가 참여한 공동구매
    @Transactional(readOnly = true)
    public PageResult<GroupBuyParticipantDTO> getParticipatedGroupBuys(int userId, int page, int size) {
        int offset = (page - 1) * size;
        List<GroupBuyParticipantDTO> list = groupBuyDAO.findParticipatedGroupBuys(userId, offset, size);
        for (GroupBuyParticipantDTO groupBuyParticipantDTO : list) {}
        int total = groupBuyDAO.countParticipatedGroupBuys(userId);
        return new PageResult<>(list, total, page, size);
    }

    /**
     * [관리자] 모든 공동구매 목록을 페이지네이션과 함께 조회합니다.
     * @param page 현재 페이지
     * @param size 페이지당 항목 수
     * @param keyword 검색어 (상품명 또는 생성자)
     * @param status 상태 필터
     * @return 페이징 처리된 공동구매 목록
     */
    @Transactional(readOnly = true)
    public PageResult<GroupBuyDTO> getAllGroupBuys(int page, int size, String keyword, String status) {
        int offset = (page > 0) ? (page - 1) * size : 0;
        Map<String, Object> params = new HashMap<>();
        params.put("offset", offset);
        params.put("size", size);
        params.put("keyword", keyword);
        params.put("status", status);

        List<GroupBuyDTO> content = groupBuyDAO.findAllGroupBuys(params);
        int totalElements = groupBuyDAO.countAllGroupBuys(params);

        return new PageResult<>(content, totalElements, page, size);
    }

    /**
     * [관리자] 특정 공동구매의 상세 정보를 조회합니다. (옵션 정보 포함)
     * @param groupBuyId 공동구매 ID
     * @return 공동구매 상세 정보 DTO
     */
    @Transactional(readOnly = true)
    public GroupBuyDTO getGroupBuyDetails(int groupBuyId) {
        // 1. 기본 상세 정보 조회
        GroupBuyDTO details = groupBuyDAO.findGroupBuyDetails(groupBuyId);

        if (details != null) {
            // 2. 상품 옵션 정보 조회
            List<String> options = productDAO.findOptionsByProductVariantId(details.getProductVariantId());
            details.setOptions(options);
        }

        return details;
    }

    @Transactional(readOnly = true)
    public PageResult<GroupBuyDTO> getGroupBuys(int sellerId, int page, int size, String keyword, String status) {
        int offset = (page > 0) ? (page - 1) * size : 0;
        Map<String, Object> params = new HashMap<>();
        params.put("sellerId", sellerId);
        params.put("offset", offset);
        params.put("size", size);
        params.put("keyword", keyword);
        params.put("status", status);

        List<GroupBuyDTO> content = groupBuyDAO.findGroupBuysBySellerId(params);
        int totalElements = groupBuyDAO.countGroupBuysBySellerId(params);

        return new PageResult<>(content, totalElements, page, size);
    }

    @Transactional(readOnly = true)
    public List<GroupBuyParticipantDTO> getGroupBuyParticipants(int sellerId, int groupBuyId) {
        // 본인 소유의 공동구매인지 검증하는 로직 추가 가능
        return groupBuyDAO.findParticipantsByGroupBuyId(groupBuyId);
    }

    @Transactional
    public int createGroupBuy(GroupBuyDTO groupBuyData) {
        groupBuyDAO.insertGroupBuy(groupBuyData);
        return groupBuyData.getId(); // keyProperty에 의해 id가 채워짐
    }

    @Transactional
    public void updateGroupBuy(int sellerId, int groupBuyId, GroupBuyDTO groupBuyData) {
        groupBuyData.setId(groupBuyId);
        groupBuyData.setSellerId(sellerId);
        groupBuyDAO.updateGroupBuy(groupBuyData);
    }

    @Transactional(readOnly = true)
    public List<GroupBuyDTO> getGroupBuysByProductId(Integer productId) {
        List<GroupBuyDTO> groupBuys = groupBuyDAO.findGroupBuysByProductId(productId);
        for (GroupBuyDTO groupBuy : groupBuys) {
            if (groupBuy != null) {
                // 2. 상품 옵션 정보 조회
                List<String> options = productDAO.findOptionsByProductVariantId(groupBuy.getProductVariantId());
                groupBuy.setOptions(options);
            }
        }
        return groupBuys;
    }
}
