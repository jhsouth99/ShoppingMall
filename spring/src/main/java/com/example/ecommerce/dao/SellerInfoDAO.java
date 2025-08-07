package com.example.ecommerce.dao;

import org.apache.ibatis.session.SqlSession;

import com.example.ecommerce.dto.SellerInfoDTO;

import lombok.RequiredArgsConstructor;

/**
 * 판매자 정보 및 문의 관련 데이터베이스 접근을 처리하는 DAO
 */
@RequiredArgsConstructor
public class SellerInfoDAO {

    private final SqlSession sqlSession;

    /**
     * 특정 판매자의 정보를 users와 business_profiles 테이블에서 조회합니다.
     * @param userId 조회할 판매자의 ID
     * @return 판매자 정보 DTO
     */
    public SellerInfoDTO findSellerInfoByUserId(int userId) {
        return sqlSession.selectOne("sellerInfo.findSellerInfoByUserId", userId);
    }

    /**
     * 판매자 정보 수정 시, users 테이블의 내용을 업데이트합니다. (담당자명, 연락처)
     * @param sellerInfoData 수정할 정보가 담긴 DTO
     * @return 업데이트된 행의 수
     */
    public int updateSellerUser(SellerInfoDTO sellerInfoData) {
        return sqlSession.update("sellerInfo.updateSellerUser", sellerInfoData);
    }

    /**
     * 판매자 정보 수정 시, business_profiles 테이블의 내용을 업데이트합니다. (상점명 등)
     * @param sellerInfoData 수정할 정보가 담긴 DTO
     * @return 업데이트된 행의 수
     */
    public int updateSellerBusinessProfile(SellerInfoDTO sellerInfoData) {
        return sqlSession.update("sellerInfo.updateSellerBusinessProfile", sellerInfoData);
    }

}