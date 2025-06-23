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
public class ProductVO {

    @Getter @Setter
    int id, seller_id, category_id;
    
    @Getter @Setter
    String name, description, detailed_content, is_business_only;
    
    @Getter @Setter
    int view_count, sold_count;
    
    @Getter @Setter
    double base_price;
    
    @Getter @Setter
    Date created_at, updated_at, deleted_at;
}
