package com.example.ecommerce.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import com.example.ecommerce.dto.UserDTO;
import com.example.ecommerce.service.WishlistService;

import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class WishlistController {

    private final WishlistService wishlistService;

    /* 목록 페이지 */
    @GetMapping("/wishlist")
    public String page(@AuthenticationPrincipal UserDTO user, Model model) {
        if (user == null) return "redirect:/login";
        model.addAttribute("items", wishlistService.list(user.getId()));
        return "wishlist";
    }

    /* 추가 */
    @PostMapping("/api/wishlist")
    @ResponseBody
    public ResponseEntity<?> add(@AuthenticationPrincipal UserDTO user,
                                 @RequestParam int productId) {
        wishlistService.add(user.getId(), productId);
        return ResponseEntity.ok("added");
    }

    /* 삭제 */
    @DeleteMapping("/api/wishlist/{productId}")
    @ResponseBody
    public ResponseEntity<String> del(@AuthenticationPrincipal UserDTO user,
                                      @PathVariable int productId) {
        wishlistService.remove(user.getId(), productId);
        return ResponseEntity.ok("removed");
    }
}
