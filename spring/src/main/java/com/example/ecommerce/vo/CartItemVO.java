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
public class CartItemVO {

    @Getter @Setter
    int user_id, product_variant_id, quantity;
    
    @Getter @Setter
    Date added_at;
}
