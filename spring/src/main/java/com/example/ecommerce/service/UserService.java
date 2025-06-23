package com.example.ecommerce.service;

import java.util.Collections;
import java.util.Set;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import com.example.ecommerce.OAuthAttributes;
import com.example.ecommerce.dao.OAuthAttributesDAO;
import com.example.ecommerce.dao.UserDAO;
import com.example.ecommerce.dao.UserRoleDAO;
import com.example.ecommerce.vo.OAuthAttributesVO;
import com.example.ecommerce.vo.UserVO;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class UserService {
	private final OAuthAttributesDAO oAuthAttributesDAO;
	private final UserDAO userDAO;
	private final UserRoleDAO userRoleDAO;
	private final PasswordEncoder passwordEncoder;

    private static final Logger logger = LoggerFactory.getLogger(UserService.class);

    /**
     * OAuth2 로그인 사용자를 처리하는 메소드.
     * 사용자가 없으면 생성하고, 있으면 정보를 로드합니다.<br/>
     * 주의: 소셜 로그인 후 자동이 아닌 수동으로 계정을 생성할 것이면
     *  아직 계정이 없는 경우 사용을 절대 금지합니다.
     * @param email OAuth2 제공자로부터 받은 이메일
     * @param name OAuth2 제공자로부터 받은 이름
     * @return UserVO 최종 사용자 정보 (권한 포함)
     */
    @Transactional
    public UserVO processOAuthUser(OAuthAttributes attributes) {
    	OAuthAttributesVO oAuthAttributesVO = oAuthAttributesDAO.findByUsernameAndProviderId(
    			attributes.getNameAttributeValue(), attributes.getProvider());
    	logger.debug("DEBUG: (processOAuthUser) attibutes-" + attributes);
    	UserVO user;
    	
        if (oAuthAttributesVO == null) {
            // 신규 사용자일 경우, 생성 및 저장
            user = new UserVO();
            user.setEmail(attributes.getEmail());
            
            user.setUsername(attributes.getProvider()
            		+ "_USER_" + attributes.getNameAttributeValue());
            user.setName(attributes.getName());
            user.setPassword(UUID.randomUUID().toString()); // 임의의 비밀번호
            
            // users 테이블에 저장 (useGeneratedKeys=true 덕분에 user.id에 PK가 채워짐)
            int res = userDAO.save(user);
            
            // 에러 처리
            if (res == 0) {
            	logger.error("ERROR: processOAuthUser inserting user"
            			+ " - username=%s, provider=%s",
            			user.getUsername(), attributes.getProvider());
            	return null;
            }
            
            // user_roles 테이블에 기본 역할 저장
            userRoleDAO.save(user.getId(), "USER");
            
            // oauthattributes 테이블에 관련 정보 저장
            oAuthAttributesVO = new OAuthAttributesVO(
            		user.getId(), attributes.getProvider(), attributes.getNameAttributeValue(),
            		attributes.getEmail(), attributes.getName());
            res = oAuthAttributesDAO.save(oAuthAttributesVO);
            
            // 에러 처리
            if (res == 0) {
            	logger.error("ERROR: processOAuthUser inserting oAuthAttributes"
            			+ " - username=%s, provider=%s",
            			user.getUsername(), attributes.getProvider());
            	return null;
            }
        } else {
        	user = userDAO.findById(oAuthAttributesVO.getUser_id());
        }

        // 기존 사용자든, 방금 생성된 사용자든 권한 정보를 DB에서 로드
        Set<String> roles = userRoleDAO.findRolesByUserId(oAuthAttributesVO.getUser_id());
        user.setRoles(roles); // UserVO 내에서 authorities가 설정됨
        logger.debug("DEBUG: (processOAuthUser) user-" + user);

        return user;
    }
    
    /**
     * 일반 회원가입
     * @param user 가입 전 UserVO 객체 (회원가입 폼 입력 정보)
     * @param role 권한 (USER)
     * @return UserVO 가입 완료된 사용자 정보 (권한 포함)
     */
    @Transactional
    public UserVO registerUser(UserVO user, String role) {
    	// 비밀번호 암호화
    	String plainPassword = user.getPassword();
    	String cipherPassword = passwordEncoder.encode(plainPassword);
    	user.setPassword(cipherPassword);
    	
    	// 폼에서 받은 정보로 USERS 테이블에 새로운 회원 정보 저장
    	int res = userDAO.save(user);
    	
    	// 에러 처리
    	if (res == 0) {
    		logger.error("ERROR: registerUser inserting user - username=%s",
    				user.getUsername());
    		return null;
    	}
    	
    	// 권한 부여
    	if (role != null && !role.isBlank()) {
    		userRoleDAO.save(user.getId(), role);
    		user.setRoles(Collections.singleton(role));
    	}
    	
    	return user;
    }
    
    /**
     * 회원에게 권한 부여
     * @param user_id 회원 식별자
     * @param role 부여할 역할
     * @return int 성공 여부
     */
    @Transactional
    public int grantRoleToUser(int user_id, String role) {
    	int res = userRoleDAO.save(user_id, role);
    	
    	// 에러 처리
    	if (res == 0) {
    		logger.error("ERROR: grantRoleToUser inserting - user_id=%d, role=%s",
    				user_id, role);
    		return 0;
    	}
    	
    	return res;
    }

    /**
     * 회원 계정과 소셜 로그인 연동
     * @param id 회원 식별자
     * @param pendingAttributes 소셜 로그인 정보
     * @return int 성공 여부
     */
    @Transactional
	public int linkSocialAccount(int id, OAuthAttributes pendingAttributes) {
		return oAuthAttributesDAO.save(new OAuthAttributesVO(id,
				pendingAttributes.getProvider(),pendingAttributes.getNameAttributeValue(),
				pendingAttributes.getEmail(), pendingAttributes.getName()));
	}

    /**
     * 소셜 가입자를 위한 신규 회원 생성 및 소셜 정보 연동 메소드
     * @param signupForm 가입 전 UserVO 객체 (회원가입 폼 입력 정보)
     * @param attributes 소셜 로그인 정보
     * @return UserVO 가입 완료된 사용자 정보 (권한 포함)
     */
    @Transactional
    public UserVO registerNewSocialUser(UserVO signupForm, OAuthAttributes attributes) {
    	// 비밀번호 암호화
    	String plainPassword = signupForm.getPassword();
    	String cipherPassword = passwordEncoder.encode(plainPassword);
    	signupForm.setPassword(cipherPassword);
    	
        // 폼에서 받은 정보로 USERS 테이블에 새로운 회원 정보 저장
        userDAO.save(signupForm); // 이 메소드는 signupForm 객체에 생성된 id를 채워줘야 함

        // USER_SOCIAL_LOGINS 테이블에 소셜 연동 정보 저장
        String providerId = attributes.getProvider();
        String username = attributes.getNameAttributeValue();
        String email = attributes.getEmail();
        String name = attributes.getName();
        OAuthAttributesVO newSocialLogin = new OAuthAttributesVO(signupForm.getId(),
        		providerId, username, email, name);
        oAuthAttributesDAO.save(newSocialLogin);

        // 3. USER_ROLES 테이블에 기본 권한 저장
        userRoleDAO.save(signupForm.getId(), "USER");
        signupForm.setRoles(Collections.singleton("USER"));
        
        // 최종적으로 생성된 회원 정보 반환
        return signupForm;
    }

    @Transactional(readOnly = true)
	public boolean existsByUsername(String username) {
    	return userDAO.findByUsername(username) != null;
	}

	public boolean existsByEmail(String email) {
		return userDAO.findByEmail(email) != null;
	}
}
