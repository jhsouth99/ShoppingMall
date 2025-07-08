package com.example.ecommerce.dao;

import java.util.List;
import java.util.Map;

import org.apache.ibatis.session.SqlSession;

import com.example.ecommerce.dto.ProductDTO;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class SearchDAO {
    
    private final SqlSession sqlSession;
    
    private static final String NAMESPACE = "com.example.ecommerce.mapper.SearchMapper";
    
    // 태그 기반 상품 검색
    public List<ProductDTO> searchProducts(Map<String, Object> searchConditions) {
        return sqlSession.selectList(NAMESPACE + ".searchProducts", searchConditions);
    }
    
    // 검색 결과 개수 조회
    public int getSearchResultCount(Map<String, Object> searchConditions) {
        return sqlSession.selectOne(NAMESPACE + ".getSearchResultCount", searchConditions);
    }
    
    // 인기 검색어 목록 조회
    public List<String> getPopularSearchKeywords(int limit) {
        return sqlSession.selectList(NAMESPACE + ".getPopularSearchKeywords", limit);
    }
    
    // 검색어 기록 저장
    public void saveSearchKeyword(String keyword) {
        sqlSession.insert(NAMESPACE + ".saveSearchKeyword", keyword);
    }
}
