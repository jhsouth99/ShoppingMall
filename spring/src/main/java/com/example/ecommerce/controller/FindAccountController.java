package com.example.ecommerce.controller;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import javax.servlet.http.HttpSession;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.ecommerce.dto.UserDTO;
import com.example.ecommerce.service.MailSendService;
import com.example.ecommerce.service.UserService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class FindAccountController {

    private final UserService userService;
    private final MailSendService mailSendService;
    private final PasswordEncoder passwordEncoder;

    /**
     * 이메일/휴대폰 인증번호 발송 (아이디/비밀번호 찾기용)
     */
    @PostMapping("/email-verification/send")
    public ResponseEntity<Map<String, Object>> sendVerificationCode(@RequestBody Map<String, Object> request, HttpSession session) {
        Map<String, Object> response = new HashMap<>();

        String email = (String) request.get("email");
        String name = (String) request.get("name");
        String username = (String) request.get("username");
        String type = (String) request.get("type"); // FIND_ID or FIND_PASSWORD

        try {
            // 인증번호 발송 간격 체크 (1분)
            LocalDateTime lastSentTime = (LocalDateTime) session.getAttribute("find-account-verify-time");
            if (lastSentTime != null && lastSentTime.plusMinutes(1).isAfter(LocalDateTime.now())) {
                response.put("success", false);
                response.put("message", "인증번호는 1분마다 한 번 발송할 수 있습니다.");
                return new ResponseEntity<>(response, HttpStatus.TOO_MANY_REQUESTS);
            }

            // 사용자 정보 확인
            UserDTO user = null;
            if ("FIND_ID".equals(type)) {
                // 아이디 찾기: 이름과 이메일로 사용자 조회
                user = userService.findByNameAndEmail(name, email);
                if (user == null) {
                    response.put("success", false);
                    response.put("message", "입력하신 정보와 일치하는 회원을 찾을 수 없습니다.");
                    return new ResponseEntity<>(response, HttpStatus.OK);
                }
            } else if ("FIND_PASSWORD".equals(type)) {
                // 비밀번호 찾기: 아이디와 이메일로 사용자 조회
                user = userService.findByUsernameAndEmail(username, email);
                if (user == null) {
                    response.put("success", false);
                    response.put("message", "입력하신 정보와 일치하는 회원을 찾을 수 없습니다.");
                    return new ResponseEntity<>(response, HttpStatus.OK);
                }
            }

            // 인증번호 생성 및 발송
            String verificationCode = mailSendService.makeRandomNumber() + "";
            String emailContent = buildVerificationEmailContent(type, verificationCode);

            mailSendService.sendEmail(email,
                    "FIND_ID".equals(type) ? "[이거어때] 아이디 찾기 인증번호" : "[이거어때] 비밀번호 찾기 인증번호",
                    emailContent);

            // 세션에 인증 정보 저장
            session.setAttribute("find-account-verify-code", verificationCode);
            session.setAttribute("find-account-verify-time", LocalDateTime.now());
            session.setAttribute("find-account-verify-email", email);
            session.setAttribute("find-account-verify-type", type);
            session.setAttribute("find-account-user-id", user.getId());

            response.put("success", true);
            response.put("message", "인증번호가 발송되었습니다.");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("인증번호 발송 실패", e);
            response.put("success", false);
            response.put("message", "인증번호 발송 중 오류가 발생했습니다.");
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * 아이디 찾기
     */
    @PostMapping("/find-id")
    public ResponseEntity<Map<String, Object>> findId(@RequestBody Map<String, Object> request, HttpSession session) {
        Map<String, Object> response = new HashMap<>();

        String verificationCode = (String) request.get("verificationCode");
        String method = (String) request.get("method"); // email or phone

        try {
            // 인증번호 검증
            boolean isValid = false;
            if ("email".equals(method)) {
                isValid = verifyCode(session, verificationCode, "email");
            } else if ("phone".equals(method)) {
                isValid = verifyCode(session, verificationCode, "phone");
            }

            if (!isValid) {
                response.put("success", false);
                response.put("message", "인증번호가 일치하지 않거나 만료되었습니다.");
                return ResponseEntity.ok(response);
            }

            // 저장된 사용자 ID로 사용자 정보 조회
            Integer userId = (Integer) session.getAttribute("find-account-user-id");
            if (userId == null) {
                response.put("success", false);
                response.put("message", "세션이 만료되었습니다. 다시 시도해주세요.");
                return ResponseEntity.ok(response);
            }

            UserDTO user = userService.findById(userId);
            if (user == null) {
                response.put("success", false);
                response.put("message", "사용자 정보를 찾을 수 없습니다.");
                return ResponseEntity.ok(response);
            }

            // 아이디 마스킹 처리 (선택사항)
            String maskedUsername = maskUsername(user.getUsername());

            response.put("success", true);
            response.put("username", maskedUsername);
            response.put("registerDate", user.getCreatedAt());
            response.put("message", "아이디를 찾았습니다.");

            // 세션 정리
            clearFindAccountSession(session);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("아이디 찾기 실패", e);
            response.put("success", false);
            response.put("message", "아이디 찾기 중 오류가 발생했습니다.");
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * 비밀번호 찾기 (임시 비밀번호 발송 또는 재설정 토큰 생성)
     */
    @PostMapping("/find-password")
    public ResponseEntity<Map<String, Object>> findPassword(@RequestBody Map<String, Object> request, HttpSession session) {
        Map<String, Object> response = new HashMap<>();

        String verificationCode = (String) request.get("verificationCode");
        String method = (String) request.get("method");

        try {
            // 인증번호 검증
            boolean isValid = false;
            if ("email".equals(method)) {
                isValid = verifyCode(session, verificationCode, "email");
            } else if ("phone".equals(method)) {
                isValid = verifyCode(session, verificationCode, "phone");
            }

            if (!isValid) {
                response.put("success", false);
                response.put("message", "인증번호가 일치하지 않거나 만료되었습니다.");
                return ResponseEntity.ok(response);
            }

            // 사용자 정보 조회
            Integer userId = (Integer) session.getAttribute("find-account-user-id");
            UserDTO user = userService.findById(userId);

            if (user == null) {
                response.put("success", false);
                response.put("message", "사용자 정보를 찾을 수 없습니다.");
                return ResponseEntity.ok(response);
            }

            // 비밀번호 재설정 방식 선택
            // 옵션 1: 재설정 토큰 생성 (권장)
            String resetToken = UUID.randomUUID().toString();
            userService.savePasswordResetToken(userId, resetToken);

            response.put("success", true);
            response.put("resetMethod", "form");
            response.put("resetToken", resetToken);
            response.put("message", "비밀번호 재설정을 진행해주세요.");

            // 옵션 2: 임시 비밀번호 발송 (보안상 권장하지 않음)
            // String tempPassword = generateTempPassword();
            // userService.resetPassword(userId, passwordEncoder.encode(tempPassword));
            // mailSendService.sendTempPassword(user.getEmail(), tempPassword);
            // response.put("resetMethod", "email");
            // response.put("email", maskEmail(user.getEmail()));

            clearFindAccountSession(session);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("비밀번호 찾기 실패", e);
            response.put("success", false);
            response.put("message", "비밀번호 찾기 중 오류가 발생했습니다.");
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * 비밀번호 재설정
     */
    @PostMapping("/reset-password-by-token")
    public ResponseEntity<Map<String, Object>> resetPassword(@RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();

        String resetToken = (String) request.get("resetToken");
        String newPassword = (String) request.get("newPassword");

        try {
            // 토큰 유효성 검증
            UserDTO user = userService.findByResetToken(resetToken);
            LocalDateTime resetTokenExpiresAt = Instant.ofEpochMilli(user.getResetTokenExpiresAt().getTime()).atZone(ZoneId.systemDefault()).toLocalDateTime();
            if (user == null || resetTokenExpiresAt.isBefore(LocalDateTime.now())) {
                response.put("success", false);
                response.put("message", "유효하지 않거나 만료된 토큰입니다.");
                return ResponseEntity.ok(response);
            }

            // 비밀번호 재설정
            String encodedPassword = passwordEncoder.encode(newPassword);
            userService.resetPassword(user.getId(), encodedPassword);
            userService.clearResetToken(user.getId());

            response.put("success", true);
            response.put("message", "비밀번호가 성공적으로 변경되었습니다.");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("비밀번호 재설정 실패", e);
            response.put("success", false);
            response.put("message", "비밀번호 재설정 중 오류가 발생했습니다.");
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // 유틸리티 메서드들

    private boolean verifyCode(HttpSession session, String inputCode, String method) {
        String sessionKey = "email".equals(method) ? "find-account-verify-code" : "find-account-phone-verify-code";
        String timeKey = "email".equals(method) ? "find-account-verify-time" : "find-account-phone-verify-time";

        String storedCode = (String) session.getAttribute(sessionKey);
        LocalDateTime sentTime = (LocalDateTime) session.getAttribute(timeKey);

        if (storedCode == null || sentTime == null) {
            return false;
        }

        // 5분 제한
        if (sentTime.plusMinutes(5).isBefore(LocalDateTime.now())) {
            return false;
        }

        return storedCode.equals(inputCode);
    }

    private void clearFindAccountSession(HttpSession session) {
        session.removeAttribute("find-account-verify-code");
        session.removeAttribute("find-account-verify-time");
        session.removeAttribute("find-account-verify-email");
        session.removeAttribute("find-account-verify-type");
        session.removeAttribute("find-account-user-id");
        session.removeAttribute("find-account-phone-verify-code");
        session.removeAttribute("find-account-phone-verify-time");
        session.removeAttribute("find-account-phone-verify-phone");
    }

    private String maskUsername(String username) {
        if (username == null || username.length() <= 3) {
            return username;
        }
        int len = username.length();
        int maskLen = len / 2;
        StringBuilder masked = new StringBuilder(username.substring(0, len - maskLen));
        for (int i = 0; i < maskLen; i++) {
            masked.append("*");
        }
        return masked.toString();
    }

    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) {
            return email;
        }
        String[] parts = email.split("@");
        String localPart = parts[0];
        if (localPart.length() <= 3) {
            return localPart + "***@" + parts[1];
        }
        return localPart.substring(0, 3) + "***@" + parts[1];
    }

    private String buildVerificationEmailContent(String type, String code) {
        StringBuilder content = new StringBuilder();
        content.append("<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>");
        content.append("<h2 style='color: #333;'>이거어때 ");
        content.append("FIND_ID".equals(type) ? "아이디 찾기" : "비밀번호 찾기");
        content.append(" 인증번호</h2>");
        content.append("<p>요청하신 인증번호는 다음과 같습니다:</p>");
        content.append("<div style='background-color: #f0f0f0; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px;'>");
        content.append(code);
        content.append("</div>");
        content.append("<p style='color: #666; margin-top: 20px;'>* 이 인증번호는 5분간 유효합니다.</p>");
        content.append("<p style='color: #666;'>* 본인이 요청하지 않은 경우 이 메일을 무시하세요.</p>");
        content.append("</div>");
        return content.toString();
    }
}