package com.example.ecommerce.dto;

import lombok.Data;

import java.util.List;

@Data
public class AttributeDTO {
    private int id;
    private String name;
    private String dataType;
    /**
     * 속성의 선택 가능한 옵션값 목록
     */
    private List<AttributeOptionDTO> options;

    /**
     * 속성 그룹 (예: 기본정보, 사이즈정보, 성능정보)
     */
    private String attributeGroup;

    /**
     * 검색 필터로 사용 가능 여부
     */
    private Boolean isSearchable;

    /**
     * 필수 입력 여부
     */
    private Boolean isRequired;

    /**
     * 표시 순서
     */
    private int displayOrder;

    /**
     * LIST 타입이 아닌 경우 옵션 개수 (관리자 페이지용)
     */
    private Integer optionCount;
}