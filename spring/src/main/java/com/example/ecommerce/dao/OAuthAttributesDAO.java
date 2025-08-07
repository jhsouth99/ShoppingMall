package com.example.ecommerce.dao;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.ibatis.session.SqlSession;

import com.example.ecommerce.dto.OAuthAttributesDTO;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class OAuthAttributesDAO {

	private final SqlSession sqlSession;

	public OAuthAttributesDTO findByUsernameAndProviderId(String username, String providerId) {
		Map<String, String> map = new HashMap<String, String>();
		map.put("username", username);
		map.put("providerId", providerId);
		return sqlSession.selectOne("oauth.findByUsernameAndProviderId", map);
	}
	
	public int save(OAuthAttributesDTO vo) {
		return sqlSession.insert("oauth.save", vo);
	}

	// 사용자의 모든 소셜 계정 조회
	public List<OAuthAttributesDTO> findByUserId(int userId) {
		return sqlSession.selectList("oauth.findByUserId", userId);
	}

	// 소셜 계정 연동 해제
	public int deleteByUserIdAndProviderId(int userId, String providerId) {
		return sqlSession.delete("oauth.deleteByUserIdAndProviderId",
				Map.of("userId", userId, "providerId", providerId));
	}
}
