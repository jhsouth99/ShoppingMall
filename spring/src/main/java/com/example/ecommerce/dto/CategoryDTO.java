package com.example.ecommerce.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;
import java.util.List;

@Data
// JSON으로 변환 시 null이거나 비어있는 자식 리스트는 제외하여 깔끔하게 만듭니다.
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public class CategoryDTO {
    private int id;
    private String name;
    private Integer parentId; // DB 조회용
    private List<CategoryDTO> children;
    private String description;
    private String imageUrl;
    private int productCount;
    private Integer productCountWithChildren;

    /**
     * 카테고리에 연결된 속성 정보 (모달 수정 시 사용)
     */
    private List<CategoryAttributeDTO> attributes;
}