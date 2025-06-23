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
public class TagVO {

    @Getter @Setter
    int id;
    
    @Getter @Setter
    String name;
    
    @Getter @Setter
    Date created_at, updated_at;
}
