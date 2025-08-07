package com.example.ecommerce.dao;

import com.example.ecommerce.dto.RefundDTO;
import lombok.RequiredArgsConstructor;
import org.apache.ibatis.session.SqlSession;

import java.util.List;

@RequiredArgsConstructor
public class RefundDAO {
    private final SqlSession sqlSession;

    public List<RefundDTO> findRefundsByOrderNo(String orderNo) {
        return sqlSession.selectList("refund.findRefundsByOrderNo", orderNo);
    }
}
