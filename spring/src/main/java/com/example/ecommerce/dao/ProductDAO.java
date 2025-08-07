package com.example.ecommerce.dao;

import java.util.List;
import java.util.Map;

import com.example.ecommerce.dto.*;
import org.apache.ibatis.session.SqlSession;
import org.springframework.stereotype.Repository;

import lombok.RequiredArgsConstructor;

@Repository
@RequiredArgsConstructor
public class ProductDAO {

    private final SqlSession sqlSession;

    /**
     * 판매자의 상품 목록을 조회합니다. (페이징 및 검색 조건 포함)
     * @param params sellerId, offset, size, keyword, status
     * @return 상품 요약 정보 리스트
     */
    public List<ProductSummaryDTO> findProductsBySellerId(Map<String, Object> params) {
        return sqlSession.selectList("product.findProductsBySellerId", params);
    }

    /**
     * 판매자의 상품 전체 개수를 조회합니다. (페이징 및 검색 조건 포함)
     * @param params sellerId, keyword, status
     * @return 상품 개수
     */
    public int countProductsBySellerId(Map<String, Object> params) {
        return sqlSession.selectOne("product.countProductsBySellerId", params);
    }

    /**
     * 특정 상품의 상세 정보를 조회합니다. (기본 정보)
     * @param productId 상품 ID
     * @return 상품 상세 정보 DTO
     */
    public ProductDetailDTO findProductById(int productId) {
        return sqlSession.selectOne("product.findProductById", productId);
    }

    /**
     * 특정 상품의 옵션 및 옵션 값 목록을 조회합니다.
     * @param productId 상품 ID
     * @return 옵션 정보 리스트
     */
    public List<ProductOptionDTO> findOptionsByProductId(int productId) {
        return sqlSession.selectList("product.findOptionsByProductId", productId);
    }

    /**
     * 특정 상품의 변형(Variant) 목록을 조회합니다.
     * @param productId 상품 ID
     * @return 변형 정보 리스트
     */
    public List<ProductVariantDTO> findVariantsByProductId(int productId) {
        return sqlSession.selectList("product.findVariantsByProductId", productId);
    }

    /**
     * 상품 기본 정보를 `products` 테이블에 삽입합니다.
     * @param productData 상품 정보 DTO
     * @return 삽입된 행의 수
     */
    public int insertProduct(ProductDetailDTO productData) {
        return sqlSession.insert("product.insertProduct", productData);
    }

    /**
     * 상품 옵션을 `product_options` 테이블에 삽입합니다.
     * @param option 옵션 정보 DTO
     * @return 삽입된 행의 수
     */
    public int insertProductOption(ProductOptionDTO option) {
        return sqlSession.insert("product.insertProductOption", option);
    }

    /**
     * [완성] 상품 옵션 값을 `product_option_values` 테이블에 삽입합니다.
     * @param value 옵션 값 DTO
     * @return 삽입된 행의 수
     */
    public int insertProductOptionValue(ProductOptionValueDTO value) {
        return sqlSession.insert("product.insertProductOptionValue", value);
    }

    /**
     * [완성] 상품 변형(Variant) 정보를 `product_variants` 테이블에 삽입합니다.
     * @param variant 변형 정보 DTO
     * @return 삽입된 행의 수
     */
    public int insertProductVariant(ProductVariantDTO variant) {
        return sqlSession.insert("product.insertProductVariant", variant);
    }

    /**
     * [완성] 변형(Variant)과 옵션 값을 `prod_variant_option_vals` 테이블에 연결합니다.
     * @param params variantId, productOptionId, productOptionValueId가 담긴 Map
     * @return 삽입된 행의 수
     */
    public int insertVariantOptionValueLink(Map<String, Object> params) {
        return sqlSession.insert("product.insertVariantOptionValueLink", params);
    }

    /**
     * 상품 기본 정보를 업데이트합니다.
     * @param productData 상품 정보 DTO
     * @return 수정된 행의 수
     */
    public int updateProduct(ProductDetailDTO productData) {
        return sqlSession.update("product.updateProduct", productData);
    }

    /**
     * 상품을 논리적 삭제(soft delete) 처리합니다. (deleted_at 컬럼 업데이트)
     * @param params sellerId, productId
     * @return 수정된 행의 수
     */
    public int deleteProduct(Map<String, Object> params) {
        return sqlSession.update("product.deleteProduct", params);
    }

    /**
     * 특정 상품에 연결된 모든 변형(Variant) 정보를 삭제합니다.
     * @param productId 상품 ID
     */
    public void deleteVariantsByProductId(int productId) {
        sqlSession.delete("product.deleteVariantsByProductId", productId);
    }

    /**
     * 특정 상품에 연결된 모든 옵션 정보를 삭제합니다. (하위 옵션 값들도 DB CASCADE로 삭제됨)
     * @param productId 상품 ID
     */
    public void deleteOptionsByProductId(int productId) {
        sqlSession.delete("product.deleteOptionsByProductId", productId);
    }

    public List<ProductVariantDTO> findGroupBuyableVariantsBySellerId(int sellerId) {
        return sqlSession.selectList("product.findGroupBuyableVariantsBySellerId", sellerId);
    }

    /**
     * 특정 판매자의 모든 활성 상품을 비활성화(soft delete)합니다.
     * @param sellerId 판매자 ID
     * @return 수정된 행의 수
     */
    public int deactivateAllProductsBySeller(int sellerId) {
        return sqlSession.update("product.deactivateAllProductsBySeller", sellerId);
    }

    public List<Map<String, Object>> findTargetableProductsBySellerId(int sellerId) {
        return sqlSession.selectList("product.findTargetableProductsBySellerId", sellerId);
    }

    public List<SearchProductDTO> findRecommendedProducts() {
        return sqlSession.selectList("product.findRecommendedProducts");
    }

    public List<SearchProductDTO> findFilteredProducts(Map<String, Object> filters) {
        return sqlSession.selectList("product.findFilteredProducts", filters);
    }

    public List<SearchProductDTO> searchProducts(Map<String, Object> searchConditions) {
        return sqlSession.selectList("product.searchProducts", searchConditions);
    }

    public int countSearchedProducts(Map<String, Object> searchConditions) {
        return sqlSession.selectOne("product.countSearchedProducts", searchConditions);
    }

    public List<ProductAttributeValueDTO> findAttributesByProductId(int productId) {
        return sqlSession.selectList("product.findAttributesByProductId", productId);
    }

    public int insertProductAttributeValue(Map<String, Object> params) {
        return sqlSession.insert("product.insertProductAttributeValue", params);
    }

    public int deleteAttributeValuesByProductId(int productId) {
        return sqlSession.delete("product.deleteAttributeValuesByProductId", productId);
    }

    /**
     * 카테고리별 상품을 검색합니다. (하위 카테고리 포함)
     * @param filters 검색 조건 맵
     * @return 상품 목록
     */
    public List<SearchProductDTO> searchProductsByCategory(Map<String, Object> filters) {
        return sqlSession.selectList("product.searchProductsByCategory", filters);
    }

    /**
     * 카테고리별 상품 총 개수를 조회합니다. (하위 카테고리 포함)
     * @param filters 검색 조건 맵
     * @return 상품 총 개수
     */
    public int countProductsByCategory(Map<String, Object> filters) {
        return sqlSession.selectOne("product.countProductsByCategory", filters);
    }

    public int insertProductImage(ProductImageDTO imageDTO) {
        return sqlSession.insert("product.insertProductImage", imageDTO);
    }

    public int deleteProductImages(int productId) {
        return sqlSession.delete("product.deleteProductImages", productId);
    }

    public List<ProductImageDTO> findImagesByProductId(int productId) {
        return sqlSession.selectList("product.findImagesByProductId", productId);
    }

    public int deleteProductImage(String id) {
        return sqlSession.delete("product.deleteProductImage", id);
    }

    /**
     * 상품 이미지의 순서와 타입을 업데이트합니다.
     * @param params imageId, displayOrder, imageType을 포함한 Map
     * @return 업데이트된 행의 수
     */
    public int updateProductImageOrder(Map<String, Object> params) {
        return sqlSession.update("product.updateProductImageOrder", params);
    }

    /**
     * 특정 상품의 이미지 개수를 조회합니다.
     * @param productId 상품 ID
     * @return 이미지 개수
     */
    public int countProductImages(int productId) {
        return sqlSession.selectOne("product.countProductImages", productId);
    }

    /**
     * 상품 이미지 정보를 대량 업데이트합니다.
     * @param imageUpdates 업데이트할 이미지 정보 리스트
     * @return 업데이트된 총 행의 수
     */
    public int batchUpdateProductImages(List<Map<String, Object>> imageUpdates) {
        return sqlSession.update("product.batchUpdateProductImages", imageUpdates);
    }

    /**
     * 특정 상품의 모든 이미지 순서를 재정렬합니다.
     * @param productId 상품 ID
     * @return 업데이트된 행의 수
     */
    public int reorderAllProductImages(int productId) {
        return sqlSession.update("product.reorderAllProductImages", productId);
    }

    /**
     * 상품 변형(Variant) 정보를 업데이트합니다.
     * @param variant 변형 정보 DTO
     * @return 수정된 행의 수
     */
    public int updateProductVariant(ProductVariantDTO variant) {
        return sqlSession.update("product.updateProductVariant", variant);
    }

    /**
     * Product Variant ID로 연결된 옵션 정보들을 조회합니다.
     * @param productVariantId 상품 Variant ID
     * @return 옵션 문자열 목록 (예: "색상: 블랙")
     */
    public List<String> findOptionsByProductVariantId(int productVariantId) {
        return sqlSession.selectList("product.findOptionsByProductVariantId", productVariantId);
    }

    public ReviewImageDTO findProductImageByUrl(String imageUrl) {
        return sqlSession.selectOne("product.findProductImageByUrl", imageUrl);
    }

    public boolean isWishlistItem(int userId, Integer productId) {
        return sqlSession.selectOne("wishlist.isWishlistItem", Map.of("userId", userId, "productId", productId));
    }

    public int insertWishlistItem(int userId, Integer productId) {
        return sqlSession.insert("wishlist.insertWishlistItem", Map.of("userId", userId, "productId", productId));
    }

    public int deleteWishlistItem(int userId, Integer productId) {
        return sqlSession.delete("wishlist.deleteWishlistItem", Map.of("userId", userId, "productId", productId));
    }

    /**
     * 상품 상세 페이지의 관련 상품 목록을 조회합니다.
     * @param productId 현재 상품 ID
     * @return 관련 상품 목록 (최대 12개)
     */
    public List<ProductDetailDTO> selectRelProductList(int productId) {
        return sqlSession.selectList("product.relPro_list", productId);
    }

    /**
     * 상품의 할인 가격 정보를 조회합니다.
     * @param productId 상품 ID
     * @return 할인 정보 (할인 타입, 할인 값)
     */
    public ProductDetailDTO findDiscountPriceByProductId(int productId) {
        return sqlSession.selectOne("product.findDiscountPrice", productId);
    }

    /**
     * 장바구니에 상품을 추가합니다.
     * @param params userId, productVariantId, quantity를 포함한 Map
     * @return 삽입된 행의 수
     */
    public int insertCartItem(Map<String, Object> params) {
        return sqlSession.insert("product.insertCartItem", params);
    }

    /**
     * 장바구니에 중복 상품이 있는지 확인합니다.
     * @param params userId, productVariantId를 포함한 Map
     * @return 중복 상품 개수
     */
    public int selectCountCartItem(Map<String, Object> params) {
        return sqlSession.selectOne("product.selectCountCartItem", params);
    }
}