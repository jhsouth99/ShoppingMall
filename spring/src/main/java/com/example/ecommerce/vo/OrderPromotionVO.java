package com.example.ecommerce.vo;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@AllArgsConstructor
@NoArgsConstructor
@ToString
public class OrderPromotionVO {

    @Getter @Setter
    int order_id, promotion_id;
    
    @Getter @Setter
    double discount_amount_applied;
}
