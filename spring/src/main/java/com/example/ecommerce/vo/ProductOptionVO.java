package com.example.ecommerce.vo;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@AllArgsConstructor
@NoArgsConstructor
@ToString
public class ProductOptionVO {

    @Getter @Setter
    int id, product_id;
    
    @Getter @Setter
    String name, sku;
}
