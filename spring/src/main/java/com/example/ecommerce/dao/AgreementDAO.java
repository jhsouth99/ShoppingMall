package com.example.ecommerce.dao;

import org.apache.ibatis.session.SqlSession;

import com.example.ecommerce.dto.AgreementTermDTO;
import com.example.ecommerce.dto.UserAgreementDTO;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class AgreementDAO {
	
	private final SqlSession sqlSession;

    public AgreementTermDTO selectLatestTerm(String type) {
    	return sqlSession.selectOne("agreement.selectLatestTerm", type);
    }

    public UserAgreementDTO selectUserAgreement(int userId, int agreementTermId) {
    	UserAgreementDTO dto = new UserAgreementDTO();
    	dto.setUserId(userId);
    	dto.setAgreementTermId(agreementTermId);
    	return sqlSession.selectOne("agreement.selectUserAgreement", dto);
    }

    public int insertUserAgreement(UserAgreementDTO ua) {
    	return sqlSession.insert("agreement.insertUserAgreement", ua);
    }

    public int reAgree(int id, String method) {
    	UserAgreementDTO dto = new UserAgreementDTO();
    	dto.setId(id);
    	dto.setMethod(method);
    	return sqlSession.update("agreement.reAgree", dto);
    }

    public int revoke(int id) {
    	return sqlSession.update("agreement.revoke", id);
    }

    public boolean existsAgreed(int userId, int agreementTermId) {
    	UserAgreementDTO dto = new UserAgreementDTO();
    	dto.setUserId(userId);
    	dto.setAgreementTermId(agreementTermId);
    	return sqlSession.selectOne("agreement.existsAgreed", dto);
    }
}
