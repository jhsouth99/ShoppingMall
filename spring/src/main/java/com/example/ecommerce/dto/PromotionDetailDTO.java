package com.example.ecommerce.dto;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

import java.util.List;

// 기존 PromotionDTO를 상속받아 상세 정보를 확장합니다.
@Data
@EqualsAndHashCode(callSuper = true)
@ToString(callSuper = true)
public class PromotionDetailDTO extends PromotionDTO {
    
    // 이 프로모션에 연결된 조건 목록
    private List<PromotionConditionDTO> conditions;

    // 이 프로모션이 적용될 상품 ID 목록
    private List<Integer> productIds;
}