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
public class PaymentVO {

    @Getter @Setter
    int id, order_id;
    
    @Getter @Setter
    String payment_method_type, card_issuer, status, transaction_id;
    
    @Getter @Setter
    double amount;
    
    @Getter @Setter
    Date paid_at, created_at, updated_at;
}