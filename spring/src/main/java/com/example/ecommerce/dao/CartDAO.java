package com.example.ecommerce.dao;

import com.example.ecommerce.dto.CartItemDTO;
import com.example.ecommerce.dto.CartOptionDTO;
import lombok.RequiredArgsConstructor;
import org.apache.ibatis.session.SqlSession;
import org.springframework.stereotype.Repository;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Repository
@RequiredArgsConstructor
public class CartDAO {
    
    private final SqlSession sqlSession;
    private static final String NAMESPACE = "cart.";
    
    /**
     * 사용자의 장바구니 목록 조회
     */
    public List<CartItemDTO> selectCartItems(int userId) {
        return sqlSession.selectList(NAMESPACE + "selectCartItems", userId);
    }
    
    /**
     * 특정 장바구니 아이템 조회
     */
    public CartItemDTO selectCartItem(int userId, int productVariantId) {
        Map<String, Object> params = new HashMap<>();
        params.put("userId", userId);
        params.put("productVariantId", productVariantId);
        return sqlSession.selectOne(NAMESPACE + "selectCartItem", params);
    }
    
    /**
     * 장바구니에 상품 추가
     */
    public int insertCartItem(int userId, int productVariantId, int quantity) {
        Map<String, Object> params = new HashMap<>();
        params.put("userId", userId);
        params.put("productVariantId", productVariantId);
        params.put("quantity", quantity);
        return sqlSession.insert(NAMESPACE + "insertCartItem", params);
    }
    
    /**
     * 장바구니 상품 수량 변경
     */
    public int updateCartItemQuantity(int userId, int productVariantId, int quantity) {
        Map<String, Object> params = new HashMap<>();
        params.put("userId", userId);
        params.put("productVariantId", productVariantId);
        params.put("quantity", quantity);
        return sqlSession.update(NAMESPACE + "updateCartItemQuantity", params);
    }
    
    /**
     * 장바구니 상품 삭제 (기본 메서드)
     */
    public int deleteCartItem(int userId, int productVariantId) {
        Map<String, Object> params = new HashMap<>();
        params.put("userId", userId);
        params.put("productVariantId", productVariantId);
        return sqlSession.delete(NAMESPACE + "deleteCartItem", params);
    }
    
    /**
     * 장바구니 상품 삭제 (Map 파라미터 버전) - 메서드명 변경으로 충돌 방지
     */
    public int deleteCartItemByParams(Map<String, Object> params) {
        return sqlSession.delete(NAMESPACE + "deleteCartItem", params);
    }
    
    /**
     * 선택된 장바구니 상품들 삭제
     */
    public int deleteSelectedCartItems(int userId, List<Integer> productVariantIds) {
        Map<String, Object> params = new HashMap<>();
        params.put("userId", userId);
        params.put("productVariantIds", productVariantIds);
        return sqlSession.delete(NAMESPACE + "deleteSelectedCartItems", params);
    }
    
    /**
     * 구매 불가능한 상품들 삭제
     */
    public int deleteUnavailableCartItems(int userId) {
        return sqlSession.delete(NAMESPACE + "deleteUnavailableCartItems", userId);
    }
    
    /**
     * 장바구니 상품 개수 조회
     */
    public int selectCartItemCount(int userId) {
        Integer count = sqlSession.selectOne(NAMESPACE + "selectCartItemCount", userId);
        return count != null ? count : 0;
    }
    
    // ============== CartOptionService에서 사용하는 메서드들 ==============
    
    /**
     * 상품 기본 정보 조회 (모달용)
     */
    public Map<String, Object> selectProductBasicInfo(int productId) {
        return sqlSession.selectOne(NAMESPACE + "selectProductBasicInfo", productId);
    }
    
    /**
     * 상품의 모든 옵션 조회 (옵션 선택 모달용)
     */
    public List<CartOptionDTO.ProductOption> selectProductOptions(int productId) {
        return sqlSession.selectList(NAMESPACE + "selectProductOptions", productId);
    }
    
    /**
     * 현재 변형 상품의 선택된 옵션 조회
     */
    public List<CartOptionDTO.CurrentVariantOption> selectCurrentVariantOptions(int variantId) {
        return sqlSession.selectList(NAMESPACE + "selectCurrentVariantOptions", variantId);
    }
    
    /**
     * 옵션 조합으로 변형 상품 조회
     */
    public Map<String, Object> selectVariantByOptions(Map<String, Object> params) {
        return sqlSession.selectOne(NAMESPACE + "selectVariantByOptions", params);
    }
    
    /**
     * 장바구니 아이템의 옵션 변경
     */
    public int updateCartItemVariant(Map<String, Object> params) {
        return sqlSession.update(NAMESPACE + "updateCartItemVariant", params);
    }
    
    /**
     * 기존 장바구니 아이템 존재 여부 확인
     */
    public int checkExistingCartItem(Map<String, Object> params) {
        Integer quantity = sqlSession.selectOne(NAMESPACE + "checkExistingCartItem", params);
        return quantity != null ? quantity : 0;
    }
    
    /**
     * 기존 장바구니 아이템 수량 증가
     */
    public int increaseCartItemQuantity(Map<String, Object> params) {
        return sqlSession.update(NAMESPACE + "increaseCartItemQuantity", params);
    }
    
    /**
     * 변형 상품 ID로 상품 ID 조회
     */
    public Integer selectProductIdByVariantId(int variantId) {
        return sqlSession.selectOne(NAMESPACE + "selectProductIdByVariantId", variantId);
    }
}