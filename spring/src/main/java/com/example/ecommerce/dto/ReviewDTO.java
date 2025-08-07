package com.example.ecommerce.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class ReviewDTO {
    private int id;
    private Integer productId;
    private String productName;
    private Integer customerId;
    private String customerName;
    private Integer orderItemId;
    private int rating;
    private String comment; // review_comment 필드
    private String content; // comment의 alias
    private String reply; // 판매자 댓글
    private Boolean isPhotoReview;
    private Boolean isVerifiedPurchase;
    private Integer helpfulCount;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss", shape = JsonFormat.Shape.STRING)
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss", shape = JsonFormat.Shape.STRING)
    private LocalDateTime repliedAt;

    private List<String> imageUrls; // 리뷰 첨부 이미지 URL 목록

    // Getter/Setter for content (comment의 alias)
    public String getContent() {
        return comment;
    }

    public void setContent(String content) {
        this.comment = content;
    }
}