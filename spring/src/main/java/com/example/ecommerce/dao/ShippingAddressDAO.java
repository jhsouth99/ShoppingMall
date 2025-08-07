package com.example.ecommerce.dao;

import java.util.List;

import org.apache.ibatis.session.SqlSession;

import com.example.ecommerce.dto.ShippingAddressDTO;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class ShippingAddressDAO {

	private final SqlSession sqlSession;

    public List<ShippingAddressDTO> findByUserId(int userId) {
    	return sqlSession.selectList("shippingAddress.findByUserId", userId);
    }

    public ShippingAddressDTO findById(int id) {
    	return sqlSession.selectOne("shippingAddress.findById", id);
    }

    public int insert(ShippingAddressDTO dto) {
    	return sqlSession.insert("shippingAddress.insert", dto);
    }

    public int update(ShippingAddressDTO dto) {
    	return sqlSession.insert("shippingAddress.update", dto);
    }

    public int delete(int id) {
    	return sqlSession.insert("shippingAddress.delete", id);
    }

    /* 기본 배송지 설정 시, 다른 주소는 N 으로 */
    public int resetDefault(int userId) {
    	return sqlSession.update("shippingAddress.resetDefault", userId);
    }
    
    public int setDefault(int id) {
    	return sqlSession.update("shippingAddress.setDefault", id);
    }
    
    /**
     * 특정 사용자의 모든 배송지 정보를 비식별화합니다.
     * @param userId 사용자 ID
     * @return 수정된 행의 수
     */
    public int anonymizeByUserId(int userId) {
        return sqlSession.update("shippingAddress.anonymizeByUserId", userId);
    }
}
