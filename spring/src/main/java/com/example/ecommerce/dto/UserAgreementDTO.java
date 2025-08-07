package com.example.ecommerce.dto;

import java.sql.Timestamp;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

@Data
public class UserAgreementDTO {
    private int id;
    private int userId;
    private int agreementTermId;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss", shape = JsonFormat.Shape.STRING)
    private Timestamp agreedAt;
    private String status;      // 'AGREED' or 'REVOKED'
    private Timestamp revokedAt;
    private String method;
}
