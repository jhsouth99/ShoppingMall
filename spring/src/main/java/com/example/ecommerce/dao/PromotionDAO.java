package com.example.ecommerce.dao;

import java.util.List;
import java.util.Map;

import org.apache.ibatis.session.SqlSession;
import org.springframework.stereotype.Repository;

import com.example.ecommerce.dto.ProductDetailDTO;
import com.example.ecommerce.dto.PromotionConditionDTO;
import com.example.ecommerce.dto.PromotionDTO;
import com.example.ecommerce.dto.PromotionDetailDTO;

import lombok.RequiredArgsConstructor;

@Repository
@RequiredArgsConstructor
public class PromotionDAO {

    private final SqlSession sqlSession;

    public List<PromotionDTO> findPromotionsByCreator(Map<String, Object> params) {
        return sqlSession.selectList("promotion.findPromotionsByCreator", params);
    }
    
    public int countPromotionsByCreator(Map<String, Object> params) {
        return sqlSession.selectOne("promotion.countPromotionsByCreator", params);
    }

    public PromotionDetailDTO findPromotionDetailsById(Map<String, Object> params) {
        return null;
    }
    
    public int insertPromotion(PromotionDetailDTO promotion) {
        return sqlSession.insert("promotion.insertPromotion", promotion);
    }

    public int updatePromotion(PromotionDetailDTO promotion) {
        return sqlSession.update("promotion.updatePromotion", promotion);
    }

    public void deleteConditionsByPromotionId(int promotionId) {
        sqlSession.delete("promotion.deleteConditionsByPromotionId", promotionId);
    }

    public void deleteProductsByPromotionId(int promotionId) {
        sqlSession.delete("promotion.deleteProductsByPromotionId", promotionId);
    }
    
    public int insertPromotionCondition(PromotionConditionDTO condition) {
        return sqlSession.insert("promotion.insertPromotionCondition", condition);
    }
    
    public int insertPromotionCondition(Map<String, Object> params) {
        return sqlSession.insert("promotion.insertPromotionCondition", params); // 기존 매퍼 재사용 가정
    }

    public int insertPromotionProductLink(Map<String, Object> params) {
        return sqlSession.insert("promotion.insertPromotionProductLink", params); // 기존 매퍼 재사용 가정
    }

    public List<PromotionDTO> findPromotionsByProductId(Integer productId) {
        return sqlSession.selectList("promotion.findPromotionsByProductId", productId);
    }

    public List<PromotionDetailDTO> findActivePromotionsByProductId(Map<String, Object> params) {
        return sqlSession.selectList("promotion.findActivePromotionsByProductId", params);
    }

    public List<PromotionDetailDTO> findActiveGlobalPromotions(Map<String, Object> params) {
        return sqlSession.selectList("promotion.findActiveGlobalPromotions", params);
    }
    
	// 상품 가격 정보 조회(할인적용가)
    public List<ProductDetailDTO> findDiscountPriceByProductId(Map<String, Object> params){
    	return sqlSession.selectList("product.findDiscountPrice", params);
    }
}