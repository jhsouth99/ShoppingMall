package com.example.ecommerce.vo;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@AllArgsConstructor
@NoArgsConstructor
@ToString
public class RefundItemVO {

    @Getter @Setter
    int id, refund_id, order_item_id;
    
    @Getter @Setter
    int quantity;
    
    @Getter @Setter
    double item_price_at_refund, item_total_amount;
}
