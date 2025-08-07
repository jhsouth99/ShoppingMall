package com.example.ecommerce.service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.Reader;
import java.sql.Clob;
import java.sql.SQLException;
import java.util.ArrayList; // ArrayList import 추가
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.ecommerce.dao.CartDAO;
import com.example.ecommerce.dto.CartOptionDTO;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class CartOptionService {

    private final CartDAO cartDAO;

    /**
     * 모달용 상품 옵션 정보 조회
     */
    public CartOptionDTO.OptionSelectionResponse getProductOptionsForModal(int productId, int variantId) {
        CartOptionDTO.OptionSelectionResponse response = new CartOptionDTO.OptionSelectionResponse();
        
        try {
            log.debug("상품 옵션 정보 조회 시작 - productId: {}, variantId: {}", productId, variantId);
            
            // 1. 상품 기본 정보 조회
            Map<String, Object> productInfo = cartDAO.selectProductBasicInfo(productId);
            if (productInfo == null) {
                log.warn("상품 정보를 찾을 수 없습니다 - productId: {}", productId);
                response.setSuccess(false);
                response.setMessage("상품 정보를 찾을 수 없습니다.");
                return response;
            }

            // 2. 상품의 모든 옵션 조회
            List<CartOptionDTO.ProductOption> optionGroups = cartDAO.selectProductOptions(productId);
            if (optionGroups == null || optionGroups.isEmpty()) {
                log.warn("상품 옵션 정보를 찾을 수 없습니다 - productId: {}", productId);
                response.setSuccess(false);
                response.setMessage("상품 옵션 정보를 찾을 수 없습니다.");
                return response;
            }

            // 3. 현재 변형 상품의 선택된 옵션 조회
            List<CartOptionDTO.CurrentVariantOption> currentOptions = cartDAO.selectCurrentVariantOptions(variantId);
            
            // 4. DTO 구성
            CartOptionDTO.ProductBasicInfo basicInfo = new CartOptionDTO.ProductBasicInfo();
            basicInfo.setProductId(getIntegerValue(productInfo.get("productId")));
            basicInfo.setProductName((String) productInfo.get("productName"));
            basicInfo.setBasePrice(getDoubleValue(productInfo.get("basePrice")));
            basicInfo.setDescription(clobToString((Clob) productInfo.get("description")));
            basicInfo.setImageUrl((String) productInfo.get("imageUrl"));
            basicInfo.setAltText((String) productInfo.get("altText"));

            CartOptionDTO.CurrentVariant currentVariant = new CartOptionDTO.CurrentVariant();
            currentVariant.setVariantId(variantId);
            currentVariant.setOptionValues(currentOptions);

            response.setSuccess(true);
            response.setProductInfo(basicInfo);
            response.setOptionGroups(optionGroups);
            response.setCurrentVariant(currentVariant);
            
            log.debug("상품 옵션 정보 조회 완료 - productId: {}, variantId: {}", productId, variantId);
            
        } catch (Exception e) {
            log.error("옵션 정보 조회 중 오류 발생 - productId: {}, variantId: {}", productId, variantId, e);
            response.setSuccess(false);
            response.setMessage("옵션 정보 조회 중 오류가 발생했습니다.");
        }
        
        return response;
    }

    private String clobToString(Clob clob) {
        if (clob == null) {
            return null;
        }

        StringBuilder sb = new StringBuilder();
        try (Reader reader = clob.getCharacterStream();
             BufferedReader br = new BufferedReader(reader)) {

            String line;
            while ((line = br.readLine()) != null) {
                sb.append(line);
            }
        } catch (SQLException | IOException e) {
            throw new RuntimeException(e);
        }

        return sb.toString();
    }
    /**
     * 옵션 조합으로 변형 상품 가용성 확인 
     */
    public CartOptionDTO.VariantAvailabilityResponse checkVariantAvailability(int productId, List<Integer> optionValueIds) {
        CartOptionDTO.VariantAvailabilityResponse response = new CartOptionDTO.VariantAvailabilityResponse();
        
        try {
            // null 체크 및 빈 리스트 체크
            if (optionValueIds == null || optionValueIds.isEmpty()) {
                response.setSuccess(false);
                response.setMessage("옵션을 선택해주세요.");
                return response;
            }

            // null 값 필터링
            List<Integer> filteredOptionValueIds = optionValueIds.stream()
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

            if (filteredOptionValueIds.isEmpty()) {
                response.setSuccess(false);
                response.setMessage("유효한 옵션을 선택해주세요.");
                return response;
            }

            // 옵션 조합으로 변형 상품 조회
            Map<String, Object> params = new HashMap<>();
            params.put("productId", productId);
            params.put("optionValueIds", filteredOptionValueIds);
            params.put("optionCount", filteredOptionValueIds.size());

            log.debug("변형 상품 조회 파라미터 - productId: {}, optionValueIds: {}, optionCount: {}", 
                     productId, filteredOptionValueIds, filteredOptionValueIds.size());

            Map<String, Object> variant = cartDAO.selectVariantByOptions(params);

            if (variant != null) {
                String availableStr = String.valueOf(variant.get("available")).trim();
                response.setSuccess(true);
                response.setAvailable("Y".equals(availableStr));
                response.setVariantId(getIntegerValue(variant.get("variantId")));
                response.setStockQuantity(getIntegerValue(variant.get("stockQuantity")));
                
                if (!response.isAvailable()) {
                    response.setMessage("선택한 옵션 조합은 품절되었습니다.");
                }
            } else {
                response.setSuccess(true);
                response.setAvailable(false);
                response.setMessage("선택한 옵션 조합이 존재하지 않습니다.");
            }
            
        } catch (Exception e) {
            log.error("변형 상품 확인 중 오류 발생 - productId: {}, optionValueIds: {}", productId, optionValueIds, e);
            response.setSuccess(false);
            response.setMessage("변형 상품 확인 중 오류가 발생했습니다.");
        }
        
        return response;
    }

    /**
     * 장바구니 아이템 옵션 변경 - 수정된 버전
     */
    @Transactional
    public boolean updateCartItemOptions(int userId, int productId, int currentVariantId, 
                                         List<Integer> optionValueIds, int quantity) {
        try {
            log.debug("장바구니 아이템 옵션 변경 시작 - userId: {}, productId: {}, currentVariantId: {}", 
                     userId, productId, currentVariantId);
            
            // 입력값 검증
            if (optionValueIds == null || optionValueIds.isEmpty()) {
                log.warn("옵션 값이 비어있습니다 - userId: {}, productId: {}", userId, productId);
                return false;
            }

            // null 값 필터링
            List<Integer> filteredOptionValueIds = optionValueIds.stream()
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

            if (filteredOptionValueIds.isEmpty()) {
                log.warn("유효한 옵션 값이 없습니다 - userId: {}, productId: {}", userId, productId);
                return false;
            }

            // 1. 새로운 변형 상품 ID 찾기
            Map<String, Object> params = new HashMap<>();
            params.put("productId", productId);
            params.put("optionValueIds", filteredOptionValueIds);
            params.put("optionCount", filteredOptionValueIds.size());

            log.debug("변형 상품 조회 파라미터 - productId: {}, optionValueIds: {}, optionCount: {}", 
                     productId, filteredOptionValueIds, filteredOptionValueIds.size());

            Map<String, Object> variant = cartDAO.selectVariantByOptions(params);
            if (variant == null) {
                log.warn("선택된 옵션에 해당하는 변형 상품을 찾을 수 없습니다");
                return false;
            }

            Integer newVariantId = getIntegerValue(variant.get("variantId"));
            if (newVariantId == null) {
                log.warn("변형 상품 ID가 null입니다");
                return false;
            }
            boolean isAvailable = "Y".equals(variant.get("available"));
            
            if (!isAvailable) {
                log.warn("선택된 변형 상품이 품절 상태입니다 - variantId: {}", newVariantId);
                return false;
            }

            // 2. 새로운 변형 상품이 이미 장바구니에 있는지 확인
            Map<String, Object> checkParams = new HashMap<>();
            checkParams.put("userId", userId);
            checkParams.put("variantId", newVariantId);
            
            int existingQuantity = cartDAO.checkExistingCartItem(checkParams);

            if (existingQuantity > 0 && newVariantId != currentVariantId) {
                // 3-1. 이미 존재하는 경우: 기존 아이템 삭제 후 수량 증가
                Map<String, Object> deleteParams = new HashMap<>();
                deleteParams.put("userId", userId);
                deleteParams.put("productVariantId", currentVariantId);
                cartDAO.deleteCartItemByParams(deleteParams);

                Map<String, Object> increaseParams = new HashMap<>();
                increaseParams.put("userId", userId);
                increaseParams.put("variantId", newVariantId);
                increaseParams.put("additionalQuantity", quantity);
                cartDAO.increaseCartItemQuantity(increaseParams);
                
            } else {
                // 3-2. 새로운 변형이거나 동일한 변형인 경우: 업데이트
                Map<String, Object> updateParams = new HashMap<>();
                updateParams.put("userId", userId);
                updateParams.put("currentVariantId", currentVariantId);
                updateParams.put("newVariantId", newVariantId);
                updateParams.put("quantity", quantity);
                cartDAO.updateCartItemVariant(updateParams);
            }

            log.debug("장바구니 아이템 옵션 변경 완료 - userId: {}, newVariantId: {}", userId, newVariantId);
            return true;
            
        } catch (Exception e) {
            log.error("장바구니 아이템 옵션 변경 중 오류 발생 - userId: {}, productId: {}, currentVariantId: {}", 
                     userId, productId, currentVariantId, e);
            return false;
        }
    }

    /**
     * 선택된 옵션들로 변형 상품 찾기 - 수정된 버전
     */
    public CartOptionDTO.VariantAvailabilityResponse findVariantBySelectedOptions(int productId, 
                                                                                  List<CartOptionDTO.SelectedOption> selectedOptions) {
        CartOptionDTO.VariantAvailabilityResponse response = new CartOptionDTO.VariantAvailabilityResponse();
        
        try {
            if (selectedOptions == null || selectedOptions.isEmpty()) {
                response.setSuccess(false);
                response.setMessage("옵션을 선택해주세요.");
                return response;
            }
            
            List<Integer> optionValueIds = new ArrayList<>();
            for (CartOptionDTO.SelectedOption option : selectedOptions) {
                if (option != null && option.getValueId() > 0) { // null 체크 및 양수 체크
                    optionValueIds.add(option.getValueId());
                }
            }

            if (optionValueIds.isEmpty()) {
                response.setSuccess(false);
                response.setMessage("유효한 옵션을 선택해주세요.");
                return response;
            }

            return checkVariantAvailability(productId, optionValueIds);
            
        } catch (Exception e) {
            log.error("변형 상품 조회 중 오류 발생 - productId: {}, selectedOptions: {}", productId, selectedOptions, e);
            response.setSuccess(false);
            response.setMessage("변형 상품 조회 중 오류가 발생했습니다.");
            return response;
        }
    }

    /**
     * 장바구니 아이템 옵션 변경 (DTO 사용)
     */
    @Transactional
    public boolean updateCartItemWithDTO(CartOptionDTO.CartItemUpdateRequest request) {
        try {
            List<Integer> optionValueIds = new ArrayList<>();
            for (CartOptionDTO.SelectedOption option : request.getOptionValues()) {
                optionValueIds.add(option.getValueId());
            }

            Integer productId = getProductIdByVariantId(request.getCurrentVariantId());
            if (productId == null) {
                log.error("변형 상품에 해당하는 상품 ID를 찾을 수 없습니다 - variantId: {}", request.getCurrentVariantId());
                return false;
            }

            return updateCartItemOptions(
                request.getUserId(),
                productId,
                request.getCurrentVariantId(),
                optionValueIds,
                request.getQuantity()
            );
            
        } catch (Exception e) {
            log.error("장바구니 아이템 옵션 변경 중 오류 발생 - request: {}", request, e);
            return false;
        }
    }

    /**
     * 변형 상품 ID로 상품 ID 조회
     */
    public Integer getProductIdByVariantId(int variantId) {
        try {
            return cartDAO.selectProductIdByVariantId(variantId);
        } catch (Exception e) {
            log.error("변형 상품 ID로 상품 ID 조회 중 오류 발생 - variantId: {}", variantId, e);
            return null;
        }
    }
    
    // 헬퍼 메서드들
    private Integer getIntegerValue(Object value) {
        if (value == null) return null;
        if (value instanceof Integer) return (Integer) value;
        if (value instanceof Number) return ((Number) value).intValue();
        try {
            return Integer.parseInt(value.toString());
        } catch (NumberFormatException e) {
            log.warn("Integer 변환 실패: {}", value, e);
            return null;
        }
    }
    
    private Double getDoubleValue(Object value) {
        if (value == null) return null;
        if (value instanceof Double) return (Double) value;
        if (value instanceof Number) return ((Number) value).doubleValue();
        try {
            return Double.parseDouble(value.toString());
        } catch (NumberFormatException e) {
            log.warn("Double 변환 실패: {}", value, e);
            return null;
        }
    }
}