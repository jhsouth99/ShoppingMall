package com.example.ecommerce.service;

import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.transaction.annotation.Transactional;

import com.example.ecommerce.dao.UserDAO;
import com.example.ecommerce.dao.UserRoleDAO;
import com.example.ecommerce.vo.UserVO;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserDAO userDAO;
    private final UserRoleDAO userRoleDAO;
    
    private static final Logger logger = LoggerFactory.getLogger(CustomUserDetailsService.class);

    @Override
    @Transactional(readOnly = true) // Shared Lock �ɱ�
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
    	logger.info("==================================================");
        logger.info("loadUserByUsername - �õ��� ����ڸ�: {}", username); // �Էµ� ���̵� Ȯ��
        // DB���� username���� ����� ���� ��ȸ
        UserVO userVO = userDAO.findByUsername(username);
        if (userVO == null) {
        	logger.warn("DB���� ����ڸ� ã�� �� �����ϴ�: {}", username); // DB ��ȸ ��� Ȯ��
            logger.info("==================================================");
        	throw new UsernameNotFoundException("User not found with username: " + username);
        }
        logger.info("DB���� ã�� �����: {}", userVO.getUsername());
        logger.info("DB�� ����� ��ȣȭ�� ��й�ȣ: {}", userVO.getPassword()); // DB ��й�ȣ Ȯ��
        logger.info("����� Ȱ��ȭ ����: {}", userVO.isEnabled()); // ���� Ȱ��ȭ ���� Ȯ�� (���� �ִٸ�)
        logger.info("����� ������ ����: {}", userVO.isAccountNonExpired());
        logger.info("����� �񿵱����� ����: {}", userVO.isAccountNonLocked());
        
        // DB���� user�� �� Ű(id)�� ����(Role) ��ȸ
        Set<String> roles = userRoleDAO.findRolesByUserId(userVO.getId());

        // ������� ����(Role) ������ GrantedAuthority �÷������� ��ȯ
        userVO.setRoles(roles);
        logger.info("�ο��� ����: {}", userVO.getAuthorities()); // ���� ���� Ȯ��
        logger.info("==================================================");
        // Spring Security�� UserDetails ��ü�� ��ȯ�Ͽ� ��ȯ
        return userVO;
    }
}
