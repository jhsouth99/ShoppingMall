package com.example.ecommerce.dao;

import com.example.ecommerce.dto.ShippingMethodDTO;
import lombok.RequiredArgsConstructor;
import org.apache.ibatis.session.SqlSession;

import java.util.List;

@RequiredArgsConstructor
public class ShipmentDAO {

    private final SqlSession sqlSession;

    public List<ShippingMethodDTO> findShippingMethodsBySellerId(int sellerId) {
        return sqlSession.selectList("shipment.findShippingMethodsBySellerId", sellerId);
    }

}
