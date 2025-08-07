package com.example.ecommerce.dao;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.ibatis.session.SqlSession;

import com.example.ecommerce.dto.QnADTO;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class QnADAO {

    private final SqlSession sqlSession;

    public List<QnADTO> findQnAsBySellerId(Map<String, Object> params) {
        return sqlSession.selectList("qna.findQnAsBySellerId", params);
    }

    public int countQnAsBySellerId(Map<String, Object> params) {
        return sqlSession.selectOne("qna.countQnAsBySellerId", params);
    }

    public int updateQnAAnswer(Map<String, Object> params) {
        return sqlSession.update("qna.updateQnAAnswer", params);
    }

    public List<QnADTO> findQnAsByCustomerId(Map<String, Object> params) {
        return sqlSession.selectList("qna.findQnAsByCustomerId", params);
    }

    public int countQnAsByCustomerId(Map<String, Object> params) {
        return sqlSession.selectOne("qna.countQnAsByCustomerId", params);
    }

    public QnADTO findQnAById(int qnaId) {
        return sqlSession.selectOne("qna.findQnAById", qnaId);
    }

    public int deleteQnA(int qnaId) {
        return sqlSession.delete("qna.deleteQnA", qnaId);
    }

    public int updateQnA(Map<String, Object> params) {
        return sqlSession.update("qna.updateQnA", params);
    }

    public List<QnADTO> findQnAsByProductId(Map<String, Object> params) {
        return sqlSession.selectList("qna.findQnAsByProductId", params);
    }

    public int countQnAsByProductId(int productId) {
        return sqlSession.selectOne("qna.countQnAsByProductId", productId);
    }
    
    // 상품문의 등록
    public int saveQna( HashMap<String, Object> qnaPrams ) {
    	return sqlSession.insert("qna.saveQna", qnaPrams);
    }
}


