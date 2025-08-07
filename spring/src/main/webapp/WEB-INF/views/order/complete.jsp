<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions" %>
<%@ taglib prefix="spring" uri="http://www.springframework.org/tags" %>
<!DOCTYPE html>
<html lang="ko">
<head>
  <jsp:include page="/WEB-INF/views/common/meta.jsp" />
  <title>주문 완료 - 이거어때</title>
  <link rel="stylesheet" href="${pageContext.request.contextPath}/resources/css/order.css">
  <style>
    /* 결제 요약 섹션 */
    .payment-summary {
      background-color: var(--bg-secondary);
      padding: 15px;
      border-radius: 8px;
      margin-top: 20px;
    }

    .payment-summary .info-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid var(--border-color);
    }

    .payment-summary .info-row:last-child {
      border-bottom: none;
    }
  </style>
</head>

<body>
<!-- 헤더 포함 -->
<%@ include file="/WEB-INF/views/common/header.jsp" %>

<div class="container">
  <!-- 주문 진행 단계 표시 -->
  <div class="order-progress">
    <div class="progress-step">
      <div class="step-number">1</div>
      <div class="step-text">주문서 작성</div>
    </div>
    <div class="progress-line"></div>
    <div class="progress-step active">
      <div class="step-number">2</div>
      <div class="step-text">결제 완료</div>
    </div>
  </div>
  <div class="order-complete-container">
    <!-- 완료 메시지 -->
    <div class="completion-header">
      <div class="success-icon">
        <i class="fas fa-check-circle"></i>
      </div>
      <h1 class="completion-title">
        <c:choose>
          <c:when test="${orderType == 'groupbuy'}">공동구매 참여 완료!</c:when>
          <c:when test="${orderType == 'multi'}">주문 완료!</c:when>
          <c:otherwise>주문 완료!</c:otherwise>
        </c:choose>
      </h1>
      <p class="completion-message">
        <c:choose>
          <c:when test="${orderType == 'groupbuy'}">
            공동구매에 성공적으로 참여하셨습니다.<br>
            목표 달성 시 자동으로 주문이 진행됩니다.
          </c:when>
          <c:when test="${orderType == 'multi'}">
            선택하신 ${completeData.totalItemCount}개 상품의 주문이 완료되었습니다.<br>
            빠른 시일 내에 배송해드리겠습니다.
          </c:when>
          <c:otherwise>
            주문이 성공적으로 완료되었습니다.<br>
            빠른 시일 내에 배송해드리겠습니다.
          </c:otherwise>
        </c:choose>
      </p>
    </div>

    <!-- 단일 주문 완료 정보 -->
    <c:if test="${orderType == 'single'}">
      <div class="order-info-section">
        <h2>주문 정보</h2>
        <div class="order-summary-card">
          <div class="order-header">
            <div class="order-number">
              <strong>주문번호: ${completeData.orderNo}</strong>
            </div>
            <div class="order-date">
              <spring:eval expression="completeData.createdAt.format(T(java.time.format.DateTimeFormatter).ofPattern('yyyy.MM.dd HH:mm'))" />
            </div>
          </div>

          <div class="product-info">
            <div class="product-image">
              <img src="${completeData.productImageUrl}" alt="${completeData.productName}">
            </div>
            <div class="product-details">
              <h3 class="product-name">${completeData.productName}</h3>
              <div class="quantity-price">
                <span class="quantity">수량: ${completeData.quantity}개</span>
                <span class="total-price">
                  <fmt:formatNumber value="${completeData.subTotalAmount}" type="number" groupingUsed="true"/>원
                </span>
              </div>
            </div>
          </div>

          <div class="payment-summary">
            <div class="info-row">
              <span class="label">상품 금액</span>
              <span class="value">
                <fmt:formatNumber value="${completeData.subTotalAmount}" type="number" groupingUsed="true"/>원
              </span>
            </div>
            <div class="info-row">
              <span class="label">배송비</span>
              <span class="value">
                <c:choose>
                  <c:when test="${completeData.shippingFee == 0}">무료배송</c:when>
                  <c:otherwise>
                    <fmt:formatNumber value="${completeData.shippingFee}" type="number" groupingUsed="true"/>원
                  </c:otherwise>
                </c:choose>
              </span>
            </div>
            <c:if test="${completeData.totalDiscountAmount > 0}">
              <div class="info-row">
                <span class="label">할인 금액</span>
                <span class="value" style="color: #e74c3c;">
                  -<fmt:formatNumber value="${completeData.totalDiscountAmount}" type="number" groupingUsed="true"/>원
                </span>
              </div>
            </c:if>
            <div class="info-row" style="border-top: 2px solid #ddd; padding-top: 10px; margin-top: 10px; font-weight: 700;">
              <span class="label">최종 결제 금액</span>
              <span class="value" style="color: #e74c3c; font-size: 18px;">
                <fmt:formatNumber value="${completeData.finalAmount}" type="number" groupingUsed="true"/>원
              </span>
            </div>
          </div>

          <div class="delivery-info">
            <div class="info-row">
              <span class="label">받는 분</span>
              <span class="value">${completeData.recipientName}</span>
            </div>
            <div class="info-row">
              <span class="label">배송지</span>
              <span class="value">${completeData.recipientAddress}</span>
            </div>
            <div class="info-row">
              <span class="label">배송비</span>
              <span class="value">
                <c:choose>
                  <c:when test="${completeData.shippingFee == 0}">무료배송</c:when>
                  <c:otherwise>
                    <fmt:formatNumber value="${completeData.shippingFee}" type="number" groupingUsed="true"/>원
                  </c:otherwise>
                </c:choose>
              </span>
            </div>
            <div class="info-row">
              <span class="label">결제 방법</span>
              <span class="value">
                <c:choose>
                  <c:when test="${completeData.paymentMethod == 'CREDIT_CARD'}">신용카드</c:when>
                  <c:when test="${completeData.paymentMethod == 'BANK_TRANSFER'}">계좌이체</c:when>
                  <c:when test="${completeData.paymentMethod == 'VIRTUAL_ACCOUNT'}">가상계좌</c:when>
                  <c:when test="${completeData.paymentMethod == 'MOBILE_PAYMENT'}">휴대폰 결제</c:when>
                  <c:otherwise>${completeData.paymentMethod}</c:otherwise>
                </c:choose>
              </span>
            </div>
          </div>
        </div>
      </div>
    </c:if>

    <!-- 공동구매 완료 정보 -->
    <c:if test="${orderType == 'groupbuy'}">
      <div class="order-info-section">
        <h2>공동구매 정보</h2>
        <div class="groupbuy-summary-card">
          <div class="groupbuy-header">
            <div class="groupbuy-name">
              <strong>${completeData.groupBuyName}</strong>
            </div>
            <div class="groupbuy-status">
              <span class="status-badge active">${groupBuyData.status}</span>
            </div>
          </div>

          <div class="product-info">
            <div class="product-image">
              <img src="${completeData.productImageUrl}" alt="${completeData.productName}">
            </div>
            <div class="product-details">
              <h3 class="product-name">${completeData.productName}</h3>
              <div class="quantity-price">
                <span class="quantity">참여 수량: ${completeData.quantity}개</span>
                <span class="total-price">
                  <fmt:formatNumber value="${completeData.totalAmount}" type="number" groupingUsed="true"/>원
                </span>
              </div>
            </div>
          </div>

          <div class="groupbuy-progress">
            <div class="progress-info">
              <span class="current">${groupBuyData.currentQuantity}명 참여</span>
              <span class="target">/ ${groupBuyData.targetQuantity}명 목표</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${(completeData.currentQuantity * 100) / completeData.targetQuantity}%"></div>
            </div>
          </div>

          <div class="delivery-info">
            <div class="info-row">
              <span class="label">받는 분</span>
              <span class="value">${completeData.recipientName}</span>
            </div>
            <div class="info-row">
              <span class="label">배송지</span>
              <span class="value">${completeData.recipientAddress}</span>
            </div>
            <div class="info-row">
              <span class="label">배송비</span>
              <span class="value">무료배송 (공동구매 혜택)</span>
            </div>
            <div class="info-row">
              <span class="label">공동구매 마감</span>
              <span class="value">
                <c:out value="${groupBuyData.endDate.toString()}"/>
              </span>
            </div>
          </div>

          <div class="groupbuy-notice">
            <h4><i class="fas fa-info-circle"></i> 공동구매 안내</h4>
            <ul>
              <li>목표 인원 달성 시 자동으로 주문이 진행됩니다.</li>
              <li>목표 인원 미달성 시 자동으로 환불 처리됩니다.</li>
              <li>공동구매 진행 상황을 마이페이지에서 확인할 수 있습니다.</li>
            </ul>
          </div>
        </div>
      </div>
    </c:if>

    <!-- 다중 주문 완료 정보 -->
    <c:if test="${orderType == 'multi'}">
      <div class="order-info-section">
        <h2>주문 정보</h2>
        <div class="multi-order-summary-card">
          <div class="order-header">
            <div class="order-group-id">
              <strong>주문그룹: ${completeData.orderGroupId}</strong>
            </div>
            <div class="order-count">
              총 ${completeData.totalItemCount}개 상품
            </div>
            <div class="order-date">
              <spring:eval expression="completeData.createdAt.format(T(java.time.format.DateTimeFormatter).ofPattern('yyyy.MM.dd HH:mm'))" />
            </div>
          </div>

          <div class="orders-list">
            <c:forEach var="item" items="${completeData.items}" varStatus="status">
              <div class="order-item">
                <div class="order-item-header">
                  <span class="order-number">주문번호: ${completeData.orderNo}</span>
                </div>
                <div class="product-info">
                  <div class="product-image">
                    <img src="${pageContext.request.contextPath}${item.productImageUrl}" alt="${item.productName}">
                  </div>
                  <div class="product-details">
                    <h3 class="product-name">${item.productName}</h3>
                    <div class="quantity-price">
                      <span class="quantity">수량: ${item.quantity}개</span>
                      <span class="total-price">
                        <fmt:formatNumber value="${item.priceAtPurchase}" type="number" groupingUsed="true"/>원
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </c:forEach>
          </div>

          <div class="total-summary">
            <div class="total-amount">
              <span class="label">상품 금액</span>
              <span class="amount">
                <fmt:formatNumber value="${completeData.subTotalAmount}" type="number" groupingUsed="true"/>원
              </span>
            </div>
            <div class="total-amount">
              <span class="label">배송비</span>
              <span class="amount">
                <c:choose>
                  <c:when test="${completeData.shippingFee == 0}">무료</c:when>
                  <c:otherwise>
                    <fmt:formatNumber value="${completeData.shippingFee}" type="number" groupingUsed="true"/>원
                  </c:otherwise>
                </c:choose>
              </span>
            </div>
            <c:if test="${completeData.totalDiscountAmount > 0}">
              <div class="total-amount">
                <span class="label">할인 금액</span>
                <span class="amount" style="color: #e74c3c;">
                  -<fmt:formatNumber value="${completeData.totalDiscountAmount}" type="number" groupingUsed="true"/>원
                </span>
              </div>
            </c:if>
            <div class="total-amount" style="border-top: 2px solid #ddd; padding-top: 10px; margin-top: 10px;">
              <span class="label" style="font-weight: 700;">총 결제 금액</span>
              <span class="amount" style="font-size: 20px; font-weight: 700;">
                <fmt:formatNumber value="${completeData.finalAmount}" type="number" groupingUsed="true"/>원
              </span>
            </div>
          </div>

          <div class="delivery-info">
            <div class="info-row">
              <span class="label">받는 분</span>
              <span class="value">${completeData.recipientName}</span>
            </div>
            <div class="info-row">
              <span class="label">배송지</span>
              <span class="value">${completeData.recipientAddress}</span>
            </div>
            <div class="info-row">
              <span class="label">결제 방법</span>
              <span class="value">
                <c:choose>
                  <c:when test="${completeData.paymentMethod == 'CREDIT_CARD'}">신용카드</c:when>
                  <c:when test="${completeData.paymentMethod == 'BANK_TRANSFER'}">계좌이체</c:when>
                  <c:when test="${completeData.paymentMethod == 'VIRTUAL_ACCOUNT'}">가상계좌</c:when>
                  <c:when test="${completeData.paymentMethod == 'MOBILE_PAYMENT'}">휴대폰 결제</c:when>
                  <c:otherwise>${completeData.paymentMethod}</c:otherwise>
                </c:choose>
              </span>
            </div>
          </div>
        </div>
      </div>
    </c:if>

    <!-- 액션 버튼들 -->
    <div class="action-buttons">
      <c:choose>
        <c:when test="${orderType == 'groupbuy'}">
          <button class="btn-primary" onclick="location.href='${pageContext.request.contextPath}/mypage#joined-gb-content'">
            <i class="fas fa-users"></i>
            공동구매 현황 보기
          </button>
          <button class="btn-secondary" onclick="location.href='${pageContext.request.contextPath}/products/${completeData.productId}'">
            <i class="fas fa-arrow-left"></i>
            상품 페이지로
          </button>
        </c:when>
        <c:when test="${orderType == 'multi'}">
          <button class="btn-primary" onclick="location.href='${pageContext.request.contextPath}/mypage#order-history-content'">
            <i class="fas fa-list"></i>
            주문 내역 보기
          </button>
          <button class="btn-secondary" onclick="location.href='${pageContext.request.contextPath}/cart'">
            <i class="fas fa-shopping-cart"></i>
            장바구니로
          </button>
        </c:when>
        <c:otherwise>
          <button class="btn-primary" onclick="location.href='${pageContext.request.contextPath}/mypage#order-history-content'">
            <i class="fas fa-list"></i>
            주문 내역 보기
          </button>
          <button class="btn-secondary" onclick="location.href='${pageContext.request.contextPath}/products/${completeData.productId}'">
            <i class="fas fa-arrow-left"></i>
            상품 페이지로
          </button>
        </c:otherwise>
      </c:choose>

      <button class="btn-outline" onclick="location.href='${pageContext.request.contextPath}/'">
        <i class="fas fa-home"></i>
        홈으로
      </button>

      <!-- 공유 버튼 -->
      <button class="btn-share" onclick="shareOrder()">
        <i class="fas fa-share-alt"></i>
        공유하기
      </button>
    </div>

    <!-- 추가 서비스 안내 -->
    <div class="additional-services">
      <h3>추가 서비스</h3>
      <div class="service-grid">
        <div class="service-item">
          <i class="fas fa-truck"></i>
          <h4>배송 조회</h4>
          <p>실시간 배송 현황을 확인하세요</p>
          <button onclick="trackDelivery()">조회하기</button>
        </div>

        <c:if test="${orderType != 'groupbuy'}">
          <div class="service-item">
            <i class="fas fa-star"></i>
            <h4>리뷰 작성</h4>
            <p>상품을 받으신 후 리뷰를 남겨주세요</p>
            <button onclick="writeReview()">작성하기</button>
          </div>
        </c:if>

        <div class="service-item">
          <i class="fas fa-headset"></i>
          <h4>고객 지원</h4>
          <p>궁금한 점이 있으시면 문의하세요</p>
          <button onclick="contactSupport()">문의하기</button>
        </div>

        <div class="service-item">
          <i class="fas fa-gift"></i>
          <h4>추천 상품</h4>
          <p>비슷한 상품을 더 보실 수 있어요</p>
          <button onclick="viewRecommendations()">보기</button>
        </div>
      </div>
    </div>

    <!-- 주문 완료 혜택 안내 -->
    <div class="completion-benefits">
      <h3>🎉 주문 완료 혜택</h3>
      <div class="benefits-list">
        <div class="benefit-item">
          <i class="fas fa-coins"></i>
          <div class="benefit-content">
            <h4>적립금 지급</h4>
            <p>주문 금액의 1% 적립금이 지급됩니다 (배송 완료 후)</p>
          </div>
        </div>

        <div class="benefit-item">
          <i class="fas fa-ticket-alt"></i>
          <div class="benefit-content">
            <h4>다음 주문 쿠폰</h4>
            <p>7일 후 사용 가능한 5% 할인 쿠폰을 드려요</p>
          </div>
        </div>

        <div class="benefit-item">
          <i class="fas fa-crown"></i>
          <div class="benefit-content">
            <h4>VIP 혜택</h4>
            <p>누적 구매 금액에 따라 등급별 혜택을 받으세요</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- 푸터 포함 -->
<%@ include file="/WEB-INF/views/common/footer.jsp" %>

<!-- JavaScript -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js"></script>
<script>
  // 주문 완료 페이지 JavaScript
  $(document).ready(function() {
    // 폼 데이터 저장소 정리
    localStorage.removeItem('orderFormData');

    // 완료 애니메이션
    $('.completion-header').addClass('animate-in');

    setTimeout(function() {
      $('.order-info-section').addClass('animate-in');
    }, 300);

    setTimeout(function() {
      $('.action-buttons').addClass('animate-in');
    }, 600);
  });

  /**
   * 주문 공유하기
   */
  function shareOrder() {
    const orderData = {
      <c:choose>
      <c:when test="${orderType == 'groupbuy'}">
      title: '공동구매 참여 완료!',
      text: '${completeData.groupBuyName}에 참여했어요! 함께 참여해보세요!',
      url: '${pageContext.request.contextPath}/groupbuy/${completeData.groupBuyId}'
      </c:when>
      <c:otherwise>
      title: '주문 완료!',
      text: '${completeData.productName}을(를) 주문했어요!',
      url: window.location.href
      </c:otherwise>
      </c:choose>
    };

    if (navigator.share) {
      navigator.share(orderData).catch(err => {
        console.log('공유 실패:', err);
        copyToClipboard(orderData.url);
      });
    } else {
      copyToClipboard(orderData.url);
    }
  }

  /**
   * 클립보드에 URL 복사
   */
  function copyToClipboard(url) {
    navigator.clipboard.writeText(url).then(() => {
      showAlert('링크가 복사되었습니다!', 'success');
    }).catch(() => {
      // 구형 브라우저 대응
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showAlert('링크가 복사되었습니다!', 'success');
    });
  }

  /**
   * 배송 조회
   */
  function trackDelivery() {
    <c:choose>
    <c:when test="${orderType == 'groupbuy'}">
    location.href = '${pageContext.request.contextPath}/user/groupbuys/${completeData.groupBuyParticipantId}';
    </c:when>
    <c:when test="${orderType == 'multi'}">
    location.href = '${pageContext.request.contextPath}/user/orders?groupId=${completeData.orderGroupId}';
    </c:when>
    <c:otherwise>
    location.href = '${pageContext.request.contextPath}/user/orders/${completeData.orderId}';
    </c:otherwise>
    </c:choose>
  }

  /**
   * 리뷰 작성
   */
  function writeReview() {
    <c:if test="${orderType == 'single'}">
    location.href = '${pageContext.request.contextPath}/reviews/write?orderId=${completeData.orderId}';
    </c:if>
    <c:if test="${orderType == 'multi'}">
    location.href = '${pageContext.request.contextPath}/user/orders?groupId=${completeData.orderGroupId}#reviews';
    </c:if>
  }

  /**
   * 고객 지원
   */
  function contactSupport() {
    location.href = '${pageContext.request.contextPath}/support/inquiry?type=ORDER&orderNo=${completeData.orderNo != null ? completeData.orderNo : completeData.orderGroupId}';
  }

  /**
   * 추천 상품 보기
   */
  function viewRecommendations() {
    <c:choose>
    <c:when test="${orderType == 'groupbuy'}">
    location.href = '${pageContext.request.contextPath}/products/${completeData.productId}#related';
    </c:when>
    <c:otherwise>
    location.href = '${pageContext.request.contextPath}/products/recommendations';
    </c:otherwise>
    </c:choose>
  }

  /**
   * 알림 메시지 표시
   */
  function showAlert(message, type = 'info', duration = 3000) {
    $('.custom-alert').remove();

    const alertClass = {
      'success': 'alert-success',
      'error': 'alert-error',
      'warning': 'alert-warning',
      'info': 'alert-info'
    };

    const alertHtml = `
      <div class="custom-alert \${alertClass[type] || 'alert-info'}">
        <div class="alert-content">
          <i class="alert-icon fas \${getAlertIcon(type)}"></i>
          <span class="alert-message">\${message}</span>
          <button class="alert-close" onclick="$(this).closest('.custom-alert').remove()">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
    `;

    $('body').append(alertHtml);

    const alertElement = $('.custom-alert').last();
    alertElement.addClass('show');

    if (duration > 0) {
      setTimeout(() => {
        alertElement.removeClass('show');
        setTimeout(() => alertElement.remove(), 300);
      }, duration);
    }
  }

  /**
   * 알림 아이콘
   */
  function getAlertIcon(type) {
    const icons = {
      'success': 'fa-check-circle',
      'error': 'fa-exclamation-circle',
      'warning': 'fa-exclamation-triangle',
      'info': 'fa-info-circle'
    };
    return icons[type] || 'fa-info-circle';
  }

  // 공동구매 진행 상황 업데이트 (공동구매인 경우)
  <c:if test="${orderType == 'groupbuy'}">
  function updateGroupBuyProgress() {
    $.ajax({
      url: '${pageContext.request.contextPath}/api/groupbuy/${completeData.groupBuyId}/status',
      method: 'GET',
      success: function(response) {
        if (response.success) {
          const data = response.data;
          $('.current').text(data.currentParticipants + '명 참여');
          $('.progress-fill').css('width', (data.currentParticipants * 100 / data.targetParticipants) + '%');

          // 목표 달성 시 알림
          if (data.currentParticipants >= data.targetParticipants && !localStorage.getItem('goalAchievedNotified')) {
            showAlert('🎉 목표 인원이 달성되었습니다! 곧 배송이 시작됩니다.', 'success', 5000);
            localStorage.setItem('goalAchievedNotified', 'true');
          }
        }
      },
      error: function(xhr) {
        console.error('공동구매 상태 업데이트 실패:', xhr);
      }
    });
  }

  // 30초마다 공동구매 진행 상황 업데이트
  setInterval(updateGroupBuyProgress, 30000);
  </c:if>

  // 축하 애니메이션 (페이지 로드 후 1초 뒤)
  setTimeout(function() {
    createCelebrationEffect();
  }, 1000);

  /**
   * 축하 효과 생성
   */
  function createCelebrationEffect() {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7'];
    const confettiCount = 50;

    for (let i = 0; i < confettiCount; i++) {
      setTimeout(() => {
        const confetti = $('<div class="confetti"></div>');
        confetti.css({
          position: 'fixed',
          top: '-10px',
          left: Math.random() * window.innerWidth + 'px',
          width: '10px',
          height: '10px',
          backgroundColor: colors[Math.floor(Math.random() * colors.length)],
          borderRadius: '50%',
          zIndex: '9999',
          animation: 'confetti-fall 3s ease-out forwards'
        });

        $('body').append(confetti);

        setTimeout(() => confetti.remove(), 3000);
      }, i * 100);
    }
  }

  // CSS 애니메이션 추가
  $('<style>').text(`
    @keyframes confetti-fall {
      0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
      100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
    }

    .animate-in {
      animation: slideInUp 0.6s ease-out;
    }

    @keyframes slideInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `).appendTo('head');
</script>
</body>
</html>