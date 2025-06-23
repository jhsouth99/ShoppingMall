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
public class WishlistItemVO {

    @Getter @Setter
    int user_id, product_id;
    
    @Getter @Setter
    Date added_at;
}
