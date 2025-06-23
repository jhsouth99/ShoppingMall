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
public class ShippingAddressVO {

    @Getter @Setter
    int id, user_id;
    
    @Getter @Setter
    String name, recipient_name, phone, address, address_detail, city, zipcode, country, is_default;
    
    @Getter @Setter
    Date created_at;
}
