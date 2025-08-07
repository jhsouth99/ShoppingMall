package com.example.ecommerce.service;

import com.example.ecommerce.dao.CarrierDAO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class CarrierService {
    private final CarrierDAO carrierDAO;

    /**
     * 활성화된 배송업체 목록을 조회합니다.
     * @return 활성화된 배송업체 목록 (id, name, code 포함)
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getActiveCarriers() {
        try {
            List<Map<String, Object>> carriers = carrierDAO.findActiveCarriers();
            log.debug("활성화된 배송업체 {}개 조회 완료", carriers.size());
            return carriers;
        } catch (Exception e) {
            log.error("활성화된 배송업체 목록 조회 중 오류 발생", e);
            throw new RuntimeException("배송업체 목록을 불러오는 중 오류가 발생했습니다.", e);
        }
    }

    /**
     * 배송업체 ID로 상세 정보를 조회합니다.
     * @param carrierId 배송업체 ID
     * @return 배송업체 상세 정보
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getCarrierById(int carrierId) {
        Map<String, Object> carrier = carrierDAO.findCarrierById(carrierId);
        if (carrier == null) {
            throw new IllegalArgumentException("존재하지 않는 배송업체입니다. ID: " + carrierId);
        }
        return carrier;
    }

    /**
     * 배송업체 코드로 정보를 조회합니다.
     * @param code 배송업체 코드 (예: "CJ", "HANJIN")
     * @return 배송업체 정보
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getCarrierByCode(String code) {
        if (code == null || code.trim().isEmpty()) {
            throw new IllegalArgumentException("배송업체 코드가 비어있습니다.");
        }

        Map<String, Object> carrier = carrierDAO.findCarrierByCode(code.trim().toUpperCase());
        if (carrier == null) {
            throw new IllegalArgumentException("존재하지 않는 배송업체 코드입니다: " + code);
        }
        return carrier;
    }

    /**
     * 전체 배송업체 목록을 조회합니다. (관리자용)
     * @return 전체 배송업체 목록
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAllCarriers() {
        return carrierDAO.findAllCarriers();
    }

    /**
     * 새 배송업체를 추가합니다. (관리자용)
     * @param name 배송업체명
     * @param code 배송업체 코드
     * @param logoUrl 로고 URL (선택사항)
     * @param trackingUrlFormat 운송장 추적 URL 형식 (선택사항)
     * @return 추가된 배송업체 ID
     */
    @Transactional
    public int addCarrier(String name, String code, String logoUrl, String trackingUrlFormat) {
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("배송업체명은 필수입니다.");
        }
        if (code == null || code.trim().isEmpty()) {
            throw new IllegalArgumentException("배송업체 코드는 필수입니다.");
        }

        // 중복 코드 검사
        try {
            getCarrierByCode(code);
            throw new IllegalArgumentException("이미 존재하는 배송업체 코드입니다: " + code);
        } catch (IllegalArgumentException e) {
            if (e.getMessage().contains("이미 존재하는")) {
                throw e; // 중복 코드 에러는 그대로 전파
            }
            // "존재하지 않는" 에러는 정상 (새로 추가할 수 있음)
        }

        Map<String, Object> carrierData = Map.of(
                "name", name.trim(),
                "code", code.trim().toUpperCase(),
                "logoUrl", logoUrl,
                "trackingUrlFormat", trackingUrlFormat,
                "isActive", "Y"
        );

        carrierDAO.insertCarrier(carrierData);
        return (Integer) carrierData.get("id");
    }

    /**
     * 배송업체 정보를 수정합니다. (관리자용)
     * @param carrierId 배송업체 ID
     * @param carrierData 수정할 정보
     */
    @Transactional
    public void updateCarrier(int carrierId, Map<String, Object> carrierData) {
        // 존재하는 배송업체인지 확인
        getCarrierById(carrierId);

        carrierData.put("id", carrierId);
        int updatedRows = carrierDAO.updateCarrier(carrierData);

        if (updatedRows == 0) {
            throw new RuntimeException("배송업체 정보 수정에 실패했습니다.");
        }

        log.info("배송업체 정보 수정 완료: ID={}", carrierId);
    }

    /**
     * 배송업체를 활성화/비활성화합니다.
     * @param carrierId 배송업체 ID
     * @param isActive 활성화 여부
     */
    @Transactional
    public void updateCarrierStatus(int carrierId, boolean isActive) {
        // 존재하는 배송업체인지 확인
        getCarrierById(carrierId);

        String status = isActive ? "Y" : "N";
        int updatedRows = carrierDAO.updateCarrierStatus(carrierId, status);

        if (updatedRows == 0) {
            throw new RuntimeException("배송업체 상태 변경에 실패했습니다.");
        }

        log.info("배송업체 상태 변경 완료: ID={}, 활성화={}", carrierId, isActive);
    }

    /**
     * 운송장 추적 URL을 생성합니다.
     * @param carrierId 배송업체 ID
     * @param trackingNumber 운송장 번호
     * @return 추적 URL (형식이 없으면 null)
     */
    @Transactional(readOnly = true)
    public String generateTrackingUrl(int carrierId, String trackingNumber) {
        if (trackingNumber == null || trackingNumber.trim().isEmpty()) {
            return null;
        }

        Map<String, Object> carrier = getCarrierById(carrierId);
        String urlFormat = (String) carrier.get("trackingUrlFormat");

        if (urlFormat == null || urlFormat.trim().isEmpty()) {
            return null;
        }

        return urlFormat.replace("{TRACKING_NO}", trackingNumber.trim());
    }
}