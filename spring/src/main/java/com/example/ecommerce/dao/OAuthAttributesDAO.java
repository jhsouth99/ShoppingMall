package com.example.ecommerce.dao;

import java.util.HashMap;
import java.util.Map;

import org.apache.ibatis.session.SqlSession;

import com.example.ecommerce.vo.OAuthAttributesVO;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class OAuthAttributesDAO {

	private final SqlSession sqlSession;

	public OAuthAttributesVO findByUsernameAndProviderId(String username, String provider_id) {
		Map<String, String> map = new HashMap<String, String>();
		map.put("username", username);
		map.put("provider_id", provider_id);
		return sqlSession.selectOne("oauth.findByUsernameAndProviderId", map);
	}
	
	public int save(OAuthAttributesVO vo) {
		return sqlSession.insert("oauth.save", vo);
	}
}
