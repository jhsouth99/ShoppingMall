package com.example.ecommerce.service;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.*;

import com.example.ecommerce.dao.*;
import com.example.ecommerce.dto.*;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class ProductService {

    private static final Logger logger = LoggerFactory.getLogger(ProductService.class);
    private final FileUploadService fileUploadService;
    private final ObjectMapper objectMapper;
    private final ProductDAO productDAO;
    private final CategoryDAO categoryDAO;
    private final PromotionDAO promotionDAO;
    private final ReviewDAO reviewDAO;
    private final QnADAO qnADAO;

    @Value("${file.upload.product-images.path:/images/products/}")
    private String uploadPath;

    // 허용되는 이미지 타입 (DB 제약조건과 일치)
    private static final List<String> ALLOWED_IMAGE_TYPES =
            Arrays.asList("PRIMARY", "HERO", "GALLERY", "DETAIL");

    @Transactional(readOnly = true)
    public List<ProductVariantDTO> getGroupBuyableVariants(int sellerId) {
        return productDAO.findGroupBuyableVariantsBySellerId(sellerId);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getTargetableProducts(int sellerId) {
        return productDAO.findTargetableProductsBySellerId(sellerId);
    }

    @Transactional(readOnly = true)
    public PageResult<SearchProductDTO> searchProducts(Map<String, Object> filters) {
        // 가격 필터 문자열을 실제 숫자 값으로 변환
        String priceRange = (String) filters.get("priceRange");
        if ("under-100000".equals(priceRange)) {
            filters.put("maxPrice", 100000);
        } else if ("100000-300000".equals(priceRange)) {
            filters.put("minPrice", 100000);
            filters.put("maxPrice", 300000);
        } else if ("over-300000".equals(priceRange)) {
            filters.put("minPrice", 300000);
        }

        int page = (int) filters.getOrDefault("page", 1);
        int size = (int) filters.getOrDefault("size", 12);
        filters.put("offset", (page - 1) * size);
        filters.put("size", size);

        List<SearchProductDTO> content = productDAO.searchProducts(filters);
        for (SearchProductDTO dto : content) {
            buildDiscountInfo(dto);
        }
        int totalElements = productDAO.countSearchedProducts(filters);

        return new PageResult<>(content, totalElements, page, size);
    }

    @Transactional(readOnly = true)
    public int getSearchResultCount(Map<String, Object> filters) {
        return productDAO.countSearchedProducts(filters);
    }

    @Transactional(readOnly = true)
    public List<SearchProductDTO> getRecommendedProducts() {
        List<SearchProductDTO> dtos = productDAO.findRecommendedProducts();
        System.out.println(dtos.size());
        for (int i = 0; i < dtos.size(); i++) {
            SearchProductDTO dto = dtos.get(i);
            buildDiscountInfo(dto);
        }
        return dtos;
    }

    @Transactional(readOnly = true)
    public List<SearchProductDTO> getFilteredProducts(Map<String, Object> filters) {
        // 가격 필터 문자열을 실제 숫자 값으로 변환
        String priceFilter = (String) filters.get("priceFilter");
        if ("under-100000".equals(priceFilter)) {
            filters.put("maxPrice", 100000);
        } else if ("100000-300000".equals(priceFilter)) {
            filters.put("minPrice", 100000);
            filters.put("maxPrice", 300000);
        } else if ("over-300000".equals(priceFilter)) {
            filters.put("minPrice", 300000);
        }

        int page = (int) filters.getOrDefault("page", 1);
        int size = (int) filters.getOrDefault("size", 12);
        filters.put("offset", (page - 1) * size);
        filters.put("size", size);

        List<SearchProductDTO> dtos = productDAO.findFilteredProducts(filters);
        for (SearchProductDTO dto : dtos) {
            buildDiscountInfo(dto);
        }
        return dtos;
    }

    private void buildDiscountInfo(SearchProductDTO dto) {
        ObjectMapper objectMapper = new ObjectMapper();
        try {
            System.out.println(objectMapper.writeValueAsString(dto));
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
        String type = null;
        Integer maxAmount = null;
        Boolean isDiscountRateReachedToMaxAmount = null;
        List<PromotionDTO> promotions = promotionDAO.findPromotionsByProductId(dto.getId());
        for (PromotionDTO promotion : promotions) {
            if (!promotion.getIsActive()
                    || !promotion.getStartDate().isBefore(LocalDateTime.now())
                    || !promotion.getEndDate().isAfter(LocalDateTime.now()))
                continue;
            if (promotion.getDiscountType().equals("PERCENTAGE")) {
                boolean t = false;
                int amount = (int) (promotion.getDiscountValue() * dto.getBasePrice() / 100);
                if (promotion.getMaxDiscountAmount() != null && promotion.getMaxDiscountAmount() > 0 && amount > promotion.getMaxDiscountAmount()) {
                    amount = promotion.getMaxDiscountAmount();
                    t = true;
                }
                if (maxAmount == null || amount > maxAmount) {
                    type = "PERCENTAGE";
                    maxAmount = amount;
                    isDiscountRateReachedToMaxAmount = t;
                }
            }
            else if (promotion.getDiscountType().equals("FIXED_AMOUNT")) {
                int amount = promotion.getDiscountValue();
                if (promotion.getMaxDiscountAmount() != null && promotion.getMaxDiscountAmount() > 0 && amount > promotion.getMaxDiscountAmount()) {
                    amount =  promotion.getMaxDiscountAmount();
                }
                if (maxAmount == null || amount > maxAmount) {
                    type = "FIXED_AMOUNT";
                    maxAmount = amount;
                    isDiscountRateReachedToMaxAmount = null;
                }
            }
        }
        if (type != null) {
            dto.setDiscountAmount(maxAmount);
            dto.setDiscountRate((int) (maxAmount / dto.getBasePrice() * 100));
        }
        try {
            System.out.println(" -> " + objectMapper.writeValueAsString(dto));
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * 판매자의 상품 목록을 조건에 맞게 조회합니다. (페이징 포함)
     */
    @Transactional(readOnly = true)
    public PageResult<ProductSummaryDTO> getProducts(int sellerId, int page, int size, String keyword, String status) {
        // DB 페이징을 위한 offset 계산 (페이지는 1부터 시작)
        int offset = (page > 0) ? (page - 1) * size : 0;

        // DAO에 전달할 파라미터 맵 생성
        Map<String, Object> params = new HashMap<>();
        params.put("sellerId", sellerId);
        params.put("offset", offset);
        params.put("size", size);
        params.put("keyword", keyword);
        params.put("status", status);

        // 데이터 조회
        List<ProductSummaryDTO> content = productDAO.findProductsBySellerId(params);
        int totalElements = productDAO.countProductsBySellerId(params);

        // PageResult 객체로 포장하여 반환
        return new PageResult<>(content, totalElements, page, size);
    }

    /**
     * 특정 상품의 모든 변형(Variant) 목록을 조회합니다. (교환 옵션 선택용)
     */
    @Transactional(readOnly = true)
    public List<ProductVariantDTO> getVariantsByProductId(int productId) {
        return productDAO.findVariantsByProductId(productId);
    }

    /**
     * 특정 상품의 모든 상세 정보를 조회합니다.
     */
    @Transactional(readOnly = true)
    public ProductDetailDTO getProductDetails(int productId) {
        // 상품 기본 정보 조회
        ProductDetailDTO product = productDAO.findProductById(productId);
        if (product == null) {
            throw new SecurityException("조회 권한이 없는 상품입니다.");
        }

        product.setAttributes(productDAO.findAttributesByProductId(productId));

        // 상품의 카테고리 경로 조회 및 설정
        if (product.getCategoryId() != null && product.getCategoryId() > 0) {
            List<Integer> categoryPath = categoryDAO.findCategoryPathById(product.getCategoryId());
            product.setCategoryPath(categoryPath);
        }

        // 옵션 및 변형 정보 조회 후 DTO에 설정
        product.setOptions(productDAO.findOptionsByProductId(productId));
        product.setVariants(productDAO.findVariantsByProductId(productId));

        // 이미지 정보 조회 및 설정 - 수정된 부분
        List<ProductImageDTO> images = productDAO.findImagesByProductId(productId);
        if (images != null && !images.isEmpty()) {
            product.setImages(images); // setImages 메서드가 URL 목록도 함께 설정
            logger.info("상품 {} 이미지 로드 완료: {} 개", productId, images.size());
            images.forEach(img -> logger.info("이미지: ID={}, URL={}", img.getId(), img.getImageUrl()));
        } else {
            logger.warn("상품 {} 이미지가 없습니다.", productId);
        }

        List<PromotionDTO> promotions = promotionDAO.findPromotionsByProductId(productId);

        int originalPrice = product.getBasePrice();
        if (promotions == null || promotions.isEmpty()) {
            product.setDiscountRate(0);
            product.setDiscountPrice(originalPrice);
        } else {
            int maxDiscountAmount = 0;

            // 현재 활성화된 프로모션 중에서 가장 할인 금액이 큰 것을 찾기
            for (PromotionDTO promotion : promotions) {
                // 프로모션이 활성화되어 있고 유효기간 내인지 확인
                if (promotion.getIsActive()
                        && promotion.getStartDate().isBefore(LocalDateTime.now())
                        && promotion.getEndDate().isAfter(LocalDateTime.now())) {
                    int discountAmount;
                    switch (promotion.getPromotionType()) {
                        case "PERCENTAGE":
                            discountAmount = (int) (originalPrice * (promotion.getDiscountValue() / 100.0));
                            break;
                        case "FIXED_AMOUNT":
                            discountAmount = promotion.getDiscountValue();
                            break;
                        case "BUY_X_GET_Y":
                            discountAmount = 0;
                            break;
                        default:
                            logger.warn("알 수 없는 할인 타입: {}", promotion.getDiscountType());
                            discountAmount = 0;
                            break;
                    }
                    // 최대 할인 금액 제한이 있는 경우 적용
                    if (promotion.getMaxDiscountAmount() != null && promotion.getMaxDiscountAmount() > 0) {
                        discountAmount = Math.min(discountAmount, promotion.getMaxDiscountAmount());
                        if (discountAmount > maxDiscountAmount) {
                            maxDiscountAmount = discountAmount;
                        }
                    }
                }
            }
            int discountPrice = product.getBasePrice() - maxDiscountAmount;
            int discountRate = (int) (((float)maxDiscountAmount / product.getBasePrice()) * 100);
            product.setDiscountRate(discountRate);
            product.setDiscountPrice(discountPrice);

        }
        int reviewCount = reviewDAO.countReviewsByProductId(Collections.singletonMap("productId", productId));
        product.setReviewCount(reviewCount);

        int qnaCount = qnADAO.countQnAsByProductId(productId);
        product.setQnaCount(qnaCount);
        return product;
    }

    /**
     * 새 상품을 등록합니다. (이미지 순서 처리 추가)
     */
    @Transactional
    public int createProduct(ProductDetailDTO productData, List<MultipartFile> imageFiles, String imageTypesJson) {
        int productId;

        if (productData.getVariants() != null && !productData.getVariants().isEmpty()) {
            productData.setBasePrice(productData.getVariants().stream()
                    .map(ProductVariantDTO::getPrice)
                    .reduce(Integer.MAX_VALUE, Integer::min));
            productDAO.insertProduct(productData);
            productId = productData.getId();
            saveOptionsAndVariants(productId, productData);
        } else {
            productDAO.insertProduct(productData);
            productId = productData.getId();
            ProductVariantDTO defaultVariant = new ProductVariantDTO();
            defaultVariant.setProductId(productId);
            defaultVariant.setPrice(productData.getBasePrice());
            defaultVariant.setStockQuantity(productData.getStockQuantity());
            defaultVariant.setSku(productData.getName() + "-STD");
            defaultVariant.setIsActive(true);
            productDAO.insertProductVariant(defaultVariant);
        }

        saveAttributes(productId, productData.getAttributes());

        if (imageFiles != null && !imageFiles.isEmpty()) {
            List<String> imageUrls = uploadProductImages(productId, imageFiles);
            updateProductImages(productId, imageUrls, imageFiles, 0); // 새 상품이므로 시작 순서는 0
            productData.setImageUrls(imageUrls);
        }

        return productId;
    }

    /**
     * 기존 상품 정보를 수정합니다. (이미지 순서 처리 추가)
     */
    @Transactional
    public void updateProduct(int sellerId, int productId, ProductDetailDTO productData,
                              List<MultipartFile> imageFiles, String imageTypesJson) {
        productData.setId(productId);
        productData.setSellerId(sellerId);

        if (productData.getVariants() != null && !productData.getVariants().isEmpty()) {
            productData.setBasePrice(productData.getVariants().stream()
                    .map(ProductVariantDTO::getPrice)
                    .reduce(Integer.MAX_VALUE, Integer::min));
        }

        // 상품 기본 정보 업데이트
        productDAO.updateProduct(productData);

        // 기존 옵션 및 변형 정보 모두 삭제
        productDAO.deleteVariantsByProductId(productId);
        productDAO.deleteOptionsByProductId(productId);
        productDAO.deleteAttributeValuesByProductId(productId);

        // 새 옵션 및 변형 정보 다시 저장
        if (productData.getVariants() != null && !productData.getVariants().isEmpty()) {
            saveOptionsAndVariants(productId, productData);
        } else {
            ProductVariantDTO defaultVariant = new ProductVariantDTO();
            defaultVariant.setProductId(productId);
            defaultVariant.setPrice(productData.getBasePrice());
            defaultVariant.setStockQuantity(productData.getStockQuantity());
            defaultVariant.setSku(productData.getName() + "-STD");
            defaultVariant.setIsActive(true);
            productDAO.insertProductVariant(defaultVariant);
        }

        saveAttributes(productId, productData.getAttributes());

        // 새 이미지가 업로드된 경우 처리
        if (imageFiles != null && !imageFiles.isEmpty()) {
            processProductImages(productId, imageFiles, imageTypesJson);
        }
    }

    /**
     * 상품 이미지를 타입별로 처리합니다.
     */
    private void processProductImages(int productId, List<MultipartFile> imageFiles, String imageTypesJson) {
        try {
            // 이미지 타입 정보 파싱
            List<Map<String, Object>> imageTypes = null;
            if (imageTypesJson != null && !imageTypesJson.isEmpty()) {
                imageTypes = objectMapper.readValue(imageTypesJson, new TypeReference<List<Map<String, Object>>>() {});
            }

            // 이미지 파일 업로드
            List<String> uploadedImageUrls = uploadProductImages(productId, imageFiles);

            // 이미지 타입 정보와 업로드된 이미지를 매핑하여 DB 저장
            for (int i = 0; i < uploadedImageUrls.size(); i++) {
                String imageUrl = uploadedImageUrls.get(i);
                MultipartFile file = imageFiles.get(i);

                // 이미지 타입 결정
                String imageType = "PRIMARY"; // 기본값
                int displayOrder = i + 1;

                if (imageTypes != null && i < imageTypes.size()) {
                    Map<String, Object> typeInfo = imageTypes.get(i);
                    String specifiedType = (String) typeInfo.get("type");
                    Integer specifiedOrder = (Integer) typeInfo.get("displayOrder");

                    if (specifiedType != null && ALLOWED_IMAGE_TYPES.contains(specifiedType)) {
                        imageType = specifiedType;
                    }
                    if (specifiedOrder != null && specifiedOrder > 0) {
                        displayOrder = specifiedOrder;
                    }
                }

                // DB에 이미지 정보 저장
                ProductImageDTO imageDTO = new ProductImageDTO();
                imageDTO.setId(UUID.randomUUID().toString());
                imageDTO.setProductId(productId);
                imageDTO.setImageUrl(imageUrl);
                imageDTO.setImageType(imageType);
                imageDTO.setDisplayOrder(displayOrder);
                imageDTO.setFileSize(file.getSize());
                imageDTO.setMimeType(file.getContentType());
                imageDTO.setOriginalFilename(file.getOriginalFilename());
                imageDTO.setIsActive(true);

                productDAO.insertProductImage(imageDTO);

                logger.info("이미지 DB 저장 완료: productId={}, imageUrl={}, type={}, order={}",
                        productId, imageUrl, imageType, displayOrder);
            }

        } catch (Exception e) {
            logger.error("이미지 처리 중 오류 발생: productId=" + productId, e);
            throw new RuntimeException("이미지 처리 실패", e);
        }
    }

    // 상품 속성을 저장하는 공통 로직
    private void saveAttributes(int productId, List<ProductAttributeValueDTO> attributes) {
        if (attributes == null || attributes.isEmpty()) {
            return;
        }

        for (ProductAttributeValueDTO attr : attributes) {
            if (attr.getAttributeId() == 0 || attr.getValue() == null || attr.getValue().isEmpty()) {
                continue; // 유효하지 않은 데이터는 건너뛰기
            }

            // DB에서 현재 속성의 실제 정보(특히 dataType)를 조회합니다.
            AttributeDTO attributeInfo = categoryDAO.getAttributeById(attr.getAttributeId());
            if (attributeInfo == null) {
                logger.warn("ID {}에 해당하는 속성 정보를 찾을 수 없습니다. 건너뜁니다.", attr.getAttributeId());
                continue;
            }

            String[] values = attr.getValue().split(",");

            for (String value : values) {
                if (value == null || value.trim().isEmpty()) continue;

                Map<String, Object> params = new HashMap<>();
                params.put("productId", productId);
                params.put("attributeId", attr.getAttributeId());

                // [핵심 수정] 속성의 dataType에 따라 다른 파라미터 키를 사용합니다.
                switch (attributeInfo.getDataType()) {
                    case "LIST":
                        // LIST 타입은 숫자 형태의 옵션 ID를 attributeOptionId 컬럼에 저장
                        params.put("attributeOptionId", Integer.parseInt(value.trim()));
                        break;
                    case "NUMBER":
                        params.put("valueNumber", Double.parseDouble(value.trim()));
                        break;
                    case "DATE":
                        // 날짜 형식에 맞게 파싱 필요 (예시)
                        // params.put("valueDate", LocalDate.parse(value.trim()));
                        params.put("valueText", value.trim()); // 임시로 텍스트로 저장
                        break;
                    case "TEXT":
                    case "BOOLEAN":
                    default:
                        // TEXT, BOOLEAN 및 기타 타입은 valueText 컬럼에 저장
                        params.put("valueText", value.trim());
                        break;
                }
                productDAO.insertProductAttributeValue(params);
            }
        }
    }

    /**
     * 상품을 논리적으로 삭제합니다.
     */
    @Transactional
    public void deleteProduct(int sellerId, int productId) {
        productDAO.deleteProduct(Map.of("sellerId", sellerId, "productId", productId));
    }

    /**
     * 생성과 수정에서 공통으로 사용될 옵션/변형 상세 정보 저장 로직
     */
    private void saveOptionsAndVariants(int productId, ProductDetailDTO productData) {
        // key: 옵션명(예: "색상"), value: 옵션ID(DB PK)
        Map<String, Integer> optionIdMap = new HashMap<>();
        // key: 옵션명, value: { key: 옵션값(예: "빨강"), value: 옵션값ID(DB PK) }
        Map<String, Map<String, Integer>> optionValueIdMap = new HashMap<>();

        // 1. 옵션과 옵션 값들을 먼저 DB에 저장하고, 생성된 ID를 맵에 저장
        if (productData.getOptions() != null) {
            for (ProductOptionDTO option : productData.getOptions()) {
                option.setProductId(productId);
                productDAO.insertProductOption(option);
                int optionId = option.getId();
                logger.debug("옵션 저장 완료: optionId={}, name={}", optionId, option.getName());

                optionIdMap.put(option.getName(), optionId);

                Map<String, Integer> valueMap = new HashMap<>();
                if (option.getValues() != null) {
                    for (ProductOptionValueDTO value : option.getValues()) {
                        value.setProductOptionId(optionId);
                        productDAO.insertProductOptionValue(value);
                        valueMap.put(value.getValue(), value.getId());
                    }
                }
                optionValueIdMap.put(option.getName(), valueMap);
            }
        }

        // 2. 판매단위(Variant)를 저장하고, 위에서 만든 맵을 이용해 옵션-값 관계를 연결
        if (productData.getVariants() != null) {
            for (ProductVariantDTO variant : productData.getVariants()) {
                variant.setProductId(productId);
                productDAO.insertProductVariant(variant);
                int variantId = variant.getId();

                // "색상:빨강 / 사이즈:XL" 과 같은 조합 문자열을 파싱하여 관계 설정
                String[] combinations = variant.getOptionCombination().split(" / ");
                for (String comboStr : combinations) {
                    String[] pair = comboStr.split(":");
                    if (pair.length == 2) {
                        String optionName = pair[0].trim();
                        String optionValue = pair[1].trim();

                        Integer optionId = optionIdMap.get(optionName);
                        Integer optionValueId = optionValueIdMap.get(optionName) != null ?
                                optionValueIdMap.get(optionName).get(optionValue) : null;

                        if (optionId != null && optionValueId != null) {
                            Map<String, Object> linkParams = Map.of(
                                    "variantId", variantId,
                                    "productOptionId", optionId,
                                    "productOptionValueId", optionValueId
                            );
                            productDAO.insertVariantOptionValueLink(linkParams);
                        }
                    }
                }
            }
        }
    }


    /**
     * 카테고리별 상품을 검색합니다. (하위 카테고리 포함)
     * @param filters 검색 조건 (categoryId, priceRange, sortBy, attributeFilters 등)
     * @return 페이징된 상품 검색 결과
     */
    @Transactional(readOnly = true)
    public PageResult<SearchProductDTO> searchProductsByCategory(Map<String, Object> filters) {

        logger.info("========== ProductService.searchProductsByCategory 시작 ==========");
        logger.info("입력 필터: {}", filters);

        // 카테고리 ID가 있으면 하위 카테고리 ID들도 함께 조회
        Integer categoryId = (Integer) filters.get("categoryId");
        if (categoryId != null) {
            try {
                List<Integer> categoryIds = categoryDAO.findAllDescendantIds(categoryId);
                logger.info("카테고리 {} 의 하위 카테고리들: {}", categoryId, categoryIds);
                filters.put("categoryIds", categoryIds);
            } catch (Exception e) {
                logger.warn("하위 카테고리 조회 실패, 현재 카테고리만 사용: " + categoryId, e);
                filters.put("categoryIds", Arrays.asList(categoryId));
            }
        }

        // 가격 필터 문자열을 실제 숫자 값으로 변환
        String priceRange = (String) filters.get("priceRange");
        if ("under-100000".equals(priceRange)) {
            filters.put("maxPrice", 100000);
            logger.info("가격 필터: 10만원 이하");
        } else if ("100000-300000".equals(priceRange)) {
            filters.put("minPrice", 100000);
            filters.put("maxPrice", 300000);
            logger.info("가격 필터: 10만원~30만원");
        } else if ("over-300000".equals(priceRange)) {
            filters.put("minPrice", 300000);
            logger.info("가격 필터: 30만원 이상");
        }

        int page = (int) filters.getOrDefault("page", 1);
        int size = (int) filters.getOrDefault("size", 12);
        filters.put("offset", (page - 1) * size);
        filters.put("size", size);

        // 속성 필터 처리 - 디버깅 강화
        @SuppressWarnings("unchecked")
        Map<Integer, List<String>> attributeFilters = (Map<Integer, List<String>>) filters.get("attributeFilters");

        if (attributeFilters != null && !attributeFilters.isEmpty()) {
            logger.info("속성 필터 처리 시작...");
            logger.info("속성 필터 원본 데이터: {}", attributeFilters);

            // MyBatis에서 처리 가능한 형태로 변환
            filters.put("attributeFiltersCount", attributeFilters.size());

            // 각 속성별로 로깅
            for (Map.Entry<Integer, List<String>> entry : attributeFilters.entrySet()) {
                logger.info("속성 ID {}: 값들 {}", entry.getKey(), entry.getValue());
            }
        }else {
            logger.info("속성 필터가 없거나 비어있음");
        }

        logger.info("최종 MyBatis 쿼리 파라미터: {}", filters);

        // 상품 검색 실행
        try {
            logger.info("DB 검색 실행 중...");
            List<SearchProductDTO> content = productDAO.searchProductsByCategory(filters);

            for (SearchProductDTO dto : content) {
                buildDiscountInfo(dto);
            }
            logger.info("DB에서 {}개 상품 조회됨", content.size());

            int totalElements = productDAO.countProductsByCategory(filters);
            logger.info("총 상품 개수: {}", totalElements);

            // 검색된 상품들 로깅 (처음 3개만)
            for (int i = 0; i < Math.min(3, content.size()); i++) {
                SearchProductDTO product = content.get(i);
                logger.info("상품 {}: ID={}, 이름={}", i+1, product.getId(), product.getName());
            }

            PageResult<SearchProductDTO> result = new PageResult<>(content, totalElements, page, size);
            logger.info("========== ProductService.searchProductsByCategory 완료 ==========");

            return result;

        } catch (Exception e) {
            logger.error("DB 검색 중 오류 발생: ", e);
            throw e;
        }
    }


    /**
     * 상품 이미지 파일들을 업로드하고 URL 목록을 반환합니다.
     */
    private List<String> uploadProductImages(int productId, List<MultipartFile> imageFiles) {
        List<String> imageUrls = new ArrayList<>();

        for (int i = 0; i < imageFiles.size(); i++) {
            MultipartFile file = imageFiles.get(i);

            if (!file.isEmpty() && isValidImageFile(file)) {
                try {
                    // 파일명 생성: productId_순서_타임스탬프.확장자
                    String filename = generateImageFilename(productId, i, file.getOriginalFilename());

                    // 파일 저장
                    String savedPath = fileUploadService.saveFile(file, uploadPath, filename);

                    // URL 생성 (웹에서 접근 가능한 경로)
                    String imageUrl = uploadPath + filename;
                    imageUrls.add(imageUrl);

                    logger.info("이미지 저장 완료: {} -> {}", filename, imageUrl);

                } catch (Exception e) {
                    logger.error("상품 이미지 업로드 실패: " + file.getOriginalFilename(), e);
                    // 업로드 실패한 파일은 건너뛰고 계속 진행
                }
            }
        }

        return imageUrls;
    }

    /**
     * 특정 상품의 개별 이미지를 삭제합니다.
     * @param sellerId 판매자 ID
     * @param productId 상품 ID
     * @param imageId 이미지 ID
     * @return 삭제 성공 여부
     */
    @Transactional
    public boolean deleteProductImage(int sellerId, int productId, String imageId) {
        // 1. 상품 소유권 확인
        ProductDetailDTO product = productDAO.findProductById(productId);
        if (product == null || product.getSellerId() != sellerId) {
            throw new SecurityException("해당 상품에 대한 권한이 없습니다.");
        }

        // 2. 이미지 정보 조회
        List<ProductImageDTO> images = productDAO.findImagesByProductId(productId);
        ProductImageDTO targetImage = images.stream()
                .filter(img -> imageId.equals(img.getId()))
                .findFirst()
                .orElse(null);

        if (targetImage == null) {
            logger.warn("삭제하려는 이미지를 찾을 수 없습니다: imageId={}", imageId);
            return false;
        }

        try {
            // 3. 실제 파일 삭제
            fileUploadService.deleteFile(targetImage.getImageUrl());

            // 4. DB에서 이미지 레코드 삭제
            int deletedRows = productDAO.deleteProductImage(imageId);

            logger.info("이미지 삭제 완료: imageId={}, imageUrl={}", imageId, targetImage.getImageUrl());
            return deletedRows > 0;

        } catch (Exception e) {
            logger.error("이미지 삭제 중 오류 발생: imageId=" + imageId, e);
            return false;
        }
    }

    /**
     * 상품 이미지 순서를 업데이트합니다.
     * @param productId 상품 ID
     * @param imageOrderData 이미지 순서 정보 리스트
     */
    @Transactional
    public void updateProductImageOrder(int productId, List<Map<String, Object>> imageOrderData) {
        if (imageOrderData == null || imageOrderData.isEmpty()) {
            return;
        }

        logger.info("상품 {} 이미지 순서 업데이트 시작", productId);

        for (Map<String, Object> imageOrder : imageOrderData) {
            String imageId = (String) imageOrder.get("id");
            Integer order = (Integer) imageOrder.get("order");
            String type = (String) imageOrder.get("type");
            Boolean isExisting = (Boolean) imageOrder.get("isExisting");

            if (isExisting != null && isExisting && imageId != null) {
                // 이미지 타입 유효성 검증
                if (type != null && !ALLOWED_IMAGE_TYPES.contains(type)) {
                    logger.warn("유효하지 않은 이미지 타입: {}, 기본값 PRIMARY로 설정", type);
                    type = "PRIMARY";
                }

                // 기존 이미지의 순서와 타입 업데이트
                Map<String, Object> params = new HashMap<>();
                params.put("imageId", imageId);
                params.put("displayOrder", order);
                params.put("imageType", type);

                int updatedRows = productDAO.updateProductImageOrder(params);
                logger.info("이미지 {} 순서 업데이트: order={}, type={}, updated={}",
                        imageId, order, type, updatedRows > 0);
            }
        }

        logger.info("상품 {} 이미지 순서 업데이트 완료", productId);
    }

    /**
     * 이미지 타입을 순서 기반으로 자동 재조정합니다.
     * @param productId 상품 ID
     */
    @Transactional
    public void reorderImageTypes(int productId) {
        List<ProductImageDTO> images = productDAO.findImagesByProductId(productId);

        // 순서대로 정렬
        images.sort((a, b) -> Integer.compare(a.getDisplayOrder(), b.getDisplayOrder()));

        for (int i = 0; i < images.size(); i++) {
            ProductImageDTO image = images.get(i);
            String newType = determineImageTypeByOrder(i + 1);

            if (!newType.equals(image.getImageType())) {
                Map<String, Object> params = new HashMap<>();
                params.put("imageId", image.getId());
                params.put("imageType", newType);
                params.put("displayOrder", i + 1);

                productDAO.updateProductImageOrder(params);
                logger.info("이미지 타입 자동 조정: {} -> {}", image.getId(), newType);
            }
        }
    }

    /**
     * 순서 기반으로 이미지 타입을 결정합니다. (기본 로직)
     */
    private String determineImageTypeByOrder(int order) {
        if (order == 1) return "PRIMARY";
        if (order == 2) return "HERO";
        if (order <= 5) return "GALLERY";
        return "DETAIL";
    }

    /**
     * 이미지 파일 유효성 검사
     */
    private boolean isValidImageFile(MultipartFile file) {
        String contentType = file.getContentType();
        return contentType != null && contentType.startsWith("image/");
    }

    /**
     * 이미지 파일명 생성
     */
    private String generateImageFilename(int productId, int order, String originalFilename) {
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }

        return String.format("product_%d_%d_%d%s",
                productId, order, System.currentTimeMillis(), extension);
    }

    /**
     * 업로드된 이미지 URL들을 데이터베이스에 저장합니다.
     */
    private void updateProductImages(int productId, List<String> imageUrls, List<MultipartFile> files) {
        // 기존 이미지 레코드 삭제
//        productDAO.deleteProductImages(productId);

        // 새 이미지 레코드 삽입
        for (int i = 0; i < imageUrls.size() && i < files.size(); i++) {
            MultipartFile file = files.get(i);

            ProductImageDTO imageDTO = new ProductImageDTO();
            imageDTO.setId(UUID.randomUUID().toString());
            imageDTO.setProductId(productId);
            imageDTO.setImageUrl(imageUrls.get(i));
            imageDTO.setDisplayOrder(i + 1);
            imageDTO.setImageType(determineImageType(i));
            imageDTO.setFileSize(file.getSize());
            imageDTO.setMimeType(file.getContentType());
            imageDTO.setOriginalFilename(file.getOriginalFilename());
            imageDTO.setIsActive(true);

            logger.info("이미지 DB 저장: productId={}, imageUrl={}, type={}",
                    productId, imageUrls.get(i), imageDTO.getImageType());

            productDAO.insertProductImage(imageDTO);
        }
    }

    private String determineImageType(int index) {
        if (index == 0) return "MAIN";
        if (index == 1) return "THUMBNAIL";
        return "SUB";
    }

    /**
     * 기존 상품 이미지 파일들을 삭제합니다.
     */
    private void deleteExistingProductImages(int productId) {
        List<ProductImageDTO> existingImages = productDAO.findImagesByProductId(productId);

        for (ProductImageDTO image : existingImages) {
            try {
                // 실제 파일 삭제
                fileUploadService.deleteFile(image.getImageUrl());

                // 데이터베이스에서 논리적 삭제
                productDAO.deleteProductImage(image.getId());

            } catch (Exception e) {
                logger.warn("이미지 삭제 실패: " + image.getImageUrl(), e);
            }
        }
    }

    /**
     * 업로드된 이미지 URL들을 데이터베이스에 저장합니다. (시작 순서 지원)
     */
    private void updateProductImages(int productId, List<String> imageUrls, List<MultipartFile> files, int startOrder) {
        // 새 이미지 레코드 삽입
        for (int i = 0; i < imageUrls.size() && i < files.size(); i++) {
            MultipartFile file = files.get(i);
            int displayOrder = startOrder + i + 1;

            ProductImageDTO imageDTO = new ProductImageDTO();
            imageDTO.setId(UUID.randomUUID().toString());
            imageDTO.setProductId(productId);
            imageDTO.setImageUrl(imageUrls.get(i));
            imageDTO.setDisplayOrder(displayOrder);
            imageDTO.setImageType(determineImageTypeByOrder(displayOrder));
            imageDTO.setFileSize(file.getSize());
            imageDTO.setMimeType(file.getContentType());
            imageDTO.setOriginalFilename(file.getOriginalFilename());
            imageDTO.setIsActive(true);

            logger.info("이미지 DB 저장: productId={}, imageUrl={}, order={}, type={}",
                    productId, imageUrls.get(i), displayOrder, imageDTO.getImageType());

            productDAO.insertProductImage(imageDTO);
        }
    }

    @Transactional(readOnly = true)
    public boolean isWishlistItem(int userId, Integer productId) {
        return productDAO.isWishlistItem(userId, productId);
    }

    /**
     * 위시리스트에서 삭제하면 false, 삽입하면 true를 반환함
     * @param userId 이용자 id
     * @param productId 상품 id
     * @return 토글 후 위시리스트에 존재하는지 여부
     */
    @Transactional
    public boolean toggleWishlist(int userId, Integer productId) {
        if (productDAO.isWishlistItem(userId, productId)) {
            productDAO.deleteWishlistItem(userId, productId);
            return false;
        } else {
            productDAO.insertWishlistItem(userId, productId);
            return true;
        }
    }


    // 관련 상품 정보 조회
    @Transactional(readOnly = true)
    public List<ProductDetailDTO> getRelatedProductList( int productId ) {
        List<ProductDetailDTO> dtos = productDAO.selectRelProductList(productId);
        for (ProductDetailDTO dto : dtos) {
            ObjectMapper objectMapper = new ObjectMapper();
            try {
                System.out.println(objectMapper.writeValueAsString(dto));
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
            String type = null;
            Integer maxAmount = null;
            Boolean isDiscountRateReachedToMaxAmount = null;
            List<PromotionDTO> promotions = promotionDAO.findPromotionsByProductId(dto.getId());
            for (PromotionDTO promotion : promotions) {
                dto.setBasePrice(dto.getRelProBasePrice());
                if (!promotion.getIsActive()
                        || !promotion.getStartDate().isBefore(LocalDateTime.now())
                        || !promotion.getEndDate().isAfter(LocalDateTime.now()))
                    continue;
                if (promotion.getDiscountType().equals("PERCENTAGE")) {
                    boolean t = false;
                    int amount = (int) ((float)promotion.getDiscountValue() * dto.getBasePrice() / 100);
                    if (promotion.getMaxDiscountAmount() != null && promotion.getMaxDiscountAmount() > 0 && amount > promotion.getMaxDiscountAmount()) {
                        amount = promotion.getMaxDiscountAmount();
                        t = true;
                    }
                    if (maxAmount == null || amount > maxAmount) {
                        type = "PERCENTAGE";
                        maxAmount = amount;
                        isDiscountRateReachedToMaxAmount = t;
                    }
                }
                else if (promotion.getDiscountType().equals("FIXED_AMOUNT")) {
                    int amount = promotion.getDiscountValue();
                    if (promotion.getMaxDiscountAmount() != null && promotion.getMaxDiscountAmount() > 0 && amount > promotion.getMaxDiscountAmount()) {
                        amount =  promotion.getMaxDiscountAmount();
                    }
                    if (maxAmount == null || amount > maxAmount) {
                        type = "FIXED_AMOUNT";
                        maxAmount = amount;
                        isDiscountRateReachedToMaxAmount = null;
                    }
                }
            }
            if (type != null) {
                dto.setRelProFinalPrice(dto.getBasePrice() - maxAmount);
                dto.setRelProDiscountRate((int) ((float)maxAmount / dto.getBasePrice() * 100));
            }
            try {
                System.out.println(" -> " + objectMapper.writeValueAsString(dto));
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        }
        return dtos;
    }

    // 상품 가격 정보 조회(할인적용가)
    @Transactional(readOnly = true)
    public ProductDetailDTO getProductPrice( int productId ){
        ProductDetailDTO dto = productDAO.findDiscountPriceByProductId(productId);
        ObjectMapper objectMapper = new ObjectMapper();
        try {
            System.out.println(objectMapper.writeValueAsString(dto));
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
        String type = null;
        Integer maxAmount = null;
        Boolean isDiscountRateReachedToMaxAmount = null;
        List<PromotionDTO> promotions = promotionDAO.findPromotionsByProductId(productId);
        for (PromotionDTO promotion : promotions) {
            if (!promotion.getIsActive()
                    || !promotion.getStartDate().isBefore(LocalDateTime.now())
                    || !promotion.getEndDate().isAfter(LocalDateTime.now()))
                continue;
            if (promotion.getDiscountType().equals("PERCENTAGE")) {
                boolean t = false;
                int amount = (int) ((float)promotion.getDiscountValue() * dto.getBasePrice() / 100);
                if (promotion.getMaxDiscountAmount() != null && promotion.getMaxDiscountAmount() > 0 && amount > promotion.getMaxDiscountAmount()) {
                    amount = promotion.getMaxDiscountAmount();
                    t = true;
                }
                if (maxAmount == null || amount > maxAmount) {
                    type = "PERCENTAGE";
                    maxAmount = amount;
                    isDiscountRateReachedToMaxAmount = t;
                }
            }
            else if (promotion.getDiscountType().equals("FIXED_AMOUNT")) {
                int amount = promotion.getDiscountValue();
                if (promotion.getMaxDiscountAmount() != null && promotion.getMaxDiscountAmount() > 0 && amount > promotion.getMaxDiscountAmount()) {
                    amount =  promotion.getMaxDiscountAmount();
                }
                if (maxAmount == null || amount > maxAmount) {
                    type = "FIXED_AMOUNT";
                    maxAmount = amount;
                    isDiscountRateReachedToMaxAmount = null;
                }
            }
        }
        if (type != null) {
            dto.setProDiscountFixed(maxAmount);
            dto.setProDiscountRate((int) ((float)maxAmount / dto.getBasePrice() * 100));
            if (type.equals("PERCENTAGE") && isDiscountRateReachedToMaxAmount == false) {
                dto.setProDiscountValue(dto.getProDiscountRate());
                dto.setProDiscountType("PERCENTAGE");
            } else {
                dto.setProDiscountValue(dto.getProDiscountFixed());
                dto.setProDiscountType("FIXED_AMOUNT");
            }
        }
        try {
            System.out.println(" -> " + objectMapper.writeValueAsString(dto));
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
        return dto;
    }


}