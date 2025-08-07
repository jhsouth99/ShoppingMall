package com.example.ecommerce.controller;

import com.example.ecommerce.dto.PageResult;
import com.example.ecommerce.dto.QnADTO;
import com.example.ecommerce.dto.UserDTO;
import com.example.ecommerce.service.QnAService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Controller
@RequiredArgsConstructor
public class QnAController {
    private final QnAService qnAService;

    /**
     * 사용자 상품 문의 목록 조회
     */
    @GetMapping("/api/user/product-qnas")
    @ResponseBody
    public PageResult<QnADTO> getUserProductQnAs(
            @AuthenticationPrincipal UserDTO user,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {

        return qnAService.getUserProductQnAs(user.getId(), page, size);
    }

    /**
     * 상품 문의 등록
     */
    @PostMapping("/api/products/{productId}/qnas")    // HTTP POST 메소드로 새 리소스 생성
    @ResponseBody                                      // JSON 형태로 응답 반환
    public ResponseEntity<Map<String, String>> createProductQnA(
            @PathVariable int productId,
            @RequestBody QnADTO qnaDTO, // 제목, 내용, 비밀글 여부
            @AuthenticationPrincipal UserDTO user) {

        try {// dao, dto, 서비스에 관련 함수 만들기
            //qnAService.saveQna(productId, qnaDTO, user);

            // ========== 성공 응답 생성 ==========
            Map<String, String> response = new HashMap<>();
            response.put("message", "문의가 성공적으로 등록되었습니다.");
            return ResponseEntity.ok(response);        // HTTP 200 OK + JSON 응답

        } catch (IllegalArgumentException e) { // 잘못된 데이터 입력 처리
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());      // 서비스에서 던진 구체적인 오류 메시지
            return ResponseEntity.badRequest().body(error);  // HTTP 400 Bad Request

        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "문의 등록 중 오류가 발생했습니다.");  // 사용자용 일반적 메시지
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);  // HTTP 500
        }
    }



    /**
     * 상품 문의 삭제
     */
    @DeleteMapping("/api/user/product-qnas/{qnaId}")
    @ResponseBody
    public ResponseEntity<Void> deleteProductQnA(
            @PathVariable int qnaId,
            @AuthenticationPrincipal UserDTO user) {

        try {
            qnAService.deleteUserProductQnA(user.getId(), qnaId);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }

    /**
     * 상품 문의 상세 조회 (수정용)
     */
    @GetMapping("/api/user/product-qnas/{qnaId}")
    @ResponseBody
    public ResponseEntity<QnADTO> getProductQnADetail(
            @PathVariable int qnaId,
            @AuthenticationPrincipal UserDTO user) {

        try {
            QnADTO qnaDetail = qnAService.getUserProductQnADetail(user.getId(), qnaId);
            return ResponseEntity.ok(qnaDetail);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }

    /**
     * 상품 문의 수정
     */
    @PutMapping("/api/user/product-qnas/{qnaId}")
    @ResponseBody
    public ResponseEntity<Map<String, String>> updateProductQnA(
            @PathVariable int qnaId,
            @RequestBody QnADTO updateDto,
            @AuthenticationPrincipal UserDTO user) {

        try {
            qnAService.updateUserProductQnA(user.getId(), qnaId, updateDto);

            Map<String, String> response = new HashMap<>();
            response.put("message", "문의가 성공적으로 수정되었습니다.");
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        } catch (SecurityException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "수정 권한이 없습니다.");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
        }
    }

    @GetMapping("/api/products/{productId}/qnas")
    @ResponseBody
    public ResponseEntity<PageResult<QnADTO>> getProductQnAs(
            @PathVariable int productId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal UserDTO user,
            String keyword, String status) {
        return new ResponseEntity<>(qnAService.getProductQnAs(productId, page, size, keyword, status, user == null ? 0 : user.getId()), HttpStatus.OK);
    }


    /**
     * 판매자의 상품 Q&A 목록을 조회합니다.
     */
    @GetMapping("/api/seller/qnas")
    @ResponseBody
    public ResponseEntity<PageResult<QnADTO>> getQnas(
            @AuthenticationPrincipal UserDTO seller,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status) {
        PageResult<QnADTO> result = qnAService.getQnas(seller.getId(), page, size, keyword, status);
        return ResponseEntity.ok(result);
    }

    /**
     * 특정 Q&A에 답변을 등록(수정)합니다.
     */
    @PostMapping("/api/seller/qnas/{qnaId}/reply")
    @ResponseBody
    public ResponseEntity<Void> replyToQna(
            @AuthenticationPrincipal UserDTO seller,
            @PathVariable int qnaId,
            @RequestBody Map<String, String> payload) {

        String answer = payload.get("answer");
        if (answer == null || answer.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        try {
            qnAService.replyToQna(seller.getId(), qnaId, answer);
            return ResponseEntity.ok().build();
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }

}
