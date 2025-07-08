package com.example.ecommerce;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.example.ecommerce.dto.ProductDTO;
import com.example.ecommerce.service.SearchService;

import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class SearchController {
    
    private final SearchService searchService;
    
    @GetMapping("/search")
    public String searchProducts(
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "category", required = false, defaultValue = "all") String category,
            @RequestParam(value = "priceRange", required = false, defaultValue = "all") String priceRange,
            @RequestParam(value = "discountOnly", required = false, defaultValue = "false") boolean discountOnly,
            @RequestParam(value = "groupPurchaseOnly", required = false, defaultValue = "false") boolean groupPurchaseOnly,
            @RequestParam(value = "sortBy", required = false, defaultValue = "popularity") String sortBy,
            Model model) {
        
        try {
            // 검색어가 없는 경우 에러 처리
            if (keyword == null || keyword.trim().isEmpty()) {
                model.addAttribute("errorMessage", "검색어를 입력해주세요.");
                return "search";
            }
            
            // 검색 조건 설정
            Map<String, Object> searchConditions = Map.of(
            	"keyword", keyword.trim(),
            	"categoryFilter", category,
            	"priceFilter", priceRange,
            	"discountFilter", discountOnly,
            	"groupPurchaseFilter", groupPurchaseOnly,
            	"sortOption", sortBy,
            	"offset", 0,
            	"limit", 12
            );
            
            // 검색 실행
            List<ProductDTO> products = searchService.searchProducts(searchConditions);
            int totalCount = searchService.getSearchResultCount(searchConditions);
            
            // 모델에 데이터 추가
            model.addAttribute("list", products);
            model.addAttribute("totalCount", totalCount);
            model.addAttribute("searchKeyword", keyword);
            model.addAttribute("hasMore", products.size() == 12);
            
            // 현재 검색 조건들도 전달
            model.addAttribute("currentCategory", category);
            model.addAttribute("currentPriceRange", priceRange);
            model.addAttribute("currentDiscountOnly", discountOnly);
            model.addAttribute("currentGroupPurchaseOnly", groupPurchaseOnly);
            model.addAttribute("currentSortBy", sortBy);
            
        } catch (Exception e) {
            e.printStackTrace();
            model.addAttribute("errorMessage", "검색 중 오류가 발생했습니다. 다시 시도해주세요.");
        }
        
        return "search";
    }
    
    @GetMapping("/search/api")
    public String searchProductsApi(
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "category", required = false, defaultValue = "all") String category,
            @RequestParam(value = "priceRange", required = false, defaultValue = "all") String priceRange,
            @RequestParam(value = "discountOnly", required = false, defaultValue = "false") boolean discountOnly,
            @RequestParam(value = "groupPurchaseOnly", required = false, defaultValue = "false") boolean groupPurchaseOnly,
            @RequestParam(value = "sortBy", required = false, defaultValue = "popularity") String sortBy,
            Model model) {
        
        try {
            if (keyword == null || keyword.trim().isEmpty()) {
                model.addAttribute("products", List.of());
                model.addAttribute("hasMore", false);
                return "search/product-list";
            }
            
            Map<String, Object> searchConditions = Map.of(
            	"keyword", keyword.trim(),
            	"categoryFilter", category,
            	"priceFilter", priceRange,
            	"discountFilter", discountOnly,
            	"groupPurchaseFilter", groupPurchaseOnly,
            	"sortOption", sortBy,
            	"offset", 0,
            	"limit", 12
            );
            
            List<ProductDTO> products = searchService.searchProducts(searchConditions);
            
            model.addAttribute("products", products);
            model.addAttribute("hasMore", products.size() == 12);
            
        } catch (Exception e) {
            e.printStackTrace();
            model.addAttribute("products", List.of());
            model.addAttribute("hasMore", false);
        }
        
        return "search/product-list";
    }
}
