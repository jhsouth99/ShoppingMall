package com.example.ecommerce.dao;

import com.example.ecommerce.dto.AttributeDTO;
import com.example.ecommerce.dto.AttributeOptionDTO;
import com.example.ecommerce.dto.CategoryAttributeDTO;
import com.example.ecommerce.dto.CategoryDTO;
import lombok.RequiredArgsConstructor;
import org.apache.ibatis.session.SqlSession;
import org.springframework.stereotype.Repository;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class CategoryDAO {

    private final SqlSession sqlSession;
    private static final String NAMESPACE = "category.";

    public List<CategoryDTO> findAll() {
        return sqlSession.selectList(NAMESPACE + "findAll");
    }

    public CategoryDTO findCategoryById(int categoryId) {
        return sqlSession.selectOne(NAMESPACE + "findCategoryById", categoryId);
    }

    // =======================================================================
    // =================== C/U/D/기타 메서드 (신규 추가) =====================
    // =======================================================================

    /**
     * 새로운 카테고리를 데이터베이스에 삽입합니다.
     * @param categoryDTO 삽입할 카테고리 정보
     */
    public void insertCategory(CategoryDTO categoryDTO) {
        sqlSession.insert(NAMESPACE + "insertCategory", categoryDTO);
    }

    /**
     * 기존 카테고리 정보를 데이터베이스에서 수정합니다.
     * @param categoryDTO 수정할 카테고리 정보
     */
    public void updateCategory(CategoryDTO categoryDTO) {
        sqlSession.update(NAMESPACE + "updateCategory", categoryDTO);
    }

    /**
     * 특정 카테고리를 데이터베이스에서 삭제합니다.
     * @param categoryId 삭제할 카테고리 ID
     */
    public void deleteCategory(int categoryId) {
        sqlSession.delete(NAMESPACE + "deleteCategory", categoryId);
    }

    /**
     * 특정 카테고리의 직계 하위 카테고리 개수를 조회합니다.
     * @param categoryId 부모 카테고리 ID
     * @return 하위 카테고리 개수
     */
    public int countChildren(int categoryId) {
        return sqlSession.selectOne(NAMESPACE + "countChildren", categoryId);
    }

    public List<Integer> findCategoryPathById(int categoryId) {
        return sqlSession.selectList(NAMESPACE + "findCategoryPathById", categoryId);
    }

    public List<AttributeDTO> findAttributesByCategoryId(int categoryId) {
        return sqlSession.selectList(NAMESPACE + "findAttributesByCategoryId", categoryId);
    }

    public List<CategoryDTO> findCategoryPath(int categoryId) {
        return sqlSession.selectList(NAMESPACE + "findCategoryPath", categoryId);
    }

    public List<CategoryDTO> findSubCategoriesWithProductCount(int categoryId) {
        return sqlSession.selectList(NAMESPACE + "findSubCategoriesWithProductCount", categoryId);
    }

    public List<Integer> findAllDescendantIds(int categoryId) {
        return sqlSession.selectList(NAMESPACE + "findAllDescendantIds", categoryId);
    }

    /**
     * 특정 카테고리의 대표 이미지('PRIMARY')를 등록합니다.
     * @param categoryId 카테고리 ID
     * @param imageUrl 이미지 URL
     */
    public void insertPrimaryImage(int categoryId, String imageUrl) {
        Map<String, Object> params = new HashMap<>();
        params.put("id", UUID.randomUUID().toString()); // PK는 임의의 UUID로 생성
        params.put("categoryId", categoryId);
        params.put("imageUrl", imageUrl);
        sqlSession.insert("category.insertPrimaryImage", params);
    }

    /**
     * 특정 카테고리의 대표 이미지('PRIMARY')를 삭제합니다.
     * @param categoryId 카테고리 ID
     */
    public void deletePrimaryImage(int categoryId) {
        sqlSession.delete("category.deletePrimaryImage", categoryId);
    }

    /**
     * 특정 카테고리의 모든 이미지를 삭제합니다. (카테고리 삭제 시 사용)
     * @param categoryId 카테고리 ID
     */
    public void deleteAllImages(int categoryId) {
        sqlSession.delete("category.deleteAllImages", categoryId);
    }

    public List<Integer> findAllAncestorIds(int categoryId) {
        return sqlSession.selectList("category.findAllAncestorIds", categoryId);
    }

    public List<AttributeDTO> findAttributesByCategoryIds(List<Integer> categoryIds) {
        return sqlSession.selectList("category.findAttributesByCategoryIds", categoryIds);
    }

    public List<AttributeOptionDTO> findAttributeOptions(int attributeId) {
        return sqlSession.selectList("category.findAttributeOptions", attributeId);
    }

    public List<String> findUsedAttributeValues(int attributeId, int categoryId) {
        Map<String, Object> params = new HashMap<>();
        params.put("attributeId", attributeId);
        params.put("categoryId", categoryId);
        return sqlSession.selectList("category.findUsedAttributeValues", params);
    }

    public AttributeDTO getAttributeById(int attributeId) {
        return sqlSession.selectOne(NAMESPACE + "findAttributeById", attributeId);
    }

    /**
     * 특정 카테고리에 연결된 속성 목록 조회
     */
    public List<CategoryAttributeDTO> findCategoryAttributes(int categoryId) {
        return sqlSession.selectList(NAMESPACE + "findCategoryAttributes", categoryId);
    }

    /**
     * 카테고리-속성 연결 삽입
     */
    public void insertCategoryAttribute(CategoryAttributeDTO categoryAttribute) {
        sqlSession.insert(NAMESPACE + "insertCategoryAttribute", categoryAttribute);
    }

    /**
     * 특정 카테고리의 모든 속성 연결 삭제
     */
    public void deleteCategoryAttributes(int categoryId) {
        sqlSession.delete(NAMESPACE + "deleteCategoryAttributes", categoryId);
    }

}