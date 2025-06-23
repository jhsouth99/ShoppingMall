package com.example.ecommerce.vo;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@AllArgsConstructor
@NoArgsConstructor
@ToString
public class PromotionConditionVO {

    @Getter @Setter
    int id, promotion_id;
    
    @Getter @Setter
    String condition_type, value, card_issuer_value, string_value;
    
    @Getter @Setter
    double decimal_value;
}
