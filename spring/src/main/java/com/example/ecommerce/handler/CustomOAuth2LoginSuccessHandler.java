package com.example.ecommerce.handler;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;

import com.example.ecommerce.controller.OAuthAttributes;
import com.example.ecommerce.dao.OAuthAttributesDAO;
import com.example.ecommerce.dto.OAuthAttributesDTO;
import com.example.ecommerce.dto.UserDTO;
import com.example.ecommerce.service.UserService;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class CustomOAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private static final Logger logger = LoggerFactory.getLogger(CustomOAuth2LoginSuccessHandler.class);
    private final UserService userService;
    private final ClientRegistrationRepository clientRegistrationRepository;
    private final OAuthAttributesDAO oAuthAttributesDAO;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
            Authentication authentication) throws IOException, ServletException {
        
        logger.info("### OAuth2 Login Success! ###");

        // registrationId 가져오기
        OAuth2AuthenticationToken oauthToken = (OAuth2AuthenticationToken) authentication;
        String registrationId = oauthToken.getAuthorizedClientRegistrationId();
        
        // userNameAttributeName 가져오기
        ClientRegistration clientRegistration =
                clientRegistrationRepository.findByRegistrationId(registrationId);
        String userNameAttributeName =
                clientRegistration
                  .getProviderDetails()
                  .getUserInfoEndpoint()
                  .getUserNameAttributeName();

        // 인증 객체로부터 OAuth2User 정보를 가져오기
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        
        // registrationId와 attributes를 기반으로 OAuthAttributes 객체를 생성
        OAuthAttributes attributes = OAuthAttributes.of(registrationId,
        		userNameAttributeName, oAuth2User.getAttributes());

        HttpSession session = request.getSession();
        UserDTO existingLoggedInUser = (UserDTO) session.getAttribute("loginUser");

        // OAuth2 인증 결과(authentication)와 별개로, 이미 세션에 로그인된 사용자(existingAuth)가 있는지 체크
        if (existingLoggedInUser != null) {
        	// 이미 로그인된 사용자가 계정 연동을 시도하는 경우
        	logger.info("### 계정 연동 시작 ### 사용자: {}, 신규 소셜: {}",
        			existingLoggedInUser.getUsername(), registrationId);

            Authentication loggedInUserAuthentication = new UsernamePasswordAuthenticationToken(existingLoggedInUser, existingLoggedInUser.getPassword(), existingLoggedInUser.getAuthorities());

            SecurityContextHolder.getContext().setAuthentication(loggedInUserAuthentication);

            // 이미 연동된 계정인지 확인
            OAuthAttributesDTO existingLink = oAuthAttributesDAO.findByUsernameAndProviderId(
                    attributes.getNameAttributeValue(), attributes.getProvider());

            if (existingLink != null) {
                // 이미 다른 계정에 연동되어 있는 경우
                response.sendRedirect(request.getContextPath() +
                        "/mypage?link_error=already_linked");
                return;
            }

            // 새로 인증된 소셜 계정 정보를 가져옴
            // '기존 사용자 ID'와 '새로운 소셜 계정 정보'를 함께 DB에 저장하는 서비스 호출
            userService.linkSocialAccount(existingLoggedInUser.getId(), attributes);

            // 마이페이지 등으로 리디렉션
            response.sendRedirect(request.getContextPath() +
            		"/mypage?link_success=" + registrationId);
            
        }else {
            // 비로그인 상태에서 소셜 로그인을 시도하는 경우
            logger.info("### 신규 소셜 로그인 시작 ### 소셜: {}", registrationId);
            
            // DB에서 해당 소셜 계정이 이미 연동되어 있는지 확인
            OAuthAttributesDTO socialLogin = oAuthAttributesDAO.findByUsernameAndProviderId(attributes.getNameAttributeValue(), attributes.getProvider());

            if (socialLogin != null) {
                // 이미 연동된 계정 -> 바로 로그인 처리
                logger.info("이미 연동된 계정입니다. 바로 로그인합니다.");
                UserDTO user = userService.processOAuthUser(attributes); // 기존 회원 정보 로드
                updateAuthenticationAndSession(request, user, oauthToken); // 최종 인증 정보로 업데이트 및 세션 저장
                response.sendRedirect(request.getContextPath() + "/");

            } else {
                // 2-B: 미연동 계정 -> 선택 페이지로 리디렉션
                logger.info("미연동 계정입니다. 선택 페이지로 이동합니다.");
                session.setAttribute("pendingSocialAttributes", attributes);
                response.sendRedirect(request.getContextPath() + "/social/link-or-register");
            }
        }
    }
    /**
     * 인증 정보(Authentication)를 DB에서 조회한 최종 정보로 업데이트하고, 세션에 저장하는 헬퍼 메소드
     */
    private void updateAuthenticationAndSession(HttpServletRequest request, UserDTO user, OAuth2AuthenticationToken oauthToken) {
        // 1. DB의 실제 권한으로 인증 정보 갱신
        OAuth2AuthenticationToken newAuthentication = new OAuth2AuthenticationToken(
                user,
                user.getAuthorities(),
                oauthToken.getAuthorizedClientRegistrationId());
        SecurityContextHolder.getContext().setAuthentication(newAuthentication);

        // 2. "loginUser" 키로 세션에 저장 (다음 연동 요청 시 이 값을 확인)
        request.getSession().setAttribute("loginUser", user);
    }
}