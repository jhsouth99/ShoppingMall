package com.example.ecommerce.dao;

import java.util.List;
import java.util.Map;

import org.apache.ibatis.session.SqlSession;
import org.springframework.stereotype.Repository;

import com.example.ecommerce.dto.WishlistItemDto;

import lombok.RequiredArgsConstructor;

@Repository
@RequiredArgsConstructor
public class WishlistDAO {

    private final SqlSession sqlSession;

    public boolean exists(int userId, int productId) {
        return sqlSession.selectOne("wishlist.isWishlistItem",
                Map.of("userId", userId, "productId", productId));
    }

    public int insert(int userId, int productId) {
        return sqlSession.insert("wishlist.insertWishlistItem",
                    Map.of("userId", userId, "productId", productId));
    }

    public int deleteOne(int userId, int productId) {
        return sqlSession.delete("wishlist.deleteWishlistItem",
                Map.of("userId", userId, "productId", productId));
    }

    public List<WishlistItemDto> findByUserId(int userId) {
        return sqlSession.selectList("wishlist.findByUserId", userId);
    }
}
