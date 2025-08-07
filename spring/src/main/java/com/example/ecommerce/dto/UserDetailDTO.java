package com.example.ecommerce.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import java.time.LocalDateTime;
import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@ToString
@Getter @Setter
public class UserDetailDTO {
    private int id;
    private String username;
    private String name;
    private String email;
    private String phone;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss", shape = JsonFormat.Shape.STRING)
    private LocalDateTime createdAt;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss", shape = JsonFormat.Shape.STRING)
    private LocalDateTime suspendedAt;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss", shape = JsonFormat.Shape.STRING)
    private LocalDateTime resumedAt;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss", shape = JsonFormat.Shape.STRING)
    private LocalDateTime deletedAt;
    private String suspension;
    private String termination;
    private String status;
    private List<String> roles;

    // 활동 통계
    private int totalOrders;
    private long totalSpent;
    private int totalReviews;
    private int totalInquiries;
    private int totalReports; // 신고 당한 횟수
    private int reportsMade; // 신고한 횟수

    // 최근 활동
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss", shape = JsonFormat.Shape.STRING)
    private LocalDateTime lastLoginAt;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss", shape = JsonFormat.Shape.STRING)
    private LocalDateTime lastOrderAt;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss", shape = JsonFormat.Shape.STRING)
    private LocalDateTime lastReviewAt;

    // 배송지 정보
    private List<ShippingAddressDTO> shippingAddresses;

    // 계정 상태 변경 이력
    private List<UserStatusHistoryDTO> statusHistory;
}