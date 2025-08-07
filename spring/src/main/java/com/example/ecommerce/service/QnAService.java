package com.example.ecommerce.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.example.ecommerce.dto.UserDTO;
import org.springframework.transaction.annotation.Transactional;

import com.example.ecommerce.dao.QnADAO;
import com.example.ecommerce.dto.PageResult;
import com.example.ecommerce.dto.QnADTO;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class QnAService {

    // QnA 관련 쿼리가 SellerInfoDAO에 있으므로 해당 DAO를 주입
    private final QnADAO qnaDAO;

    @Transactional(readOnly = true)
    public PageResult<QnADTO> getQnas(int sellerId, int page, int size, String keyword, String status) {
        int offset = (page > 0) ? (page - 1) * size : 0;
        Map<String, Object> params = new HashMap<>();
        params.put("sellerId", sellerId);
        params.put("offset", offset);
        params.put("size", size);
        params.put("keyword", keyword);
        params.put("status", status);

        List<QnADTO> content = qnaDAO.findQnAsBySellerId(params);
        int totalElements = qnaDAO.countQnAsBySellerId(params);

        return new PageResult<>(content, totalElements, page, size);
    }

    @Transactional
    public void replyToQna(int sellerId, int qnaId, String answer) {
        Map<String, Object> params = Map.of(
            "sellerId", sellerId,
            "qnaId", qnaId,
            "answer", answer
        );
        int updatedRows = qnaDAO.updateQnAAnswer(params);

        if (updatedRows == 0) {
            // 본인 소유의 QnA가 아니거나, 존재하지 않는 QnA일 경우
            throw new SecurityException("답변을 등록할 권한이 없거나 존재하지 않는 문의입니다.");
        }
    }

    @Transactional(readOnly = true)
    public PageResult<QnADTO> getUserProductQnAs(int id, int page, int size) {
        int offset = (page > 0) ? (page - 1) * size : 0;
        Map<String, Object> params = new HashMap<>();
        params.put("id", id);
        params.put("offset", offset);
        params.put("size", size);

        List<QnADTO> content = qnaDAO.findQnAsByCustomerId(params);
        int totalElements = qnaDAO.countQnAsByCustomerId(params);

        return new PageResult<>(content, totalElements, page, size);
    }

    @Transactional
    public void deleteUserProductQnA(int id, int qnaId) {
        QnADTO details = qnaDAO.findQnAById(qnaId);
        if (details == null){
            throw new IllegalArgumentException("삭제할 리뷰가 없습니다.");
        }
        if (id != details.getCustomerId()) {
            throw new SecurityException("삭제 권한이 없는 리뷰입니다.");
        }
        if (details.getAnswer() != null) {
            throw new SecurityException("이미 답변이 된 리뷰입니다.");
        }

        int deletedRows = qnaDAO.deleteQnA(qnaId);

        if (deletedRows == 0) {
            throw new IllegalArgumentException("삭제 실패했습니다.");
        }
    }

    @Transactional
    public void updateUserProductQnA(int userId, int qnaId, QnADTO updateDto) {
        // 유효성 검사
        if (!updateDto.isValid()) {
            throw new IllegalArgumentException("입력 데이터가 올바르지 않습니다.");
        }

        // 기존 문의 조회 및 권한 확인
        QnADTO existingQnA = qnaDAO.findQnAById(qnaId);
        if (existingQnA == null) {
            throw new IllegalArgumentException("존재하지 않는 문의입니다.");
        }

        if (existingQnA.getCustomerId() != userId) {
            throw new SecurityException("수정 권한이 없는 문의입니다.");
        }

        // 답변이 이미 달린 문의는 수정 불가
        if (existingQnA.getAnswer() != null && !existingQnA.getAnswer().trim().isEmpty()) {
            throw new SecurityException("이미 답변이 달린 문의는 수정할 수 없습니다.");
        }

        // 문의 수정
        Map<String, Object> params = new HashMap<>();
        params.put("qnaId", qnaId);
        params.put("title", updateDto.getTitle().trim());
        params.put("question", updateDto.getQuestion().trim());
        params.put("isSecret", updateDto.getIsSecret());

        int updatedRows = qnaDAO.updateQnA(params);

        if (updatedRows == 0) {
            throw new IllegalArgumentException("문의 수정에 실패했습니다.");
        }
    }

    @Transactional(readOnly = true)
    public QnADTO getUserProductQnADetail(int userId, int qnaId) {
        QnADTO qnaDetail = qnaDAO.findQnAById(qnaId);

        if (qnaDetail == null) {
            throw new IllegalArgumentException("존재하지 않는 문의입니다.");
        }

        if (qnaDetail.getCustomerId() != userId) {
            throw new SecurityException("접근 권한이 없는 문의입니다.");
        }

        return qnaDetail;
    }

    @Transactional(readOnly = true)
    public PageResult<QnADTO> getProductQnAs(int productId, Integer page, Integer size, String keyword, String status, int userId) {
        int offset = (page > 0) ? (page - 1) * size : 0;
        Map<String, Object> params = new HashMap<>();
        params.put("productId", productId);
        params.put("offset", offset);
        params.put("size", size);
        params.put("keyword", keyword);
        params.put("status", status);

        List<QnADTO> content = qnaDAO.findQnAsByProductId(params);
        for (QnADTO qna : content) {
            System.out.println(qna);
            if (qna.getIsSecret() == true && qna.getCustomerId() != userId) {
                qna.setQuestion("비밀글입니다.");
                if (qna.getAnswer() != null) {
                    qna.setAnswer("비밀글입니다.");
                }
                qna.setCanView(false);
            }
            System.out.println(" -> " + qna);
        }
        int totalElements = qnaDAO.countQnAsByProductId(productId);

        return new PageResult<>(content, totalElements, page, size);
    }

    public int saveQna(Integer productId, QnADTO qnaDTO, UserDTO user) {
        String isSecretValue = (qnaDTO.getIsSecret() != null && qnaDTO.getIsSecret()) ? "Y" : "N";

        HashMap<String, Object> qnaParams = new HashMap<String, Object>();
        qnaParams.put("productId", productId);
        qnaParams.put("title", qnaDTO.getTitle());
        qnaParams.put("question", qnaDTO.getQuestion());
        qnaParams.put("isSecret", isSecretValue);
        qnaParams.put("userId", user.getId());

        int result = qnaDAO.saveQna(qnaParams);

        return result;
    }
}