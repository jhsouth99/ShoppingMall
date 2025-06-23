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
		System.out.println("������ȣ: " + checkNum);
		return checkNum;
	}
	
	// �̸��� ���� �غ�
	public String joinEmail(String email) {
		int authNumber = makeRandomNumber(); // ���� �߻�
		String fromMail = emailAddress;
		String toMail = email; // �߼��� ���� �ּ�
		String title = "ȸ�� ���� ���� �̸��� �Դϴ�.";
		
		// �̸��Ͽ� �� ����
		String content = "������ȣ�� [ " + authNumber + " ] �Դϴ�";
		
		try {
			MimeMessage mail = javaMailSender.createMimeMessage();
			MimeMessageHelper mailHelper = new MimeMessageHelper(mail, true, "UTF-8");
			mailHelper.setFrom(fromMail);
			mailHelper.setTo(toMail);
			mailHelper.setSubject(title);
			mailHelper.setText(content);
			
			javaMailSender.send(mail); // ���� ����
		} catch(Exception e) {
			e.printStackTrace();
		}
		
		// ������ȣ�� ���ڿ��� ��ȯ�Ͽ� ��ȯ
		return String.valueOf(authNumber);
	}

}
