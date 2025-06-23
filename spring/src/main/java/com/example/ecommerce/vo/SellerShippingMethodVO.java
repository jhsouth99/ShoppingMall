package com.example.ecommerce.vo;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@AllArgsConstructor
@NoArgsConstructor
@ToString
public class SellerShippingMethodVO {

    @Getter @Setter
    int seller_id, shipping_method_id;
    
    @Getter @Setter
    double cost_override;
    
    @Getter @Setter
    String is_default;
}
