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
public class GroupBuyParticipantVO {

    @Getter @Setter
    int id, group_buy_id, user_id, quantity, order_id, shipping_address_id;
    
    @Getter @Setter
    double total_amount_paid;
    
    @Getter @Setter
    String status, deliv_req_msg_snapshot;
    
    @Getter @Setter
    Date joined_at, created_at, updated_at;
}