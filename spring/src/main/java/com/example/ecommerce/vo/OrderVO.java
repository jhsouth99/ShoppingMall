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
public class OrderVO {

    @Getter @Setter
    int id, user_id;
    
    @Getter @Setter
    String recipient_name, recipient_phone, recipient_address, recipient_address_detail, recipient_zipcode,
           recipient_deliv_req_type, recipient_deliv_req_msg, status;
    
    @Getter @Setter
    double sub_total_amount, shipping_fee, coupon_discount_amount, promotion_discount_amount,
           total_discount_amount, final_amount;
    
    @Getter @Setter
    Date created_at, updated_at;
}