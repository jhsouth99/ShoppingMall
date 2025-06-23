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
public class BusinessProfileVO {

    @Getter @Setter
    int user_id;
    
    @Getter @Setter
    String business_name, biz_number;
    
    @Getter @Setter
    Date verified_at;
    
    @Getter @Setter
    String additional_documents;
}
