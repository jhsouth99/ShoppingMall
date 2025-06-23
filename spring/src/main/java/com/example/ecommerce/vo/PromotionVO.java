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
public class PromotionVO {

    @Getter @Setter
    int id, coupon_id;
    
    @Getter @Setter
    String name, description, promotion_type, discount_type, is_active;
    
    @Getter @Setter
    double discount_value, max_discount_amount;
    
    @Getter @Setter
    Date start_date, end_date, created_at, updated_at;
    
    @Getter @Setter
    int priority;
}