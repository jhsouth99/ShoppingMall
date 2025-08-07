package com.example.ecommerce.dao;

import org.apache.ibatis.session.SqlSession;
import com.example.ecommerce.dto.NotificationSettingsDTO;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class NotificationSettingsDAO {

	private final SqlSession sqlSession;

	public NotificationSettingsDTO findByUserId(int userId) {
		return sqlSession.selectOne("notification.findByUserId", userId);
	}

	public int upsert(NotificationSettingsDTO settings) {
		return sqlSession.update("notification.upsert", settings);
	}
}