package com.example.ecommerce.vo;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@AllArgsConstructor
@NoArgsConstructor
@ToString
public class ProductImageVO {

    @Getter @Setter
    String id;
    
    @Getter @Setter
    int product_id;
    
    @Getter @Setter
    String image_url, alt_text, image_type;
    
    @Getter @Setter
    int order;
}
