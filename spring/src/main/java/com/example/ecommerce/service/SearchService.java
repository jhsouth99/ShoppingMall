package com.example.ecommerce.service;

import java.util.List;
import java.util.Map;

import com.example.ecommerce.dao.SearchDAO;
import com.example.ecommerce.dto.SearchProductDTO;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class SearchService {
    
    private final SearchDAO searchDAO;
    
    //태그 기반 상품 검색
    public List<SearchProductDTO> searchProducts(Map<String, Object> searchConditions) {
        return searchDAO.searchProducts(searchConditions);
    }
    
    //검색 결과 개수 조회
    public int getSearchResultCount(Map<String, Object> searchConditions) {
        return searchDAO.getSearchResultCount(searchConditions);
    }
    
    //인기 검색어 목록 조회
    public List<String> getPopularSearchKeywords(int limit) {
        return searchDAO.getPopularSearchKeywords(limit);
    }
    
    //검색어 기록 저장
    public void saveSearchKeyword(String keyword) {
        searchDAO.saveSearchKeyword(keyword);
    }
}
