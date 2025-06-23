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
public class ProductVariantVO {

    @Getter @Setter
    int id, product_id;
    
    @Getter @Setter
    String sku, is_active;
    
    @Getter @Setter
    double price;
    
    @Getter @Setter
    int stock_quantity;
    
    @Getter @Setter
    Date created_at, updated_at;
}
