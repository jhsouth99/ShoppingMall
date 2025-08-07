package com.example.ecommerce.controller;

import com.example.ecommerce.dto.AttributeDTO;
import com.example.ecommerce.dto.AttributeOptionDTO;
import com.example.ecommerce.dto.PageResult;
import com.example.ecommerce.service.AttributeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Controller
@RequiredArgsConstructor
public class AttributeController {

    private final AttributeService attributeService;

    /**
     * 속성 목록 조회 (페이징, 필터링 지원)
     */
    @GetMapping("/api/admin/attributes")
    @ResponseBody
    public ResponseEntity<PageResult<AttributeDTO>> getAttributes(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(defaultValue = "") String dataType,
            @RequestParam(defaultValue = "") String attributeGroup) {

        PageResult<AttributeDTO> result = attributeService.getAttributes(page, size, keyword, dataType, attributeGroup);
        return ResponseEntity.ok(result);
    }

    /**
     * 모든 속성 목록 조회 (카테고리 모달용)
     */
    @GetMapping("/api/admin/attributes/all")
    @ResponseBody
    public ResponseEntity<List<AttributeDTO>> getAllAttributesForCategory() {
        try {
            List<AttributeDTO> attributes = attributeService.getAllAttributes();
            return ResponseEntity.ok(attributes);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * 특정 속성 상세 정보 조회
     */
    @GetMapping("/api/admin/attributes/{attributeId}")
    @ResponseBody
    public ResponseEntity<AttributeDTO> getAttributeDetail(@PathVariable int attributeId) {
        try {
            AttributeDTO attribute = attributeService.getAttributeDetail(attributeId);
            return ResponseEntity.ok(attribute);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * 새로운 속성 생성
     */
    @PostMapping("/api/admin/attributes")
    @ResponseBody
    public ResponseEntity<AttributeDTO> createAttribute(@RequestBody AttributeDTO attributeDTO) {
        try {
            AttributeDTO createdAttribute = attributeService.createAttribute(attributeDTO);
            return new ResponseEntity<>(createdAttribute, HttpStatus.CREATED);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    /**
     * 기존 속성 수정
     */
    @PutMapping("/api/admin/attributes/{attributeId}")
    @ResponseBody
    public ResponseEntity<?> updateAttribute(
            @PathVariable int attributeId,
            @RequestBody AttributeDTO attributeDTO) {
        try {
            attributeDTO.setId(attributeId);
            AttributeDTO updatedAttribute = attributeService.updateAttribute(attributeDTO);
            return ResponseEntity.ok(updatedAttribute);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "속성 수정 중 오류가 발생했습니다."));
        }
    }

    /**
     * 속성 삭제
     */
    @DeleteMapping("/api/admin/attributes/{attributeId}")
    @ResponseBody
    public ResponseEntity<?> deleteAttribute(@PathVariable int attributeId) {
        try {
            attributeService.deleteAttribute(attributeId);
            return ResponseEntity.noContent().build();
        } catch (IllegalStateException e) {
            // 사용 중인 속성은 삭제할 수 없음
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "속성 삭제 중 오류가 발생했습니다."));
        }
    }

    /**
     * 속성 옵션 추가
     */
    @PostMapping("/api/admin/attributes/{attributeId}/options")
    @ResponseBody
    public ResponseEntity<?> addAttributeOption(
            @PathVariable int attributeId,
            @RequestBody Map<String, String> request) {
        try {
            String optionValue = request.get("optionValue");
            if (optionValue == null || optionValue.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "옵션값을 입력해주세요."));
            }

            AttributeOptionDTO option = attributeService.addAttributeOption(attributeId, optionValue.trim());
            return new ResponseEntity<>(option, HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "옵션 추가 중 오류가 발생했습니다."));
        }
    }

    /**
     * 속성 옵션 삭제
     */
    @DeleteMapping("/api/admin/attribute-options/{optionId}")
    @ResponseBody
    public ResponseEntity<?> deleteAttributeOption(@PathVariable int optionId) {
        try {
            attributeService.deleteAttributeOption(optionId);
            return ResponseEntity.noContent().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "옵션 삭제 중 오류가 발생했습니다."));
        }
    }

    /**
     * 속성 옵션 목록 조회
     */
    @GetMapping("/api/admin/attributes/{attributeId}/options")
    @ResponseBody
    public ResponseEntity<List<AttributeOptionDTO>> getAttributeOptions(@PathVariable int attributeId) {
        try {
            List<AttributeOptionDTO> options = attributeService.getAttributeOptions(attributeId);
            return ResponseEntity.ok(options);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

}
