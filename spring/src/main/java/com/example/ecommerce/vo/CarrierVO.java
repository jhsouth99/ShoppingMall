package com.example.ecommerce.vo;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@AllArgsConstructor
@NoArgsConstructor
@ToString
public class CarrierVO {

    @Getter @Setter
    int id;
    
    @Getter @Setter
    String name, code, logo_url, tracking_url_format, is_active;
}
