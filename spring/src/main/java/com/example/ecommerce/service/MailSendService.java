package com.example.ecommerce.service;

import java.util.Random;

import javax.mail.internet.MimeMessage;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class MailSendService {

	Logger logger = LoggerFactory.getLogger(MailSendService.class);

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
		String content = buildJoinEmailContent(String.valueOf(authNumber));
		
		try {
			MimeMessage mail = javaMailSender.createMimeMessage();
			MimeMessageHelper mailHelper = new MimeMessageHelper(mail, true, "UTF-8");
			mailHelper.setFrom(fromMail);
			mailHelper.setTo(toMail);
			mailHelper.setSubject(title);
			mailHelper.setText(content, true);
			
			javaMailSender.send(mail); // 메일 전송
		} catch(Exception e) {
			e.printStackTrace();
		}
		
		// 인증번호를 문자열로 변환하여 반환
		return String.valueOf(authNumber);
	}

	/**
	 * 회원가입 인증 이메일 내용 생성
	 * @param code 인증번호
	 * @return HTML 형식의 이메일 내용
	 */
	private String buildJoinEmailContent(String code) {
		StringBuilder content = new StringBuilder();
		content.append("<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;'>");

		// 헤더
		content.append("<div style='text-align: center; margin-bottom: 30px;'>");
		content.append("<h1 style='color: #2c3e50; margin-bottom: 10px;'>이거어때</h1>");
		content.append("<p style='color: #7f8c8d; font-size: 16px;'>회원가입을 환영합니다!</p>");
		content.append("</div>");

		// 본문
		content.append("<div style='background-color: #f8f9fa; border-radius: 10px; padding: 30px;'>");
		content.append("<h2 style='color: #333; text-align: center; margin-bottom: 20px;'>이메일 인증번호</h2>");
		content.append("<p style='color: #555; text-align: center; margin-bottom: 25px;'>아래 인증번호를 회원가입 화면에 입력해주세요.</p>");

		// 인증번호 박스
		content.append("<div style='background-color: #fff; border: 2px solid #e9ecef; border-radius: 8px; padding: 25px; text-align: center;'>");
		content.append("<span style='font-size: 32px; font-weight: bold; color: #2980b9; letter-spacing: 8px;'>");
		content.append(code);
		content.append("</span>");
		content.append("</div>");

		// 안내사항
		content.append("<div style='margin-top: 25px;'>");
		content.append("<p style='color: #e74c3c; font-weight: bold; margin-bottom: 10px;'>⚠️ 주의사항</p>");
		content.append("<ul style='color: #666; line-height: 1.8; padding-left: 20px;'>");
		content.append("<li>이 인증번호는 <strong>5분</strong> 동안만 유효합니다.</li>");
		content.append("<li>타인에게 인증번호를 공유하지 마세요.</li>");
		content.append("<li>본인이 요청하지 않은 경우 이 메일을 무시하세요.</li>");
		content.append("</ul>");
		content.append("</div>");
		content.append("</div>");

		// 푸터
		content.append("<div style='text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;'>");
		content.append("<p style='color: #95a5a6; font-size: 14px;'>이 메일은 발송 전용이므로 회신할 수 없습니다.</p>");
		content.append("<p style='color: #95a5a6; font-size: 14px;'>문의사항이 있으시면 고객센터로 연락해주세요.</p>");
		content.append("<p style='color: #bdc3c7; font-size: 12px; margin-top: 10px;'>© 2024 이거어때. All rights reserved.</p>");
		content.append("</div>");

		content.append("</div>");
		return content.toString();
	}

	/**
	 * 범용 이메일 발송 메서드
	 * @param toEmail 수신자 이메일
	 * @param subject 제목
	 * @param content HTML 내용
	 */
	public void sendEmail(String toEmail, String subject, String content) {
		try {
			MimeMessage mail = javaMailSender.createMimeMessage();
			MimeMessageHelper mailHelper = new MimeMessageHelper(mail, true, "UTF-8");

			mailHelper.setFrom(emailAddress);
			mailHelper.setTo(toEmail);
			mailHelper.setSubject(subject);
			mailHelper.setText(content, true); // HTML 형식으로 전송

			javaMailSender.send(mail);

			logger.info("이메일 발송 성공: {} -> {}", emailAddress, toEmail);
		} catch(Exception e) {
			logger.error("이메일 발송 실패: {}", e.getMessage());
			throw new RuntimeException("이메일 발송에 실패했습니다.", e);
		}
	}

	/**
	 * 임시 비밀번호 발송 (옵션)
	 * @param toEmail 수신자 이메일
	 * @param tempPassword 임시 비밀번호
	 */
	public void sendTempPassword(String toEmail, String tempPassword) {
		String subject = "[이거어때] 임시 비밀번호 안내";

		StringBuilder content = new StringBuilder();
		content.append("<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>");
		content.append("<h2 style='color: #333;'>임시 비밀번호 안내</h2>");
		content.append("<p>고객님의 임시 비밀번호가 발급되었습니다.</p>");
		content.append("<div style='background-color: #f0f0f0; padding: 20px; margin: 20px 0;'>");
		content.append("<p><strong>임시 비밀번호:</strong> <span style='font-size: 18px; letter-spacing: 2px;'>");
		content.append(tempPassword);
		content.append("</span></p>");
		content.append("</div>");
		content.append("<p style='color: #d9534f;'><strong>보안 안내:</strong></p>");
		content.append("<ul style='color: #666;'>");
		content.append("<li>로그인 후 반드시 비밀번호를 변경해주세요.</li>");
		content.append("<li>이 이메일은 발송 전용이므로 회신할 수 없습니다.</li>");
		content.append("<li>본인이 요청하지 않은 경우 고객센터로 문의해주세요.</li>");
		content.append("</ul>");
		content.append("</div>");

		sendEmail(toEmail, subject, content.toString());
	}
}
