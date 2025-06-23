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
public class UserCouponVO {

    @Getter @Setter
    int id, user_id, coupon_id, order_id;
    
    @Getter @Setter
    Date used_at, created_at;
}