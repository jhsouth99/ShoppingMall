package com.example.ecommerce.dto;

import java.sql.Timestamp;

import lombok.Data;

@Data
public class AgreementTermDTO {
    private int id;
    private String type;
    private String version;
    private String title;
    private String content;
    private String required;     // 'Y'/'N'
    private Timestamp createdAt;
    private Timestamp updatedAt;
}
