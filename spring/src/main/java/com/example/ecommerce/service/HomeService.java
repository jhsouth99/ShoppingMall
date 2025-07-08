package com.example.ecommerce.service;

import java.util.List;
import java.util.Map;

import com.example.ecommerce.dao.HomeDAO;
import com.example.ecommerce.dto.ProductDTO;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class HomeService {
    
    private final HomeDAO homeDAO;

    //추천 상품 12개 조회   
    public List<ProductDTO> getRecommendedProducts() {
        try {
            return homeDAO.getRecommendedProducts();
        } catch (Exception e) {
            throw new RuntimeException("추천 상품을 불러오는데 실패했습니다.", e);
        }
    }
    
    //필터 조건에 따른 상품 조회
    public List<ProductDTO> getFilteredProducts(Map<String, Object> filters) {
        try {
            int page = (Integer) filters.getOrDefault("page", 1);
            int size = (Integer) filters.getOrDefault("size", 12);
            
            int offset = (page - 1) * size; 
            filters.put("offset", offset);   
            filters.put("limit", size);
            
            return homeDAO.getFilteredProducts(filters);
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("상품 조회 중 오류가 발생했습니다.", e);
        }
    }
    
    // 필터 조건에 따른 상품 총 개수 조회
    public int getFilteredProductCount(Map<String, Object> filters) {
        try {
            return homeDAO.getFilteredProductCount(filters);
        } catch (Exception e) {
            e.printStackTrace();
            return 0;
        }
    }
}
