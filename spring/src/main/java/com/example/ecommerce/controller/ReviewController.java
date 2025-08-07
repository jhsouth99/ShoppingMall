package com.example.ecommerce.controller;

import com.example.ecommerce.dto.PageResult;
import com.example.ecommerce.dto.ReviewDTO;
import com.example.ecommerce.dto.UserDTO;
import com.example.ecommerce.service.ReviewService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@Controller
@RequiredArgsConstructor
public class ReviewController {

    private static final Logger logger = LoggerFactory.getLogger(ReviewController.class);

    private final ObjectMapper objectMapper;
    private final ReviewService reviewService;

    /**
     * 사용자 리뷰 목록 조회
     */
    @GetMapping("/api/user/reviews")
    @ResponseBody
    public PageResult<ReviewDTO> getUserReviews(
            @AuthenticationPrincipal UserDTO user,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {

        return reviewService.getUserReviews(user.getId(), page, size);
    }

    /**
     * 특정 상품의 리뷰 목록 조회 (상품 상세 페이지용)
     */
    @GetMapping("/api/products/{productId}/reviews")
    @ResponseBody
    public PageResult<ReviewDTO> getProductReviews(
            @PathVariable int productId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Integer rating) {

        return reviewService.getProductReviews(productId, page, size, rating);
    }

    /**
     * 특정 리뷰 상세 조회
     */
    @GetMapping("/api/reviews/{reviewId}")
    @ResponseBody
    public ResponseEntity<ReviewDTO> getReviewDetails(@PathVariable int reviewId) {
        try {
            ReviewDTO review = reviewService.getReviewById(reviewId);
            return ResponseEntity.ok(review);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * 리뷰 작성 (이미지 포함)
     */
    @PostMapping(value = "/api/reviews", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseBody
    public ResponseEntity<?> createReview(
            @AuthenticationPrincipal UserDTO user,
            @RequestParam("reviewData") String reviewDataJson,
            @RequestParam(value = "images", required = false) List<MultipartFile> images) {

        try {
            // JSON 문자열을 ReviewDTO 객체로 변환
            ReviewDTO reviewData = objectMapper.readValue(reviewDataJson, ReviewDTO.class);
            reviewData.setCustomerId(user.getId());
            reviewData.setCustomerName(user.getName());

            // 리뷰 생성 (이미지 포함)
            int newReviewId = reviewService.createReview(reviewData, images);

            logger.info("리뷰 작성 완료: reviewId={}, userId={}, imageCount={}",
                    newReviewId, user.getId(), images != null ? images.size() : 0);

            return ResponseEntity.ok(Map.of("reviewId", newReviewId, "success", true));

        } catch (Exception e) {
            logger.error("리뷰 작성 중 오류 발생", e);
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "리뷰 작성에 실패했습니다: " + e.getMessage()));
        }
    }

    /**
     * 리뷰 수정 (이미지 포함)
     */
    @PutMapping(value = "/api/reviews/{reviewId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseBody
    public ResponseEntity<?> updateReview(
            @AuthenticationPrincipal UserDTO user,
            @PathVariable int reviewId,
            @RequestParam("reviewData") String reviewDataJson,
            @RequestParam(value = "images", required = false) List<MultipartFile> images,
            @RequestParam(value = "keepExistingImages", required = false, defaultValue = "false") boolean keepExistingImages) {

        try {
            // JSON 문자열을 ReviewDTO 객체로 변환
            ReviewDTO reviewData = objectMapper.readValue(reviewDataJson, ReviewDTO.class);
            reviewData.setId(reviewId);
            reviewData.setCustomerId(user.getId());

            // 리뷰 수정 (이미지 포함)
            reviewService.updateReview(user.getId(), reviewId, reviewData, images, keepExistingImages);

            logger.info("리뷰 수정 완료: reviewId={}, userId={}, imageCount={}",
                    reviewId, user.getId(), images != null ? images.size() : 0);

            return ResponseEntity.ok(Map.of("success", true, "message", "리뷰가 성공적으로 수정되었습니다."));

        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "권한이 없습니다."));
        } catch (Exception e) {
            logger.error("리뷰 수정 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "리뷰 수정에 실패했습니다: " + e.getMessage()));
        }
    }

    /**
     * 리뷰 삭제
     */
    @DeleteMapping("/api/user/reviews/{reviewId}")
    @ResponseBody
    public ResponseEntity<Void> deleteReview(
            @PathVariable int reviewId,
            @AuthenticationPrincipal UserDTO user) {

        try {
            reviewService.deleteUserReviewOneself(user.getId(), reviewId);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }

    /**
     * 특정 리뷰의 개별 이미지 삭제
     */
    @DeleteMapping("/api/reviews/{reviewId}/images/{imageFileName}")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> deleteReviewImage(
            @AuthenticationPrincipal UserDTO user,
            @PathVariable int reviewId,
            @PathVariable String imageFileName) {

        try {
            boolean deleted = reviewService.deleteReviewImage(user.getId(), reviewId, imageFileName);

            if (deleted) {
                return ResponseEntity.ok(Map.of("success", true, "message", "이미지가 삭제되었습니다."));
            } else {
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "message", "이미지 삭제에 실패했습니다."));
            }

        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("success", false, "message", "권한이 없습니다."));
        } catch (Exception e) {
            logger.error("리뷰 이미지 삭제 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "서버 오류가 발생했습니다."));
        }
    }

    /**
     * 리뷰 도움됨 투표
     */
    @PostMapping("/api/reviews/{reviewId}/helpful")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> voteHelpful(
            @AuthenticationPrincipal UserDTO user,
            @PathVariable int reviewId,
            @RequestBody Map<String, Boolean> request) {

        try {
            boolean isHelpful = request.getOrDefault("isHelpful", true);
            reviewService.voteHelpful(user.getId(), reviewId, isHelpful);

            return ResponseEntity.ok(Map.of("success", true, "message", "투표가 완료되었습니다."));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", e.getMessage()));
        } catch (Exception e) {
            logger.error("리뷰 도움됨 투표 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "서버 오류가 발생했습니다."));
        }
    }

    /**
     * 사용자가 작성 가능한 리뷰 목록 조회 (주문 기반)
     */
    @GetMapping("/api/user/available-reviews")
    @ResponseBody
    public PageResult<ReviewDTO> getAvailableReviews(
            @AuthenticationPrincipal UserDTO user,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {

        return reviewService.getAvailableReviews(user.getId(), page, size);
    }

    /**
     * 특정 주문 항목에 대한 리뷰 작성 가능 여부 확인
     */
    @GetMapping("/api/orders/{orderItemId}/review-availability")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> checkReviewAvailability(
            @AuthenticationPrincipal UserDTO user,
            @PathVariable int orderItemId) {

        try {
            boolean canWriteReview = reviewService.canWriteReview(user.getId(), orderItemId);
            boolean hasExistingReview = reviewService.hasExistingReview(user.getId(), orderItemId);

            return ResponseEntity.ok(Map.of(
                    "canWriteReview", canWriteReview,
                    "hasExistingReview", hasExistingReview
            ));

        } catch (Exception e) {
            logger.error("리뷰 작성 가능 여부 확인 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "서버 오류가 발생했습니다."));
        }
    }


    /**
     * 판매자의 상품에 달린 리뷰 목록을 조회합니다.
     */
    @GetMapping("/api/seller/reviews")
    @ResponseBody
    public ResponseEntity<PageResult<ReviewDTO>> getReviews(
            @AuthenticationPrincipal UserDTO seller,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer rating) {
        PageResult<ReviewDTO> result = reviewService.getReviewsForSeller(seller.getId(), page, size, keyword, rating);
        return ResponseEntity.ok(result);
    }

    /**
     * 특정 리뷰의 상세 정보를 조회합니다.
     */
    @GetMapping("/api/seller/reviews/{reviewId}")
    @ResponseBody
    public ResponseEntity<ReviewDTO> getReviewDetails(
            @AuthenticationPrincipal UserDTO seller,
            @PathVariable int reviewId) {
        try {
            ReviewDTO details = reviewService.getReviewDetails(seller.getId(), reviewId);
            return ResponseEntity.ok(details);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }

    /**
     * 특정 리뷰에 판매자 댓글을 등록합니다.
     */
    @PostMapping("/api/seller/reviews/{reviewId}/reply")
    @ResponseBody
    public ResponseEntity<Void> saveReviewReply(
            @AuthenticationPrincipal UserDTO seller,
            @PathVariable int reviewId,
            @RequestBody Map<String, String> payload) {
        try {
            reviewService.saveReply(seller.getId(), reviewId, payload.get("content"));
            return ResponseEntity.ok().build();
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }

}