package com.example.ecommerce.vo;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@AllArgsConstructor
@NoArgsConstructor
@ToString
public class ReviewImageVO {

    @Getter @Setter
    String id;
    
    @Getter @Setter
    int review_id;
    
    @Getter @Setter
    String image_url;
    
    @Getter @Setter
    int order;
}
