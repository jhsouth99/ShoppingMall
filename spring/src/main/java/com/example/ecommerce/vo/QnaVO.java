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
public class QnaVO {

    @Getter @Setter
    int id, user_id, seller_id, product_id;
    
    @Getter @Setter
    String title, question, answer, is_secret;
    
    @Getter @Setter
    Date questioned_at, answered_at;
}