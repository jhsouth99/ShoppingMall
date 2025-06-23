package com.example.ecommerce.service;

import java.util.Random;

import javax.mail.internet.MimeMessage;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class MailSendService {

	private final JavaMailSender javaMailSender;
	
	@Value("${mail.address}")
	private String emailAddress;
	
	public int makeRandomNumber() {
		Random rnd = new Random();
		int checkNum = rnd.nextInt(999999 - 111111 + 1) + 111111;
		System.out.println("인증번호: " + checkNum);
		return checkNum;
	}
	
	// 이메일 전송 준비
	public String joinEmail(String email) {
		int authNumber = makeRandomNumber(); // 난수 발생
		String fromMail = emailAddress;
		String toMail = email; // 발송할 메일 주소
		String title = "회원 가입 인증 이메일 입니다.";
		
		// 이메일에 들어갈 내용
		String content = "인증번호는 [ " + authNumber + " ] 입니다";
		
		try {
			MimeMessage mail = javaMailSender.createMimeMessage();
			MimeMessageHelper mailHelper = new MimeMessageHelper(mail, true, "UTF-8");
			mailHelper.setFrom(fromMail);
			mailHelper.setTo(toMail);
			mailHelper.setSubject(title);
			mailHelper.setText(content);
			
			javaMailSender.send(mail); // 메일 전송
		} catch(Exception e) {
			e.printStackTrace();
		}
		
		// 인증번호를 문자열로 변환하여 반환
		return String.valueOf(authNumber);
	}

}
