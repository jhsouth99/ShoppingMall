package com.example.ecommerce.dto;

import java.util.Date;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonFormat;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@AllArgsConstructor
@NoArgsConstructor
@Getter @Setter
@ToString
public class GroupBuyDTO {

    int id, productVariantId, sellerId;
    
    String name, productName, sellerName, description, status, creatorName, productImageUrl, displayName;
    
    int targetQuantity, currentQuantity, minQuantityPerUser, maxQuantityPerUser;
    
    int groupPrice, originalVariantPrice;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm", shape = JsonFormat.Shape.STRING)
    Date startDate, endDate;
    
    List<String> options;
}
