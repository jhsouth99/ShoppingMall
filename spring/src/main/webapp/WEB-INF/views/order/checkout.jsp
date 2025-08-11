<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions" %>
<%@ taglib prefix="sec" uri="http://www.springframework.org/security/tags" %>
<!DOCTYPE html>
<html lang="ko">
<head>
    <jsp:include page="/WEB-INF/views/common/meta.jsp" />
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>주문서 작성 - 이거어때</title>

    <!-- 외부 라이브러리 -->
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">

    <!-- 프로젝트 CSS -->
    <link rel="stylesheet" href="${pageContext.request.contextPath}/resources/css/common.css">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/resources/css/order-checkout.css">

    <!-- 다음 우편번호 API -->
    <script src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"></script>
</head>

<body>
<!-- 헤더 포함 -->
<%@ include file="/WEB-INF/views/common/header.jsp" %>

<!-- 메인 컨테이너 -->
<div class="container">
    <!-- 주문 진행 단계 표시 -->
    <div class="order-progress">
        <div class="progress-step active">
            <div class="step-number">1</div>
            <div class="step-text">주문서 작성</div>
        </div>
        <div class="progress-line"></div>
        <div class="progress-step">
            <div class="step-number">2</div>
            <div class="step-text">결제 완료</div>
        </div>
    </div>

    <!-- 주문서 폼 -->
    <form id="checkoutForm">
        <sec:csrfInput />

        <div class="checkout-container">
            <!-- 왼쪽: 주문 정보 -->
            <div class="checkout-main">
                <!-- 주문 상품 정보 -->
                <div class="section-card">
                    <h2 class="section-title">
                        <i class="fas fa-shopping-bag"></i>
                        주문 상품 정보
                        <c:choose>
                            <c:when test="${orderType == 'groupbuy'}">
                                <span class="order-type-badge groupbuy">공동구매</span>
                            </c:when>
                            <c:when test="${orderType == 'multi'}">
                                <span class="order-type-badge multi">다중 주문</span>
                            </c:when>
                            <c:otherwise>
                                <span class="order-type-badge single">단일 주문</span>
                            </c:otherwise>
                        </c:choose>
                    </h2>

                    <div class="order-items">
                        <c:choose>
                            <%-- 단일 상품 주문 --%>
                            <c:when test="${orderType != 'multi'}">
                                <div class="order-item">
                                    <div class="item-image">
                                        <img src="${pageContext.request.contextPath}${checkoutData.productImageUrl}" alt="${checkoutData.productName}">
                                    </div>
                                    <div class="item-info">
                                        <h3 class="item-name">${checkoutData.productName}</h3>
                                        <c:if test="${not empty checkoutData.optionCombination}">
                                            <div class="item-options">${checkoutData.optionCombination}</div>
                                        </c:if>
                                        <div class="item-price-info">
                                            <c:if test="${checkoutData.originalPrice != checkoutData.finalPrice}">
                                                <span class="original-price">
                                                    <fmt:formatNumber value="${checkoutData.originalPrice}" type="number" groupingUsed="true"/>원
                                                </span>
                                            </c:if>
                                            <span class="current-price">
                                                <fmt:formatNumber value="${checkoutData.finalPrice}" type="number" groupingUsed="true"/>원
                                            </span>
                                            <span class="item-quantity">× ${checkoutData.quantity}개</span>
                                        </div>
                                        <c:if test="${orderType == 'groupbuy'}">
                                            <div class="groupbuy-info">
                                                <div class="groupbuy-price">
                                                    공동구매 할인가: <span class="highlight">
                                                        <fmt:formatNumber value="${checkoutData.groupPrice * checkoutData.quantity}" type="number" groupingUsed="true"/>원
                                                    </span>
                                                </div>
                                                <div class="groupbuy-progress">
                                                    진행률: ${checkoutData.currentQuantity}/${checkoutData.targetQuantity} 참여
                                                </div>
                                            </div>
                                        </c:if>
                                    </div>
                                    <div class="item-total">
                                        <fmt:formatNumber value="${checkoutData.totalAmount}" type="number" groupingUsed="true"/>원
                                    </div>
                                </div>
                            </c:when>
                            <%-- 다중 상품 주문 --%>
                            <c:otherwise>
                                <c:forEach var="item" items="${checkoutData.items}">
                                    <div class="order-item">
                                        <div class="item-image">
                                            <img src="${item.productImageUrl}" alt="${item.productName}">
                                        </div>
                                        <div class="item-info">
                                            <h3 class="item-name">${item.productName}</h3>
                                            <c:if test="${not empty item.optionCombination}">
                                                <div class="item-options">${item.optionCombination}</div>
                                            </c:if>
                                            <div class="item-price-info">
                                                <span class="current-price">
                                                    <fmt:formatNumber value="${item.priceAtPurchase}" type="number" groupingUsed="true"/>원
                                                </span>
                                                <span class="item-quantity">× ${item.quantity}개</span>
                                            </div>
                                        </div>
                                        <div class="item-total">
                                            <fmt:formatNumber value="${item.totalPriceAtPurchase}" type="number" groupingUsed="true"/>원
                                        </div>
                                    </div>
                                </c:forEach>
                            </c:otherwise>
                        </c:choose>
                    </div>
                </div>

                <!-- 배송지 정보 -->
                <div class="section-card">
                    <h2 class="section-title">
                        <i class="fas fa-map-marker-alt"></i>
                        배송지 정보
                    </h2>

                    <!-- 배송지 선택 옵션 -->
                    <div class="address-selection">
                        <c:if test="${not empty shippingAddresses}">
                            <div class="address-type-options">
                                <label class="address-type-radio">
                                    <input type="radio" name="addressType" value="existing" checked>
                                    <span class="radio-label">기존 배송지 선택</span>
                                </label>
                                <label class="address-type-radio">
                                    <input type="radio" name="addressType" value="new">
                                    <span class="radio-label">새 배송지 입력</span>
                                </label>
                            </div>

                            <!-- 기존 배송지 목록 -->
                            <div id="existingAddresses" class="existing-addresses">
                                <c:forEach var="address" items="${shippingAddresses}" varStatus="status">
                                    <div class="address-item ${status.first ? 'selected' : ''}"
                                         onclick="selectAddress(${address.id})">
                                        <input type="radio" name="shippingAddressId" value="${address.id}"
                                               data-address-id="${address.id}" ${status.first ? 'checked' : ''}>
                                        <div class="address-info">
                                            <div class="address-name">
                                                    ${address.recipientName}
                                                <c:if test="${address.isDefault}">
                                                    <span class="default-badge">기본배송지</span>
                                                </c:if>
                                            </div>
                                            <div class="address-phone">${address.recipientPhone}</div>
                                            <div class="address-full">
                                                (${address.zipcode}) ${address.address} ${address.addressDetail}
                                            </div>
                                        </div>
                                    </div>
                                </c:forEach>
                            </div>
                        </c:if>

                        <!-- 새 배송지 입력 폼 -->
                        <div id="newAddressForm" class="new-address-form"
                             style="${not empty shippingAddresses ? 'display: none;' : ''}">
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="recipientName" class="required">받는 분</label>
                                    <input type="text" id="recipientName" name="recipientName"
                                           class="form-control" placeholder="받는 분 성함을 입력하세요"
                                           value="${checkoutData.recipientName}">
                                </div>
                                <div class="form-group">
                                    <label for="recipientPhone" class="required">연락처</label>
                                    <input type="tel" id="recipientPhone" name="recipientPhone"
                                           class="form-control" placeholder="010-1234-5678"
                                           value="${checkoutData.recipientPhone}">
                                </div>
                            </div>

                            <div class="form-row">
                                <div class="form-group zipcode-group">
                                    <label for="recipientZipcode" class="required">우편번호</label>
                                    <div class="zipcode-input-group">
                                        <input type="text" id="recipientZipcode" name="recipientZipcode"
                                               class="form-control" placeholder="우편번호" readonly
                                               value="${checkoutData.recipientZipcode}">
                                        <button type="button" class="btn btn-outline-primary" onclick="searchZipcode()">
                                            우편번호 찾기
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div class="form-group">
                                <label for="recipientAddress" class="required">주소</label>
                                <input type="text" id="recipientAddress" name="recipientAddress"
                                       class="form-control" placeholder="주소" readonly
                                       value="${checkoutData.recipientAddress}">
                            </div>

                            <div class="form-group">
                                <label for="recipientAddressDetail">상세주소</label>
                                <input type="text" id="recipientAddressDetail" name="recipientAddressDetail"
                                       class="form-control" placeholder="상세주소를 입력하세요"
                                       value="${checkoutData.recipientAddressDetail}">
                            </div>
                        </div>
                    </div>

                    <!-- 배송 요청사항 -->
                    <div class="delivery-request">
                        <label for="deliveryRequestType">배송 요청사항</label>
                        <select id="deliveryRequestType" name="recipientDelivReqType" class="form-control">
                            <option value="">배송 요청사항을 선택하세요</option>
                            <option value="FRONT_DOOR">집 앞에 놓아주세요</option>
                            <option value="SECURITY_OFFICE">경비실에 맡겨주세요</option>
                            <option value="CONTACT_BEFORE">배송 전 연락주세요</option>
                            <option value="DIRECT_HANDOVER">직접 받을게요</option>
                            <option value="CUSTOM">직접 입력</option>
                        </select>
                        <input type="text" id="customDeliveryRequest" name="recipientDelivReqMsg"
                               class="form-control" placeholder="배송 요청사항을 직접 입력하세요"
                               style="display: none; margin-top: 10px;"
                               value="${checkoutData.recipientDelivReqMsg}">
                    </div>
                </div>

                <!-- 쿠폰 할인 (공동구매가 아닌 경우) -->
                <c:if test="${orderType != 'groupbuy' and not empty availableCoupons}">
                    <div class="section-card">
                        <h2 class="section-title">
                            <i class="fas fa-ticket-alt"></i>
                            쿠폰 할인
                        </h2>

                        <div class="coupon-selection">
                            <select id="couponSelect" name="appliedCouponCode" class="form-control">
                                <option value="">쿠폰을 선택하세요</option>
                                <c:forEach var="coupon" items="${availableCoupons}">
                                    <option value="${coupon.couponCode}"
                                            data-discount-type="${coupon.discountType}"
                                            data-discount-value="${coupon.discountValue}"
                                            data-min-purchase="${coupon.minPurchaseAmount}">
                                            ${coupon.name}
                                        (<c:choose>
                                        <c:when test="${coupon.discountType == 'PERCENTAGE'}">
                                            ${coupon.discountValue}% 할인
                                        </c:when>
                                        <c:otherwise>
                                            <fmt:formatNumber value="${coupon.discountValue}" type="number" groupingUsed="true"/>원 할인
                                        </c:otherwise>
                                    </c:choose>)
                                        <c:if test="${coupon.minPurchaseAmount != null}">
                                            - <fmt:formatNumber value="${coupon.minPurchaseAmount}" type="number" groupingUsed="true"/>원 이상
                                        </c:if>
                                    </option>
                                </c:forEach>
                            </select>
                        </div>
                    </div>
                </c:if>

                <!-- 결제 방법 -->
                <div class="section-card">
                    <h2 class="section-title">
                        <i class="fas fa-credit-card"></i>
                        결제 방법
                    </h2>

                    <div class="payment-methods">
                        <label class="payment-method">
                            <input type="radio" name="paymentMethod" value="CREDIT_CARD" checked
                                   onchange="showPaymentForm('CREDIT_CARD')">
                            <div class="payment-option">
                                <i class="fas fa-credit-card"></i>
                                <span>신용/체크카드</span>
                                <div class="payment-desc">간편하고 안전한 카드 결제</div>
                            </div>
                        </label>

                        <label class="payment-method">
                            <input type="radio" name="paymentMethod" value="BANK_TRANSFER"
                                   onchange="showPaymentForm('BANK_TRANSFER')">
                            <div class="payment-option">
                                <i class="fas fa-university"></i>
                                <span>무통장입금</span>
                                <div class="payment-desc">계좌이체로 결제</div>
                            </div>
                        </label>

                        <label class="payment-method">
                            <input type="radio" name="paymentMethod" value="VIRTUAL_ACCOUNT"
                                   onchange="showPaymentForm('VIRTUAL_ACCOUNT')">
                            <div class="payment-option">
                                <i class="fas fa-money-check"></i>
                                <span>가상계좌</span>
                                <div class="payment-desc">발급된 계좌로 입금</div>
                            </div>
                        </label>

                        <label class="payment-method">
                            <input type="radio" name="paymentMethod" value="MOBILE_PAYMENT"
                                   onchange="showPaymentForm('MOBILE_PAYMENT')">
                            <div class="payment-option">
                                <i class="fas fa-mobile-alt"></i>
                                <span>휴대폰 결제</span>
                                <div class="payment-desc">휴대폰 소액결제</div>
                            </div>
                        </label>
                    </div>
                </div>

                <!-- 동의 사항 -->
                <div class="section-card">
                    <h2 class="section-title">
                        <i class="fas fa-check-circle"></i>
                        주문 동의
                    </h2>

                    <div class="agreements">
                        <div class="agreement-item">
                            <label>
                                <input type="checkbox" required>
                                <span class="checkmark"></span>
                                <span class="agreement-text">주문 상품정보 및 결제대행 서비스 이용약관에 동의합니다. (필수)</span>
                            </label>
                            <a href="#" class="agreement-link">보기</a>
                        </div>

                        <div class="agreement-item">
                            <label>
                                <input type="checkbox" required>
                                <span class="checkmark"></span>
                                <span class="agreement-text">개인정보 제3자 제공 동의 (필수)</span>
                            </label>
                            <a href="#" class="agreement-link">보기</a>
                        </div>

                        <c:if test="${orderType == 'groupbuy'}">
                            <div class="agreement-item">
                                <label>
                                    <input type="checkbox" required>
                                    <span class="checkmark"></span>
                                    <span class="agreement-text">공동구매 이용약관에 동의합니다. (필수)</span>
                                </label>
                                <a href="#" class="agreement-link">보기</a>
                            </div>
                        </c:if>

                        <div class="agreement-item">
                            <label>
                                <input type="checkbox">
                                <span class="checkmark"></span>
                                <span class="agreement-text">마케팅 정보 수신 동의 (선택)</span>
                            </label>
                            <a href="#" class="agreement-link">보기</a>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 오른쪽: 주문 요약 -->
            <div class="checkout-sidebar">
                <div class="order-summary">
                    <h3 class="summary-title">주문 요약</h3>

                    <div class="summary-content">
                        <!-- 상품 금액 -->
                        <div class="summary-row">
                            <span class="summary-label">상품금액</span>
                            <span class="summary-value" id="subtotalAmount">
                                <fmt:formatNumber value="${checkoutData.subTotalAmount}" type="number" groupingUsed="true"/>원
                            </span>
                        </div>

                        <!-- 할인 금액 -->
                        <c:if test="${checkoutData.promotionDiscountAmount > 0}">
                            <div class="summary-row discount">
                                <span class="summary-label">프로모션 할인</span>
                                <span class="summary-value discount-amount">
                                    -<fmt:formatNumber value="${checkoutData.promotionDiscountAmount}" type="number" groupingUsed="true"/>원
                                </span>
                            </div>
                        </c:if>

                        <!-- 쿠폰 할인 -->
                        <div class="summary-row discount" id="couponDiscountRow" style="display: none;">
                            <span class="summary-label">쿠폰 할인</span>
                            <span class="summary-value discount-amount" id="couponDiscount">-0원</span>
                        </div>

                        <!-- 배송비 -->
                        <div class="summary-row">
                            <span class="summary-label">배송비</span>
                            <span class="summary-value" id="shippingFee">
                                <c:choose>
                                    <c:when test="${checkoutData.shippingFee == 0}">무료</c:when>
                                    <c:otherwise>
                                        <fmt:formatNumber value="${checkoutData.shippingFee}" type="number" groupingUsed="true"/>원
                                    </c:otherwise>
                                </c:choose>
                            </span>
                        </div>

                        <%--<div class="summary-divider"></div>--%>

                        <!-- 최종 결제 금액 -->
                        <div class="summary-row total">
                            <span class="summary-label">최종 결제금액</span>
                            <span class="summary-value total-amount" id="totalAmount">
                                <fmt:formatNumber value="${checkoutData.finalAmount}" type="number" groupingUsed="true"/>원
                            </span>
                        </div>

                        <%--<!-- 적립금 정보 -->
                        <div class="summary-info">
                            <i class="fas fa-info-circle"></i>
                            결제 완료 시 <span class="highlight">
                                <fmt:formatNumber value="${checkoutData.finalAmount * 0.01}" pattern="#,##0"/>원
                            </span> 적립예정
                        </div>--%>
                    </div>

                    <!-- 주문하기 버튼 (결제 모달 열기) -->
                    <button type="button" id="orderButton" class="order-button" disabled onclick="openPaymentModalFromOrder()">
                        <span id="orderButtonText">
                            <c:choose>
                                <c:when test="${orderType == 'groupbuy'}">
                                    <fmt:formatNumber value="${checkoutData.finalAmount}" type="number" groupingUsed="true"/>원 공동구매 참여하기
                                </c:when>
                                <c:otherwise>
                                    <fmt:formatNumber value="${checkoutData.finalAmount}" type="number" groupingUsed="true"/>원 주문하기
                                </c:otherwise>
                            </c:choose>
                        </span>
                    </button>

                    <!-- 보안 정보 -->
                    <div class="security-info">
                        <i class="fas fa-shield-alt"></i>
                        <span>안전한 결제가 보장됩니다</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- 숨겨진 입력 필드들 -->
        <input type="hidden" id="shippingAddressIdInput" name="shippingAddressId" value="">
        <input type="hidden" id="finalAmountInput" name="finalAmount" value="${checkoutData.finalAmount}">
    </form>
</div>

<!-- 결제 모달 포함 -->
<div id="paymentModal" class="payment-modal" style="display: none;">
    <div class="modal-overlay" onclick="closePaymentModal()"></div>
    <div class="modal-container">
        <div class="modal-header">
            <h2 class="modal-title">결제하기</h2>
            <button class="modal-close" onclick="closePaymentModal()">
                <i class="fas fa-times"></i>
            </button>
        </div>

        <div class="modal-body">
            <!-- 주문 요약 -->
            <div class="payment-summary">
                <h3>주문 요약</h3>
                <div class="summary-content">
                    <div class="summary-row">
                        <span>상품금액</span>
                        <span id="modalSubtotal">0원</span>
                    </div>
                    <div class="summary-row">
                        <span>배송비</span>
                        <span id="modalShippingFee">0원</span>
                    </div>
                    <div class="summary-row discount" id="modalCouponRow" style="display: none;">
                        <span>쿠폰 할인</span>
                        <span id="modalCouponDiscount">-0원</span>
                    </div>
                    <div class="summary-divider"></div>
                    <div class="summary-row total">
                        <span>최종 결제금액</span>
                        <span id="modalFinalAmount" class="final-amount">0원</span>
                    </div>
                </div>
            </div>

            <!-- 결제 방법별 입력 폼 -->
            <div class="payment-forms">
                <!-- 신용카드 결제 -->
                <div id="creditCardForm" class="payment-form active">
                    <h4><i class="fas fa-credit-card"></i> 신용카드 정보</h4>

                    <div class="form-group">
                        <label for="cardNumber">카드번호</label>
                        <input type="text" id="cardNumber" placeholder="1234 5678 9012 3456"
                               maxlength="19" oninput="formatCardNumber(this)" required>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="expiryDate">유효기간</label>
                            <input type="text" id="expiryDate" placeholder="MM/YY"
                                   maxlength="5" oninput="formatExpiryDate(this)" required>
                        </div>
                        <div class="form-group">
                            <label for="cvv">CVC</label>
                            <input type="password" id="cvv" placeholder="123"
                                   maxlength="4" oninput="this.value = this.value.replace(/[^0-9]/g, '')" required>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="cardholderName">카드소유자명</label>
                        <input type="text" id="cardholderName" placeholder="홍길동" required>
                    </div>

                    <div class="form-group">
                        <label for="cardPassword">카드비밀번호 앞 2자리</label>
                        <input type="password" id="cardPassword" placeholder="**"
                               maxlength="2" oninput="this.value = this.value.replace(/[^0-9]/g, '')" required>
                    </div>
                </div>

                <!-- 계좌이체 -->
                <div id="bankTransferForm" class="payment-form">
                    <h4><i class="fas fa-university"></i> 계좌이체 정보</h4>

                    <div class="form-group">
                        <label for="bankName">은행 선택</label>
                        <select id="bankName" required>
                            <option value="">은행을 선택하세요</option>
                            <option value="KB">KB국민은행</option>
                            <option value="SHINHAN">신한은행</option>
                            <option value="WOORI">우리은행</option>
                            <option value="HANA">하나은행</option>
                            <option value="NH">농협은행</option>
                            <option value="IBK">기업은행</option>
                            <option value="SC">SC제일은행</option>
                            <option value="CITI">씨티은행</option>
                            <option value="KAKAO">카카오뱅크</option>
                            <option value="TOSS">토스뱅크</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="accountNumber">계좌번호</label>
                        <input type="text" id="accountNumber" placeholder="계좌번호를 입력하세요"
                               oninput="this.value = this.value.replace(/[^0-9-]/g, '')" required>
                    </div>

                    <div class="form-group">
                        <label for="accountHolder">예금주</label>
                        <input type="text" id="accountHolder" placeholder="예금주명을 입력하세요" required>
                    </div>

                    <div class="form-group">
                        <label for="accountPassword">계좌비밀번호</label>
                        <input type="password" id="accountPassword" placeholder="계좌비밀번호를 입력하세요" required>
                    </div>
                </div>

                <!-- 가상계좌 -->
                <div id="virtualAccountForm" class="payment-form">
                    <h4><i class="fas fa-money-check"></i> 가상계좌 발급</h4>

                    <div class="virtual-account-info">
                        <div class="info-card">
                            <i class="fas fa-info-circle"></i>
                            <div>
                                <h5>가상계좌 안내</h5>
                                <p>결제 완료 후 전용 가상계좌가 발급됩니다.<br>
                                    발급된 계좌로 입금하시면 주문이 완료됩니다.</p>
                            </div>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="depositorName">입금자명</label>
                        <input type="text" id="depositorName" placeholder="입금자명을 입력하세요" required>
                    </div>
                </div>

                <!-- 휴대폰 결제 -->
                <div id="mobilePaymentForm" class="payment-form">
                    <h4><i class="fas fa-mobile-alt"></i> 휴대폰 결제</h4>

                    <div class="form-group">
                        <label for="mobileCarrier">통신사</label>
                        <select id="mobileCarrier" required>
                            <option value="">통신사를 선택하세요</option>
                            <option value="SKT">SKT</option>
                            <option value="KT">KT</option>
                            <option value="LGU+">LG U+</option>
                            <option value="SKT_MVNO">SKT 알뜰폰</option>
                            <option value="KT_MVNO">KT 알뜰폰</option>
                            <option value="LGU_MVNO">LG U+ 알뜰폰</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="mobileNumber">휴대폰번호</label>
                        <input type="tel" id="mobileNumber" placeholder="010-1234-5678"
                               oninput="formatPhoneNumber(this)" required>
                    </div>

                    <div class="form-group">
                        <label for="mobileOwnerName">명의자명</label>
                        <input type="text" id="mobileOwnerName" placeholder="명의자명을 입력하세요" required>
                    </div>

                    <div class="form-group">
                        <label for="mobileBirthdate">생년월일 6자리</label>
                        <input type="text" id="mobileBirthdate" placeholder="YYMMDD"
                               maxlength="6" oninput="this.value = this.value.replace(/[^0-9]/g, '')" required>
                    </div>
                </div>
            </div>
        </div>

        <div class="modal-footer">
            <button type="button" class="btn-cancel" onclick="closePaymentModal()">취소</button>
            <button type="button" class="btn-pay" onclick="processPayment()">
                <span id="payButtonText">결제하기</span>
                <div id="payButtonLoader" class="button-loader" style="display: none;">
                    <i class="fas fa-spinner fa-spin"></i>
                </div>
            </button>
        </div>
    </div>
</div>

<!-- 푸터 포함 -->
<%@ include file="/WEB-INF/views/common/footer.jsp" %>

<!-- JavaScript -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js"></script>
<script src="${pageContext.request.contextPath}/resources/js/order.js"></script>

<!-- 결제 모달 JavaScript -->
<script>
    let selectedPaymentMethod = 'CREDIT_CARD';
    let finalOrderData = {};

    // 주문서에서 결제 모달 열기
    function openPaymentModalFromOrder() {
        // 주문서 유효성 검사
        if (!validateCheckoutForm()) {
            return;
        }

        // 주문 데이터 수집
        const orderData = collectOrderData();

        // 결제 모달 열기
        openPaymentModal(orderData);
    }

    // 주문서 유효성 검사
    function validateCheckoutForm() {
        // 배송지 정보 검증
        const addressType = $('input[name="addressType"]:checked').val();

        if (addressType === 'existing') {
            const selectedAddress = $('.address-item.selected');
            if (selectedAddress.length === 0) {
                alert('배송지를 선택해주세요.');
                return false;
            }
        } else {
            const requiredFields = ['recipientName', 'recipientPhone', 'recipientZipcode', 'recipientAddress'];
            for (const fieldId of requiredFields) {
                const field = $('#' + fieldId);
                if (!field.val() || field.val().trim() === '') {
                    alert('배송지 정보를 모두 입력해주세요.');
                    field.focus();
                    return false;
                }
            }

            // 전화번호 형식 검증
            const phone = $('#recipientPhone').val();
            const phonePattern = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;
            if (!phonePattern.test(phone)) {
                alert('올바른 전화번호 형식을 입력해주세요.');
                $('#recipientPhone').focus();
                return false;
            }
        }

        // 필수 동의 체크박스 검증
        const requiredAgreements = $('.agreements input[type="checkbox"][required]');
        for (let i = 0; i < requiredAgreements.length; i++) {
            if (!$(requiredAgreements[i]).is(':checked')) {
                alert('필수 약관에 동의해주세요.');
                return false;
            }
        }

        return true;
    }

    // 주문 데이터 수집
    function collectOrderData() {
        const addressType = $('input[name="addressType"]:checked').val();

        const orderData = {
            orderType: '${orderType}',
            subTotalAmount: ${checkoutData.subTotalAmount},
            shippingFee: ${checkoutData.shippingFee},
            finalAmount: parseInt($('#finalAmountInput').val()),
            couponDiscount: 0,

            // 배송지 정보
            addressType: addressType,
            recipientName: '',
            recipientPhone: '',
            recipientAddress: '',
            recipientAddressDetail: '',
            recipientZipcode: '',
            recipientDelivReqType: $('#deliveryRequestType').val(),
            recipientDelivReqMsg: $('#customDeliveryRequest').val(),

            // 쿠폰 정보
            appliedCouponCode: $('#couponSelect').val()
        };

        // 배송지 정보 설정
        if (addressType === 'existing') {
            const selectedAddress = $('.address-item.selected');
            const addressData = selectedAddress.find('.address-info');
            orderData.shippingAddressId = selectedAddress.find('input[type="radio"]').data('address-id');
            orderData.recipientName = addressData.find('.address-name').text().trim().split('\n')[0];
            orderData.recipientPhone = addressData.find('.address-phone').text().trim();

            const fullAddress = addressData.find('.address-full').text().trim();
            const matches = fullAddress.match(/\((\d+)\)\s*(.+)/);
            if (matches) {
                orderData.recipientZipcode = matches[1];
                orderData.recipientAddress = matches[2];
            }
        } else {
            orderData.recipientName = $('#recipientName').val();
            orderData.recipientPhone = $('#recipientPhone').val();
            orderData.recipientAddress = $('#recipientAddress').val();
            orderData.recipientAddressDetail = $('#recipientAddressDetail').val();
            orderData.recipientZipcode = $('#recipientZipcode').val();
        }

        // 쿠폰 할인 금액 계산
        const couponDiscountText = $('#couponDiscount').text();
        if (couponDiscountText && couponDiscountText !== '-0원') {
            orderData.couponDiscount = parseInt(couponDiscountText.replace(/[^0-9]/g, ''));
        }

        return orderData;
    }

    // 결제 모달 열기
    function openPaymentModal(orderData) {
        finalOrderData = orderData;

        // 주문 요약 정보 업데이트
        document.getElementById('modalSubtotal').textContent =
            new Intl.NumberFormat('ko-KR').format(orderData.subTotalAmount) + '원';
        document.getElementById('modalShippingFee').textContent =
            orderData.shippingFee === 0 ? '무료' : new Intl.NumberFormat('ko-KR').format(orderData.shippingFee) + '원';
        document.getElementById('modalFinalAmount').textContent =
            new Intl.NumberFormat('ko-KR').format(orderData.finalAmount) + '원';

        // 쿠폰 할인이 있다면 표시
        if (orderData.couponDiscount && orderData.couponDiscount > 0) {
            document.getElementById('modalCouponRow').style.display = 'flex';
            document.getElementById('modalCouponDiscount').textContent =
                '-' + new Intl.NumberFormat('ko-KR').format(orderData.couponDiscount) + '원';
        }

        // 선택된 결제 방법에 따른 폼 표시
        const selectedMethod = $('input[name="paymentMethod"]:checked').val();
        showPaymentForm(selectedMethod);

        // 모달 표시
        document.getElementById('paymentModal').style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    // 결제 모달 닫기
    function closePaymentModal() {
        document.getElementById('paymentModal').style.display = 'none';
        document.body.style.overflow = '';
        resetPaymentForms();
    }

    // 결제 방법에 따른 폼 표시
    function showPaymentForm(paymentMethod) {
        selectedPaymentMethod = paymentMethod;

        // 모든 폼 숨김
        document.querySelectorAll('.payment-form').forEach(form => {
            form.classList.remove('active');
        });

        // 선택된 결제 방법 폼 표시
        const formMap = {
            'CREDIT_CARD': 'creditCardForm',
            'BANK_TRANSFER': 'bankTransferForm',
            'VIRTUAL_ACCOUNT': 'virtualAccountForm',
            'MOBILE_PAYMENT': 'mobilePaymentForm'
        };

        const formId = formMap[paymentMethod];
        if (formId) {
            document.getElementById(formId).classList.add('active');
        }

        updatePayButtonText();
    }

    // 결제 버튼 텍스트 업데이트
    function updatePayButtonText() {
        const amount = finalOrderData.finalAmount || 0;
        const formattedAmount = new Intl.NumberFormat('ko-KR').format(amount);

        const buttonTexts = {
            'CREDIT_CARD': formattedAmount + '원 카드결제',
            'BANK_TRANSFER': formattedAmount + '원 계좌이체',
            'VIRTUAL_ACCOUNT': formattedAmount + '원 가상계좌 발급',
            'MOBILE_PAYMENT': formattedAmount + '원 휴대폰결제'
        };

        document.getElementById('payButtonText').textContent =
            buttonTexts[selectedPaymentMethod] || (formattedAmount + '원 결제하기');
    }

    // 결제 폼 초기화
    function resetPaymentForms() {
        document.querySelectorAll('.payment-form input, .payment-form select').forEach(input => {
            input.value = '';
            input.classList.remove('error');
        });
    }

    // 입력 포맷팅 함수들
    function formatCardNumber(input) {
        let value = input.value.replace(/\s/g, '').replace(/[^0-9]/gi, '');
        let formattedValue = value.match(/.{1,4}/g)?.join(' ');
        if (formattedValue !== undefined) {
            input.value = formattedValue;
        }
    }

    function formatExpiryDate(input) {
        let value = input.value.replace(/\D/g, '');
        if (value.length >= 2) {
            value = value.substring(0, 2) + '/' + value.substring(2, 4);
        }
        input.value = value;
    }

    function formatPhoneNumber(input) {
        let value = input.value.replace(/[^0-9]/g, '');
        if (value.length <= 3) {
            input.value = value;
        } else if (value.length <= 7) {
            input.value = value.substring(0, 3) + '-' + value.substring(3);
        } else {
            input.value = value.substring(0, 3) + '-' + value.substring(3, 7) + '-' + value.substring(7, 11);
        }
    }

    // 결제 처리
    function processPayment() {
        if (!validatePaymentInfo()) {
            return;
        }

        // 로딩 상태로 변경
        const payButton = document.querySelector('.btn-pay');
        const payButtonText = document.getElementById('payButtonText');
        const payButtonLoader = document.getElementById('payButtonLoader');

        payButton.disabled = true;
        payButtonText.style.display = 'none';
        payButtonLoader.style.display = 'block';

        // 결제 데이터 준비
        const paymentData = {
            ...finalOrderData,
            paymentMethod: selectedPaymentMethod,
            paymentInfo: getPaymentInfo()
        };

        // 서버로 결제 요청
        $.ajax({
            url: '${pageContext.request.contextPath}/order/execute',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                '${_csrf.headerName}': '${_csrf.token}'
            },
            data: JSON.stringify(paymentData),
            success: function(response) {
                if (response.success) {
                    // 결제 성공 시 완료 페이지로 이동
                    window.location.href = '${pageContext.request.contextPath}/order/complete/' + response.orderNo;
                } else {
                    throw new Error(response.message || '결제에 실패했습니다.');
                }
            },
            error: function(xhr, status, error) {
                let errorMessage = '결제 처리 중 오류가 발생했습니다.';

                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMessage = xhr.responseJSON.message;
                } else if (xhr.responseText) {
                    try {
                        const errorResponse = JSON.parse(xhr.responseText);
                        errorMessage = errorResponse.message || errorMessage;
                    } catch (e) {
                        // JSON 파싱 실패 시 기본 메시지 사용
                    }
                }

                alert(errorMessage);

                // 로딩 상태 해제
                payButton.disabled = false;
                payButtonText.style.display = 'block';
                payButtonLoader.style.display = 'none';
            }
        });
    }

    // 결제 정보 검증
    function validatePaymentInfo() {
        const form = document.querySelector('.payment-form.active');
        const inputs = form.querySelectorAll('input[required], select[required]');
        let isValid = true;

        inputs.forEach(input => {
            input.classList.remove('error');
            if (!input.value.trim()) {
                input.classList.add('error');
                isValid = false;
            }
        });

        // 결제 방법별 추가 검증
        if (selectedPaymentMethod === 'CREDIT_CARD') {
            isValid = validateCardInfo() && isValid;
        } else if (selectedPaymentMethod === 'MOBILE_PAYMENT') {
            isValid = validateMobileInfo() && isValid;
        }

        if (!isValid) {
            alert('필수 정보를 모두 입력해주세요.');
        }

        return isValid;
    }

    // 카드 정보 검증
    function validateCardInfo() {
        const cardNumber = document.getElementById('cardNumber').value.replace(/\s/g, '');
        const expiryDate = document.getElementById('expiryDate').value;
        const cvv = document.getElementById('cvv').value;

        if (cardNumber.length < 15 || cardNumber.length > 16) {
            document.getElementById('cardNumber').classList.add('error');
            return false;
        }

        if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
            document.getElementById('expiryDate').classList.add('error');
            return false;
        }

        if (cvv.length < 3 || cvv.length > 4) {
            document.getElementById('cvv').classList.add('error');
            return false;
        }

        return true;
    }

    // 휴대폰 정보 검증
    function validateMobileInfo() {
        const mobileNumber = document.getElementById('mobileNumber').value.replace(/[^0-9]/g, '');
        const birthdate = document.getElementById('mobileBirthdate').value;

        if (mobileNumber.length !== 11 || !mobileNumber.startsWith('010')) {
            document.getElementById('mobileNumber').classList.add('error');
            return false;
        }

        if (birthdate.length !== 6) {
            document.getElementById('mobileBirthdate').classList.add('error');
            return false;
        }

        return true;
    }

    // 결제 정보 수집
    function getPaymentInfo() {
        const info = {};

        switch (selectedPaymentMethod) {
            case 'CREDIT_CARD':
                info.cardNumber = document.getElementById('cardNumber').value;
                info.expiryDate = document.getElementById('expiryDate').value;
                info.cvv = document.getElementById('cvv').value;
                info.cardholderName = document.getElementById('cardholderName').value;
                info.cardPassword = document.getElementById('cardPassword').value;
                break;

            case 'BANK_TRANSFER':
                info.bankName = document.getElementById('bankName').value;
                info.accountNumber = document.getElementById('accountNumber').value;
                info.accountHolder = document.getElementById('accountHolder').value;
                info.accountPassword = document.getElementById('accountPassword').value;
                break;

            case 'VIRTUAL_ACCOUNT':
                info.depositorName = document.getElementById('depositorName').value;
                break;

            case 'MOBILE_PAYMENT':
                info.carrier = document.getElementById('mobileCarrier').value;
                info.mobileNumber = document.getElementById('mobileNumber').value;
                info.ownerName = document.getElementById('mobileOwnerName').value;
                info.birthdate = document.getElementById('mobileBirthdate').value;
                break;
        }

        return info;
    }
</script>

<!-- 페이지 데이터 전달 -->
<script>
    // 서버에서 전달받은 데이터를 JavaScript 변수로 설정
    window.orderData = {
        contextPath: '${pageContext.request.contextPath}',
        orderType: '${orderType}',
        productAmount: ${checkoutData.subTotalAmount},
        shippingFee: ${checkoutData.shippingFee},
        finalAmount: ${checkoutData.finalAmount},
        hasPromotionDiscount: ${checkoutData.promotionDiscountAmount > 0},
        promotionDiscount: ${checkoutData.promotionDiscountAmount}
    };

    <c:if test="${orderType == 'multi'}">
    window.multiOrderData = {
        contextPath: '${pageContext.request.contextPath}',
        orderType: 'multi',
        subTotalAmount: ${checkoutData.subTotalAmount},
        shippingFee: ${checkoutData.shippingFee},
        finalAmount: ${checkoutData.finalAmount},
        itemCount: ${fn:length(checkoutData.items)}
    };
    </c:if>

    <c:if test="${orderType == 'groupbuy'}">
    window.groupBuyOrderData = {
        contextPath: '${pageContext.request.contextPath}',
        orderType: 'groupbuy',
        groupBuyId: ${checkoutData.groupBuyId},
        totalAmount: ${checkoutData.finalAmount},
        groupPrice: ${checkoutData.groupPrice},
        currentQuantity: ${checkoutData.currentQuantity},
        targetQuantity: ${checkoutData.targetQuantity}
    };
    </c:if>
</script>

<!-- 결제 모달 CSS 추가 -->
<style>
    /* 결제 모달 스타일 */
    .payment-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .modal-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(4px);
    }

    .modal-container {
        position: relative;
        background: white;
        border-radius: 16px;
        width: 90%;
        max-width: 600px;
        overflow: hidden;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        animation: modalSlideIn 0.3s ease-out;
    }

    @keyframes modalSlideIn {
        from {
            transform: translateY(-30px);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }

    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 25px 30px;
        border-bottom: 1px solid #eee;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
    }

    .modal-title {
        font-size: 20px;
        font-weight: 700;
        margin: 0;
    }

    .modal-close {
        background: none;
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        padding: 5px;
        border-radius: 50%;
        transition: background-color 0.3s ease;
    }

    .modal-close:hover {
        background-color: rgba(255, 255, 255, 0.2);
    }

    .modal-body {
        padding: 30px;
        max-height: calc(90vh - 140px);
        overflow-y: auto;
    }

    /* 주문 요약 스타일 */
    .payment-summary {
        background: linear-gradient(135deg, #f8f9ff 0%, #f0f2ff 100%);
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 30px;
        border: 1px solid #e0e7ff;
    }

    .payment-summary h3 {
        margin: 0 0 15px 0;
        font-size: 16px;
        font-weight: 600;
        color: #374151;
    }

    .summary-content {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .summary-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 14px;
        color: #6b7280;
    }

    .summary-row.discount {
        color: #dc2626;
    }

    .summary-row.total {
        font-size: 16px;
        font-weight: 700;
        color: #111827;
        padding-top: 12px;
        border-top: 1px solid #d1d5db;
    }

    .final-amount {
        color: #dc2626;
    }

    .summary-divider {
        height: 1px;
        background-color: #d1d5db;
        margin: 8px 0;
    }

    /* 결제 폼 스타일 */
    .payment-forms h4 {
        display: flex;
        align-items: center;
        gap: 10px;
        margin: 0 0 20px 0;
        font-size: 16px;
        font-weight: 600;
        color: #374151;
    }

    .payment-forms h4 i {
        color: #667eea;
    }

    .payment-form {
        display: none;
    }

    .payment-form.active {
        display: block;
    }

    .payment-form .form-group {
        margin-bottom: 20px;
    }

    .payment-form .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 15px;
    }

    .payment-form .form-group label {
        display: block;
        margin-bottom: 8px;
        font-size: 14px;
        font-weight: 500;
        color: #374151;
    }

    .payment-form .form-group input,
    .payment-form .form-group select {
        width: 100%;
        padding: 12px 16px;
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        font-size: 14px;
        transition: all 0.3s ease;
        box-sizing: border-box;
    }

    .payment-form .form-group input:focus,
    .payment-form .form-group select:focus {
        outline: none;
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .payment-form .form-group input.error {
        border-color: #dc2626;
        box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
    }

    /* 가상계좌 안내 */
    .virtual-account-info {
        margin-bottom: 20px;
    }

    .info-card {
        display: flex;
        align-items: flex-start;
        gap: 15px;
        padding: 20px;
        background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
        border-radius: 10px;
        border-left: 4px solid #f59e0b;
    }

    .info-card i {
        color: #f59e0b;
        font-size: 20px;
        margin-top: 2px;
    }

    .info-card h5 {
        margin: 0 0 5px 0;
        font-size: 14px;
        font-weight: 600;
        color: #92400e;
    }

    .info-card p {
        margin: 0;
        font-size: 13px;
        line-height: 1.5;
        color: #92400e;
    }

    /* 모달 푸터 */
    .modal-footer {
        display: flex;
        gap: 15px;
        padding: 25px 30px;
        border-top: 1px solid #e5e7eb;
        background-color: #f9fafb;
    }

    .btn-cancel {
        flex: 1;
        padding: 14px 20px;
        background-color: #6b7280;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
    }

    .btn-cancel:hover {
        background-color: #4b5563;
        transform: translateY(-1px);
    }

    .btn-pay {
        flex: 2;
        padding: 14px 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
    }

    .btn-pay:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
    }

    .btn-pay:disabled {
        background: #9ca3af;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
    }

    .button-loader {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    }

    /* 반응형 디자인 */
    @media (max-width: 768px) {
        .modal-container {
            width: 95%;
            margin: 10px;
        }

        .modal-header,
        .modal-body,
        .modal-footer {
            padding: 20px;
        }

        .payment-form .form-row {
            grid-template-columns: 1fr;
            gap: 10px;
        }

        .modal-footer {
            flex-direction: column;
        }

        .btn-cancel,
        .btn-pay {
            flex: none;
        }
    }
</style>
</body>
</html>