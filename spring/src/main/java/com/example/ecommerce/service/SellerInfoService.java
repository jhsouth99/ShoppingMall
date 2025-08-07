package com.example.ecommerce.service;

import org.springframework.transaction.annotation.Transactional;

import com.example.ecommerce.dao.SellerInfoDAO;
import com.example.ecommerce.dto.SellerInfoDTO;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class SellerInfoService {

    private final SellerInfoDAO sellerInfoDAO;

    /**
     * 특정 판매자의 상세 정보를 조회합니다.
     * @param sellerId 판매자의 user_id
     * @return 판매자 정보 DTO
     */
    @Transactional(readOnly = true)
    public SellerInfoDTO getSellerInfo(int sellerId) {
        return sellerInfoDAO.findSellerInfoByUserId(sellerId);
    }

    /**
     * 판매자 정보를 업데이트합니다.
     * users 테이블과 business_profiles 테이블을 함께 수정하므로 트랜잭션으로 처리합니다.
     * @param sellerId 수정할 판매자의 user_id
     * @param sellerInfoData 수정할 내용이 담긴 DTO
     */
    @Transactional
    public void updateSellerInfo(int sellerId, SellerInfoDTO sellerInfoData) {
        // DTO에 현재 판매자 ID를 설정하여, 다른 판매자의 정보가 수정되는 것을 방지합니다.
        sellerInfoData.setUserId(sellerId);

        // users 테이블 업데이트 (담당자명, 연락처)
        sellerInfoDAO.updateSellerUser(sellerInfoData);

        // business_profiles 테이블 업데이트 (상점명 등)
        sellerInfoDAO.updateSellerBusinessProfile(sellerInfoData);
        
    }
}