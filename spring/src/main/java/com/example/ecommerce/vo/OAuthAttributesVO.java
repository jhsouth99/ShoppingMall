package com.example.ecommerce.vo;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@AllArgsConstructor
@NoArgsConstructor
@ToString
public class OAuthAttributesVO {

	@Getter @Setter
	int user_id;
	
	@Getter @Setter
	String provider_id, username, email, name;
}
