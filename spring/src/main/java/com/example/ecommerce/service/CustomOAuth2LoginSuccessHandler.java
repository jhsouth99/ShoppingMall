package com.example.ecommerce.service;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;

import com.example.ecommerce.OAuthAttributes;
import com.example.ecommerce.dao.OAuthAttributesDAO;
import com.example.ecommerce.vo.OAuthAttributesVO;
import com.example.ecommerce.vo.UserVO;

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

        // registrationId ��������
        OAuth2AuthenticationToken oauthToken = (OAuth2AuthenticationToken) authentication;
        String registrationId = oauthToken.getAuthorizedClientRegistrationId();
        
        // userNameAttributeName ��������
        ClientRegistration clientRegistration =
                clientRegistrationRepository.findByRegistrationId(registrationId);
        String userNameAttributeName =
                clientRegistration
                  .getProviderDetails()
                  .getUserInfoEndpoint()
                  .getUserNameAttributeName();

        // ���� ��ü�κ��� OAuth2User ������ ��������
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        
        // registrationId�� attributes�� ������� OAuthAttributes ��ü�� ����
        OAuthAttributes attributes = OAuthAttributes.of(registrationId,
        		userNameAttributeName, oAuth2User.getAttributes());

        HttpSession session = request.getSession();
        UserVO existingLoggedInUser = (UserVO) session.getAttribute("loginUser");

        // OAuth2 ���� ���(authentication)�� ������, �̹� ���ǿ� �α��ε� �����(existingAuth)�� �ִ��� üũ
        if (existingLoggedInUser != null) {
        	// �̹� �α��ε� ����ڰ� ���� ������ �õ��ϴ� ���
        	logger.info("### ���� ���� ���� ### �����: {}, �ű� �Ҽ�: {}",
        			existingLoggedInUser.getUsername(), registrationId);

            // ���� ������ �Ҽ� ���� ������ ������
            // '���� ����� ID'�� '���ο� �Ҽ� ���� ����'�� �Բ� DB�� �����ϴ� ���� ȣ��
            userService.linkSocialAccount(existingLoggedInUser.getId(), attributes);

            // ���������� ������ ���𷺼�
            response.sendRedirect(request.getContextPath() +
            		"/my-page?link_success=" + registrationId);
            
        }else {
            // ��α��� ���¿��� �Ҽ� �α����� �õ��ϴ� ���
            logger.info("### �ű� �Ҽ� �α��� ���� ### �Ҽ�: {}", registrationId);
            
            // DB���� �ش� �Ҽ� ������ �̹� �����Ǿ� �ִ��� Ȯ��
            OAuthAttributesVO socialLogin = oAuthAttributesDAO.findByUsernameAndProviderId(attributes.getNameAttributeValue(), attributes.getProvider());

            if (socialLogin != null) {
                // �̹� ������ ���� -> �ٷ� �α��� ó��
                logger.info("�̹� ������ �����Դϴ�. �ٷ� �α����մϴ�.");
                UserVO user = userService.processOAuthUser(attributes); // ���� ȸ�� ���� �ε�
                updateAuthenticationAndSession(request, user, oauthToken); // ���� ���� ������ ������Ʈ �� ���� ����
                response.sendRedirect(request.getContextPath() + "/");

            } else {
                // 2-B: �̿��� ���� -> ���� �������� ���𷺼�
                logger.info("�̿��� �����Դϴ�. ���� �������� �̵��մϴ�.");
                session.setAttribute("pendingSocialAttributes", attributes);
                response.sendRedirect(request.getContextPath() + "/social/link-or-register");
            }
        }
    }
    /**
     * ���� ����(Authentication)�� DB���� ��ȸ�� ���� ������ ������Ʈ�ϰ�, ���ǿ� �����ϴ� ���� �޼ҵ�
     */
    private void updateAuthenticationAndSession(HttpServletRequest request, UserVO user, OAuth2AuthenticationToken oauthToken) {
        // 1. DB�� ���� �������� ���� ���� ����
        OAuth2AuthenticationToken newAuthentication = new OAuth2AuthenticationToken(
                user,
                user.getAuthorities(),
                oauthToken.getAuthorizedClientRegistrationId());
        SecurityContextHolder.getContext().setAuthentication(newAuthentication);

        // 2. "loginUser" Ű�� ���ǿ� ���� (���� ���� ��û �� �� ���� Ȯ��)
        request.getSession().setAttribute("loginUser", user);
    }
}