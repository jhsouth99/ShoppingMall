package com.example.ecommerce.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter @Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class MarketingConsentDTO {
    private Boolean emailConsent;   // true ⇒ 동의, false ⇒ 철회
    private Boolean smsConsent;
    private String method;
    
    public MarketingConsentDTO(boolean emailConsent, boolean smsConsent) {
    	this.emailConsent = emailConsent;
    	this.smsConsent = smsConsent;
    }
}
