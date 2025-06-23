package com.example.ecommerce.vo;

import java.util.Date;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@AllArgsConstructor
@NoArgsConstructor
@ToString
public class ReviewVO {

    @Getter @Setter
    int id, user_id, product_id, order_item_id;
    
    @Getter @Setter
    int rating;
    
    @Getter @Setter
    String review_comment;
    
    @Getter @Setter
    Date created_at;
}
