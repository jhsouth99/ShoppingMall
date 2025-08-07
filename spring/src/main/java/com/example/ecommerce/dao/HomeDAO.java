package com.example.ecommerce.dao;

import java.util.List;
import java.util.Map;

import org.apache.ibatis.session.SqlSession;

import com.example.ecommerce.dto.SearchProductDTO;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class HomeDAO {
   
    private final SqlSession sqlSession;
    
    //추천 상품 12개 조회
    public List<SearchProductDTO> getRecommendedProducts() {
        try {
            return sqlSession.selectList("home.getRecommendedProducts");
        } catch (Exception e) {
        	e.printStackTrace();
            throw new RuntimeException("추천 상품 조회 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }
    
    //필터 조건에 따른 상품 조회
    public List<SearchProductDTO> getFilteredProducts(Map<String, Object> filters) {
        try {
        	return sqlSession.selectList("home.getFilteredProducts", filters);
        } catch (Exception e) {
            throw new RuntimeException("필터 상품 조회 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }
    
    //필터 조건에 따른 상품 총 개수 조회
    public int getFilteredProductCount(Map<String, Object> filters) {
        try {
        	return sqlSession.selectOne("home.getFilteredProductCount", filters);
        } catch (Exception e) {
            throw new RuntimeException("필터 상품 개수 조회 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }
    
    //상품 조회수 증가
    public void increaseViewCount(int productId) {
        try {
            sqlSession.update("home.increaseViewCount", productId);
        } catch (Exception e) {
            throw new RuntimeException("상품 조회수 증가 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }
    
}
