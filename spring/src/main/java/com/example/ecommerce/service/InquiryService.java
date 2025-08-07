package com.example.ecommerce.service;

import com.example.ecommerce.dao.InquiryDAO;
import com.example.ecommerce.dto.InquiryDTO;
import com.example.ecommerce.dto.PageResult;
import lombok.RequiredArgsConstructor;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RequiredArgsConstructor
public class InquiryService {
    private final InquiryDAO inquiryDAO;
    public PageResult<InquiryDTO> getUserInquiries(int id, int page, int size) {
        int offset = (page > 0) ? (page - 1) * size : 0;
        Map<String, Object> params = new HashMap<>();
        params.put("id", id);
        params.put("offset", offset);
        params.put("size", size);

        List<InquiryDTO> content = inquiryDAO.findInquiriesByCustomerId(params);
        int totalElements = inquiryDAO.countInquiriesByCustomerId(params);

        return new PageResult<>(content, totalElements, page, size);
    }

    /**
     * 판매자와 관련된 1:1 문의 목록을 조회합니다.
     * (판매자 상품에 대한 문의, 주문 관련 문의 등)
     */
    public PageResult<InquiryDTO> getSellerInquiries(int sellerId, int page, int size, String keyword, String status) {
        int offset = (page > 0) ? (page - 1) * size : 0;
        Map<String, Object> params = new HashMap<>();
        params.put("sellerId", sellerId);
        params.put("keyword", keyword);
        params.put("status", status);
        params.put("offset", offset);
        params.put("size", size);

        List<InquiryDTO> content = inquiryDAO.findInquiriesBySellerId(params);
        int totalElements = inquiryDAO.countInquiriesBySellerId(params);

        return new PageResult<>(content, totalElements, page, size);
    }

    /**
     * 특정 1:1 문의에 답변을 등록합니다.
     */
    public void replyToInquiry(int sellerId, int inquiryId, String answer) {
        Map<String, Object> params = new HashMap<>();
        params.put("sellerId", sellerId);
        params.put("inquiryId", inquiryId);
        params.put("answer", answer);

        int updated = inquiryDAO.updateInquiryAnswer(params);
        if (updated == 0) {
            throw new SecurityException("답변 권한이 없거나 문의를 찾을 수 없습니다.");
        }
    }
}
