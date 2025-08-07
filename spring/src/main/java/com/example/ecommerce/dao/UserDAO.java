package com.example.ecommerce.dao;

import java.util.HashMap;
import java.util.Map;

import org.apache.ibatis.session.SqlSession;

import com.example.ecommerce.dto.UserDTO;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class UserDAO {
	
	private final SqlSession sqlSession;

	public UserDTO findByUsername(String username) {
		return sqlSession.selectOne("user.findByUsername", username);
	}

	public UserDTO findByEmail(String email) {
		return sqlSession.selectOne("user.findByEmail", email);
	}

	public int save(UserDTO user) {
		return sqlSession.insert("user.save", user);
	}

	public int update(UserDTO user) {
		return sqlSession.update("user.update", user);
	}

	public UserDTO findById(int user_id) {
		return sqlSession.selectOne("user.findById", user_id);
	}

    public int deactivateUser(int userId) {
        return sqlSession.update("user.deactivateUser", Map.of("userId", userId));
    }

	/**
	 * 이름과 이메일로 사용자 찾기
	 */
	public UserDTO findByNameAndEmail(String name, String email) {
		Map<String, Object> params = new HashMap<>();
		params.put("name", name);
		params.put("email", email);
		return sqlSession.selectOne("user.findByNameAndEmail", params);
	}

	/**
	 * 이름과 휴대폰 번호로 사용자 찾기
	 */
	public UserDTO findByNameAndPhone(String name, String phone) {
		Map<String, Object> params = new HashMap<>();
		params.put("name", name);
		params.put("phone", phone);
		return sqlSession.selectOne("user.findByNameAndPhone", params);
	}

	/**
	 * 재설정 토큰으로 사용자 찾기
	 */
	public UserDTO findByResetToken(String resetToken) {
		return sqlSession.selectOne("user.findByResetToken", resetToken);
	}

	/**
	 * 재설정 토큰 업데이트
	 */
	public int updateResetToken(UserDTO user) {
		return sqlSession.update("user.updateResetToken", user);
	}
}
