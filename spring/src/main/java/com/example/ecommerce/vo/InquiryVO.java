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
public class InquiryVO {

    @Getter @Setter
    int id, user_id, ans_by_admin_id;
    
    @Getter @Setter
    String title, question, answer;
    
    @Getter @Setter
    Date created_at, answered_at;
}