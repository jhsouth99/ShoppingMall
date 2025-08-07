package com.example.ecommerce.service;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.transaction.annotation.Transactional;

import com.example.ecommerce.dao.ShippingAddressDAO;
import com.example.ecommerce.dto.ShippingAddressDTO;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class ShippingAddressService {
	private static final Logger logger = LoggerFactory.getLogger(ShippingAddressService.class);

    private final ShippingAddressDAO dao;

    public List<ShippingAddressDTO> list(int userId) {
        return dao.findByUserId(userId);
    }

    public ShippingAddressDTO detail(int userId, int id) {
        ShippingAddressDTO dto = dao.findById(id);
        if (dto == null || dto.getUserId() != userId) {
            throw new IllegalArgumentException("배송지를 찾을 수 없습니다.");
        }
        return dto;
    }

    @Transactional
    public int create(ShippingAddressDTO dto) {
        // 기본 배송지로 저장하려면 기존 것을 해제
        if (dto.getIsDefault()) {
            dao.resetDefault(dto.getUserId());
        }
        dao.insert(dto);
        return dto.getId();
    }

    @Transactional
    public void update(int userId, int id, ShippingAddressDTO dto) {
        dto.setId(id);
        dto.setUserId(userId);

        if (dto.getIsDefault()) {
            dao.resetDefault(userId);
        }
        int cnt = dao.update(dto);
        if (cnt == 0) throw new IllegalArgumentException("수정 대상이 없습니다.");
    }

    @Transactional
    public void delete(int userId, int id) {
        ShippingAddressDTO dto = dao.findById(id);
        if (dto == null || dto.getUserId() != userId) {
            throw new IllegalArgumentException("배송지를 찾을 수 없습니다.");
        }
        dao.delete(id);
    }

    @Transactional
    public void makeDefault(int userId, int id) {
        ShippingAddressDTO dto = dao.findById(id);
        if (dto == null || dto.getUserId() != userId) {
            throw new IllegalArgumentException("설정 대상이 없습니다.");
        }
        dao.resetDefault(userId);
        int cnt = dao.setDefault(id);
        if (cnt == 0) throw new IllegalArgumentException("설정 대상이 없습니다.");
    }

    public ShippingAddressDTO getAddressById(Integer shippingAddressId) {
        return dao.findById(shippingAddressId);
    }
}
