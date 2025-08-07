package com.example.ecommerce.service;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import com.example.ecommerce.controller.OAuthAttributes;
import com.example.ecommerce.dao.OAuthAttributesDAO;
import com.example.ecommerce.dao.ProductDAO;
import com.example.ecommerce.dao.ShippingAddressDAO;
import com.example.ecommerce.dao.UserDAO;
import com.example.ecommerce.dao.UserRoleDAO;
import com.example.ecommerce.dto.OAuthAttributesDTO;
import com.example.ecommerce.dto.UserDTO;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class UserService {
	private final PasswordEncoder passwordEncoder;
	private final OAuthAttributesDAO oAuthAttributesDAO;
	private final UserDAO userDAO;
	private final UserRoleDAO userRoleDAO;
    private final ProductDAO sellerProductDAO;
    private final ShippingAddressDAO shippingAddressDAO;

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
    public UserDTO processOAuthUser(OAuthAttributes attributes) {
    	OAuthAttributesDTO oAuthAttributesDTO = oAuthAttributesDAO.findByUsernameAndProviderId(
    			attributes.getNameAttributeValue(), attributes.getProvider());
    	logger.debug("DEBUG: (processOAuthUser) attibutes-" + attributes);
    	UserDTO user;
    	
        if (oAuthAttributesDTO == null) {
            // 신규 사용자일 경우, 생성 및 저장
            user = new UserDTO();
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
            oAuthAttributesDTO = new OAuthAttributesDTO(
            		user.getId(), attributes.getProvider(), attributes.getNameAttributeValue(),
            		attributes.getEmail(), attributes.getName());
            res = oAuthAttributesDAO.save(oAuthAttributesDTO);
            
            // 에러 처리
            if (res == 0) {
            	logger.error("ERROR: processOAuthUser inserting oAuthAttributes"
            			+ " - username=%s, provider=%s",
            			user.getUsername(), attributes.getProvider());
            	return null;
            }
        } else {
        	user = userDAO.findById(oAuthAttributesDTO.getUserId());
        }

        // 기존 사용자든, 방금 생성된 사용자든 권한 정보를 DB에서 로드
        Set<String> roles = userRoleDAO.findRolesByUserId(oAuthAttributesDTO.getUserId());
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
    public UserDTO registerUser(UserDTO user, String role) {
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
		return oAuthAttributesDAO.save(new OAuthAttributesDTO(id,
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
    public UserDTO registerNewSocialUser(UserDTO signupForm, OAuthAttributes attributes) {
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
        OAuthAttributesDTO newSocialLogin = new OAuthAttributesDTO(signupForm.getId(),
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

    @Transactional(readOnly = true)
	public boolean existsByEmail(String email) {
		return userDAO.findByEmail(email) != null;
	}

	@Transactional
	public int resetPassword(int id, String newPasswordEncoded) {
		UserDTO user = userDAO.findById(id);
		user.setPassword(newPasswordEncoded);
		return userDAO.update(user);
	}

	@Transactional
	public int setEmail(int id, String email) {
		UserDTO user = userDAO.findById(id);
		user.setEmail(email);
		return userDAO.update(user);
	}

	@Transactional
	public int setPhone(int id, String phone) {
		UserDTO user = userDAO.findById(id);
		user.setPhone(phone);
		return userDAO.update(user);
	}
	
    /**
     * 회원 탈퇴를 처리합니다.
     * @param userId 탈퇴할 사용자의 ID
     * @param currentPassword 확인을 위해 입력한 현재 비밀번호
     */
    @Transactional
    public void deactivateUser(int userId, String currentPassword) {
        // 1. 사용자 정보 및 현재 비밀번호 확인
        UserDTO user = userDAO.findById(userId);
		Set<String> roles = userRoleDAO.findRolesByUserId(userId);
		user.setRoles(roles);
		if (user == null) {
            throw new IllegalArgumentException("사용자 정보를 찾을 수 없습니다.");
        }
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new SecurityException("비밀번호가 일치하지 않습니다.");
        }

        // 2. 사용자가 판매자인 경우, 모든 상품을 비활성화 처리
        if (user.getRoles().contains("SELLER")) {
            sellerProductDAO.deactivateAllProductsBySeller(userId);
        }
        
        // 3. 배송지 등 민감한 정보가 담긴 다른 테이블의 데이터 처리
        shippingAddressDAO.anonymizeByUserId(userId);

        // ... 주문, 리뷰 등 다른 테이블의 개인정보도 필요시 비식별화 처리 ...
        
        // 4. users 테이블 비활성화 및 비식별화 처리
        userDAO.deactivateUser(userId);
        
        // 5. Spring Security 컨텍스트 클리어 (로그아웃 처리)
        SecurityContextHolder.clearContext();
    }

	// 사용자의 소셜 계정 목록 조회
	@Transactional(readOnly = true)
	public List<OAuthAttributesDTO> getUserSocialAccounts(int userId) {
		return oAuthAttributesDAO.findByUserId(userId);
	}

	// 소셜 계정 연동 해제
	@Transactional
	public void unlinkSocialAccount(int userId, String provider) {
		// 최소 하나의 로그인 수단은 남겨두어야 함
		UserDTO user = userDAO.findById(userId);
		List<OAuthAttributesDTO> socialAccounts = oAuthAttributesDAO.findByUserId(userId);

		// 비밀번호가 없고 소셜 계정이 1개뿐인 경우 연동 해제 불가
		if ((user.getPassword() == null || user.getPassword().isEmpty())
				&& socialAccounts.size() <= 1) {
			throw new IllegalStateException("마지막 로그인 수단은 해제할 수 없습니다.");
		}

		int result = oAuthAttributesDAO.deleteByUserIdAndProviderId(userId, provider);
		if (result == 0) {
			throw new IllegalArgumentException("연동된 계정을 찾을 수 없습니다.");
		}
	}


	/**
	 * 이름과 이메일로 사용자 찾기 (아이디 찾기용)
	 */
	@Transactional(readOnly = true)
	public UserDTO findByNameAndEmail(String name, String email) {
		return userDAO.findByNameAndEmail(name, email);
	}

	/**
	 * 아이디와 이메일로 사용자 찾기 (비밀번호 찾기용)
	 */
	@Transactional(readOnly = true)
	public UserDTO findByUsernameAndEmail(String username, String email) {
		UserDTO user = userDAO.findByUsername(username);
		if (user != null && email.equals(user.getEmail())) {
			return user;
		}
		return null;
	}

	/**
	 * 이름과 휴대폰 번호로 사용자 찾기 (아이디 찾기용)
	 */
	@Transactional(readOnly = true)
	public UserDTO findByNameAndPhone(String name, String phone) {
		return userDAO.findByNameAndPhone(name, phone);
	}

	/**
	 * 아이디와 휴대폰 번호로 사용자 찾기 (비밀번호 찾기용)
	 */
	@Transactional(readOnly = true)
	public UserDTO findByUsernameAndPhone(String username, String phone) {
		UserDTO user = userDAO.findByUsername(username);
		if (user != null && phone.equals(user.getPhone())) {
			return user;
		}
		return null;
	}

	/**
	 * 비밀번호 재설정 토큰 저장
	 */
	@Transactional
	public void savePasswordResetToken(int userId, String resetToken) {
		UserDTO user = userDAO.findById(userId);
		if (user != null) {
			user.setResetToken(resetToken);
			user.setResetTokenExpiresAt(Date.from(LocalDateTime.now().plusHours(24).atZone(ZoneId.systemDefault()).toInstant())); // 24시간 유효
			userDAO.updateResetToken(user);
		}
	}

	/**
	 * 재설정 토큰으로 사용자 찾기
	 */
	@Transactional(readOnly = true)
	public UserDTO findByResetToken(String resetToken) {
		return userDAO.findByResetToken(resetToken);
	}

	/**
	 * 재설정 토큰 초기화
	 */
	@Transactional
	public void clearResetToken(int userId) {
		UserDTO user = userDAO.findById(userId);
		if (user != null) {
			user.setResetToken(null);
			user.setResetTokenExpiresAt(null);
			userDAO.updateResetToken(user);
		}
	}

	/**
	 * ID로 사용자 찾기
	 */
	@Transactional(readOnly = true)
	public UserDTO findById(int id) {
		return userDAO.findById(id);
	}
}
