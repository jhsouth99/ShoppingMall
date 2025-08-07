<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core"%>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn"%>
<%@ taglib prefix="sec" uri="http://www.springframework.org/security/tags" %>

<!DOCTYPE html>
<html>
<head>
	<jsp:include page="/WEB-INF/views/common/meta.jsp" />
	<title>검색 결과 - 이거어때</title>

	<!-- 검색 페이지 전용 CSS -->
	<link rel="stylesheet" href="${pageContext.request.contextPath}/resources/css/search.css" />

	<!-- 검색 관련 JavaScript -->
	<script src="${pageContext.request.contextPath}/resources/js/search-page.js"></script>
</head>

<body>
<!-- 공통 헤더 -->
<jsp:include page="/WEB-INF/views/common/header.jsp" />

<!-- 메인 컨텐츠 영역 -->
<main>
	<!-- 검색 결과 섹션 -->
	<section class="product-section">
		<div class="container">
			<div class="section-header">
				<!-- 검색 결과 정보 -->
				<div class="search-info">
					<h2>'${searchKeyword}' 검색 결과</h2>
					<p class="result-count">
						총 <span>${totalCount}</span>개의 상품이 있습니다.
					</p>
				</div>

				<!-- 필터 컨테이너 -->
				<div class="filter-container">
					<div class="category-filter">
						<select id="category-filter">
							<option value="all">전체 카테고리</option>
						</select>
					</div>
					<div class="price-filter">
						<select id="price-filter">
							<option value="all">전체 가격대</option>
							<option value="under-100000">10만원 이하</option>
							<option value="100000-300000">10-30만원</option>
							<option value="over-300000">30만원 이상</option>
						</select>
					</div>
					<div class="special-filter">
						<label><input type="checkbox" id="discount-filter"> 할인상품만</label>
						<label><input type="checkbox" id="group-purchase-filter"> 공동구매 가능</label>
					</div>
					<div class="sort-options">
						<select id="sort-option">
							<option value="popularity">인기순</option>
							<option value="latest">최신순</option>
							<option value="price-low">낮은 가격순</option>
							<option value="price-high">높은 가격순</option>
						</select>
					</div>
				</div>

				<!-- 상품 그리드 -->
				<div class="product-grid" id="product-grid">
					<c:choose>
						<c:when test="${not empty list}">
							<c:forEach var="dto" items="${list}">
								<div class="product-card" data-product-id="${dto.id}">
									<div class="product-image">
										<c:choose>
											<c:when test="${not empty dto.imageUrl}">
												<c:set var="imageUrl" value="${dto.imageUrl}" />
											</c:when>
											<c:otherwise>
												<c:set var="imageUrl" value="/resources/images/no-image.jpg" />
											</c:otherwise>
										</c:choose>
										<c:choose>
											<c:when test="${not empty dto.altText}">
												<c:set var="altText" value="${dto.altText}" />
											</c:when>
											<c:otherwise>
												<c:set var="altText" value="${dto.name}" />
											</c:otherwise>
										</c:choose>
										<img src="<c:url value='${imageUrl}' />" alt="${altText}"
											 onerror="this.src='${pageContext.request.contextPath}/resources/images/no-image.jpg'" />

										<c:if test="${not empty dto.discountRate and dto.discountRate > 0}">
											<div class="product-badge discount">${dto.discountRate}%</div>
										</c:if>

										<c:if test="${dto.isGroupPurchase == true}">
											<div class="product-badge group">공동구매</div>
										</c:if>
									</div>

									<div class="product-info">
										<h3 class="product-name">${dto.name}</h3>
										<div class="product-price">
											<c:choose>
												<c:when test="${not empty dto.discountRate and dto.discountRate > 0}">
													<div class="original-price">
														<fmt:formatNumber value="${dto.basePrice}" pattern="#,###" />원
													</div>
													<div class="discount-price">
														<c:choose>
															<c:when test="${not empty dto.discountPrice}">
																<fmt:formatNumber value="${dto.discountPrice}" pattern="#,###" />원
															</c:when>
															<c:otherwise>
																<c:set var="discountPrice" value="${dto.basePrice - dto.discountAmount}" />
																<fmt:formatNumber value="${discountPrice}" pattern="#,###" />원
															</c:otherwise>
														</c:choose>
													</div>
												</c:when>
												<c:otherwise>
													<div class="current-price">
														<fmt:formatNumber value="${dto.basePrice}" pattern="#,###" />원
													</div>
												</c:otherwise>
											</c:choose>
										</div>

										<c:if test="${dto.isGroupPurchase == true}">
											<div class="group-purchase-info">
												<div class="group-price">
													공동구매시:
													<fmt:formatNumber value="${dto.groupPrice}" pattern="#,###" />원
												</div>
											</div>
										</c:if>
									</div>
								</div>
							</c:forEach>
						</c:when>
						<c:otherwise>
							<div class="no-products">
								<c:choose>
									<c:when test="${not empty errorMessage}">
										<p class="error-message">${errorMessage}</p>
									</c:when>
									<c:otherwise>
										<div class="no-results">
											<h3>검색 결과가 없습니다.</h3>
											<p>'${searchKeyword}'에 대한 검색 결과가 없습니다.</p>
											<p>다른 키워드로 검색해보세요.</p>
										</div>
									</c:otherwise>
								</c:choose>
							</div>
						</c:otherwise>
					</c:choose>
				</div>

				<div class="load-more">
					<button id="load-more-btn" style="${empty list or fn:length(list) < 12 ? 'display:none;' : ''}">더 보기</button>
				</div>
			</div>
		</div>
	</section>
</main>

<!-- 공통 푸터 -->
<jsp:include page="/WEB-INF/views/common/footer.jsp" />
</body>
</html>