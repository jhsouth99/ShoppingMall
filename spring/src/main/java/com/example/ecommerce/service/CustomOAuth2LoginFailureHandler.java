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
        
        // --- ���⼭ ��� ����� �������ϴ� ---
        logger.error("!!! LOGIN FAILED !!!");
        logger.error("Exception Type: {}", exception.getClass().getName());
        logger.error("Exception Message: {}", exception.getMessage());
        
        // OAuth2 ���� ���ܶ�� �� ���� ������ ����մϴ�.
        if (exception instanceof OAuth2AuthenticationException) {
            OAuth2AuthenticationException oauth2Exception = (OAuth2AuthenticationException) exception;
            logger.error("OAuth2 Error Code: {}", oauth2Exception.getError().getErrorCode());
            logger.error("OAuth2 Error Description: {}", oauth2Exception.getError().getDescription());
            logger.error("OAuth2 Error URI: {}", oauth2Exception.getError().getUri());
        }
        
        // ��ü ���� Ʈ���̽��� ����Ͽ� ��� �ܼ��� Ȯ���մϴ�.
        exception.printStackTrace();
        
        // ����ó�� �α��� �������� ���𷺼��մϴ�.
        response.sendRedirect(request.getContextPath() + "/login?error");
    }
}