package com.example.ecommerce.service;

import com.example.ecommerce.dao.CategoryDAO;
import com.example.ecommerce.dto.AttributeDTO;
import com.example.ecommerce.dto.AttributeOptionDTO;
import com.example.ecommerce.dto.CategoryDTO;
import com.example.ecommerce.dto.CategoryAttributeDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryDAO categoryDAO;

    @Transactional(readOnly = true)
    public List<CategoryDTO> getCategoryTree() {
        // 1. DB에서 모든 카테고리를 플랫 리스트로 조회 (대표 이미지 포함)
        List<CategoryDTO> flatList = categoryDAO.findAll();

        // 2. 계층 구조로 조립 (기존 로직과 동일)
        Map<Integer, CategoryDTO> map = new HashMap<>();
        List<CategoryDTO> tree = new ArrayList<>();

        for (CategoryDTO category : flatList) {
            category.setChildren(new ArrayList<>());
            map.put(category.getId(), category);
        }

        for (CategoryDTO category : flatList) {
            if (category.getParentId() != null && category.getParentId() != 0) {
                CategoryDTO parent = map.get(category.getParentId());
                if (parent != null) {
                    parent.getChildren().add(category);
                }
            } else {
                tree.add(category);
            }
        }
        return tree;
    }

    /**
     * 새로운 카테고리를 생성하고 대표 이미지를 등록합니다.
     * @param categoryDTO 생성할 카테고리 데이터
     * @return 생성된 카테고리 (ID 포함)
     */
    @Transactional
    public CategoryDTO createCategory(CategoryDTO categoryDTO) {
        // 1. 카테고리 정보 삽입
        categoryDAO.insertCategory(categoryDTO); // 이 호출 후 categoryDTO.id에 생성된 ID가 채워집니다.

        // 2. 대표 이미지 URL이 있으면 category_images 테이블에 삽입
        if (StringUtils.hasText(categoryDTO.getImageUrl())) {
            categoryDAO.insertPrimaryImage(categoryDTO.getId(), categoryDTO.getImageUrl());
        }

        // 3. 속성 연결 처리
        if (categoryDTO.getAttributes() != null && !categoryDTO.getAttributes().isEmpty()) {
            for (CategoryAttributeDTO attr : categoryDTO.getAttributes()) {
                attr.setCategoryId(categoryDTO.getId());
                categoryDAO.insertCategoryAttribute(attr);
            }
        }

        return categoryDTO;
    }

    /**
     * 카테고리 정보를 수정하고 대표 이미지를 갱신합니다.
     * @param categoryDTO 수정할 카테고리 데이터
     * @return 수정된 카테고리
     */
    @Transactional
    public CategoryDTO updateCategory(CategoryDTO categoryDTO) {
        // 1. 카테고리 기본 정보 수정
        categoryDAO.updateCategory(categoryDTO);

        // 2. 대표 이미지 수정 (기존 것 삭제 후 새로 등록)
        categoryDAO.deletePrimaryImage(categoryDTO.getId());
        if (StringUtils.hasText(categoryDTO.getImageUrl())) {
            categoryDAO.insertPrimaryImage(categoryDTO.getId(), categoryDTO.getImageUrl());
        }

        // 3. 속성 연결 갱신
        categoryDAO.deleteCategoryAttributes(categoryDTO.getId());
        if (categoryDTO.getAttributes() != null && !categoryDTO.getAttributes().isEmpty()) {
            for (CategoryAttributeDTO attr : categoryDTO.getAttributes()) {
                attr.setCategoryId(categoryDTO.getId());
                categoryDAO.insertCategoryAttribute(attr);
            }
        }

        return categoryDAO.findCategoryById(categoryDTO.getId());
    }

    /**
     * 카테고리를 삭제합니다. (대표 이미지도 함께 삭제됩니다)
     * @param categoryId 삭제할 카테고리 ID
     */
    @Transactional
    public void deleteCategory(int categoryId) {
        int childCount = categoryDAO.countChildren(categoryId);
        if (childCount > 0) {
            throw new IllegalArgumentException("하위 카테고리가 존재하여 삭제할 수 없습니다.");
        }

        // 연결된 이미지 먼저 삭제 (FK 제약조건)
        categoryDAO.deleteAllImages(categoryId);

        // 속성 연결 삭제
        categoryDAO.deleteCategoryAttributes(categoryId);

        // 카테고리 삭제
        categoryDAO.deleteCategory(categoryId);
    }

    /**
     * 특정 카테고리에 연결된 속성 목록 조회
     */
    @Transactional(readOnly = true)
    public List<CategoryAttributeDTO> getCategoryAttributes(int categoryId) {
        return categoryDAO.findCategoryAttributes(categoryId);
    }

    /**
     * 카테고리별 속성 조회 - 옵션값까지 포함하여 완전한 AttributeDTO를 반환
     */
    @Transactional(readOnly = true)
    public List<AttributeDTO> getAttributesForCategory(int categoryId) {
        // 1. 기본 속성 정보 조회
        List<AttributeDTO> attributes = categoryDAO.findAttributesByCategoryId(categoryId);

        // 2. 각 속성별로 옵션값들을 조회하여 설정
        for (AttributeDTO attribute : attributes) {
            if ("LIST".equals(attribute.getDataType())) {
                // LIST 타입인 경우 미리 정의된 옵션값들을 조회
                List<AttributeOptionDTO> options = categoryDAO.findAttributeOptions(attribute.getId());
                attribute.setOptions(options);
            } else {
                // 다른 타입의 경우 실제 사용되는 값들을 조회
                List<String> usedValues = categoryDAO.findUsedAttributeValues(attribute.getId(), categoryId);

                // String 값들을 AttributeOptionDTO로 변환
                List<AttributeOptionDTO> options = new ArrayList<>();
                for (int i = 0; i < usedValues.size(); i++) {
                    AttributeOptionDTO option = new AttributeOptionDTO();
                    option.setAttributeId(attribute.getId());
                    // DTO에 value 필드가 없으므로 name을 대신 사용하거나 DTO 수정 필요
                    // 여기서는 임시로 name에 값을 설정
                    option.setValue(usedValues.get(i));
                    option.setDisplayOrder(i + 1);
                    options.add(option);
                }
                attribute.setOptions(options);
            }
        }

        return attributes;
    }

    /**
     * 특정 카테고리 정보를 조회합니다.
     * @param categoryId 카테고리 ID
     * @return 카테고리 정보
     */
    @Transactional(readOnly = true)
    public CategoryDTO getCategoryById(int categoryId) {
        return categoryDAO.findCategoryById(categoryId);
    }

    /**
     * 카테고리의 전체 경로를 조회합니다. (브레드크럼용)
     * @param categoryId 카테고리 ID
     * @return 루트부터 현재 카테고리까지의 경로 목록
     */
    @Transactional(readOnly = true)
    public List<CategoryDTO> getCategoryPath(int categoryId) {
        return categoryDAO.findCategoryPath(categoryId);
    }

    /**
     * 특정 카테고리의 직계 하위 카테고리 목록을 조회합니다.
     * @param categoryId 상위 카테고리 ID
     * @return 하위 카테고리 목록 (상품 개수 포함)
     */
    @Transactional(readOnly = true)
    public List<CategoryDTO> getSubCategories(int categoryId) {
        return categoryDAO.findSubCategoriesWithProductCount(categoryId);
    }

    /**
     * 특정 카테고리와 모든 하위 카테고리의 ID 목록을 조회합니다.
     * @param categoryId 상위 카테고리 ID
     * @return 자기 자신을 포함한 모든 하위 카테고리 ID 목록
     */
    @Transactional(readOnly = true)
    public List<Integer> getAllDescendantIds(int categoryId) {
        return categoryDAO.findAllDescendantIds(categoryId);
    }

    /**
     * 여러 카테고리에 연결된 속성 목록을 조회합니다. (검색 가능한 속성만)
     * @param categoryIds 카테고리 ID 목록
     * @return 속성 목록 (옵션값 포함)
     */
    @Transactional(readOnly = true)
    public List<AttributeDTO> getAttributesForCategories(List<Integer> categoryIds) {
        // 1. 기본 속성 정보 조회
        if (categoryIds == null || categoryIds.isEmpty()) {
            return new ArrayList<>();
        }
        List<AttributeDTO> attributes = categoryDAO.findAttributesByCategoryIds(categoryIds);

        // 2. 각 속성별로 옵션값들을 조회하여 설정
        for (AttributeDTO attribute : attributes) {
            if ("LIST".equals(attribute.getDataType())) {
                // LIST 타입인 경우 미리 정의된 옵션값들을 조회
                List<AttributeOptionDTO> options = categoryDAO.findAttributeOptions(attribute.getId());
                attribute.setOptions(options);
            } else {
                // 다른 타입의 경우 빈 옵션 리스트로 설정 (동적 필터링에서는 사용하지 않음)
                attribute.setOptions(new ArrayList<>());
            }
        }

        return attributes;
    }
}