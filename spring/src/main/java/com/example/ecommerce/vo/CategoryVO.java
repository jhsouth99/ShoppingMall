package com.example.ecommerce.vo;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@AllArgsConstructor
@NoArgsConstructor
@ToString
public class CategoryVO {

    @Getter @Setter
    int id;
    
    @Getter @Setter
    String name;
    
    @Getter @Setter
    int parent_id;
}
