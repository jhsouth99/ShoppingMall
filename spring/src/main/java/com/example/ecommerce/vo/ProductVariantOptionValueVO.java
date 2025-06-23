package com.example.ecommerce.vo;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@AllArgsConstructor
@NoArgsConstructor
@ToString
public class ProductVariantOptionValueVO {

    @Getter @Setter
    int variant_id, product_option_value_id;
    
    @Getter @Setter
    int product_option_id;
}
