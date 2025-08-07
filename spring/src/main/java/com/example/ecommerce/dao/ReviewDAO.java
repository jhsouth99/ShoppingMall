package com.example.ecommerce.dao;

import com.example.ecommerce.dto.ReviewDTO;
import com.example.ecommerce.dto.ReviewImageDTO;
import lombok.RequiredArgsConstructor;
import org.apache.ibatis.session.SqlSession;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

@Repository
@RequiredArgsConstructor
public class ReviewDAO {
    private final SqlSession sqlSession;

    // 판매자용 리뷰 조회
    public List<ReviewDTO> findReviewsBySellerId(Map<String, Object> params) {
        return sqlSession.selectList("review.findReviewsBySellerId", params);
    }

    public int countReviewsBySellerId(Map<String, Object> params) {
        return sqlSession.selectOne("review.countReviewsBySellerId", params);
    }

    // 구매자용 리뷰 조회
    public List<ReviewDTO> findReviewsByBuyerId(Map<String, Object> params) {
        return sqlSession.selectList("review.findReviewsByBuyerId", params);
    }

    public int countReviewsByBuyerId(Map<String, Object> params) {
        return sqlSession.selectOne("review.countReviewsByBuyerId", params);
    }

    // 상품별 리뷰 조회
    public List<ReviewDTO> findReviewsByProductId(Map<String, Object> params) {
        return sqlSession.selectList("review.findReviewsByProductId", params);
    }

    public int countReviewsByProductId(Map<String, Object> params) {
        return sqlSession.selectOne("review.countReviewsByProductId", params);
    }

    // 리뷰 상세 조회
    public ReviewDTO findReviewDetailsById(Map<String, Object> params) {
        return sqlSession.selectOne("review.findReviewDetailsById", params);
    }

    public ReviewDTO findReviewById(int reviewId) {
        return sqlSession.selectOne("review.findReviewById", reviewId);
    }

    // 리뷰 이미지 관련
    public List<String> findReviewImagesByReviewId(int reviewId) {
        return sqlSession.selectList("review.findReviewImagesByReviewId", reviewId);
    }

    public ReviewImageDTO findReviewImageById(String imageId) {
        return sqlSession.selectOne("review.findReviewImageById", imageId);
    }

    // 리뷰 CRUD
    public int insertReview(ReviewDTO reviewData) {
        return sqlSession.insert("review.insertReview", reviewData);
    }

    public int updateReview(ReviewDTO reviewData) {
        return sqlSession.update("review.updateReview", reviewData);
    }

    public int deleteReview(int reviewId) {
        return sqlSession.delete("review.deleteReview", reviewId);
    }

    // 리뷰 이미지 CRUD
    public int insertReviewImage(ReviewImageDTO imageDTO) {
        return sqlSession.insert("review.insertReviewImage", imageDTO);
    }

    public int deleteReviewImage(String imageId) {
        return sqlSession.delete("review.deleteReviewImage", imageId);
    }

    public int deleteReviewImages(int reviewId) {
        return sqlSession.delete("review.deleteReviewImages", reviewId);
    }

    // 판매자 댓글
    public int updateReviewReply(Map<String, Object> params) {
        return sqlSession.update("review.updateReviewReply", params);
    }

    // 포토 리뷰 상태 업데이트
    public int updateReviewPhotoStatus(int reviewId, Boolean isPhotoReview) {
        return sqlSession.update("review.updateReviewPhotoStatus",
                Map.of("reviewId", reviewId, "isPhotoReview", isPhotoReview));
    }

    // 도움됨 투표
    public int insertOrUpdateReviewHelpfulness(Map<String, Object> params) {
        return sqlSession.insert("review.insertOrUpdateReviewHelpfulness", params);
    }

    // 통계 업데이트
    public int updateProductRatingStats(int productId) {
        return sqlSession.update("review.updateProductRatingStats", productId);
    }

    public int updateReviewHelpfulCount(int reviewId) {
        return sqlSession.update("review.updateReviewHelpfulCount", reviewId);
    }

    // 작성 가능한 리뷰 조회 (주문 기반)
    public List<ReviewDTO> findAvailableReviewsByUserId(Map<String, Object> params) {
        return sqlSession.selectList("review.findAvailableReviewsByUserId", params);
    }

    public int countAvailableReviewsByUserId(Map<String, Object> params) {
        return sqlSession.selectOne("review.countAvailableReviewsByUserId", params);
    }

    // 리뷰 작성 가능 여부 확인
    public boolean canWriteReview(Map<String, Object> params) {
        Integer count = sqlSession.selectOne("review.canWriteReview", params);
        return count != null && count > 0;
    }

    public boolean hasExistingReview(Map<String, Object> params) {
        Integer count = sqlSession.selectOne("review.hasExistingReview", params);
        return count != null && count > 0;
    }

    public ReviewImageDTO findReviewImageByUrl(String imageUrl) {
        return sqlSession.selectOne("review.findReviewImageByUrl", imageUrl);
    }

    public ReviewDTO findReviewByOrderItemId(int orderItemId) {
        return sqlSession.selectOne("review.findReviewByOrderItemId", orderItemId);
    }
}