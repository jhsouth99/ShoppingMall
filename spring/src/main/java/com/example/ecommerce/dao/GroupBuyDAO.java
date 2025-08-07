package com.example.ecommerce.dao;

import java.util.List;
import java.util.Map;

import org.apache.ibatis.session.SqlSession;

import com.example.ecommerce.dto.GroupBuyDTO;
import com.example.ecommerce.dto.GroupBuyParticipantDTO;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class GroupBuyDAO {

	private final SqlSession sqlSession;
	
//	public List<MyGroupBuySummaryDTO> findCreatedGroupBuys(int userId, int offset, int limit) {
//        Map<String,Integer> p = Map.of("userId", userId, "offset", offset, "limit", limit);
//		return sqlSession.selectList("groupBuy.findCreatedGroupBuys", p);
//	}

    public int countCreatedGroupBuys(int userId) {
        return sqlSession.selectOne("groupBuy.countCreatedGroupBuys", userId);
    }

	public List<GroupBuyParticipantDTO> findParticipatedGroupBuys(int userId, int offset, int limit) {
        Map<String,Integer> p = Map.of("userId", userId, "offset", offset, "limit", limit);
		return sqlSession.selectList("groupBuy.findParticipatedGroupBuys", p);
	}

	public int countParticipatedGroupBuys(int userId) {
		return sqlSession.selectOne("groupBuy.countParticipatedGroupBuys", userId);
	}

    public List<GroupBuyDTO> findGroupBuysBySellerId(Map<String, Object> params) {
        return sqlSession.selectList("groupBuy.findGroupBuysBySellerId", params);
    }

    public int countGroupBuysBySellerId(Map<String, Object> params) {
        return sqlSession.selectOne("groupBuy.countGroupBuysBySellerId", params);
    }

    public List<GroupBuyParticipantDTO> findParticipantsByGroupBuyId(int groupBuyId) {
        return sqlSession.selectList("groupBuy.findParticipantsByGroupBuyId", groupBuyId);
    }

    public int insertGroupBuy(GroupBuyDTO groupBuyData) {
        return sqlSession.insert("groupBuy.insertGroupBuy", groupBuyData);
    }
    
    public int updateGroupBuy(GroupBuyDTO groupBuyData) {
        return sqlSession.update("groupBuy.updateGroupBuy", groupBuyData);
    }


    /**
     * 페이지네이션을 적용하여 모든 공동구매 목록을 조회합니다.
     * @param params 페이징(offset, size) 및 검색(keyword, status) 파라미터
     * @return 공동구매 목록
     */
    public List<GroupBuyDTO> findAllGroupBuys(Map<String, Object> params) {
        return sqlSession.selectList("groupBuy.findAllGroupBuys", params);
    }

    /**
     * 전체 공동구매 개수를 조회합니다.
     * @param params 검색(keyword, status) 파라미터
     * @return 공동구매 개수
     */
    public int countAllGroupBuys(Map<String, Object> params) {
        return sqlSession.selectOne("groupBuy.countAllGroupBuys", params);
    }

    /**
     * ID로 특정 공동구매의 상세 정보를 조회합니다.
     * @param groupBuyId 공동구매 ID
     * @return 공동구매 상세 정보 DTO
     */
    public GroupBuyDTO findGroupBuyDetails(int groupBuyId) {
        return sqlSession.selectOne("groupBuy.findGroupBuyDetails", groupBuyId);
    }

    public List<GroupBuyDTO> findGroupBuysByProductId(Integer productId) {
        return sqlSession.selectList("groupBuy.findGroupBuysByProductId", productId);
    }

    public GroupBuyDTO findGroupBuyByGroupBuyPartId(Integer participantId) {
        return sqlSession.selectOne("groupBuy.findGroupBuyByGroupBuyPartId", participantId);
    }
}
