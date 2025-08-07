package com.example.ecommerce.handler;

import java.io.IOException;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;

import com.example.ecommerce.dto.UserDTO;

public class CustomFormLoginSuccessHandler implements AuthenticationSuccessHandler {

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
            Authentication authentication) throws IOException, ServletException {

        // 인증된 사용자 정보를 UserVO로 가져옴
        UserDTO user = (UserDTO) authentication.getPrincipal();

        // 세션에 "loginUser" 라는 이름으로 사용자 정보 저장
        request.getSession().setAttribute("loginUser", user);

        // 메인 페이지로 리디렉션
        response.sendRedirect(request.getContextPath() + "/");
    }
}