package com.example.ecommerce.service;

import com.example.ecommerce.dao.OrderDAO;
import com.example.ecommerce.dao.ReviewDAO;
import com.example.ecommerce.dto.PageResult;
import com.example.ecommerce.dto.ReviewDTO;
import com.example.ecommerce.dto.ReviewImageDTO;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private static final Logger logger = LoggerFactory.getLogger(ReviewService.class);

    private final ReviewDAO reviewDAO;
    private final FileUploadService fileUploadService;
    private final OrderDAO orderDAO;

    @Value("${file.upload.review-images.path:/images/reviews/}")
    private String uploadPath;

    @Transactional(readOnly = true)
    public PageResult<ReviewDTO> getReviewsForSeller(int sellerId, int page, int size, String keyword, Integer rating) {
        int offset = (page > 0) ? (page - 1) * size : 0;
        Map<String, Object> params = new HashMap<>();
        params.put("sellerId", sellerId);
        params.put("offset", offset);
        params.put("size", size);
        params.put("keyword", keyword);
        params.put("rating", rating);

        List<ReviewDTO> content = reviewDAO.findReviewsBySellerId(params);
        int totalElements = reviewDAO.countReviewsBySellerId(params);

        return new PageResult<>(content, totalElements, page, size);
    }

    @Transactional(readOnly = true)
    public ReviewDTO getReviewDetails(int sellerId, int reviewId) {
        // 1. 리뷰 기본 정보 조회 (판매자 권한 확인 포함)
        ReviewDTO details = reviewDAO.findReviewDetailsById(Map.of("sellerId", sellerId, "reviewId", reviewId));
        if (details == null) {
            throw new SecurityException("조회 권한이 없는 리뷰입니다.");
        }

        // 2. 첨부 이미지 목록 조회 후 DTO에 설정
        List<String> imageUrls = reviewDAO.findReviewImagesByReviewId(reviewId);
        details.setImageUrls(imageUrls);

        return details;
    }

    @Transactional
    public void saveReply(int sellerId, int reviewId, String content) {
        int updatedRows = reviewDAO.updateReviewReply(Map.of(
                "sellerId", sellerId,
                "reviewId", reviewId,
                "reply", content
        ));

        if (updatedRows == 0) {
            throw new SecurityException("댓글을 등록할 권한이 없습니다.");
        }
    }

    @Transactional(readOnly = true)
    public PageResult<ReviewDTO> getUserReviews(int userId, int page, int size) {
        int offset = (page > 0) ? (page - 1) * size : 0;
        Map<String, Object> params = new HashMap<>();
        params.put("id", userId);
        params.put("offset", offset);
        params.put("size", size);

        List<ReviewDTO> content = reviewDAO.findReviewsByBuyerId(params);
        // 각 리뷰의 이미지 목록 조회
        for (ReviewDTO review : content) {
            List<String> imageUrls = reviewDAO.findReviewImagesByReviewId(review.getId());
            review.setImageUrls(imageUrls);
        }

        int totalElements = reviewDAO.countReviewsByBuyerId(params);
        return new PageResult<>(content, totalElements, page, size);
    }

    @Transactional(readOnly = true)
    public PageResult<ReviewDTO> getProductReviews(int productId, int page, int size, Integer rating) {
        int offset = (page > 0) ? (page - 1) * size : 0;
        Map<String, Object> params = new HashMap<>();
        params.put("productId", productId);
        params.put("offset", offset);
        params.put("size", size);
        params.put("rating", rating);

        List<ReviewDTO> content = reviewDAO.findReviewsByProductId(params);
        // 각 리뷰의 이미지 목록 조회
        for (ReviewDTO review : content) {
            List<String> imageUrls = reviewDAO.findReviewImagesByReviewId(review.getId());
            review.setImageUrls(imageUrls);
        }

        int totalElements = reviewDAO.countReviewsByProductId(params);
        return new PageResult<>(content, totalElements, page, size);
    }

    @Transactional(readOnly = true)
    public ReviewDTO getReviewById(int reviewId) {
        ReviewDTO review = reviewDAO.findReviewById(reviewId);
        if (review == null) {
            throw new IllegalArgumentException("존재하지 않는 리뷰입니다.");
        }

        // 이미지 목록 조회
        List<String> imageUrls = reviewDAO.findReviewImagesByReviewId(reviewId);
        review.setImageUrls(imageUrls);

        return review;
    }

    @Transactional
    public int createReview(ReviewDTO reviewData, List<MultipartFile> imageFiles) {
        // 1. 리뷰 기본 정보 저장
        reviewDAO.insertReview(reviewData);
        int reviewId = reviewData.getId();
        reviewData.setProductId(reviewDAO.findReviewById(reviewId).getProductId());

        // 2. 이미지 파일 업로드 및 저장
        if (imageFiles != null && !imageFiles.isEmpty()) {
            List<String> imageUrls = uploadReviewImages(reviewId, imageFiles);
            saveReviewImages(reviewId, imageUrls);

            // 포토 리뷰 여부 업데이트
            reviewDAO.updateReviewPhotoStatus(reviewId, true);

            logger.info("리뷰 이미지 {}개 저장 완료: reviewId={}", imageUrls.size(), reviewId);
        }

        // 3. 상품 평균 평점 및 리뷰 수 업데이트
        updateProductRatingStats(reviewData.getProductId());

        // 4. 리뷰에 해당되는 주문 아이템 업데이트
        Integer orderItemId = reviewData.getOrderItemId();
        orderDAO.setOrderItemConfirmed(orderItemId);

        return reviewId;
    }

    @Transactional
    public void updateReview(int userId, int reviewId, ReviewDTO reviewData,
                             List<MultipartFile> imageFiles, boolean keepExistingImages) {
        // 1. 권한 확인
        ReviewDTO existingReview = reviewDAO.findReviewById(reviewId);
        if (existingReview == null) {
            throw new IllegalArgumentException("존재하지 않는 리뷰입니다.");
        }
        if (!existingReview.getCustomerId().equals(userId)) {
            throw new SecurityException("수정 권한이 없는 리뷰입니다.");
        }

        // 2. 리뷰 기본 정보 업데이트
        reviewDAO.updateReview(reviewData);

        // 3. 이미지 처리
        if (!keepExistingImages) {
            // 기존 이미지 삭제
            //deleteExistingReviewImages(reviewId);
        }

        if (imageFiles != null && !imageFiles.isEmpty()) {
            List<String> imageUrls = uploadReviewImages(reviewId, imageFiles);
            saveReviewImages(reviewId, imageUrls);

            logger.info("리뷰 이미지 {}개 업데이트 완료: reviewId={}", imageUrls.size(), reviewId);
        }

        // 4. 포토 리뷰 상태 업데이트
        List<String> allImages = reviewDAO.findReviewImagesByReviewId(reviewId);
        reviewDAO.updateReviewPhotoStatus(reviewId, !allImages.isEmpty());

        // 5. 상품 평균 평점 업데이트
        updateProductRatingStats(existingReview.getProductId());
    }

    @Transactional
    public void deleteUserReviewOneself(int userId, int reviewId) {
        ReviewDTO review = reviewDAO.findReviewById(reviewId);
        if (review == null) {
            throw new IllegalArgumentException("삭제할 리뷰가 없습니다.");
        }
        if (!review.getCustomerId().equals(userId)) {
            throw new SecurityException("삭제 권한이 없는 리뷰입니다.");
        }

        // 1. 리뷰 이미지 파일 삭제
        deleteExistingReviewImages(reviewId);

        // 2. 리뷰 삭제
        int deletedRows = reviewDAO.deleteReview(reviewId);
        if (deletedRows == 0) {
            throw new IllegalArgumentException("삭제에 실패했습니다.");
        }

        // 3. 상품 평균 평점 업데이트
        updateProductRatingStats(review.getProductId());
    }

    @Transactional
    public boolean deleteReviewImage(int userId, int reviewId, String imageFileName) {
        // 1. 권한 확인
        ReviewDTO review = reviewDAO.findReviewById(reviewId);
        if (review == null || !review.getCustomerId().equals(userId)) {
            throw new SecurityException("권한이 없습니다.");
        }

        // 2. 이미지 정보 조회
        String imageUrl = uploadPath + imageFileName;
        ReviewImageDTO imageInfo = reviewDAO.findReviewImageByUrl(imageUrl);
        if (imageInfo == null || !imageInfo.getReviewId().equals(reviewId)) {
            System.out.println(imageUrl);
            System.out.println(imageInfo);
            System.out.println(reviewId);
            return false;
        }

        try {
            // 3. 실제 파일 삭제
            fileUploadService.deleteFile(imageInfo.getImageUrl());

            // 4. DB에서 이미지 레코드 삭제
            int deletedRows = reviewDAO.deleteReviewImage(imageInfo.getId());

            // 5. 포토 리뷰 상태 업데이트
            List<String> remainingImages = reviewDAO.findReviewImagesByReviewId(reviewId);
            reviewDAO.updateReviewPhotoStatus(reviewId, !remainingImages.isEmpty());

            logger.info("리뷰 이미지 삭제 완료: imageId={}, reviewId={}", imageInfo.getId(), reviewId);
            return deletedRows > 0;

        } catch (Exception e) {
            logger.error("리뷰 이미지 삭제 중 오류 발생: imageId=" + imageInfo.getId(), e);
            return false;
        }
    }

    @Transactional
    public void voteHelpful(int userId, int reviewId, boolean isHelpful) {
        // 1. 리뷰 존재 확인
        ReviewDTO review = reviewDAO.findReviewById(reviewId);
        if (review == null) {
            throw new IllegalArgumentException("존재하지 않는 리뷰입니다.");
        }

        // 2. 자신의 리뷰에는 투표 불가
        if (review.getCustomerId().equals(userId)) {
            throw new IllegalArgumentException("본인의 리뷰에는 투표할 수 없습니다.");
        }

        // 3. 투표 처리 (중복 투표 시 업데이트)
        Map<String, Object> params = new HashMap<>();
        params.put("userId", userId);
        params.put("reviewId", reviewId);
        params.put("isHelpful", isHelpful);

        reviewDAO.insertOrUpdateReviewHelpfulness(params);

        // 4. 리뷰 도움됨 카운트 업데이트
        updateReviewHelpfulCount(reviewId);
    }

    @Transactional(readOnly = true)
    public PageResult<ReviewDTO> getAvailableReviews(int userId, int page, int size) {
        int offset = (page > 0) ? (page - 1) * size : 0;
        Map<String, Object> params = new HashMap<>();
        params.put("userId", userId);
        params.put("offset", offset);
        params.put("size", size);

        List<ReviewDTO> content = reviewDAO.findAvailableReviewsByUserId(params);
        int totalElements = reviewDAO.countAvailableReviewsByUserId(params);

        return new PageResult<>(content, totalElements, page, size);
    }

    @Transactional(readOnly = true)
    public boolean canWriteReview(int userId, int orderItemId) {
        return reviewDAO.canWriteReview(Map.of("userId", userId, "orderItemId", orderItemId));
    }

    @Transactional(readOnly = true)
    public boolean hasExistingReview(int userId, int orderItemId) {
        return reviewDAO.hasExistingReview(Map.of("userId", userId, "orderItemId", orderItemId));
    }

    // === 내부 헬퍼 메서드들 ===

    /**
     * 리뷰 이미지 파일들을 업로드하고 URL 목록을 반환합니다.
     */
    private List<String> uploadReviewImages(int reviewId, List<MultipartFile> imageFiles) {
        List<String> imageUrls = new ArrayList<>();

        for (int i = 0; i < imageFiles.size(); i++) {
            MultipartFile file = imageFiles.get(i);

            if (!file.isEmpty() && isValidImageFile(file)) {
                try {
                    // 파일명 생성: review_reviewId_순서_타임스탬프.확장자
                    String filename = generateReviewImageFilename(reviewId, i, file.getOriginalFilename());

                    // 파일 저장
                    String savedPath = fileUploadService.saveFile(file, uploadPath, filename);

                    // URL 생성 (웹에서 접근 가능한 경로)
                    String imageUrl = uploadPath + filename;
                    imageUrls.add(imageUrl);

                    logger.info("리뷰 이미지 저장 완료: {} -> {}", filename, imageUrl);

                } catch (Exception e) {
                    logger.error("리뷰 이미지 업로드 실패: " + file.getOriginalFilename(), e);
                    // 업로드 실패한 파일은 건너뛰고 계속 진행
                }
            }
        }

        return imageUrls;
    }

    /**
     * 업로드된 이미지 URL들을 데이터베이스에 저장합니다.
     */
    private void saveReviewImages(int reviewId, List<String> imageUrls) {
        for (int i = 0; i < imageUrls.size(); i++) {
            ReviewImageDTO imageDTO = new ReviewImageDTO();
            imageDTO.setId(UUID.randomUUID().toString());
            imageDTO.setReviewId(reviewId);
            imageDTO.setImageUrl(imageUrls.get(i));
            imageDTO.setDisplayOrder(i + 1);

            reviewDAO.insertReviewImage(imageDTO);
        }
    }

    /**
     * 기존 리뷰 이미지들을 삭제합니다.
     */
    private void deleteExistingReviewImages(int reviewId) {
        List<String> existingImages = reviewDAO.findReviewImagesByReviewId(reviewId);

        for (String imageUrl : existingImages) {
            try {
                // 실제 파일 삭제
                fileUploadService.deleteFile(imageUrl);
            } catch (Exception e) {
                logger.warn("리뷰 이미지 파일 삭제 실패: " + imageUrl, e);
            }
        }

        // 데이터베이스에서 이미지 레코드 삭제
        reviewDAO.deleteReviewImages(reviewId);
    }

    /**
     * 이미지 파일 유효성 검사
     */
    private boolean isValidImageFile(MultipartFile file) {
        String contentType = file.getContentType();
        return contentType != null && contentType.startsWith("image/");
    }

    /**
     * 리뷰 이미지 파일명 생성
     */
    private String generateReviewImageFilename(int reviewId, int order, String originalFilename) {
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }

        return String.format("review_%d_%d_%d%s",
                reviewId, order, System.currentTimeMillis(), extension);
    }

    /**
     * 상품의 평균 평점 및 리뷰 수를 업데이트합니다.
     */
    private void updateProductRatingStats(int productId) {
        reviewDAO.updateProductRatingStats(productId);
    }

    /**
     * 리뷰의 도움됨 카운트를 업데이트합니다.
     */
    private void updateReviewHelpfulCount(int reviewId) {
        reviewDAO.updateReviewHelpfulCount(reviewId);
    }

    @Transactional(readOnly = true)
    public ReviewDTO findReviewForOrderItem(int orderItemId) {
        return reviewDAO.findReviewByOrderItemId(orderItemId);
    }
}