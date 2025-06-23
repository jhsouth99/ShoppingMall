package com.example.ecommerce;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetails;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.example.ecommerce.service.UserService;
import com.example.ecommerce.vo.UserVO;

import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class LoginController {
    private final AuthenticationManager authenticationManager;
    private final UserService userService;

	private static final Logger logger = LoggerFactory.getLogger(LoginController.class);
	
	@Autowired
	HttpServletRequest request;

	@GetMapping("/login")
	public String loginPage(@RequestParam(value = "error", required = false) String error, Model model) {
		return "login";
	}
	@GetMapping("/signup")
	public String signUpFormPage() {
		return "signup";
	}
	@GetMapping("/username-exists")
    public ResponseEntity<Map<String, Boolean>> checkUsernameExists(
            @RequestParam("username") String username) {

        boolean exists = userService.existsByUsername(username);
        return ResponseEntity.ok(Collections.singletonMap("exists", exists));
    }
	@GetMapping("/email-exists")
    public ResponseEntity<Map<String, Boolean>> checkEmailExists(@RequestParam("email") String email) {
        boolean exists = userService.existsByEmail(email);
        return ResponseEntity.ok(Collections.singletonMap("exists", exists));
    }
	@PostMapping("/signup-perform") // JSP�� form action�� ��ġ��Ŵ
    public ResponseEntity<Map<String, Object>>  performSignUp(UserVO user, String password, HttpServletRequest request) {
        logger.info("Performing standard user registration for username: {}", user.getUsername());

        Map<String, Object> response = new HashMap<>();
        HttpSession session = request.getSession(); // ���� ��������

        // �̸��� ���� ���� Ȯ��
        Boolean emailVerified = (Boolean) session.getAttribute("email-verified");
        String sessionEmail = (String) session.getAttribute("email"); // ���ǿ� ����� �̸���

        if (emailVerified == null || !emailVerified || !user.getEmail().equals(sessionEmail)) {
            response.put("success", false);
            response.put("message", "�̸��� ������ �Ϸ���� �ʾҰų�, ������ �̸��� �ּҰ� �ƴմϴ�.");
            return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST); // 400 Bad Request
        }
        
        // ����� ���
        UserVO registeredUser;
        try {
        	registeredUser = userService.registerUser(user, "USER");
            if (registeredUser == null) {
                throw new Exception("User registration returned null.");
            }
        } catch(DuplicateKeyException e) {
            response.put("success", false);
            response.put("message", "�̹� ������� ���̵� �Ǵ� �̸����Դϴ�.");
            // 409 Conflict: ��û�� ������ ���� ���¿� �浹�� �� ��� (�ڿ� �ߺ�)
            return new ResponseEntity<>(response, HttpStatus.CONFLICT);
        } catch(Exception e) {
            response.put("success", false);
            response.put("message", "�� �� ���� ������ ���Կ� �����߽��ϴ�.");
            // 500 Internal Server Error: ���� ���� ����
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
        
        // ���� ���� �� �ڵ� �α��� ó��
        manuallyAuthenticateUser(registeredUser.getUsername(), password, request);

        request.getSession().setAttribute("loginUser", registeredUser);

        // �̸��� ���� ���� ���� ���� ���� (���� ����������, ���� �� ���� ���� ȿ���� ���� ����)
        session.removeAttribute("email-verified");
        session.removeAttribute("email");
        session.removeAttribute("email-verifying-code");
        session.removeAttribute("email-verifying-time");
        
        response.put("success", true);
        response.put("message", "ȸ�������� �Ϸ�Ǿ����ϴ�.");
        // 200 OK: ����
        return ResponseEntity.ok(response);
    }

    @GetMapping("/social/link-or-register")
    public String linkOrRegisterPage() {
        return "link-or-register"; // JSP ���� ���
    }
    @GetMapping("/login/link")
    public String linkLoginPage(Model model) {
        // �� �α��� ���� '������'���� ������ �� �ִ� ���� �𵨿� ��� ���� �� ����
        model.addAttribute("isLinkLogin", true);
        return "login-link"; // ���� ���� �α��� JSP
    }
    @PostMapping("/login/perform-link")
    public String performLinkLogin(HttpServletRequest request, String username, String password) {
        try {
            // ����ڰ� �Է��� ���̵�/��й�ȣ�� ���� ����
            manuallyAuthenticateUser(username, password, request);

            // ���� ���� ��, ������ �Ҽ� ���� ��������
            OAuthAttributes pendingAttributes = (OAuthAttributes) request.getSession().getAttribute("pendingSocialAttributes");
            if (pendingAttributes == null) {
                return "redirect:/login?error=session_expired";
            }

            // ���� �α��ε� ����� ������ �Ҽ� ���� ����
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            UserVO user = (UserVO) authentication.getPrincipal();
            userService.linkSocialAccount(user.getId(), pendingAttributes);

            // �ӽ� ���� ���� ����
            request.getSession().removeAttribute("pendingSocialAttributes");

            logger.info("Successfully linked social account for user: {}", user.getUsername());
            return "redirect:/";

        } catch (AuthenticationException e) {
            logger.warn("Failed to link account for user: {}. Reason: {}", username, e.getMessage());
            return "redirect:/link?error=true";
        }
    }
    @GetMapping("/signup/social")
    public String socialSignupPage(HttpSession session, Model model) {
        // ���ǿ��� �Ҽ� ���� ��������
        OAuthAttributes attributes = (OAuthAttributes) session.getAttribute("pendingSocialAttributes");
        if (attributes == null) {
            return "redirect:/login"; // ������ ����
        }
        // �̸���, �̸� ���� �𵨿� ��� ȸ������ ���� �̸� ä����
        model.addAttribute("username", attributes.getProvider() + "_" + attributes.getNameAttributeValue());
        model.addAttribute("email", attributes.getEmail());
        model.addAttribute("name", attributes.getName());
        return "signup-social"; // �Ҽ� ���� ���� JSP
    }
    @PostMapping("/signup/social-perform")
    public ResponseEntity<Map<String, Object>> performSocialSignup(UserVO signupForm, HttpServletRequest request) {
        HttpSession session = request.getSession();
        OAuthAttributes attributes = (OAuthAttributes) session.getAttribute("pendingSocialAttributes");
        if (attributes == null) {
            return new ResponseEntity<>(
                    Collections.singletonMap("message", "������ ����Ǿ��ų� ���������� �����Դϴ�."), 
                    HttpStatus.BAD_REQUEST);
        }

        Map<String, Object> response = new HashMap<>();
        
        // --- ���Ǻ� �̸��� ���� ���� ---
        String socialEmail = attributes.getEmail();      // �Ҽ� ���񽺰� ������ �̸���
        String formEmail = signupForm.getEmail();        // ����ڰ� ���� �Է�/������ �̸���

        if (!socialEmail.equals(formEmail)) {
            // �ó����� B: ����ڰ� �̸����� ������ ��� -> �츮 �ý����� �̸��� ������ �ݵ�� ���ƴ��� Ȯ��
            logger.info("User changed email from {} to {}. Verifying manual email confirmation...", socialEmail, formEmail);
            
            Boolean emailVerified = (Boolean) session.getAttribute("email-verified");
            String verifiedSessionEmail = (String) session.getAttribute("email");

            if (emailVerified == null || !emailVerified || !formEmail.equals(verifiedSessionEmail)) {
                response.put("success", false);
                response.put("message", "����� �̸��� �ּҿ� ���� ������ �ʿ��մϴ�.");
                return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
            }
            logger.info("Manually entered email {} was successfully verified.", formEmail);

        } else {
            // �ó����� A: �Ҽ� �̸����� �״�� ����ϴ� ���, ������ �ŷ��ϹǷ� ���� �˻� ����
            logger.info("User is using the verified social email {}. Skipping manual email verification.", socialEmail);
        }
        
        // �ű� ȸ�� ���� �� �Ҽ� ���� ���� (���ο� ���� �޼ҵ� ȣ��)
        UserVO newUser;
        try {
            newUser = userService.registerNewSocialUser(signupForm, attributes);
            if (newUser == null) {
                throw new Exception("Social user registration returned null.");
            }
        } catch (DuplicateKeyException e) {
            response.put("success", false);
            response.put("message", "�̹� ������� ���̵� �Ǵ� �̸��� �Դϴ�.");
            return new ResponseEntity<>(response, HttpStatus.CONFLICT);
        } catch(Exception e) {
            response.put("success", false);
            response.put("message", "�� �� ���� ������ ���Կ� �����߽��ϴ�.");
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }

        // �ӽ� ���� ���� ����
        session.removeAttribute("pendingSocialAttributes");
        session.removeAttribute("email-verified");
        session.removeAttribute("email");
        session.removeAttribute("email-verifying-code");
        session.removeAttribute("email-verifying-time");
        
        // ���� ������ �Ҽ� �������� �ڵ� �α��� ó��
        manuallyAuthenticateUser(newUser);
        
        // ���ǿ� "loginUser" �Ӽ� ���� ����
        session.setAttribute("loginUser", newUser);

        logger.info("Successfully registered new social user: {}", newUser.getUsername());
        
        response.put("success", true);
        response.put("message", "�Ҽ� �������� ȸ�������� �Ϸ�Ǿ����ϴ�.");
        return ResponseEntity.ok(response);
    }
    
    /**
     * ���̵�/��й�ȣ�� ���� ���� �� �α��� ó��
     */
    private void manuallyAuthenticateUser(String username, String password, HttpServletRequest request) {
        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(username, password);
        // request ������ �߰��Ͽ� ���� ���� �����ϵ��� ��
        authToken.setDetails(new WebAuthenticationDetails(request)); 
        
        Authentication authentication = authenticationManager.authenticate(authToken);
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }
    
    /**
     * UserVO ��ü�� ���� ���� �� �α��� ó�� (�Ҽ� ���� �� ���)
     */
    private void manuallyAuthenticateUser(UserVO user) {
        // �Ҽ� �����ڴ� ��й�ȣ ������ ��ġ�� �����Ƿ�, UserVO�� ���� ������ ���� ���� ��ü�� ����
        UsernamePasswordAuthenticationToken newAuthentication = new UsernamePasswordAuthenticationToken(
                user, // Principal
                user.getPassword(),
                user.getAuthorities()); // DB���� ������ ���� ����
        
        SecurityContextHolder.getContext().setAuthentication(newAuthentication);
    }
    
    private Map<String, Object> isValidUserSignup(UserVO vo) {
    	Map<String, Object> map = new HashMap<>();
    	boolean success = true;
    	String reason = "";
    	if (vo.getUsername() == null || vo.getUsername().isBlank()) {
    		success = false;
    		reason = "���̵�";
    	}
    	if (vo.getPassword() == null || vo.getPassword().isBlank()) {
    		success = false;
    		if (!reason.isEmpty())
    			reason += ", ";
    		reason += "��й�ȣ";
    	}
    	if (vo.getName() == null || vo.getName().isBlank()) {
    		success = false;
    		if (!reason.isEmpty())
    			reason += ", ";
    		reason += "�̸�";
    	}
    	if (vo.getPhone() == null || vo.getPhone().isBlank()) {
    		success = false;
    		if (!reason.isEmpty())
    			reason += ", ";
    		reason += "�޴���ȭ��ȣ";
    	}
    	if (vo.getEmail() == null || vo.getEmail().isBlank()) {
    		success = false;
    		if (!reason.isEmpty())
    			reason += ", ";
    		reason += "�̸���";
    	}
    	if (!success) {
    		reason += " �ʵ尡 ��� �ֽ��ϴ�.";
    	}
    	map.put("success", success);
    	map.put("reason", reason);
    	return map;
    }
}
