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
    @Transactional(readOnly = true) // Shared Lock 걸기
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
    	logger.info("==================================================");
        logger.info("loadUserByUsername - 시도된 사용자명: {}", username); // 입력된 아이디 확인
        // DB에서 username으로 사용자 정보 조회
        UserVO userVO = userDAO.findByUsername(username);
        if (userVO == null) {
        	logger.warn("DB에서 사용자를 찾을 수 없습니다: {}", username); // DB 조회 결과 확인
            logger.info("==================================================");
        	throw new UsernameNotFoundException("User not found with username: " + username);
        }
        logger.info("DB에서 찾은 사용자: {}", userVO.getUsername());
        logger.info("DB에 저장된 암호화된 비밀번호: {}", userVO.getPassword()); // DB 비밀번호 확인
        logger.info("사용자 활성화 여부: {}", userVO.isEnabled()); // 계정 활성화 상태 확인 (만약 있다면)
        logger.info("사용자 비정지 여부: {}", userVO.isAccountNonExpired());
        logger.info("사용자 비영구정지 여부: {}", userVO.isAccountNonLocked());
        
        // DB에서 user의 주 키(id)로 역할(Role) 조회
        Set<String> roles = userRoleDAO.findRolesByUserId(userVO.getId());

        // 사용자의 역할(Role) 정보를 GrantedAuthority 컬렉션으로 변환
        userVO.setRoles(roles);
        logger.info("부여된 권한: {}", userVO.getAuthorities()); // 최종 권한 확인
        logger.info("==================================================");
        // Spring Security의 UserDetails 객체로 변환하여 반환
        return userVO;
    }
}
