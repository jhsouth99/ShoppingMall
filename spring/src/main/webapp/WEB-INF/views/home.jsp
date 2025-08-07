<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>
<%@ taglib prefix="sec" uri="http://www.springframework.org/security/tags" %>

<!DOCTYPE html>
<html>
<head>
    <jsp:include page="/WEB-INF/views/common/meta.jsp" />
    <title>이거어때 - 온라인 쇼핑몰</title>

    <!-- 홈 페이지 전용 JavaScript -->
    <script src="${pageContext.request.contextPath}/resources/js/home.js"></script>
</head>

<body>
<!-- 공통 헤더 -->
<jsp:include page="/WEB-INF/views/common/header.jsp" />

<!-- 메인 컨텐츠 영역 -->
<main>
    <!-- 배너 슬라이더 섹션 -->
    <section class="banner-slider">
        <div class="container">
            <div class="slider-container">
                <div class="slider-wrapper">
                    <div class="slide">
                        <img src='https://d2v80xjmx68n4w.cloudfront.net/members/portfolios/GyOyE1730102954.jpg?w=500' alt="배너 이미지 1">
                    </div>
                    <div class="slide">
                        <img src='https://d2v80xjmx68n4w.cloudfront.net/members/portfolios/PoivZ1730103831.jpg?w=500' alt="배너 이미지 2">
                    </div>
                </div>
                <div class="slider-controls-and-dots">
                    <button class="slider-control prev">
                        <img src="<c:url value='/resources/images/left-arrow.png'/>" alt="이전 배너" width="32" height="32">
                    </button>
                    <div class="slider-dots">
                        <span class="dot active" data-index="0"></span>
                        <span class="dot" data-index="1"></span>
                    </div>
                    <button class="slider-control next">
                        <img src="<c:url value='/resources/images/right-arrow.png'/>" alt="다음 배너" width="32" height="32">
                    </button>
                </div>
            </div>
        </div>
    </section>

    <!-- 제품 목록 섹션 -->
    <section class="product-section">
        <div class="container">
            <div class="section-header">
                <h2>인기 상품</h2>

                <!-- 필터 컨테이너 -->
                <div class="filter-container">
                    <div class="category-filter">
                        <select id="category-filter">
                            <option value="all">전체</option>
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
                                                <c:set var="imageUrl" value="${pageContext.request.contextPath}/resources/images/no-image.jpg" />
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
                                             onerror="this.src='${pageContext.request.contextPath}/resources/images/no-image.jpg'"/>

                                        <c:if test="${not empty dto.discountRate and dto.discountRate > 0}">
                                            <div class="product-badge discount">${dto.discountRate}%</div>
                                        </c:if>

                                        <c:if test="${dto.isGroupPurchase == 1}">
                                            <div class="product-badge group">공동구매</div>
                                        </c:if>
                                    </div>

                                    <div class="product-info">
                                        <h3 class="product-name">${dto.name}</h3>
                                        <div class="product-price">
                                            <c:choose>
                                                <c:when test="${not empty dto.discountRate and dto.discountRate > 0}">
                                                    <div class="original-price">
                                                        <fmt:formatNumber value="${dto.basePrice}" pattern="#,###"/>원
                                                    </div>
                                                    <div class="discount-price">
                                                        <c:choose>
                                                            <c:when test="${not empty dto.discountPrice}">
                                                                <fmt:formatNumber value="${dto.discountPrice}" pattern="#,###"/>원
                                                            </c:when>
                                                            <c:otherwise>
                                                                <c:set var="discountPrice" value="${dto.basePrice - dto.discountAmount}" />
                                                                <fmt:formatNumber value="${discountPrice}" pattern="#,###"/>원
                                                            </c:otherwise>
                                                        </c:choose>
                                                    </div>
                                                </c:when>
                                                <c:otherwise>
                                                    <div class="current-price">
                                                        <fmt:formatNumber value="${dto.basePrice}" pattern="#,###"/>원
                                                    </div>
                                                </c:otherwise>
                                            </c:choose>
                                        </div>

                                        <c:if test="${dto.isGroupPurchase == 1}">
                                            <div class="group-purchase-info">
                                                <div class="group-price">
                                                    공동구매시:
                                                    <fmt:formatNumber value="${dto.group_price}" pattern="#,###"/>원
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
                                        <p>등록된 상품이 없습니다.</p>
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