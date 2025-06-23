package com.example.ecommerce.service;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;

public class CustomOAuth2LoginFailureHandler implements AuthenticationFailureHandler {

    private static final Logger logger = LoggerFactory.getLogger(CustomOAuth2LoginFailureHandler.class);

    @Override
    public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response,
            AuthenticationException exception) throws IOException, ServletException {
        
        // --- 여기서 모든 비밀이 밝혀집니다 ---
        logger.error("!!! LOGIN FAILED !!!");
        logger.error("Exception Type: {}", exception.getClass().getName());
        logger.error("Exception Message: {}", exception.getMessage());
        
        // OAuth2 관련 예외라면 더 상세한 정보를 출력합니다.
        if (exception instanceof OAuth2AuthenticationException) {
            OAuth2AuthenticationException oauth2Exception = (OAuth2AuthenticationException) exception;
            logger.error("OAuth2 Error Code: {}", oauth2Exception.getError().getErrorCode());
            logger.error("OAuth2 Error Description: {}", oauth2Exception.getError().getDescription());
            logger.error("OAuth2 Error URI: {}", oauth2Exception.getError().getUri());
        }
        
        // 전체 스택 트레이스를 출력하여 모든 단서를 확인합니다.
        exception.printStackTrace();
        
        // 기존처럼 로그인 페이지로 리디렉션합니다.
        response.sendRedirect(request.getContextPath() + "/login?error");
    }
}