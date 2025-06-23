package com.example.ecommerce.vo;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@AllArgsConstructor
@NoArgsConstructor
@ToString
public class ShipmentItemVO {

    @Getter @Setter
    int id, shipment_id, order_item_id;
    
    @Getter @Setter
    int quantity;
}
