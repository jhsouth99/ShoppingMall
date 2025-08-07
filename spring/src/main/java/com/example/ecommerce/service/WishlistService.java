package com.example.ecommerce.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.ecommerce.dao.WishlistDAO;
import com.example.ecommerce.dto.WishlistItemDto;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class WishlistService {

    private final WishlistDAO dao;

    public List<WishlistItemDto> list(int userId) {
        return dao.findByUserId(userId);
    }

    @Transactional
    public void add(int userId, int productId) {
        if (!dao.exists(userId, productId)) {
            dao.insert(userId, productId);
        }
    }

    /* ▶ 여기: void  →  boolean  +  삭제된 행 수 > 0 */
    @Transactional
    public boolean remove(int userId, int productId) {
        return dao.deleteOne(userId, productId) > 0;
    }
}
