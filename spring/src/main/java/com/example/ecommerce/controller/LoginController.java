package com.example.ecommerce.controller;

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
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.authentication.WebAuthenticationDetails;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;

import com.example.ecommerce.dto.UserDTO;
import com.example.ecommerce.service.UserService;

import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class LoginController {
    private final AuthenticationManager authenticationManager;
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;

	private static final Logger logger = LoggerFactory.getLogger(LoginController.class);

	@GetMapping("/login")
	public String loginPage(@RequestParam(value = "error", required = false) String error, Model model) {
		return "login";
	}

	@GetMapping("/signup")
	public String signUpFormPage() {
		return "signup";
	}

	@GetMapping("/api/username-exists")
    public ResponseEntity<Map<String, Boolean>> checkUsernameExists(
            @RequestParam("username") String username) {

        boolean exists = userService.existsByUsername(username);
        return ResponseEntity.ok(Collections.singletonMap("exists", exists));
    }

	@GetMapping("/api/email-exists")
    public ResponseEntity<Map<String, Boolean>> checkEmailExists(@RequestParam("email") String email) {
        boolean exists = userService.existsByEmail(email);
        return ResponseEntity.ok(Collections.singletonMap("exists", exists));
    }

	@PostMapping("/api/signup-perform") // JSP의 form action과 일치시킴
    public ResponseEntity<Map<String, Object>>  performSignUp(UserDTO user, String password, HttpServletRequest request) {
        logger.info("Performing standard user registration for username: {}", user.getUsername());

        Map<String, Object> response = new HashMap<>();
        HttpSession session = request.getSession(); // 세션 가져오기

        // 이메일 인증 여부 확인
        Boolean emailVerified = (Boolean) session.getAttribute("email-verified");
        String sessionEmail = (String) session.getAttribute("email"); // 세션에 저장된 이메일

        if (emailVerified == null || !emailVerified || !user.getEmail().equals(sessionEmail)) {
            response.put("success", false);
            response.put("message", "이메일 인증이 완료되지 않았거나, 인증된 이메일 주소가 아닙니다.");
            return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST); // 400 Bad Request
        }
        
        // 사용자 등록
        UserDTO registeredUser;
        try {
        	registeredUser = userService.registerUser(user, "USER");
            if (registeredUser == null) {
                throw new Exception("User registration returned null.");
            }
        } catch(DuplicateKeyException e) {
            response.put("success", false);
            response.put("message", "이미 사용중인 아이디 또는 이메일입니다.");
            // 409 Conflict: 요청이 서버의 현재 상태와 충돌될 때 사용 (자원 중복)
            return new ResponseEntity<>(response, HttpStatus.CONFLICT);
        } catch(Exception e) {
            response.put("success", false);
            response.put("message", "알 수 없는 오류로 가입에 실패했습니다.");
            // 500 Internal Server Error: 서버 내부 오류
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
        
        // 가입 성공 후 자동 로그인 처리
        manuallyAuthenticateUser(registeredUser.getUsername(), password, request);

        request.getSession().setAttribute("loginUser", registeredUser);

        // 이메일 인증 관련 세션 정보 삭제 (선택 사항이지만, 보안 및 세션 관리 효율을 위해 권장)
        session.removeAttribute("email-verified");
        session.removeAttribute("email");
        session.removeAttribute("email-verifying-code");
        session.removeAttribute("email-verifying-time");
        
        response.put("success", true);
        response.put("message", "회원가입이 완료되었습니다.");
        // 200 OK: 성공
        return ResponseEntity.ok(response);
    }

    @GetMapping("/social/link-or-register")
    public String linkOrRegisterPage() {
        return "link-or-register"; // JSP 파일 경로
    }

    @GetMapping("/login/link")
    public String linkLoginPage(Model model) {
        // 이 로그인 폼이 '연동용'임을 구분할 수 있는 값을 모델에 담아 보낼 수 있음
        model.addAttribute("isLinkLogin", true);
        return "login-link"; // 연동 전용 로그인 JSP
    }

    @PostMapping("/login/perform-link")
    public String performLinkLogin(HttpServletRequest request, String username, String password) {
        try {
            // 사용자가 입력한 아이디/비밀번호로 수동 인증
            manuallyAuthenticateUser(username, password, request);

            // 인증 성공 시, 세션의 소셜 정보 가져오기
            OAuthAttributes pendingAttributes = (OAuthAttributes) request.getSession().getAttribute("pendingSocialAttributes");
            if (pendingAttributes == null) {
                return "redirect:/login?error=session_expired";
            }

            // 현재 로그인된 사용자 정보와 소셜 정보 연동
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            UserDTO user = (UserDTO) authentication.getPrincipal();
            userService.linkSocialAccount(user.getId(), pendingAttributes);

            // 임시 세션 정보 삭제
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
        // 세션에서 소셜 정보 가져오기
        OAuthAttributes attributes = (OAuthAttributes) session.getAttribute("pendingSocialAttributes");
        if (attributes == null) {
            return "redirect:/login"; // 비정상 접근
        }
        // 이메일, 이름 등을 모델에 담아 회원가입 폼에 미리 채워줌
        model.addAttribute("username", attributes.getProvider() + "_" + attributes.getNameAttributeValue());
        model.addAttribute("email", attributes.getEmail());
        model.addAttribute("name", attributes.getName());
        return "signup-social"; // 소셜 가입 전용 JSP
    }

    @PostMapping("/api/signup/social-perform")
    public ResponseEntity<Map<String, Object>> performSocialSignup(UserDTO signupForm, HttpServletRequest request) {
        HttpSession session = request.getSession();
        OAuthAttributes attributes = (OAuthAttributes) session.getAttribute("pendingSocialAttributes");
        if (attributes == null) {
            return new ResponseEntity<>(
                    Collections.singletonMap("message", "세션이 만료되었거나 비정상적인 접근입니다."), 
                    HttpStatus.BAD_REQUEST);
        }

        Map<String, Object> response = new HashMap<>();
        
        // --- 조건부 이메일 인증 로직 ---
        String socialEmail = attributes.getEmail();      // 소셜 서비스가 제공한 이메일
        String formEmail = signupForm.getEmail();        // 사용자가 폼에 입력/수정한 이메일

        if (!socialEmail.equals(formEmail)) {
            // 시나리오 B: 사용자가 이메일을 변경한 경우 -> 우리 시스템의 이메일 인증을 반드시 거쳤는지 확인
            logger.info("User changed email from {} to {}. Verifying manual email confirmation...", socialEmail, formEmail);
            
            Boolean emailVerified = (Boolean) session.getAttribute("email-verified");
            String verifiedSessionEmail = (String) session.getAttribute("email");

            if (emailVerified == null || !emailVerified || !formEmail.equals(verifiedSessionEmail)) {
                response.put("success", false);
                response.put("message", "변경된 이메일 주소에 대한 인증이 필요합니다.");
                return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
            }
            logger.info("Manually entered email {} was successfully verified.", formEmail);

        } else {
            // 시나리오 A: 소셜 이메일을 그대로 사용하는 경우, 인증을 신뢰하므로 별도 검사 안함
            logger.info("User is using the verified social email {}. Skipping manual email verification.", socialEmail);
        }
        
        // 신규 회원 가입 및 소셜 정보 연동 (새로운 서비스 메소드 호출)
        UserDTO newUser;
        try {
            newUser = userService.registerNewSocialUser(signupForm, attributes);
            if (newUser == null) {
                throw new Exception("Social user registration returned null.");
            }
        } catch (DuplicateKeyException e) {
            response.put("success", false);
            response.put("message", "이미 사용중인 아이디 또는 이메일 입니다.");
            return new ResponseEntity<>(response, HttpStatus.CONFLICT);
        } catch(Exception e) {
            response.put("success", false);
            response.put("message", "알 수 없는 오류로 가입에 실패했습니다.");
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }

        // 임시 세션 정보 삭제
        session.removeAttribute("pendingSocialAttributes");
        session.removeAttribute("email-verified");
        session.removeAttribute("email");
        session.removeAttribute("email-verifying-code");
        session.removeAttribute("email-verifying-time");
        
        // 새로 가입한 소셜 계정으로 자동 로그인 처리
        manuallyAuthenticateUser(newUser);

        // 세션에 "loginUser" 속성 직접 저장
        session.setAttribute("loginUser", newUser);

        logger.info("Successfully registered new social user: {}", newUser.getUsername());
        
        response.put("success", true);
        response.put("message", "소셜 계정으로 회원가입이 완료되었습니다.");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/api/users/{id}/{target}")
    public ResponseEntity<Map<String, Object>> editInfo(
    		@PathVariable("id") Integer id,
            @PathVariable("target") String target,
            @RequestParam MultiValueMap<String,String> params,
            @AuthenticationPrincipal UserDTO user) {
    	String payload = params.getFirst(target);
    	Map<String, Object> response = new HashMap<String, Object>();
    	if (id == null || user.getId() != id) {
    		response.put("success", false);
    		response.put("message", "세션이 만료되었습니다.");
    		return ResponseEntity.status(401).body(response);
    	}
    	if (target.equals("email")) {
    		int res = userService.setEmail(id, payload);
    		if (res == 1) {
    			response.put("success", true);
    			response.put("message", "이메일이 변경되었습니다.");
    			return ResponseEntity.ok(response);
    		}
    	} else if (target.equals("phone")) {
    		int res = userService.setPhone(id, payload);
    		if (res == 1) {
    			response.put("success", true);
    			response.put("message", "휴대폰 번호가 변경되었습니다.");
    			return ResponseEntity.ok(response);
    		}
    	}
		response.put("success", false);
		response.put("message", "실패");
		return ResponseEntity.status(500).body(response);
    }

    @PostMapping("/api/reset-password")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> resetPassword(
            @RequestBody Map<String, Object> params,
    		@AuthenticationPrincipal UserDTO user) {
        Map<String, Object> response = new HashMap<>();
        String currentPassword = params.get("currentPassword").toString();
        String newPassword = params.get("newPassword").toString();
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
        	response.put("success", false);
        	response.put("message", "기존 비밀번호가 틀렸습니다.");
        	return ResponseEntity.status(400).body(response);
        }
        String newPasswordEncoded = passwordEncoder.encode(newPassword);
        int result = userService.resetPassword(user.getId(), newPasswordEncoded);
        if (result != 1) {
        	response.put("success", false);
        	response.put("message", "서버 오류");
        	return ResponseEntity.status(500).body(response);
        }
        response.put("success", true);
        response.put("message", "비밀번호 변경이 완료되었습니다.");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/find-id")
    public String viewFindId(Model model) {
        return "find-id";
    }

    @GetMapping("/find-password")
    public String viewFindPassword(Model model) {
        return "find-password";
    }

    /**
     * 아이디/비밀번호로 수동 인증 및 로그인 처리
     */
    private void manuallyAuthenticateUser(String username, String password, HttpServletRequest request) {
        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(username, password);
        // request 정보를 추가하여 세션 등을 관리하도록 함
        authToken.setDetails(new WebAuthenticationDetails(request)); 
        
        Authentication authentication = authenticationManager.authenticate(authToken);
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }
    
    /**
     * UserVO 객체로 수동 인증 및 로그인 처리 (소셜 가입 후 사용)
     */
    private void manuallyAuthenticateUser(UserDTO user) {
        // 소셜 가입자는 비밀번호 인증을 거치지 않으므로, UserVO와 권한 정보로 직접 인증 객체를 생성
        UsernamePasswordAuthenticationToken newAuthentication = new UsernamePasswordAuthenticationToken(
                user, // Principal
                user.getPassword(),
                user.getAuthorities()); // DB에서 가져온 실제 권한
        
        SecurityContextHolder.getContext().setAuthentication(newAuthentication);
    }
    
    private Map<String, Object> isValidUserSignup(UserDTO vo) {
    	Map<String, Object> map = new HashMap<>();
    	boolean success = true;
    	String reason = "";
    	if (vo.getUsername() == null || vo.getUsername().isBlank()) {
    		success = false;
    		reason = "아이디";
    	}
    	if (vo.getPassword() == null || vo.getPassword().isBlank()) {
    		success = false;
    		if (!reason.isEmpty())
    			reason += ", ";
    		reason += "비밀번호";
    	}
    	if (vo.getName() == null || vo.getName().isBlank()) {
    		success = false;
    		if (!reason.isEmpty())
    			reason += ", ";
    		reason += "이름";
    	}
    	if (vo.getPhone() == null || vo.getPhone().isBlank()) {
    		success = false;
    		if (!reason.isEmpty())
    			reason += ", ";
    		reason += "휴대전화번호";
    	}
    	if (vo.getEmail() == null || vo.getEmail().isBlank()) {
    		success = false;
    		if (!reason.isEmpty())
    			reason += ", ";
    		reason += "이메일";
    	}
    	if (!success) {
    		reason += " 필드가 비어 있습니다.";
    	}
    	map.put("success", success);
    	map.put("reason", reason);
    	return map;
    }
}
