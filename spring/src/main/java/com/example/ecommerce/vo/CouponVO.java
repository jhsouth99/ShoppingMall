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
public class CouponVO {

    @Getter @Setter
    int id;
    
    @Getter @Setter
    String code, discount_type;
    
    @Getter @Setter
    double discount_value, min_purchase_amount, usage_limit_per_user, total_usage_limit, current_usage_count;
    
    @Getter @Setter
    Date valid_from, valid_to, created_at;
    
    @Getter @Setter
    String is_active;
}
