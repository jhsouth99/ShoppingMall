package com.example.ecommerce.vo;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@AllArgsConstructor
@NoArgsConstructor
@ToString
public class ShippingMethodVO {

    @Getter @Setter
    int id, carrier_id;
    
    @Getter @Setter
    String name, estimated_days, is_active;
    
    @Getter @Setter
    double cost;
}