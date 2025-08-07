package com.example.ecommerce.controller;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.example.ecommerce.dto.PageResult;
import com.example.ecommerce.service.ProductService;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.example.ecommerce.dto.SearchProductDTO;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
@RequiredArgsConstructor
public class SearchController {

    private final ProductService productService;

    /**
     * 상품 검색 결과를 보여주는 메인 페이지를 처리합니다.
     * @param keyword 필수 검색어
     * @param allParams 모든 요청 파라미터를 받아 동적 속성 필터 처리
     * @param model View에 데이터를 전달할 모델 객체
     * @return 뷰 이름
     */
    @GetMapping("/search")
    public String searchProductsPage(
            @RequestParam(value = "keyword") String keyword,
            @RequestParam(required = false) Integer categoryId,
            @RequestParam(required = false, defaultValue = "all") String priceRange,
            @RequestParam(required = false) Boolean discountOnly,
            @RequestParam(required = false) Boolean groupPurchaseOnly,
            @RequestParam(required = false, defaultValue = "popularity") String sortBy,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam Map<String, String> allParams,
            Model model) {

        // 1. 서비스에 전달할 검색 조건 맵 생성
        Map<String, Object> searchConditions = new HashMap<>();
        searchConditions.put("keyword", keyword);
        searchConditions.put("categoryId", categoryId);
        searchConditions.put("priceRange", priceRange);
        searchConditions.put("discountOnly", discountOnly != null && discountOnly);
        searchConditions.put("groupPurchaseOnly", groupPurchaseOnly != null && groupPurchaseOnly);
        searchConditions.put("sortBy", sortBy);
        searchConditions.put("page", page);
        searchConditions.put("size", 12); // 페이지 당 아이템 수

        // 2. [핵심] 속성 필터(attributeFilters) 가공
        // allParams에서 "attr_"로 시작하는 키들을 찾아 Map<Integer, List<String>> 형태로 변환
        Map<Integer, List<String>> attributeFilters = allParams.entrySet().stream()
                .filter(entry -> entry.getKey().startsWith("attr_") && entry.getValue() != null && !entry.getValue().isEmpty())
                .collect(Collectors.toMap(
                        entry -> Integer.parseInt(entry.getKey().replace("attr_", "")),
                        entry -> Arrays.asList(entry.getValue().split(","))
                ));

        if (!attributeFilters.isEmpty()) {
            searchConditions.put("attributeFilters", attributeFilters);
        }

        // 3. 서비스를 호출하여 상품 검색
        PageResult<SearchProductDTO> result = productService.searchProducts(searchConditions);

        // 4. View에 결과 데이터 전달
        model.addAttribute("list", result.getContent());
        model.addAttribute("pageResult", result); // 페이징 처리를 위해 PageResult 객체 전체를 전달
        model.addAttribute("searchKeyword", keyword);

        // 5. 현재 필터링 조건들을 View에 전달하여, 사용자가 선택한 값을 유지하도록 함
        model.addAttribute("currentFilters", searchConditions);

        return "search-page";
    }

    /**
     * '더보기' 또는 무한 스크롤을 위한 상품 목록 API
     * @return PageResult<SearchProductDTO> 페이징 결과가 포함된 JSON 데이터
     */
    @GetMapping("/api/search")
    @ResponseBody
    public ResponseEntity<PageResult<SearchProductDTO>> searchProductsApi(
            @RequestParam("keyword") String keyword,
            @RequestParam(required = false) Integer categoryId,
            @RequestParam(required = false, defaultValue = "all") String priceRange,
            @RequestParam(required = false) Boolean discountOnly,
            @RequestParam(required = false) Boolean groupPurchaseOnly,
            @RequestParam(required = false, defaultValue = "popularity") String sortBy,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam Map<String, String> allParams) {

        // 위 searchProductsPage와 동일한 로직으로 검색 조건을 구성합니다.
        Map<String, Object> searchConditions = new HashMap<>();
        searchConditions.put("keyword", keyword);
        searchConditions.put("categoryId", categoryId);
        searchConditions.put("priceRange", priceRange);
        searchConditions.put("discountOnly", discountOnly != null && discountOnly);
        searchConditions.put("groupPurchaseOnly", groupPurchaseOnly != null && groupPurchaseOnly);
        searchConditions.put("sortBy", sortBy);
        searchConditions.put("page", page);
        searchConditions.put("size", 12);

        Map<Integer, List<String>> attributeFilters = allParams.entrySet().stream()
                .filter(entry -> entry.getKey().startsWith("attr_") && entry.getValue() != null && !entry.getValue().isEmpty())
                .collect(Collectors.toMap(
                        entry -> Integer.parseInt(entry.getKey().replace("attr_", "")),
                        entry -> Arrays.asList(entry.getValue().split(","))
                ));

        if (!attributeFilters.isEmpty()) {
            searchConditions.put("attributeFilters", attributeFilters);
        }

        PageResult<SearchProductDTO> result = productService.searchProducts(searchConditions);

        return ResponseEntity.ok(result);
    }
}