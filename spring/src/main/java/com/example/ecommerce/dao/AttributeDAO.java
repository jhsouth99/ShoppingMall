package com.example.ecommerce.dao;

import com.example.ecommerce.dto.AttributeDTO;
import com.example.ecommerce.dto.AttributeOptionDTO;
import lombok.RequiredArgsConstructor;
import org.apache.ibatis.session.SqlSession;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

@Repository
@RequiredArgsConstructor
public class AttributeDAO {

    private final SqlSession sqlSession;
    private static final String NAMESPACE = "attribute.";

    /**
     * 속성 목록 조회 (페이징, 필터링 지원)
     */
    public List<AttributeDTO> findAttributesWithPaging(Map<String, Object> params) {
        return sqlSession.selectList(NAMESPACE + "findAttributesWithPaging", params);
    }

    /**
     * 속성 개수 조회 (필터링 조건 적용)
     */
    public int countAttributes(Map<String, Object> params) {
        return sqlSession.selectOne(NAMESPACE + "countAttributes", params);
    }

    /**
     * 특정 속성 조회
     */
    public AttributeDTO findAttributeById(int attributeId) {
        return sqlSession.selectOne(NAMESPACE + "findAttributeById", attributeId);
    }

    /**
     * 속성명 중복 체크
     */
    public boolean existsByName(String name) {
        int count = sqlSession.selectOne(NAMESPACE + "countByName", name);
        return count > 0;
    }

    /**
     * 새로운 속성 삽입
     */
    public void insertAttribute(AttributeDTO attributeDTO) {
        sqlSession.insert(NAMESPACE + "insertAttribute", attributeDTO);
    }

    /**
     * 속성 정보 수정
     */
    public void updateAttribute(AttributeDTO attributeDTO) {
        sqlSession.update(NAMESPACE + "updateAttribute", attributeDTO);
    }

    /**
     * 속성 삭제
     */
    public void deleteAttribute(int attributeId) {
        sqlSession.delete(NAMESPACE + "deleteAttribute", attributeId);
    }

    /**
     * 속성 사용 현황 조회 (카테고리나 상품에서 사용되는지)
     */
    public int countAttributeUsage(int attributeId) {
        return sqlSession.selectOne(NAMESPACE + "countAttributeUsage", attributeId);
    }

    /**
     * 속성의 옵션 목록 조회
     */
    public List<AttributeOptionDTO> findAttributeOptions(int attributeId) {
        return sqlSession.selectList(NAMESPACE + "findAttributeOptions", attributeId);
    }

    /**
     * 속성의 옵션 개수 조회
     */
    public int countAttributeOptions(int attributeId) {
        return sqlSession.selectOne(NAMESPACE + "countAttributeOptions", attributeId);
    }

    /**
     * 새로운 속성 옵션 삽입
     */
    public void insertAttributeOption(AttributeOptionDTO option) {
        sqlSession.insert(NAMESPACE + "insertAttributeOption", option);
    }

    /**
     * 속성의 모든 옵션 삭제 (사용되지 않는 옵션만)
     */
    public void deleteAttributeOptions(int attributeId) {
        sqlSession.delete(NAMESPACE + "deleteAttributeOptions", attributeId);
    }

    /**
     * 특정 옵션 삭제
     */
    public void deleteAttributeOption(int optionId) {
        sqlSession.delete(NAMESPACE + "deleteAttributeOption", optionId);
    }

    /**
     * 옵션값 중복 체크
     */
    public boolean existsOptionValue(int attributeId, String optionValue) {
        Map<String, Object> params = Map.of("attributeId", attributeId, "optionValue", optionValue);
        int count = sqlSession.selectOne(NAMESPACE + "countOptionValue", params);
        return count > 0;
    }

    /**
     * 다음 옵션 표시 순서 조회
     */
    public int getNextOptionDisplayOrder(int attributeId) {
        Integer maxOrder = sqlSession.selectOne(NAMESPACE + "getMaxOptionDisplayOrder", attributeId);
        return (maxOrder != null ? maxOrder : 0) + 1;
    }

    /**
     * 옵션 사용 현황 조회
     */
    public int countOptionUsage(int optionId) {
        return sqlSession.selectOne(NAMESPACE + "countOptionUsage", optionId);
    }

    /**
     * 모든 속성 목록 조회 (카테고리 연결용)
     */
    public List<AttributeDTO> findAllAttributes() {
        return sqlSession.selectList(NAMESPACE + "findAllAttributes");
    }

    /**
     * 사용되지 않는 옵션들만 삭제 (안전한 삭제)
     */
    public void deleteUnusedAttributeOptions(int attributeId) {
        sqlSession.delete(NAMESPACE + "deleteUnusedAttributeOptions", attributeId);
    }

    /**
     * 특정 속성의 사용 중인 옵션 개수 조회
     */
    public int countUsedOptions(int attributeId) {
        return sqlSession.selectOne(NAMESPACE + "countUsedOptions", attributeId);
    }
}