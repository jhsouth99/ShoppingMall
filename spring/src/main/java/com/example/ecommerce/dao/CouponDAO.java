package com.example.ecommerce.dao;

import java.util.List;
import java.util.Map;
import org.apache.ibatis.session.SqlSession;

import com.example.ecommerce.dto.CouponDTO;
import com.example.ecommerce.dto.UserCouponDTO;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class CouponDAO {

	private final SqlSession sqlSession;

	public List<UserCouponDTO> findAvailableCouponsByUserId(int userId) {
		return sqlSession.selectList("coupon.findAvailableCouponsByUserId", userId);
	}

	public int countUserCoupon(Map<String, Object> params) {
		return sqlSession.selectOne("coupon.countUserCoupon", params);
	}

	public int insertUserCoupon(Map<String, Object> params) {
		return sqlSession.insert("coupon.insertUserCoupon", params);
	}

    public List<CouponDTO> findCouponsByCreator(Map<String, Object> params) {
        return sqlSession.selectList("coupon.findCouponsByCreator", params);
    }

    public int countCouponsByCreator(Map<String, Object> params) {
        return sqlSession.selectOne("coupon.countCouponsByCreator", params);
    }

    public CouponDTO findCouponById(Map<String, Object> params) {
        return sqlSession.selectOne("coupon.findCouponById", params);
    }

    public int insertCoupon(CouponDTO coupon) {
        return sqlSession.insert("coupon.insertCoupon", coupon);
    }

    public int updateCoupon(CouponDTO coupon) {
        return sqlSession.update("coupon.updateCoupon", coupon);
    }

    // 프로모션에 연결되지 않은 활성 쿠폰 목록 조회
    public List<CouponDTO> findAvailableCouponsForPromotion(Map<String, Object> params) {
        return sqlSession.selectList("coupon.findAvailableCouponsForPromotion", params);
    }

    /**
     * 관리자가 모든 쿠폰을 조회할 수 있는 메서드
     */
    public List<CouponDTO> findAllCoupons(Map<String, Object> params) {
        return sqlSession.selectList("coupon.findAllCoupons", params);
    }

    /**
     * 관리자가 모든 쿠폰의 총 개수를 조회할 수 있는 메서드
     */
    public int countAllCoupons(Map<String, Object> params) {
        return sqlSession.selectOne("coupon.countAllCoupons", params);
    }

    /**
     * 관리자가 특정 쿠폰을 ID로 조회할 수 있는 메서드 (권한 체크 없음)
     */
    public CouponDTO findCouponByIdForAdmin(int couponId) {
        return sqlSession.selectOne("coupon.findCouponByIdForAdmin", couponId);
    }

    public List<UserCouponDTO> findAvailableCouponsForProduct(Map<String, Object> params) {
        return sqlSession.selectList("coupon.findAvailableCouponsForProduct", params);
    }

    public CouponDTO findCouponByCode(String appliedCouponCode) {
        return sqlSession.selectOne("coupon.findCouponByCode", appliedCouponCode);
    }

    public int setUserCouponUsedAtNowByUserIdAndCouponId(int userId, int couponId) {
        return sqlSession.update("coupon.setUserCouponUsedAtNowByUserIdAndCouponId", Map.of("userId", userId, "couponId", couponId));
    }
}