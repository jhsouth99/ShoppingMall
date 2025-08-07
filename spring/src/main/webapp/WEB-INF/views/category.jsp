<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>
<%@ taglib prefix="sec" uri="http://www.springframework.org/security/tags" %>

<!DOCTYPE html>
<html>
<head>
    <jsp:include page="/WEB-INF/views/common/meta.jsp" />
    <title>${categoryName} - 이거어때</title>

    <!-- 카테고리 페이지 전용 CSS -->
    <link rel="stylesheet" href="${pageContext.request.contextPath}/resources/css/category.css"/>

    <!-- 카테고리 페이지 전용 JavaScript -->
    <script src="${pageContext.request.contextPath}/resources/js/category.js"></script>
</head>

<body>
<!-- 공통 헤더 -->
<jsp:include page="/WEB-INF/views/common/header.jsp" />

<!-- 메인 컨텐츠 영역 -->
<main>
    <!-- 브레드크럼 네비게이션 -->
    <section class="breadcrumb-section">
        <div class="container">
            <nav class="breadcrumb">
                <a href="<c:url value='/'/>">홈</a>
                <c:if test="${not empty categoryPath}">
                    <c:forEach var="pathCategory" items="${categoryPath}">
                        <span class="breadcrumb-separator">></span>
                        <a href="<c:url value='/products/category/${pathCategory.id}'/>">${pathCategory.name}</a>
                    </c:forEach>
                </c:if>
            </nav>
        </div>
    </section>

    <!-- 카테고리 헤더 섹션 -->
    <section class="category-header">
        <div class="container">
            <div class="category-info">
                <h1 class="category-title">${categoryName}</h1>
                <c:if test="${not empty categoryDescription}">
                    <p class="category-description">${categoryDescription}</p>
                </c:if>
                <p class="result-count">
                    총 <span id="total-count">${totalCount}</span>개의 상품
                </p>
            </div>
        </div>
    </section>

    <!-- 서브 카테고리 섹션 -->
    <c:if test="${not empty subCategories}">
        <section class="subcategory-section">
            <div class="container">
                <div class="subcategory-grid">
                    <c:forEach var="subCategory" items="${subCategories}">
                        <div class="subcategory-card">
                            <a href="<c:url value='/products/category/${subCategory.id}'/>">
                                <c:if test="${not empty subCategory.imageUrl}">
                                    <div class="subcategory-image">
                                        <img src="<c:url value='${subCategory.imageUrl}'/>" alt="${subCategory.name}">
                                    </div>
                                </c:if>
                                <div class="subcategory-info">
                                    <h3>${subCategory.name}</h3>
                                    <p class="product-count">${subCategory.productCountWithChildren}개 상품</p>
                                </div>
                            </a>
                        </div>
                    </c:forEach>
                </div>
            </div>
        </section>
    </c:if>

    <!-- 상품 목록 섹션 -->
    <section class="product-section">
        <div class="container">
            <div class="section-header">
                <!-- 필터 컨테이너 -->
                <div class="filter-container">
                    <!-- 속성 필터 영역 -->
                    <div class="attribute-filters" id="attribute-filters" style="display: none;">
                        <div class="filter-loading">
                            <p>카테고리별 속성 필터를 불러오는 중...</p>
                        </div>
                        <!-- 동적으로 생성됨 -->
                    </div>

                    <!-- 기본 필터들 -->
                    <div class="basic-filters">
                        <div class="price-filter">
                            <label>가격대</label>
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
                            <label>정렬</label>
                            <select id="sort-option">
                                <option value="popularity">인기순</option>
                                <option value="latest">최신순</option>
                                <option value="price-low">낮은 가격순</option>
                                <option value="price-high">높은 가격순</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- 활성 필터 표시 -->
                <div class="active-filters" id="active-filters" style="display: none;">
                    <h4>적용된 필터</h4>
                    <div class="filter-tags" id="filter-tags">
                        <!-- 동적으로 생성됨 -->
                    </div>
                    <button class="clear-all-filters" id="clear-all-filters">모든 필터 초기화</button>
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

                                        <c:if test="${dto.isGroupPurchase}">
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

                                        <c:if test="${dto.isGroupPurchase}">
                                            <div class="group-purchase-info">
                                                <div class="group-price">
                                                    공동구매시:
                                                    <fmt:formatNumber value="${dto.groupPrice}" pattern="#,###"/>원
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
                                            <h3>상품이 없습니다.</h3>
                                            <p>${categoryName}에 등록된 상품이 없습니다.</p>
                                            <p>다른 카테고리를 확인해보세요.</p>
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

<!-- 현재 카테고리 ID와 필터 정보를 JavaScript에서 사용할 수 있도록 전달 -->
<script>
    window.currentCategoryId = ${categoryId};
    window.currentCategoryName = '${categoryName}';

    // URL 파라미터에서 필터 정보 추출
    window.initialFilters = {
        priceRange: '${param.priceRange != null ? param.priceRange : "all"}',
        discountOnly: ${param.discountOnly != null ? param.discountOnly : false},
        groupPurchaseOnly: ${param.groupPurchaseOnly != null ? param.groupPurchaseOnly : false},
        sortBy: '${param.sortBy != null ? param.sortBy : "popularity"}'
    };

    // URL의 속성 필터 파라미터들 (attr_1, attr_2 등)
    window.initialAttributeFilters = {};
    <c:forEach var="param" items="${paramValues}">
    <c:if test="${fn:startsWith(param.key, 'attr_')}">
    window.initialAttributeFilters['${param.key}'] = [<c:forEach var="value" items="${param.value}" varStatus="status">'${value}'<c:if test="${!status.last}">,</c:if></c:forEach>];
    </c:if>
    </c:forEach>
</script>
</body>
</html>