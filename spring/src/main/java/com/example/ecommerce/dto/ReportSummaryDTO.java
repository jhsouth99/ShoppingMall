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
public class ReportSummaryDTO {
    private int id;
    private String reportType; // USER, PRODUCT, REVIEW, QNA
    private String reason;
    private String detail;
    private String status; // PENDING, REVIEWING, RESOLVED, REJECTED

    // 신고자 정보
    private int reporterId;
    private String reporterName;
    private String reporterUsername;

    // 신고 대상 정보
    private Integer reportedUserId;
    private String reportedUserName;
    private String reportedUserUsername;
    private Integer reportedProductId;
    private String reportedProductName;
    private Integer reportedReviewId;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss", shape = JsonFormat.Shape.STRING)
    private LocalDateTime createdAt;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss", shape = JsonFormat.Shape.STRING)
    private LocalDateTime processedAt;
    private Integer processedBy;
    private String processedByName;
    private String actionTaken;
    private String evidenceUrl;
}
