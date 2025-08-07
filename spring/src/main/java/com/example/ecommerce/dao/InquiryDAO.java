package com.example.ecommerce.dao;

import com.example.ecommerce.dto.InquiryDTO;
import lombok.RequiredArgsConstructor;
import org.apache.ibatis.session.SqlSession;

import java.util.List;
import java.util.Map;

@RequiredArgsConstructor
public class InquiryDAO {
    private final SqlSession sqlSession;

    public List<InquiryDTO> findInquiriesByCustomerId(Map<String, Object> params) {
        return sqlSession.selectList("inquiry.findInquiriesByCustomerId", params);
    }

    public int countInquiriesByCustomerId(Map<String, Object> params) {
        return  sqlSession.selectOne("inquiry.countInquiriesByCustomerId", params);
    }

    public List<InquiryDTO> findInquiriesBySellerId(Map<String, Object> params) {
        return sqlSession.selectList("inquiry.findInquiriesBySellerId", params);
    }

    public int countInquiriesBySellerId(Map<String, Object> params) {
        return sqlSession.selectOne("inquiry.countInquiriesBySellerId", params);
    }

    public int updateInquiryAnswer(Map<String, Object> params) {
        return sqlSession.update("inquiry.updateInquiryAnswer", params);
    }
}
