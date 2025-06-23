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
public class NoticeVO {

    @Getter @Setter
    int id, admin_id;
    
    @Getter @Setter
    String title, content;
    
    @Getter @Setter
    Date created_at, updated_at;
}
