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
public class AttributeVO {

    @Getter @Setter
    int id;
    
    @Getter @Setter
    String name, data_type;
    
    @Getter @Setter
    Date created_at;
}