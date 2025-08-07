package com.example.ecommerce.dto;

import java.util.Date;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class ShippingAddressDTO {
	private int id;
	private int userId;
	private String name;            // 주소 별칭
    private String recipientName;   // 수령인
    private String recipientPhone;
    private String address;
    private String addressDetail;
    private String zipcode;
    private String country = "KR";
    private Boolean isDefault = false;
	private Boolean isActive;
	@JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss", shape = JsonFormat.Shape.STRING)
    private Date createdAt;
    
    public boolean isValidRequestDTO() {
    	if (name == null || name.isBlank())
    		return false;
    	if (recipientName == null || recipientName.isBlank())
    		return false;
    	if (recipientPhone == null || recipientPhone.isBlank())
    		return false;
    	if (address == null || address.isBlank())
    		return false;
    	if (zipcode == null || zipcode.isBlank())
    		return false;
    	return true;
    }

	public String getPhone() {
		return recipientPhone;
	}

	public void setPhone(String phone) {
		this.recipientPhone = phone;
	}
}
