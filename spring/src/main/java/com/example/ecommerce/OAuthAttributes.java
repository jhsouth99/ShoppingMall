package com.example.ecommerce;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;

import lombok.Builder;
import lombok.Getter;
import lombok.ToString;

@Getter
@ToString
public class OAuthAttributes {
    private Map<String, Object> attributes;
    private String nameAttributeKey;
    private String nameAttributeValue; // e.g., "sub", "id"
    private String name;
    private String email;
    private String provider; // 어떤 소셜 로그인인지 (e.g., "google", "naver")

    private static final Logger logger = LoggerFactory.getLogger(OAuthAttributes.class);

    @Builder
    public OAuthAttributes(Map<String, Object> attributes, String nameAttributeKey, String nameAttributeValue, String name, String email, String provider) {
        this.attributes = attributes;
        this.nameAttributeKey = nameAttributeKey;
        this.nameAttributeValue = nameAttributeValue;
        this.name = name;
        this.email = email;
        this.provider = provider;
    }

    // registrationId를 기준으로 어떤 소셜 로그인인지 판단하여, 각각에 맞는 파싱 메소드를 호출
    public static OAuthAttributes of(String registrationId, String userNameAttributeName, Map<String, Object> attributes) {
        if ("google".equals(registrationId)) {
        	return ofGoogle(userNameAttributeName, attributes);
        }
        if ("naver".equals(registrationId)) {
            return ofNaver("id", attributes);
        }
        if ("kakao".equals(registrationId)) {
            return ofKakao("id", attributes);
        }
        throw new OAuth2AuthenticationException(
        		new OAuth2Error("invalid_provider", "지원하지 않는 OAuth 2.0 제공자입니다.", null));
    }

    private static OAuthAttributes ofGoogle(String userNameAttributeName, Map<String, Object> attributes) {
        String nameAttributeValue = (String) attributes.get(userNameAttributeName);
    	return OAuthAttributes.builder()
                .name((String) attributes.get("name"))
                .email((String) attributes.get("email"))
                .provider("google")
                .attributes(attributes)
                .nameAttributeKey(userNameAttributeName)
                .nameAttributeValue(nameAttributeValue)
                .build();
    }

    private static OAuthAttributes ofNaver(String userNameAttributeName, Map<String, Object> attributes) {
        Map<String, Object> response = (Map<String, Object>) attributes.get("response");
        logger.debug("DEBUG: (OAuthAttributes::ofNaver) response-" + response);

        String nameAttributeValue = response.get(userNameAttributeName).toString();
        return OAuthAttributes.builder()
                .name((String) response.get("name"))
                .email((String) response.get("email"))
                .provider("naver")
                .attributes(response)
                .nameAttributeKey(userNameAttributeName)
                .nameAttributeValue(nameAttributeValue)
                .build();
    }

    private static OAuthAttributes ofKakao(String userNameAttributeName, Map<String, Object> attributes) {
        Map<String, Object> kakaoAccount = (Map<String, Object>) attributes.get("kakao_account");
        Map<String, Object> kakaoProfile = (Map<String, Object>) kakaoAccount.get("profile");

        String nameAttributeValue = attributes.get(userNameAttributeName).toString();
        return OAuthAttributes.builder()
                .name((String) kakaoProfile.get("nickname"))
                .email("")
                .provider("kakao")
                .attributes(attributes)
                .nameAttributeKey(userNameAttributeName)
                .nameAttributeValue(nameAttributeValue)
                .build();
    }
}