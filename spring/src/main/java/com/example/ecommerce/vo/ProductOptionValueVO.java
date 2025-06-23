package com.example.ecommerce.vo;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@AllArgsConstructor
@NoArgsConstructor
@ToString
public class ProductOptionValueVO {

    @Getter @Setter
    int id, product_option_id;
    
    @Getter @Setter
    String value, is_active, comment_needed;
    
    @Getter @Setter
    double price_adjustment;
}
