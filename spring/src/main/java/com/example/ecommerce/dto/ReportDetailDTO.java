package com.example.ecommerce.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import java.time.LocalDateTime;

@AllArgsConstructor
@NoArgsConstructor
@ToString
@Getter @Setter
public class ReportDetailDTO {
    private int id;
    private String reportType;
    private String reason;
    private String detail;
    private String status;
    private String evidenceUrl;

    // 신고자 상세 정보
    private UserSummaryDTO reporter;

    // 신고 대상 상세 정보
    private UserSummaryDTO reportedUser;
    private ProductSummaryDTO reportedProduct;
    private ReviewDTO reportedReview;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss", shape = JsonFormat.Shape.STRING)
    private LocalDateTime createdAt;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss", shape = JsonFormat.Shape.STRING)
    private LocalDateTime processedAt;
    private Integer processedBy;
    private String processedByName;
    private String actionTaken;

    // 처리 관련
    private String processingComment;
    private String adminNotes;
}