package com.example.ecommerce.controller;

import java.util.*;

import com.example.ecommerce.dto.*;
import com.example.ecommerce.service.CategoryService;
import com.example.ecommerce.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
@RequiredArgsConstructor
public class CategoryController {

    private static final Logger logger = LoggerFactory.getLogger(CategoryController.class);

    private final CategoryService categoryService;
    private final ProductService productService;

    /**
     * 전체 카테고리 목록을 계층 구조로 조회합니다.
     */
    @GetMapping("/api/categories")
    @ResponseBody
    public ResponseEntity<List<CategoryDTO>> getCategoryMenu() {
        List<CategoryDTO> categoryTree = categoryService.getCategoryTree();
        return ResponseEntity.ok(categoryTree);
    }

    /**
     * 카테고리 페이지를 표시합니다.
     * @param categoryId 카테고리 ID
     * @param allParams 모든 요청 파라미터 (필터 조건 포함)
     * @param model View에 데이터를 전달할 모델 객체
     * @return 뷰 이름
     */
    @GetMapping("/products/category/{categoryId}")
    public String categoryPage(
            @PathVariable int categoryId,
            @RequestParam(required = false, defaultValue = "all") String priceRange,
            @RequestParam(required = false) Boolean discountOnly,
            @RequestParam(required = false) Boolean groupPurchaseOnly,
            @RequestParam(required = false, defaultValue = "popularity") String sortBy,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam Map<String, String> allParams,
            Model model) {

        try {
            // 1. 카테고리 정보 조회
            CategoryDTO category = categoryService.getCategoryById(categoryId);
            if (category == null) {
                model.addAttribute("errorMessage", "존재하지 않는 카테고리입니다.");
                return "error";
            }

            // 2. 카테고리 경로(브레드크럼용) 조회
            List<CategoryDTO> categoryPath = categoryService.getCategoryPath(categoryId);

            // 3. 서브 카테고리 목록 조회
            List<CategoryDTO> subCategories = categoryService.getSubCategories(categoryId);

            // 4. 서비스에 전달할 검색 조건 맵 생성
            Map<String, Object> searchConditions = new HashMap<>();
            searchConditions.put("categoryId", categoryId);
            searchConditions.put("priceRange", priceRange);
            searchConditions.put("discountOnly", discountOnly != null && discountOnly);
            searchConditions.put("groupPurchaseOnly", groupPurchaseOnly != null && groupPurchaseOnly);
            searchConditions.put("sortBy", sortBy);
            searchConditions.put("page", page);
            searchConditions.put("size", 12);

            // 5. 속성 필터 가공 - 디버깅 강화
            Map<Integer, List<String>> attributeFilters = new HashMap<>();

            logger.info("초기 페이지 로드 - 속성 필터 파싱 시작...");
            logger.info("allParams: {}", allParams);

            for (Map.Entry<String, String> entry : allParams.entrySet()) {
                String key = entry.getKey();
                String value = entry.getValue();

                if (key.startsWith("attr_") && value != null && !value.isEmpty()) {
                    try {
                        int attributeId = Integer.parseInt(key.replace("attr_", ""));
                        List<String> values = new ArrayList<>(Arrays.asList(value.split(",")));
                        attributeFilters.put(attributeId, values);
                        logger.info("초기 속성 필터 추가: {} = {}", attributeId, values);
                    } catch (NumberFormatException e) {
                        logger.warn("잘못된 속성 필터 키: " + key);
                    }
                }
            }

            if (!attributeFilters.isEmpty()) {
                searchConditions.put("attributeFilters", attributeFilters);
                logger.info("초기 페이지의 속성 필터: {}", attributeFilters);
            }

            // 6. 카테고리별 상품 검색
            PageResult<SearchProductDTO> result = productService.searchProductsByCategory(searchConditions);

            // 7. View에 결과 데이터 전달
            model.addAttribute("categoryId", categoryId);
            model.addAttribute("categoryName", category.getName());
            model.addAttribute("categoryDescription", category.getDescription());
            model.addAttribute("categoryPath", categoryPath);
            model.addAttribute("subCategories", subCategories);
            model.addAttribute("list", result.getContent());
            model.addAttribute("totalCount", result.getTotalElements());
            model.addAttribute("pageResult", result);
            model.addAttribute("currentFilters", searchConditions);

            return "category";

        } catch (Exception e) {
            logger.error("카테고리 페이지 로딩 중 오류 발생: ", e);
            model.addAttribute("errorMessage", "카테고리 정보를 불러오는데 실패했습니다.");
            return "error";
        }
    }

    /**
     * 카테고리별 상품 목록 API (AJAX 요청용)
     * @param requestData 필터 조건들
     * @return JSON 형태의 상품 목록 및 페이징 정보
     */
    @PostMapping(value = "/api/category/products",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getCategoryProducts(@RequestBody Map<String, Object> requestData) {

        Map<String, Object> response = new HashMap<>();

        try {
            logger.info("========== 카테고리 상품 필터링 디버깅 시작 ==========");
            logger.info("요청 데이터: {}", requestData);

            // 1. 파라미터 추출 및 기본값 설정
            Integer categoryId = requestData.get("categoryId") != null ?
                    Integer.parseInt(requestData.get("categoryId").toString()) : null;

            if (categoryId == null) {
                response.put("success", false);
                response.put("message", "카테고리 ID가 필요합니다.");
                return ResponseEntity.badRequest().body(response);
            }

            String priceFilter = (String) requestData.getOrDefault("priceFilter", "all");
            Boolean discountFilter = (Boolean) requestData.getOrDefault("discountFilter", false);
            Boolean groupPurchaseFilter = (Boolean) requestData.getOrDefault("groupPurchaseFilter", false);
            String sortOption = (String) requestData.getOrDefault("sortOption", "popularity");

            // 페이지 파라미터 처리
            Integer page = requestData.get("page") != null ?
                    Integer.parseInt(requestData.get("page").toString()) : 1;
            Integer size = requestData.get("size") != null ?
                    Integer.parseInt(requestData.get("size").toString()) : 12;

            // 2. 검색 조건 맵 생성
            Map<String, Object> searchConditions = new HashMap<>();
            searchConditions.put("categoryId", categoryId);
            searchConditions.put("priceRange", priceFilter);
            searchConditions.put("discountOnly", discountFilter);
            searchConditions.put("groupPurchaseOnly", groupPurchaseFilter);
            searchConditions.put("sortBy", sortOption);
            searchConditions.put("page", page);
            searchConditions.put("size", size);

            // 3. 속성 필터 처리 - 디버깅 강화
            Map<Integer, List<String>> attributeFilters = new HashMap<>();

            logger.info("속성 필터 파싱 시작...");
            for (Map.Entry<String, Object> entry : requestData.entrySet()) {
                String key = entry.getKey();
                if (key.startsWith("attr_") && entry.getValue() != null) {
                    try {
                        int attributeId = Integer.parseInt(key.replace("attr_", ""));
                        String valueStr = entry.getValue().toString();

                        logger.info("속성 필터 발견: {} = {}", key, valueStr);

                        if (!valueStr.isEmpty()) {
                            List<String> values = Arrays.asList(valueStr.split(","));
                            attributeFilters.put(attributeId, values);
                            logger.info("속성 ID {} 에 값들 추가: {}", attributeId, values);
                        }
                    } catch (NumberFormatException e) {
                        logger.warn("잘못된 속성 필터 키: " + key);
                    }
                }
            }

            logger.info("최종 속성 필터 맵: {}", attributeFilters);

            if (!attributeFilters.isEmpty()) {
                searchConditions.put("attributeFilters", attributeFilters);
                searchConditions.put("attributeFiltersCount", attributeFilters.size());
                logger.info("속성 필터가 검색 조건에 추가됨. 개수: {}", attributeFilters.size());
            } else {
                logger.info("속성 필터가 비어있음");
            }

            logger.info("최종 검색 조건: {}", searchConditions);

            // 4. 상품 검색 실행
            PageResult<SearchProductDTO> result = productService.searchProductsByCategory(searchConditions);

            logger.info("검색 결과: 총 {}개 상품, {}페이지 중 {}페이지",
                    result.getTotalElements(), result.getTotalPages(), result.getPage());

            // 5. 다음 페이지 존재 여부 확인
            boolean hasMore = result.getPage() < result.getTotalPages();

            // 6. 응답 데이터 구성
            response.put("success", true);
            response.put("products", result.getContent());
            response.put("hasMore", hasMore);
            response.put("currentPage", page);
            response.put("totalCount", result.getTotalElements());
            response.put("totalPages", result.getTotalPages());

            logger.info("========== 카테고리 상품 필터링 디버깅 완료 ==========");

        } catch (Exception e) {
            logger.error("카테고리 상품 조회 중 오류 발생: ", e);
            response.put("success", false);
            response.put("message", "상품을 불러오는 중 오류가 발생했습니다.");
        }

        return ResponseEntity.ok(response);
    }

    /**
     * 특정 카테고리의 모든 하위 카테고리 ID 목록을 조회합니다.
     * @param categoryId 상위 카테고리 ID
     * @return 하위 카테고리 ID 목록 (자기 자신 포함)
     */
    @GetMapping("/api/categories/{categoryId}/descendants")
    @ResponseBody
    public ResponseEntity<List<Integer>> getCategoryDescendants(@PathVariable int categoryId) {
        try {
            List<Integer> descendantIds = categoryService.getAllDescendantIds(categoryId);
            return ResponseEntity.ok(descendantIds);
        } catch (Exception e) {
            logger.error("하위 카테고리 조회 중 오류 발생: ", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 특정 카테고리에 연결된 속성 목록을 조회합니다. (필터용)
     */
    @GetMapping("/api/categories/{categoryId}/attributes")
    @ResponseBody
    public ResponseEntity<List<AttributeDTO>> getAttributesForCategory(@PathVariable int categoryId) {
        try {
            List<AttributeDTO> attributes = categoryService.getAttributesForCategory(categoryId);
            logger.info("카테고리 {} 의 속성 목록: {}", categoryId, attributes);
            return ResponseEntity.ok(attributes);
        } catch (Exception e) {
            logger.error("카테고리 속성 조회 중 오류 발생: ", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 카테고리별 추천 상품을 조회합니다.
     * @param categoryId 카테고리 ID
     * @param limit 조회할 상품 수 (기본값: 6)
     * @return 추천 상품 목록
     */
    @GetMapping("/api/categories/{categoryId}/recommended")
    @ResponseBody
    public ResponseEntity<List<SearchProductDTO>> getRecommendedProductsByCategory(
            @PathVariable int categoryId,
            @RequestParam(defaultValue = "6") int limit) {

        try {
            Map<String, Object> conditions = new HashMap<>();
            conditions.put("categoryId", categoryId);
            conditions.put("sortBy", "popularity");
            conditions.put("page", 1);
            conditions.put("size", limit);

            PageResult<SearchProductDTO> result = productService.searchProductsByCategory(conditions);
            return ResponseEntity.ok(result.getContent());

        } catch (Exception e) {
            logger.error("카테고리별 추천 상품 조회 중 오류 발생: ", e);
            return ResponseEntity.internalServerError().build();
        }
    }


    /**
     * 전체 카테고리 목록을 계층 구조(Tree)로 조회합니다.
     * @return 계층 구조화된 카테고리 목록
     */
    @GetMapping("/api/admin/categories")
    @ResponseBody
    public ResponseEntity<List<CategoryDTO>> getCategoryTree() {
        List<CategoryDTO> categoryTree = categoryService.getCategoryTree();
        return ResponseEntity.ok(categoryTree);
    }

    /**
     * 새로운 카테고리를 생성합니다.
     * @param categoryDTO 생성할 카테고리 정보
     * @return 생성된 카테고리 정보 (ID 포함)
     */
    @PostMapping("/api/admin/categories")
    @ResponseBody
    public ResponseEntity<CategoryDTO> createCategory(@RequestBody CategoryDTO categoryDTO) {
        System.out.println(categoryDTO);
        CategoryDTO createdCategory = categoryService.createCategory(categoryDTO);
        return new ResponseEntity<>(createdCategory, HttpStatus.CREATED);
    }

    /**
     * 기존 카테고리 정보를 수정합니다.
     * @param categoryId 수정할 카테고리 ID
     * @param categoryDTO 수정될 카테고리 정보
     * @return 수정된 카테고리 정보
     */
    @PutMapping("/api/admin/categories/{categoryId}")
    @ResponseBody
    public ResponseEntity<CategoryDTO> updateCategory(@PathVariable int categoryId, @RequestBody CategoryDTO categoryDTO) {
        categoryDTO.setId(categoryId); // URL의 ID를 DTO에 설정
        CategoryDTO updatedCategory = categoryService.updateCategory(categoryDTO);
        return ResponseEntity.ok(updatedCategory);
    }

    /**
     * 특정 카테고리를 삭제합니다.
     * @param categoryId 삭제할 카테고리 ID
     * @return 작업 성공 여부
     */
    @DeleteMapping("/api/admin/categories/{categoryId}")
    @ResponseBody
    public ResponseEntity<Void> deleteCategory(@PathVariable int categoryId) {
        try {
            categoryService.deleteCategory(categoryId);
            return ResponseEntity.noContent().build(); // 성공 시 204 No Content
        } catch (IllegalArgumentException e) {
            // 하위 카테고리가 있어 삭제 못하는 경우 등
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }
    }

    /**
     * 특정 카테고리에 연결된 속성 목록 조회
     */
    @GetMapping("/api/admin/categories/{categoryId}/attributes")
    @ResponseBody
    public ResponseEntity<List<CategoryAttributeDTO>> getCategoryAttributes(@PathVariable int categoryId) {
        try {
            List<CategoryAttributeDTO> categoryAttributes = categoryService.getCategoryAttributes(categoryId);
            return ResponseEntity.ok(categoryAttributes);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

}
