package com.example.ecommerce.dao;

import org.apache.ibatis.session.SqlSession;

import com.example.ecommerce.vo.UserVO;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class UserDAO {
	
	private final SqlSession sqlSession;

	public UserVO findByUsername(String username) {
		return sqlSession.selectOne("user.findByUsername", username);
	}

	public UserVO findByEmail(String email) {
		return sqlSession.selectOne("user.findByEmail", email);
	}

	public int save(UserVO user) {
		return sqlSession.insert("user.save", user);
	}

	public UserVO findById(int user_id) {
		return sqlSession.selectOne("user.findById", user_id);
	}

}
