package com.example.ecommerce.service;

import com.example.ecommerce.dao.ShipmentDAO;
import com.example.ecommerce.dto.ShippingMethodDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@RequiredArgsConstructor
public class ShipmentService {
    private final ShipmentDAO shipmentDAO;

    @Transactional(readOnly = true)
    public List<ShippingMethodDTO> getShippingMethodsBySeller(int sellerId) {
        return shipmentDAO.findShippingMethodsBySellerId(sellerId);
    }

}
