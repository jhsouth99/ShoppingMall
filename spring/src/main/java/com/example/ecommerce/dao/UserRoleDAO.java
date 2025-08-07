package com.example.ecommerce.dao;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.apache.ibatis.session.SqlSession;

import com.example.ecommerce.dto.UserRoleDTO;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class UserRoleDAO {
	
	private final SqlSession sqlSession;

	public Set<String> findRolesByUserId(int id) {
		List<UserRoleDTO> list = sqlSession.selectList("userRole.findByUserId", id);
		return list.stream().map(elem -> elem.getRole()).collect(Collectors.toSet());
	}

	public int save(int userId, String role) {
		Map<String, Object> map = new HashMap<String, Object>();
		map.put("user_id", userId);
		map.put("role", role);
		return sqlSession.insert("userRole.save", map);
	}

}
