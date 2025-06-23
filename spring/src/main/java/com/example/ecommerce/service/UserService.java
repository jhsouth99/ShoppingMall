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
     * OAuth2 �α��� ����ڸ� ó���ϴ� �޼ҵ�.
     * ����ڰ� ������ �����ϰ�, ������ ������ �ε��մϴ�.<br/>
     * ����: �Ҽ� �α��� �� �ڵ��� �ƴ� �������� ������ ������ ���̸�
     *  ���� ������ ���� ��� ����� ���� �����մϴ�.
     * @param email OAuth2 �����ڷκ��� ���� �̸���
     * @param name OAuth2 �����ڷκ��� ���� �̸�
     * @return UserVO ���� ����� ���� (���� ����)
     */
    @Transactional
    public UserVO processOAuthUser(OAuthAttributes attributes) {
    	OAuthAttributesVO oAuthAttributesVO = oAuthAttributesDAO.findByUsernameAndProviderId(
    			attributes.getNameAttributeValue(), attributes.getProvider());
    	logger.debug("DEBUG: (processOAuthUser) attibutes-" + attributes);
    	UserVO user;
    	
        if (oAuthAttributesVO == null) {
            // �ű� ������� ���, ���� �� ����
            user = new UserVO();
            user.setEmail(attributes.getEmail());
            
            user.setUsername(attributes.getProvider()
            		+ "_USER_" + attributes.getNameAttributeValue());
            user.setName(attributes.getName());
            user.setPassword(UUID.randomUUID().toString()); // ������ ��й�ȣ
            
            // users ���̺� ���� (useGeneratedKeys=true ���п� user.id�� PK�� ä����)
            int res = userDAO.save(user);
            
            // ���� ó��
            if (res == 0) {
            	logger.error("ERROR: processOAuthUser inserting user"
            			+ " - username=%s, provider=%s",
            			user.getUsername(), attributes.getProvider());
            	return null;
            }
            
            // user_roles ���̺� �⺻ ���� ����
            userRoleDAO.save(user.getId(), "USER");
            
            // oauthattributes ���̺� ���� ���� ����
            oAuthAttributesVO = new OAuthAttributesVO(
            		user.getId(), attributes.getProvider(), attributes.getNameAttributeValue(),
            		attributes.getEmail(), attributes.getName());
            res = oAuthAttributesDAO.save(oAuthAttributesVO);
            
            // ���� ó��
            if (res == 0) {
            	logger.error("ERROR: processOAuthUser inserting oAuthAttributes"
            			+ " - username=%s, provider=%s",
            			user.getUsername(), attributes.getProvider());
            	return null;
            }
        } else {
        	user = userDAO.findById(oAuthAttributesVO.getUser_id());
        }

        // ���� ����ڵ�, ��� ������ ����ڵ� ���� ������ DB���� �ε�
        Set<String> roles = userRoleDAO.findRolesByUserId(oAuthAttributesVO.getUser_id());
        user.setRoles(roles); // UserVO ������ authorities�� ������
        logger.debug("DEBUG: (processOAuthUser) user-" + user);

        return user;
    }
    
    /**
     * �Ϲ� ȸ������
     * @param user ���� �� UserVO ��ü (ȸ������ �� �Է� ����)
     * @param role ���� (USER)
     * @return UserVO ���� �Ϸ�� ����� ���� (���� ����)
     */
    @Transactional
    public UserVO registerUser(UserVO user, String role) {
    	// ��й�ȣ ��ȣȭ
    	String plainPassword = user.getPassword();
    	String cipherPassword = passwordEncoder.encode(plainPassword);
    	user.setPassword(cipherPassword);
    	
    	// ������ ���� ������ USERS ���̺� ���ο� ȸ�� ���� ����
    	int res = userDAO.save(user);
    	
    	// ���� ó��
    	if (res == 0) {
    		logger.error("ERROR: registerUser inserting user - username=%s",
    				user.getUsername());
    		return null;
    	}
    	
    	// ���� �ο�
    	if (role != null && !role.isBlank()) {
    		userRoleDAO.save(user.getId(), role);
    		user.setRoles(Collections.singleton(role));
    	}
    	
    	return user;
    }
    
    /**
     * ȸ������ ���� �ο�
     * @param user_id ȸ�� �ĺ���
     * @param role �ο��� ����
     * @return int ���� ����
     */
    @Transactional
    public int grantRoleToUser(int user_id, String role) {
    	int res = userRoleDAO.save(user_id, role);
    	
    	// ���� ó��
    	if (res == 0) {
    		logger.error("ERROR: grantRoleToUser inserting - user_id=%d, role=%s",
    				user_id, role);
    		return 0;
    	}
    	
    	return res;
    }

    /**
     * ȸ�� ������ �Ҽ� �α��� ����
     * @param id ȸ�� �ĺ���
     * @param pendingAttributes �Ҽ� �α��� ����
     * @return int ���� ����
     */
    @Transactional
	public int linkSocialAccount(int id, OAuthAttributes pendingAttributes) {
		return oAuthAttributesDAO.save(new OAuthAttributesVO(id,
				pendingAttributes.getProvider(),pendingAttributes.getNameAttributeValue(),
				pendingAttributes.getEmail(), pendingAttributes.getName()));
	}

    /**
     * �Ҽ� �����ڸ� ���� �ű� ȸ�� ���� �� �Ҽ� ���� ���� �޼ҵ�
     * @param signupForm ���� �� UserVO ��ü (ȸ������ �� �Է� ����)
     * @param attributes �Ҽ� �α��� ����
     * @return UserVO ���� �Ϸ�� ����� ���� (���� ����)
     */
    @Transactional
    public UserVO registerNewSocialUser(UserVO signupForm, OAuthAttributes attributes) {
    	// ��й�ȣ ��ȣȭ
    	String plainPassword = signupForm.getPassword();
    	String cipherPassword = passwordEncoder.encode(plainPassword);
    	signupForm.setPassword(cipherPassword);
    	
        // ������ ���� ������ USERS ���̺� ���ο� ȸ�� ���� ����
        userDAO.save(signupForm); // �� �޼ҵ�� signupForm ��ü�� ������ id�� ä����� ��

        // USER_SOCIAL_LOGINS ���̺� �Ҽ� ���� ���� ����
        String providerId = attributes.getProvider();
        String username = attributes.getNameAttributeValue();
        String email = attributes.getEmail();
        String name = attributes.getName();
        OAuthAttributesVO newSocialLogin = new OAuthAttributesVO(signupForm.getId(),
        		providerId, username, email, name);
        oAuthAttributesDAO.save(newSocialLogin);

        // 3. USER_ROLES ���̺� �⺻ ���� ����
        userRoleDAO.save(signupForm.getId(), "USER");
        signupForm.setRoles(Collections.singleton("USER"));
        
        // ���������� ������ ȸ�� ���� ��ȯ
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
