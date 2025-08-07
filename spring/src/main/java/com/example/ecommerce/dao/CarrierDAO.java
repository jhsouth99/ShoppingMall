package com.example.ecommerce.dao;

import lombok.RequiredArgsConstructor;
import org.apache.ibatis.session.SqlSession;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

@Repository
@RequiredArgsConstructor
public class CarrierDAO {
    private final SqlSession sqlSession;

    /**
     * 활성화된 배송업체 목록을 조회합니다.
     * @return 활성화된 배송업체 목록
     */
    public List<Map<String, Object>> findActiveCarriers() {
        return sqlSession.selectList("carrier.findActiveCarriers");
    }

    /**
     * 배송업체 ID로 상세 정보를 조회합니다.
     * @param carrierId 배송업체 ID
     * @return 배송업체 상세 정보
     */
    public Map<String, Object> findCarrierById(int carrierId) {
        return sqlSession.selectOne("carrier.findCarrierById", carrierId);
    }

    /**
     * 배송업체 코드로 정보를 조회합니다.
     * @param code 배송업체 코드
     * @return 배송업체 정보
     */
    public Map<String, Object> findCarrierByCode(String code) {
        return sqlSession.selectOne("carrier.findCarrierByCode", code);
    }

    /**
     * 전체 배송업체 목록을 조회합니다. (관리자용)
     * @return 전체 배송업체 목록
     */
    public List<Map<String, Object>> findAllCarriers() {
        return sqlSession.selectList("carrier.findAllCarriers");
    }

    /**
     * 새 배송업체를 추가합니다. (관리자용)
     * @param carrierData 배송업체 정보
     * @return 추가된 행 수
     */
    public int insertCarrier(Map<String, Object> carrierData) {
        return sqlSession.insert("carrier.insertCarrier", carrierData);
    }

    /**
     * 배송업체 정보를 수정합니다. (관리자용)
     * @param carrierData 수정할 배송업체 정보
     * @return 수정된 행 수
     */
    public int updateCarrier(Map<String, Object> carrierData) {
        return sqlSession.update("carrier.updateCarrier", carrierData);
    }

    /**
     * 배송업체의 활성화 상태를 변경합니다.
     * @param carrierId 배송업체 ID
     * @param isActive 활성화 여부 ('Y' 또는 'N')
     * @return 수정된 행 수
     */
    public int updateCarrierStatus(int carrierId, String isActive) {
        Map<String, Object> params = Map.of(
                "id", carrierId,
                "isActive", isActive
        );
        return sqlSession.update("carrier.updateCarrierStatus", params);
    }
}