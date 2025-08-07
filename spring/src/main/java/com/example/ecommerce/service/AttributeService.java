package com.example.ecommerce.service;

import com.example.ecommerce.dao.AttributeDAO;
import com.example.ecommerce.dto.AttributeDTO;
import com.example.ecommerce.dto.AttributeOptionDTO;
import com.example.ecommerce.dto.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AttributeService {

    private final AttributeDAO attributeDAO;

    /**
     * 속성 목록 조회 (페이징, 필터링 지원)
     */
    @Transactional(readOnly = true)
    public PageResult<AttributeDTO> getAttributes(int page, int size, String keyword, String dataType, String attributeGroup) {
        Map<String, Object> params = new HashMap<>();
        params.put("keyword", keyword);
        params.put("dataType", dataType);
        params.put("attributeGroup", attributeGroup);
        params.put("offset", (page - 1) * size);
        params.put("size", size);

        List<AttributeDTO> content = attributeDAO.findAttributesWithPaging(params);
        int totalElements = attributeDAO.countAttributes(params);
        int totalPages = (int) Math.ceil((double) totalElements / size);

        // 각 속성별로 옵션 개수 설정
        for (AttributeDTO attribute : content) {
            if ("LIST".equals(attribute.getDataType())) {
                int optionCount = attributeDAO.countAttributeOptions(attribute.getId());
                attribute.setOptionCount(optionCount);
            } else {
                attribute.setOptionCount(0);
            }
        }

        return new PageResult<>(content, totalElements, page, size);
    }

    /**
     * 특정 속성 상세 정보 조회
     */
    @Transactional(readOnly = true)
    public AttributeDTO getAttributeDetail(int attributeId) {
        AttributeDTO attribute = attributeDAO.findAttributeById(attributeId);
        if (attribute == null) {
            throw new IllegalArgumentException("존재하지 않는 속성입니다.");
        }

        // LIST 타입인 경우 옵션 목록도 함께 조회
        if ("LIST".equals(attribute.getDataType())) {
            List<AttributeOptionDTO> options = attributeDAO.findAttributeOptions(attributeId);
            attribute.setOptions(options);
        }

        return attribute;
    }

    /**
     * 새로운 속성 생성
     */
    @Transactional
    public AttributeDTO createAttribute(AttributeDTO attributeDTO) {
        // 속성명 중복 체크
        if (attributeDAO.existsByName(attributeDTO.getName())) {
            throw new IllegalArgumentException("이미 존재하는 속성명입니다.");
        }

        // 기본값 설정
        if (attributeDTO.getIsSearchable() == null) {
            attributeDTO.setIsSearchable(false);
        }
        if (attributeDTO.getIsRequired() == null) {
            attributeDTO.setIsRequired(false);
        }
        if (attributeDTO.getDisplayOrder() == 0) {
            attributeDTO.setDisplayOrder(0);
        }

        // 속성 생성
        attributeDAO.insertAttribute(attributeDTO);

        // LIST 타입인 경우 옵션값들도 함께 저장
        if ("LIST".equals(attributeDTO.getDataType()) && attributeDTO.getOptions() != null) {
            for (int i = 0; i < attributeDTO.getOptions().size(); i++) {
                AttributeOptionDTO option = attributeDTO.getOptions().get(i);
                option.setAttributeId(attributeDTO.getId());
                option.setDisplayOrder(i);
                attributeDAO.insertAttributeOption(option);
            }
        }

        return getAttributeDetail(attributeDTO.getId());
    }

    /**
     * 기존 속성 수정
     */
    @Transactional
    public AttributeDTO updateAttribute(AttributeDTO attributeDTO) {
        AttributeDTO existing = attributeDAO.findAttributeById(attributeDTO.getId());
        if (existing == null) {
            throw new IllegalArgumentException("존재하지 않는 속성입니다.");
        }

        // 속성명 중복 체크 (자기 자신 제외)
        if (!existing.getName().equals(attributeDTO.getName()) &&
                attributeDAO.existsByName(attributeDTO.getName())) {
            throw new IllegalArgumentException("이미 존재하는 속성명입니다.");
        }

        // 속성 정보 수정
        attributeDAO.updateAttribute(attributeDTO);

        // LIST 타입인 경우 옵션값들 처리
        if ("LIST".equals(attributeDTO.getDataType()) && attributeDTO.getOptions() != null) {
            // 기존 옵션들 중 참조되고 있는지 확인
            List<AttributeOptionDTO> existingOptions = attributeDAO.findAttributeOptions(attributeDTO.getId());

            // 사용 중인 옵션이 있는지 체크
            boolean hasUsedOptions = false;
            for (AttributeOptionDTO option : existingOptions) {
                if (attributeDAO.countOptionUsage(option.getId()) > 0) {
                    hasUsedOptions = true;
                    break;
                }
            }

            if (hasUsedOptions) {
                // 사용 중인 옵션이 있으면 삭제하지 않고 비활성화하거나 오류 메시지 반환
                throw new IllegalStateException("이 속성의 옵션값들이 상품에서 사용 중이므로 수정할 수 없습니다. 먼저 해당 상품들의 속성값을 변경해주세요.");
            } else {
                // 사용 중인 옵션이 없으면 안전하게 삭제 후 재추가
                attributeDAO.deleteAttributeOptions(attributeDTO.getId());

                // 새로운 옵션들 추가
                for (int i = 0; i < attributeDTO.getOptions().size(); i++) {
                    AttributeOptionDTO option = attributeDTO.getOptions().get(i);
                    option.setAttributeId(attributeDTO.getId());
                    option.setDisplayOrder(i);
                    attributeDAO.insertAttributeOption(option);
                }
            }
        }

        return getAttributeDetail(attributeDTO.getId());
    }

    /**
     * 속성 삭제
     */
    @Transactional
    public void deleteAttribute(int attributeId) {
        // 사용 중인 속성인지 확인
        int usageCount = attributeDAO.countAttributeUsage(attributeId);
        if (usageCount > 0) {
            throw new IllegalStateException("카테고리나 상품에서 사용 중인 속성은 삭제할 수 없습니다.");
        }

        // 옵션 사용 여부 체크
        List<AttributeOptionDTO> options = attributeDAO.findAttributeOptions(attributeId);
        for (AttributeOptionDTO option : options) {
            if (attributeDAO.countOptionUsage(option.getId()) > 0) {
                throw new IllegalStateException("이 속성의 옵션값들이 상품에서 사용 중이므로 삭제할 수 없습니다.");
            }
        }

        // 옵션들 먼저 삭제
        attributeDAO.deleteAttributeOptions(attributeId);

        // 속성 삭제
        attributeDAO.deleteAttribute(attributeId);
    }

    /**
     * 속성 옵션 목록 조회
     */
    @Transactional(readOnly = true)
    public List<AttributeOptionDTO> getAttributeOptions(int attributeId) {
        return attributeDAO.findAttributeOptions(attributeId);
    }

    /**
     * 속성 옵션 추가
     */
    @Transactional
    public AttributeOptionDTO addAttributeOption(int attributeId, String optionValue) {
        // 속성이 LIST 타입인지 확인
        AttributeDTO attribute = attributeDAO.findAttributeById(attributeId);
        if (attribute == null) {
            throw new IllegalArgumentException("존재하지 않는 속성입니다.");
        }
        if (!"LIST".equals(attribute.getDataType())) {
            throw new IllegalArgumentException("LIST 타입 속성만 옵션을 추가할 수 있습니다.");
        }

        // 중복 옵션값 체크
        if (attributeDAO.existsOptionValue(attributeId, optionValue)) {
            throw new IllegalArgumentException("이미 존재하는 옵션값입니다.");
        }

        // 다음 표시 순서 계산
        int nextOrder = attributeDAO.getNextOptionDisplayOrder(attributeId);

        AttributeOptionDTO option = new AttributeOptionDTO();
        option.setAttributeId(attributeId);
        option.setValue(optionValue);
        option.setDisplayOrder(nextOrder);

        attributeDAO.insertAttributeOption(option);
        return option;
    }

    /**
     * 속성 옵션 삭제
     */
    @Transactional
    public void deleteAttributeOption(int optionId) {
        // 사용 중인 옵션인지 확인
        int usageCount = attributeDAO.countOptionUsage(optionId);
        if (usageCount > 0) {
            throw new IllegalStateException("상품에서 사용 중인 옵션은 삭제할 수 없습니다.");
        }

        attributeDAO.deleteAttributeOption(optionId);
    }

    /**
     * 모든 속성 목록 조회 (카테고리 연결용)
     */
    @Transactional(readOnly = true)
    public List<AttributeDTO> getAllAttributes() {
        return attributeDAO.findAllAttributes();
    }
}