package com.example.ecommerce;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import javax.servlet.http.HttpSession;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.example.ecommerce.service.MailSendService;

@Controller
public class EmailController {
	MailSendService mailSendService;

	public EmailController(MailSendService mailSendService) {
		this.mailSendService = mailSendService;
	}
	
	@PostMapping("/mail-send")
	public ResponseEntity<Map<String, Object>> sendMailCode(@RequestParam("email") String email, HttpSession session) {
        Map<String, Object> response = new HashMap<>();
        
        // 최근에 이메일 보낸 시각
        LocalDateTime lastVerifyingTime = (LocalDateTime) session.getAttribute("email-verifying-time");
        
        // 이메일 과다 전송 방지
		if (lastVerifyingTime != null
				&& lastVerifyingTime.plusMinutes(1).isAfter(LocalDateTime.now())) {
			// 최근에 이메일 보낸지 1분이 지나지 않았다면
			response.put("success", false);
			response.put("message", "인증 메일은 1분마다 한 번 보낼 수 있습니다.");
            return new ResponseEntity<>(response, HttpStatus.TOO_MANY_REQUESTS); // 429 Too Many Requests
		}
		
		try {
		    String res = mailSendService.joinEmail(email);
		    session.setAttribute("email", email);
		    session.setAttribute("email-verifying-code", res);
		    session.setAttribute("email-verifying-time", LocalDateTime.now());
		    session.setAttribute("email-verified", false); // 이메일 전송 시 인증 상태 초기화
		    response.put("success", true); // 성공적으로 메일 전송
		    response.put("message", "인증 메일이 성공적으로 전송되었습니다.");
		    return new ResponseEntity<>(response, HttpStatus.OK); // 200 OK
		} catch (Exception e) {
		    e.printStackTrace();
		    response.put("success", false);
		    response.put("message", "인증 메일 전송 중 오류가 발생했습니다.");
		    return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR); // 500 Internal Server Error
		}
	}

	@PostMapping("/mail-check")
	public ResponseEntity<Map<String, Object>> checkMailCode(@RequestParam("code") String code, HttpSession session) {
		Map<String, Object> response = new HashMap<>();
		
		// 인증번호 보낸 이메일 찾기
        String email = (String) session.getAttribute("email");
        
        if (email == null) {
        	// 이메일 인증 번호를 요청한 적이 없다면
			response.put("success", false);
        	response.put("message", "이메일 인증 번호를 요청한 기록이 없습니다.");
        	return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST); // 400 Bad Request
        }

        // 최근에 이메일 보낸 시각
        LocalDateTime lastVerifyingTime = (LocalDateTime) session.getAttribute("email-verifying-time");
        
        if (lastVerifyingTime == null) {
        	// 이메일 인증 번호를 요청한 적이 없다면 (세션 만료 등)
			response.put("success", false);
        	response.put("message", "이메일 인증 세션이 만료되었습니다. 인증 메일을 다시 전송해주세요.");
        	return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST); // 400 Bad Request
        }
		
		if (lastVerifyingTime.plusMinutes(5).isBefore(LocalDateTime.now())) {
			// 최근에 이메일 보낸지 5분이 넘었다면
			response.put("success", false);
			response.put("message", "인증 코드 유효 시간이 만료되었습니다. 인증 메일을 다시 전송해주세요.");
            return new ResponseEntity<>(response, HttpStatus.GONE); // 410 Gone (리소스가 영구적으로 사용 불가능)
		}
		
		String codeSent = (String) session.getAttribute("email-verifying-code");
		
		if (codeSent == null || !code.equals(codeSent)) { // codeSent가 null인 경우도 포함
			// 코드 불일치 -> 인증 실패
			response.put("success", false);
			response.put("message", "인증 코드가 일치하지 않습니다.");
			return new ResponseEntity<>(response, HttpStatus.OK); // 200 OK (클라이언트에게 실패 메시지 전달)
		}

		session.setAttribute("email-verified", true); // 이메일 인증 완료 상태 저장
		response.put("success", true);
		response.put("message", "이메일 주소가 성공적으로 인증되었습니다.");
		return new ResponseEntity<>(response, HttpStatus.OK);
	}
}