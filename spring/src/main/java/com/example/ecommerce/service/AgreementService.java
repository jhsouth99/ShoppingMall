package com.example.ecommerce.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.transaction.annotation.Transactional;

import com.example.ecommerce.dao.AgreementDAO;
import com.example.ecommerce.dto.AgreementTermDTO;
import com.example.ecommerce.dto.MarketingConsentDTO;
import com.example.ecommerce.dto.UserAgreementDTO;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class AgreementService {
	private static final Logger logger = LoggerFactory.getLogger(AgreementService.class);
    private final AgreementDAO agreementDAO;
    

    // 약관 유형 상수
    private static final String MARKETING_EMAIL = "MARKETING_EMAIL";
    private static final String MARKETING_SMS   = "MARKETING_SMS";

    /** 저장(동의/철회) */
    public void saveOrUpdateConsents(int userId, MarketingConsentDTO req) {
    	logger.debug("=====================" + req.toString() + userId);
        upsertSingle(userId, MARKETING_EMAIL, req.getEmailConsent(), req.getMethod());
        upsertSingle(userId, MARKETING_SMS,   req.getSmsConsent(),   req.getMethod());
    }

    /** 조회 */
    @Transactional(readOnly = true)
    public MarketingConsentDTO getConsents(int userId) {
        AgreementTermDTO emailTerm = agreementDAO.selectLatestTerm(MARKETING_EMAIL);
        AgreementTermDTO smsTerm   = agreementDAO.selectLatestTerm(MARKETING_SMS);

        boolean emailAgreed = emailTerm != null && agreementDAO.existsAgreed(userId, emailTerm.getId());
        boolean smsAgreed   = smsTerm != null && agreementDAO.existsAgreed(userId, smsTerm.getId());

        return new MarketingConsentDTO(emailAgreed, smsAgreed);
    }

    // ──────────────────────────────────────────────────────────────────────
    private void upsertSingle(int userId, String type, boolean wantAgree, String method) {
        AgreementTermDTO term = agreementDAO.selectLatestTerm(type);
        if (term == null) {                       // 안전 장치
            throw new IllegalStateException("약관 유형이 정의되어 있지 않습니다: " + type);
        }

        UserAgreementDTO ua = agreementDAO.selectUserAgreement(userId, term.getId());

        if (wantAgree) {
            if (ua == null) {                     // 최초 동의
                UserAgreementDTO newUa = new UserAgreementDTO();
                newUa.setUserId(userId);
                newUa.setAgreementTermId(term.getId());
                newUa.setStatus("AGREED");
                newUa.setMethod(method);
                agreementDAO.insertUserAgreement(newUa);
            } else if ("REVOKED".equals(ua.getStatus())) { // 재동의
            	agreementDAO.reAgree(ua.getId(), method);
            }
        } else {                                  // 철회
            if (ua != null && "AGREED".equals(ua.getStatus())) {
            	agreementDAO.revoke(ua.getId());
            }
        }
    }
}
