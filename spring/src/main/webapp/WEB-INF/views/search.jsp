<%@ page language="java" contentType="text/html; charset=UTF-8"
	pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core"%>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn"%>
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>검색 결과 - 이거어때</title>
	<link rel="stylesheet" href="${pageContext.request.contextPath}/resources/css/home.css" />
	<link rel="stylesheet" href="${pageContext.request.contextPath}/resources/css/search.css" />
	
	<script>var contextPath = "${pageContext.request.contextPath}";</script>
	<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.7.1/jquery.min.js"></script>
	<script src="${pageContext.request.contextPath}/resources/js/search.js"></script>
</head>
<body>
	<header>
		<div class="header-top">
			<div class="container">
				<div class="logo">
					<a href="<c:url value='/'/>">이거어때</a>
				</div>
				<div class="search-container">
					<input type="text" id="search-input" placeholder="상품을 검색해보세요">
					<button id="search-button">
						<img
							src="${pageContext.request.contextPath}/resources/images/search.png"
							alt="검색">
					</button>
					<div class="search-history">
						<h4>최근 검색어</h4>
						<ul id="search-history-list">
							<!-- 검색 기록은 JS로 추가됨 -->
						</ul>
					</div>
				</div>
				<div class="user-menu">
					<div class="auth-links">
						<%-- sec:authorize 태그를 사용하여 로그인 상태에 따라 다른 내용을 표시 --%>

						<%-- 인증된 사용자 (로그인한 사용자)에게만 보이는 부분 --%>
						<c:if test="${not empty sessionScope.loginUser}">
							<p>안녕하세요, ${sessionScope.loginUser.name}님!</p>

							<%-- 로그아웃은 CSRF 공격 방지를 위해 반드시 POST 방식으로 요청 --%>
							<form action="<c:url value='/perform-logout' />" method="post">
								<%-- CSRF 토큰을 자동으로 생성해주는 태그 --%>
								<button type="submit">로그아웃</button>
							</form>

							<a href="<c:url value='/my-page'/>">마이페이지</a>
							<a href="<c:url value='/cart'/>">장바구니</a>

						</c:if>

						<%-- 인증되지 않은 사용자 (로그인하지 않은 사용자)에게만 보이는 부분 --%>
						<c:if test="${empty sessionScope.loginUser}">
							<div class="auth-links-box">
								<a href="<c:url value='/login'/>">로그인</a> <a
									href="<c:url value='/signup'/>">회원가입</a>
							</div>
						</c:if>
					</div>
				</div>
			</div>
		</div>
		<div class="header-nav">
			<div class="container">
				<nav class="main-nav">
					<ul>
						<li class="has-submenu"><a href="<c:url value='/clothing'/>">의류</a>
							<ul class="submenu">
								<li><a href="<c:url value='/shoes'/>">신발</a></li>
								<li><a href="<c:url value='/top'/>">상의</a></li>
								<li><a href="<c:url value='/outer'/>">아우터</a></li>
								<li><a href="<c:url value='/bottom'/>">하의</a></li>
							</ul></li>
						<li class="has-submenu"><a href="<c:url value='/food'/>">식품</a>
							<ul class="submenu">
								<li><a href="<c:url value='/bakery'/>">베이커리</a></li>
								<li><a href="<c:url value='/vegitable'/>">농산</a></li>
								<li><a href="<c:url value='/meat'/>">축산</a></li>
								<li><a href="<c:url value='/seafood'/>">수산</a></li>
								<li><a href="<c:url value='/snacks'/>">간식</a></li>
								<li><a href="<c:url value='/sauce-noodles'/>">양념/면</a></li>
							</ul></li>
						<li class="has-submenu"><a
							href="<c:url value='/electronics'/>">전자기기</a>
							<ul class="submenu">
								<li><a href="<c:url value='/appliances'/>">가전/TV</a></li>
								<li><a href="<c:url value='/computers'/>">컴퓨터/노트북/조립PC</a></li>
								<li><a href="<c:url value='/mobile'/>">태블릿/모바일</a></li>
								<li><a href="<c:url value='/camera'/>">카메라</a></li>
							</ul></li>
						<li class="has-submenu"><a
							href="<c:url value='/group-purchase'/>">공동구매</a>
							<ul class="submenu">
								<li><a href="<c:url value='/group-purchase/clothing'/>">의류</a></li>
								<li><a href="<c:url value='/group-purchase/food'/>">식품</a></li>
								<li><a href="<c:url value='/group-purchase/electronics'/>">전자기기</a></li>
							</ul></li>
					</ul>
				</nav>
			</div>
		</div>
	</header>

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
								<option value="all">전체</option>
								<option value="clothing">의류</option>
								<option value="food">식품</option>
								<option value="electronics">전자기기</option>
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
							<label><input type="checkbox" id="discount-filter">
								할인상품만</label> <label><input type="checkbox"
								id="group-purchase-filter"> 공동구매 가능</label>
						</div>
						<div class="sort-options">
							<select id="sort-option">
								<option value="popularity">인기순</option>
								<option value="latest">최신순</option>
								<option value="price-low">낮은 가격순</option>
								<option value="price-high">높은 가격순</option>
								<option value="discount">할인율순</option>
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
												<c:when test="${not empty dto.image_url}">
													<c:set var="imageUrl" value="${dto.image_url}" />
												</c:when>
												<c:otherwise>
													<c:set var="imageUrl"
														value="${pageContext.request.contextPath}/resources/images/no-image.jpg" />
												</c:otherwise>
											</c:choose>
											<c:choose>
												<c:when test="${not empty dto.alt_text}">
													<c:set var="altText" value="${dto.alt_text}" />
												</c:when>
												<c:otherwise>
													<c:set var="altText" value="${dto.name}" />
												</c:otherwise>
											</c:choose>
											<img src="<c:url value='${imageUrl}' />" alt="${altText}"
												onerror="this.src='${pageContext.request.contextPath}/resources/images/no-image.jpg'" />

											<c:if
												test="${not empty dto.discount_rate and dto.discount_rate > 0}">
												<div class="product-badge discount">${dto.discount_rate}%</div>
											</c:if>

											<c:if test="${dto.is_group_purchase == 1}">
												<div class="product-badge group">공동구매</div>
											</c:if>
										</div>

										<div class="product-info">
											<h3 class="product-name">${dto.name}</h3>
											<div class="product-price">
												<c:choose>
													<c:when
														test="${not empty dto.discount_rate and dto.discount_rate > 0}">
														<div class="original-price">
															<fmt:formatNumber value="${dto.base_price}"
																pattern="#,###" />
															원
														</div>
														<div class="discount-price">
															<c:choose>
																<c:when test="${not empty dto.discount_price}">
																	<fmt:formatNumber value="${dto.discount_price}"
																		pattern="#,###" />원
						                                        </c:when>
																<c:otherwise>
																	<c:set var="discountPrice"
																		value="${dto.base_price * (1 - dto.discount_rate / 100)}" />
																	<fmt:formatNumber value="${discountPrice}"
																		pattern="#,###" />원
						                                        </c:otherwise>
															</c:choose>
														</div>
													</c:when>
													<c:otherwise>
														<div class="current-price">
															<fmt:formatNumber value="${dto.base_price}"
																pattern="#,###" />
															원
														</div>
													</c:otherwise>
												</c:choose>
											</div>

											<c:if test="${dto.is_group_purchase == 1}">
												<div class="group-purchase-info">
													<div class="group-price">
														공동구매시:
														<fmt:formatNumber value="${dto.group_price}"
															pattern="#,###" />
														원
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
						<button id="load-more-btn"
							style="${empty list or fn:length(list) < 12 ? 'display:none;' : ''}">더
							보기</button>
					</div>
				</div>
			</div>
		</section>
	</main>

	<footer>
		<div class="container">
			<div class="footer-top">
				<div class="footer-logo">
					<a href="${pageContext.request.contextPath}/home">이거어때</a>
				</div>
				<div class="footer-nav">
					<ul>
						<li><a href="<c:url value='/about'/>">회사소개</a></li>
						<li><a href="<c:url value='/terms'/>">이용약관</a></li>
						<li><a href="<c:url value='/privacy'/>">개인정보처리방침</a></li>
						<li><a href="<c:url value='/contact'/>">고객센터</a></li>
						<li><a href="<c:url value='/partnership'/>">제휴문의</a></li>
					</ul>
				</div>
			</div>
			<div class="footer-sns">
				<ul>
					<li><a href="#"><img
							src="${pageContext.request.contextPath}/resources/images/instagram.png"
							alt="인스타그램"></a></li>
					<li><a href="#"><img
							src="${pageContext.request.contextPath}/resources/images/facebook.png"
							alt="페이스북"></a></li>
					<li><a href="#"><img
							src="${pageContext.request.contextPath}/resources/images/kakao-talk.png"
							alt="카카오톡"></a></li>
				</ul>
			</div>
			<div class="footer-info">
				<p>상호명: (주)이거어때 | 대표: 홍길동 | 사업자등록번호: 123-45-67890</p>
				<p>주소: 서울특별시 강남구 테헤란로 123 이거어때빌딩 8층</p>
				<p>고객센터: 1234-5678 (평일 09:00-18:00, 주말/공휴일 휴무)</p>
				<p>이메일: help@howaboutthis.co.kr</p>
			</div>
			<div class="footer-copyright">
				<p>&copy; 2025 이거어때. All rights reserved.</p>
			</div>
		</div>
	</footer>
</body>
</html>
