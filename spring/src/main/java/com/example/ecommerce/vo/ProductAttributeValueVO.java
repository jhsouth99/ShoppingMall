package com.example.ecommerce.vo;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@AllArgsConstructor
@NoArgsConstructor
@ToString
public class ProductAttributeValueVO {

    @Getter @Setter
    int id, product_id, attribute_id;
    
    @Getter @Setter
    String value;
}