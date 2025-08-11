<%@ page language="java" contentType="text/html; charset=UTF-8"
    pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<jsp:include page="/WEB-INF/views/common/meta.jsp" />
<title>이거어때 - 장바구니</title>
	
	<link rel="stylesheet" href="${pageContext.request.contextPath}/resources/css/common.css">
	<link rel="stylesheet" href="${pageContext.request.contextPath}/resources/css/cart.css"/>
	<link rel="stylesheet" href="${pageContext.request.contextPath}/resources/css/cart_modal.css"/>

    <meta name="_csrf" content="${_csrf.token}"/>
    <meta name="_csrf_header" content="${_csrf.headerName}"/>
	
	<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.7.1/jquery.min.js"></script>
	<script>const contextPath = "${pageContext.request.contextPath}";</script>
	<script src="${pageContext.request.contextPath}/resources/js/search.js"></script>
	<script src="${pageContext.request.contextPath}/resources/js/cart/cart.js"></script>
	<script src="${pageContext.request.contextPath}/resources/js/cart/cart_modal.js"></script>

</head>

<body>
<!-- 공통 헤더 -->
<jsp:include page="/WEB-INF/views/common/header.jsp" />
	
	<main>
	<div class="cart-container">
		<h2 class="cart-title">장바구니</h2>

		<div class="cart-content" id="cart-content">
			<div class="cart-header">
				<div class="select-all-container">
					<input type="checkbox" id="select-all">
					<label for="select-all">전체 선택</label>
				</div>
				<div class="cart-header-right">
					<button class="delete-selected-btn">선택 삭제</button>
					<button class="delete-unable-btn">구매불가 상품 삭제</button>
				</div>
			</div>

			<div class="cart-items" id="cart-items">
				<!-- 장바구니 아이템들 -->
				<c:choose>
					<c:when test="${not empty cartList}">
						<!-- 판매자별로 그룹화 -->
						<c:set var="currentSeller" value="" />
						<c:set var="sellerGroupOpen" value="false" />
						
						<c:forEach var="dto" items="${cartList}" varStatus="status">
						    <c:if test="${status.index == 0 or cartList[status.index - 1].businessName ne dto.businessName}">
						        <!-- 판매자별 그룹 시작 -->
						        <div class="seller-group" data-shipping-cost="${dto.finalShippingCost}">
						            <div class="seller-header">
						                <div class="seller-info">
						                    <input type="checkbox" class="seller-checkbox" id="seller-${dto.sellerId}">
						                    <label for="seller-${dto.sellerId}" class="seller-name">
						                        ${not empty dto.businessName ? dto.businessName : '판매자명'}
						                    </label>
						                </div>
						            </div>
						            <div class="seller-items">
						    </c:if>
							
							<!-- 상품 아이템 -->
							<div class="cart-item ${dto.isActive eq 'N' ? 'unavailable' : ''}" 
							     data-variant-id="${dto.productVariantId}" 
							     data-user-id="${dto.userId}"
							     data-seller-id="${dto.sellerId}">
							    
							    <div class="item-check">
							        <input type="checkbox" class="item-checkbox" 
							               ${dto.isActive eq 'N' ? 'disabled' : 'checked'}>
							    </div>
							    
							    <div class="item-img"
							         onclick="location.href='${pageContext.request.contextPath}/products/${dto.productId}'"
							         style="cursor: pointer;">
							        <img src="${pageContext.request.contextPath}${dto.thumbnailUrl}" alt="${altText}" />
							        
							        <!-- 구매불가 상품 오버레이 -->
							        <c:if test="${dto.isActive eq 'N'}">
							            <div class="sold-out-overlay">
							                <div class="sold-out-title">품절</div>
							            </div>
							        </c:if>
							    </div>
							    
							    <div class="item-info">
							        <h3 class="item-name">${dto.productName}</h3>
			                        <div class="item-option-quantity">
			                            <!-- Service에서 처리된 옵션 정보 사용 -->
			                            <c:if test="${not empty dto.optionInfo}">
			                                <p class="item-option">${dto.optionInfo}</p>
			                            </c:if>
								        <p class="item-quantity">${dto.quantity}개</p>
							        </div>
							        
							        <div class="item-details">
							            <!-- 옵션 선택 버튼 -->
							            <div class="option-select-container">
							                <button class="option-select-btn" 
							                        data-product-id="${dto.productId}"
							                        data-variant-id="${dto.productVariantId}"
							                        data-current-quantity="${dto.quantity}"
							                        ${dto.isActive eq 'N' ? 'disabled' : ''}>
							                    옵션 선택
							                </button>
							            </div>
							            
							            <div class="item-price">
										    <c:choose>
										        <c:when test="${dto.isDiscounted != null && dto.isDiscounted}">
										            <p class="original-price" data-unit-original-price="${dto.unitPrice}" data-total-original-price="${dto.totalPrice}">
										                <fmt:formatNumber value="${dto.totalPrice}" type="number" groupingUsed="true"/>원
										            </p>
										            <p class="current-price"
										               data-unit-price="${dto.finalUnitPrice}"
										               data-total-price="${dto.finalTotalPrice}"
										               data-discounted-price="${dto.finalUnitPrice}"> <%-- finalUnitPrice가 할인된 단가라면 이처럼 --%>
										                <span class="discount-price" style="font-weight: bold;">
										                    <fmt:formatNumber value="${dto.finalTotalPrice}" type="number" groupingUsed="true"/>원
										                </span>
										            </p>
										        </c:when>
										        <c:otherwise>
										            <p class="current-price"
										               data-unit-price="${dto.finalUnitPrice}"
										               data-total-price="${dto.finalTotalPrice}">
										                <span class="regular-price">
										                    <fmt:formatNumber value="${dto.finalTotalPrice}" type="number" groupingUsed="true"/>원
										                </span>
										            </p>
										        </c:otherwise>
										    </c:choose>
										</div>
							        </div>
							    </div>
							    
							    <div class="item-actions">
							        <button class="remove-item" data-variant-id="${dto.productVariantId}" 
							                data-user-id="${dto.userId}">×</button>
							    </div>
							</div>
							
						    <!-- 판매자 그룹 닫기 및 요약 표시 -->
						    <c:if test="${status.last or cartList[status.index + 1].businessName ne dto.businessName}">
						            <!-- 요약 정보는 seller-items 안쪽에! -->
						            <div class="seller-summary">
						                <div class="seller-total">
						                    <span class="label">상품금액</span>
						                    <span class="value seller-product-total">0원</span>
						                </div>
						                <div class="seller-shipping">
						                    <span class="label">배송비</span>
						                    <span class="value seller-shipping-cost">무료</span>
						                </div>
						            </div>
						            </div> <!-- seller-items 닫기 -->
						        </div> <!-- seller-group 닫기 -->
						    </c:if>
						</c:forEach>
					</c:when>
					<c:otherwise>
						<div class="empty-cart" id="empty-cart">
							<div class="empty-cart-content">
								<p>장바구니에 담긴 상품이 없습니다.</p>
								<a href="${pageContext.request.contextPath}/" class="go-shopping-btn">쇼핑하러 가기</a>
							</div>
						</div>
					</c:otherwise>
				</c:choose>
			</div>
		</div>
		<div class="cart-items-summary" id="cart-items-summary">
			<!-- 전체 주문 요약 섹션 -->
			<div class="total-summary">
				<div class="summary-row">
					<span class="summary-label">총 상품금액</span>
					<span class="summary-value total-product-amount">0원</span>
				</div>
				<div class="summary-row">
					<span class="summary-label">총 할인금액</span>
					<span class="summary-value total-discount-amount">-&nbsp;0원</span>
				</div>
				<div class="summary-row">
					<span class="summary-label">총 배송비</span>
					<span class="summary-value total-shipping-amount">0원</span>
				</div>
				<div class="summary-row total-row">
					<span class="summary-label">총 주문금액</span>
					<span class="summary-value final-total-amount">0원</span>
				</div>
			</div>
		</div>
	</main>
	
	<!-- 옵션 선택 모달 -->
	<div id="option-modal" class="modal">
		<div class="modal-content">
			<div class="modal-header">
				<h3>옵션 선택</h3>
				<span class="close">&times;</span>
			</div>
			<div class="modal-body">
				<div class="product-info">
					<div class="product-image">
						<img id="modal-product-image" src="" alt="">
					</div>
					<div class="product-details">
						<h4 id="modal-product-name"></h4>
						<span id="modal-product-variant"></span>
						<div class="product-price">
							<span id="modal-product-price"></span>
						</div>
					</div>
				</div>
				
				<div class="option-section">
					<h4>옵션 선택</h4>
					<div id="option-groups"></div>
				</div>
				
				<div class="modal-controll">
					<div class="modal-regular-price">
						<p id="modal-total-price">구매가</p>
						<span id="modal-regular-price">0원</span>
					</div>
					
					<div class="quantity-section">
						<div class="quantity-control">
							<button class="quantity-btn decrease">-</button>
							<input type="number" id="modal-quantity" value="1" min="1">
							<button class="quantity-btn increase">+</button>
						</div>
					</div>
				</div>
			</div>
			<div class="modal-footer">
				<button class="btn-confirm">확인</button>
			</div>
		</div>
	</div>
	
	<footer>
	    <div class="cart-summary">
	        <button class="checkout-btn" onclick="button">
	            <span class="final-price">0원</span>&nbsp;구매하기 (<span class="selected-count">0</span>개)
	        </button>
	    </div>
	</footer>

</body>

</html>