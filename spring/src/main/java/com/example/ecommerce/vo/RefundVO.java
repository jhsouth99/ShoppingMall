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
public class RefundVO {

    @Getter @Setter
    int id, order_id, payment_id, processed_by;
    
    @Getter @Setter
    double prod_items_total_amount, shipping_fee_deduction, other_deductions, final_refund_amount;
    
    @Getter @Setter
    String refund_reason, status, transaction_id;
    
    @Getter @Setter
    Date requested_at, processed_at, created_at, updated_at;
}