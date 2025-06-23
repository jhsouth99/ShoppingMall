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
public class GroupBuyVO {

    @Getter @Setter
    int id, product_variant_id, seller_id;
    
    @Getter @Setter
    String name, description, status;
    
    @Getter @Setter
    int target_quantity, current_quantity, min_quantity_per_user, max_quantity_per_user;
    
    @Getter @Setter
    double group_price, original_variant_price;
    
    @Getter @Setter
    Date start_date, end_date;
}
