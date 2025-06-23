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
        
        // �ֱٿ� �̸��� ���� �ð�
        LocalDateTime lastVerifyingTime = (LocalDateTime) session.getAttribute("email-verifying-time");
        
        // �̸��� ���� ���� ����
		if (lastVerifyingTime != null
				&& lastVerifyingTime.plusMinutes(1).isAfter(LocalDateTime.now())) {
			// �ֱٿ� �̸��� ������ 1���� ������ �ʾҴٸ�
			response.put("success", false);
			response.put("message", "���� ������ 1�и��� �� �� ���� �� �ֽ��ϴ�.");
            return new ResponseEntity<>(response, HttpStatus.TOO_MANY_REQUESTS); // 429 Too Many Requests
		}
		
		try {
		    String res = mailSendService.joinEmail(email);
		    session.setAttribute("email", email);
		    session.setAttribute("email-verifying-code", res);
		    session.setAttribute("email-verifying-time", LocalDateTime.now());
		    session.setAttribute("email-verified", false); // �̸��� ���� �� ���� ���� �ʱ�ȭ
		    response.put("success", true); // ���������� ���� ����
		    response.put("message", "���� ������ ���������� ���۵Ǿ����ϴ�.");
		    return new ResponseEntity<>(response, HttpStatus.OK); // 200 OK
		} catch (Exception e) {
		    e.printStackTrace();
		    response.put("success", false);
		    response.put("message", "���� ���� ���� �� ������ �߻��߽��ϴ�.");
		    return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR); // 500 Internal Server Error
		}
	}

	@PostMapping("/mail-check")
	public ResponseEntity<Map<String, Object>> checkMailCode(@RequestParam("code") String code, HttpSession session) {
		Map<String, Object> response = new HashMap<>();
		
		// ������ȣ ���� �̸��� ã��
        String email = (String) session.getAttribute("email");
        
        if (email == null) {
        	// �̸��� ���� ��ȣ�� ��û�� ���� ���ٸ�
			response.put("success", false);
        	response.put("message", "�̸��� ���� ��ȣ�� ��û�� ����� �����ϴ�.");
        	return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST); // 400 Bad Request
        }

        // �ֱٿ� �̸��� ���� �ð�
        LocalDateTime lastVerifyingTime = (LocalDateTime) session.getAttribute("email-verifying-time");
        
        if (lastVerifyingTime == null) {
        	// �̸��� ���� ��ȣ�� ��û�� ���� ���ٸ� (���� ���� ��)
			response.put("success", false);
        	response.put("message", "�̸��� ���� ������ ����Ǿ����ϴ�. ���� ������ �ٽ� �������ּ���.");
        	return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST); // 400 Bad Request
        }
		
		if (lastVerifyingTime.plusMinutes(5).isBefore(LocalDateTime.now())) {
			// �ֱٿ� �̸��� ������ 5���� �Ѿ��ٸ�
			response.put("success", false);
			response.put("message", "���� �ڵ� ��ȿ �ð��� ����Ǿ����ϴ�. ���� ������ �ٽ� �������ּ���.");
            return new ResponseEntity<>(response, HttpStatus.GONE); // 410 Gone (���ҽ��� ���������� ��� �Ұ���)
		}
		
		String codeSent = (String) session.getAttribute("email-verifying-code");
		
		if (codeSent == null || !code.equals(codeSent)) { // codeSent�� null�� ��쵵 ����
			// �ڵ� ����ġ -> ���� ����
			response.put("success", false);
			response.put("message", "���� �ڵ尡 ��ġ���� �ʽ��ϴ�.");
			return new ResponseEntity<>(response, HttpStatus.OK); // 200 OK (Ŭ���̾�Ʈ���� ���� �޽��� ����)
		}

		session.setAttribute("email-verified", true); // �̸��� ���� �Ϸ� ���� ����
		response.put("success", true);
		response.put("message", "�̸��� �ּҰ� ���������� �����Ǿ����ϴ�.");
		return new ResponseEntity<>(response, HttpStatus.OK);
	}
}