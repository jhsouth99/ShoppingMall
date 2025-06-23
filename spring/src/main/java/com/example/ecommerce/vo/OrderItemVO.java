package com.example.ecommerce.vo;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@AllArgsConstructor
@NoArgsConstructor
@ToString
public class OrderItemVO {

    @Getter @Setter
    int id, order_id, product_variant_id;
    
    @Getter @Setter
    String item_comment, status;
    
    @Getter @Setter
    int quantity;
    
    @Getter @Setter
    double price_at_purchase, total_price_at_purch;
}