package com.example.ecommerce;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;

import com.example.ecommerce.dto.ProductDTO;
import com.example.ecommerce.service.HomeService;

import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class HomeController {
    
    private final HomeService homeService;
    
    @GetMapping({"/", "/home"})
    public String home(Model model) {
        try {
            // 추천 상품 12개 조회
            List<ProductDTO> recommendedProducts = homeService.getRecommendedProducts();
            model.addAttribute("list", recommendedProducts);
            
            return "home";
            
        } catch (Exception e) {
        	e.printStackTrace();
            // 오류 발생 시 빈 목록으로 처리
            model.addAttribute("list", null);
            model.addAttribute("errorMessage", "상품 정보를 불러오는데 실패했습니다. 잠시 후 다시 시도해주세요.");
            return "home";
        }
    }
    
    @RequestMapping(value = "/products/filter", method = RequestMethod.POST, 
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
	@ResponseBody
	public ResponseEntity<Map<String, Object>> getFilteredProducts(@RequestBody Map<String, Object> filterParams) {
	 
	 Map<String, Object> response = new HashMap<>();
	 
	 try {
	     // 파라미터 추출 및 기본값 설정
	     String categoryFilter = (String) filterParams.getOrDefault("categoryFilter", "all");
	     String priceFilter = (String) filterParams.getOrDefault("priceFilter", "all");
	     Boolean discountFilter = (Boolean) filterParams.getOrDefault("discountFilter", false);
	     Boolean groupPurchaseFilter = (Boolean) filterParams.getOrDefault("groupPurchaseFilter", false);
	     String sortOption = (String) filterParams.getOrDefault("sortOption", "popularity");
	     
	     // 페이지 파라미터 처리
	     Integer page = filterParams.get("page") != null ? 
	                   Integer.parseInt(filterParams.get("page").toString()) : 1;
	     Integer size = filterParams.get("size") != null ? 
	                   Integer.parseInt(filterParams.get("size").toString()) : 12;
	     
	     // 필터 조건 맵 생성
	     Map<String, Object> filters = new HashMap<>();
	     filters.put("categoryFilter", categoryFilter);
	     filters.put("priceFilter", priceFilter);
	     filters.put("discountFilter", discountFilter);
	     filters.put("groupPurchaseFilter", groupPurchaseFilter);
	     filters.put("sortOption", sortOption);
	     filters.put("page", page);
	     filters.put("size", size);
	     
	     // 상품 조회
	     List<ProductDTO> products = homeService.getFilteredProducts(filters);
	     
	     // 다음 페이지 존재 여부 확인
	     filters.put("page", page + 1);
	     List<ProductDTO> nextPageProducts = homeService.getFilteredProducts(filters);
	     boolean hasMore = nextPageProducts != null && !nextPageProducts.isEmpty();
	     
	     // 응답 데이터 구성
	     response.put("success", true);
	     response.put("products", products);
	     response.put("hasMore", hasMore);
	     response.put("currentPage", page);
	     response.put("totalProducts", products != null ? products.size() : 0);
	     
	 } catch (Exception e) {
	     e.printStackTrace();
	     response.put("success", false);
	     response.put("message", "상품을 불러오는 중 오류가 발생했습니다.");
	 }
	 
	 return ResponseEntity.ok(response);
	}
    
    //에러 페이지 처리
    @GetMapping("/error")
    public String error(Model model) {
        model.addAttribute("errorMessage", "요청을 처리하는 중 오류가 발생했습니다.");
        return "error";
    }
}
