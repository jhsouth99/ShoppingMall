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
public class ShipmentVO {

    @Getter @Setter
    int id, order_id, shipping_method_id;
    
    @Getter @Setter
    String tracking_number, carrier_name_snapshot, recipient_name, recipient_phone, recipient_address,
           recipient_address_detail, recipient_zipcode, status;
    
    @Getter @Setter
    double cost;
    
    @Getter @Setter
    Date shipped_at, created_at, updated_at;
}
