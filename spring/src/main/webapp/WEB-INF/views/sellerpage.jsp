<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ page pageEncoding="UTF-8" contentType="text/html; charset=UTF-8" %>
<!DOCTYPE html>
<html lang="ko">

<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>판매자 센터</title>
  <meta name="_csrf" content="${_csrf.token}" />
  <meta name="_csrf_header" content="${_csrf.headerName}" />
  <link rel="stylesheet" href="<c:url value="/resources/css/sellerpage.css"/>" />
  <script src="<c:url value="/resources/js/sellerpage.js"/>"></script>
</head>

<body>
<header class="header">
  <div class="logo">
    <a href="<c:url value="/"/>">이거어때</a>
  </div>
  <h1 class="page-title">판매자 센터</h1>
  <nav class="header-nav">
    <a href="<c:url value="/"/>">홈</a>
    <a onclick="logout(); return false;">로그아웃</a>
  </nav>
</header>

<div class="seller-container">
  <aside class="seller-nav">
    <div class="store-name">${storeName}</div>
    <nav>
      <ul>
        <li><a href="#seller-dashboard" class="nav-link active">판매 현황</a></li>
        <li><a href="#seller-products" class="nav-link">상품 관리</a></li>
        <li><a href="#seller-groupbuys" class="nav-link">공동구매 관리</a></li>
        <li><a href="#seller-orders" class="nav-link">주문 관리</a></li>
        <li><a href="#seller-returns" class="nav-link">반품/교환 관리</a></li>
        <li><a href="#seller-settlements" class="nav-link">정산 관리</a></li>
        <li><a href="#seller-promotions" class="nav-link">프로모션 관리</a></li>
        <li><a href="#seller-coupons" class="nav-link">쿠폰 관리</a></li>
        <li><a href="#seller-info" class="nav-link">판매자 정보</a></li>
        <li><a href="#seller-qnas" class="nav-link">상품 QnA</a></li>
        <li><a href="#seller-inquiries" class="nav-link">문의 관리</a></li>
        <li><a href="#seller-reviews" class="nav-link">리뷰 관리</a></li>
        <li><a href="#seller-account-settings" class="nav-link">계정 설정</a></li>
      </ul>
    </nav>
  </aside>

  <main class="seller-main">
    <section id="seller-dashboard" class="content-section active">
      <h2>판매 현황 대시보드</h2>
      <div class="dashboard-cards">
        <div class="card sales">
          <h3>오늘 매출액</h3>
          <div class="value" id="dashboard-sales">원</div>
        </div>
        <div class="card orders">
          <h3>신규 주문 (미처리)</h3>
          <div class="value" id="dashboard-new-orders">건</div>
        </div>
        <div class="card settlement">
          <h3>정산 예정 금액</h3>
          <div class="value">5,800,000원</div>
        </div>
        <div class="card QnAs">
          <h3>미답변 문의</h3>
          <div class="value" id="dashboard-QnAs">건</div>
        </div>
      </div>
      <hr />
      <h3>오늘 처리할 업무 (To-Do List)</h3>
      <div class="todo-list">
        <a href="#seller-orders" class="todo-item" onclick="navigateToSection('#seller-orders')">
          <span class="icon">📦</span>
          <span class="title">신규 주문 (배송 준비 전)</span>
          <span class="count" id="todo-new-orders">2건</span>
        </a>
        <a href="#seller-qnas" class="todo-item" onclick="navigateToSection('#seller-QnAs')">
          <span class="icon">💬</span>
          <span class="title">미답변 상품 QnA</span>
          <span class="count" id="todo-unanswered-QnAs">1건</span>
        </a>
        <a href="#seller-products" class="todo-item" onclick="navigateToSection('#seller-products')">
          <span class="icon">⚠️</span>
          <span class="title">재고 5개 이하 상품</span>
          <span class="count" id="todo-low-stock">1건</span>
        </a>
        <a href="#seller-returns" class="todo-item" onclick="navigateToSection('#seller-returns')">
          <span class="icon">↩️</span>
          <span class="title">신규 반품/교환 요청</span>
          <span class="count" id="todo-new-returns">2건</span>
        </a>
      </div>
      <hr />
      <button class="btn" onclick="openProductModal('add')">+ 새 상품 등록</button>
      <button class="btn success" onclick="openGroupBuyModal('add')">+ 공동구매 생성</button>
    </section>

    <section id="seller-products" class="content-section">
      <h2>내 상품 관리</h2>
      <button class="btn" onclick="openProductModal('add')">+ 새 상품 등록</button>
      <div class="filter-controls">
        <input type="text" id="product-search-keyword" placeholder="상품명 검색..." />
        <select id="product-search-status">
          <option value="">판매 상태 전체</option>
          <option value="SELLING">판매중</option>
          <option value="STOPPED">판매중지</option>
          <option value="SOLDOUT">품절</option>
        </select>
        <button class="btn secondary btn-sm" onclick="loadProducts(1)">검색</button>
      </div>
      <table class="data-table">
        <thead>
        <tr>
          <th>ID</th>
          <th>이미지</th>
          <th>상품명</th>
          <th>가격</th>
          <th>재고</th>
          <th>조회/판매</th>
          <th>판매상태</th>
          <th>등록일</th>
          <th>작업</th>
        </tr>
        </thead>
        <tbody id="product-list-body">
        <!-- 데이터가 여기에 동적으로 채워집니다 -->
        </tbody>
      </table>
      <div id="product-pagination" class="pagination"></div>
    </section>

    <!-- 나머지 섹션들은 동일하게 유지 -->
    <section id="seller-groupbuys" class="content-section">
      <h2>내가 만든 공동구매 관리</h2>
      <button class="btn success" onclick="openGroupBuyModal('add')">+ 공동구매 생성</button>
      <div class="filter-controls">
        <input type="text" id="gb-search-keyword" placeholder="공동구매명 검색..." />
        <select id="gb-search-status">
          <option value="">상태 전체</option>
          <option value="PENDING">진행 중</option>
          <option value="SUCCESS">성공</option>
          <option value="FAILED">실패</option>
        </select>
        <button class="btn secondary btn-sm" onclick="loadGroupBuys(1)">검색</button>
      </div>
      <table class="data-table">
        <thead>
        <tr>
          <th>ID</th>
          <th>상품명</th>
          <th>목표/현재</th>
          <th>종료일</th>
          <th>상태</th>
          <th>작업</th>
        </tr>
        </thead>
        <tbody id="groupbuy-list-body">
        </tbody>
      </table>
      <div id="groupbuy-pagination" class="pagination"></div>
    </section>

    <!-- 기타 섹션들도 동일하게 유지... -->
    <section id="seller-orders" class="content-section">
      <h2>내 상품 주문 관리</h2>
      <div class="filter-controls">
        <input type="text" id="order-search-keyword" placeholder="주문번호, 구매자, 상품명 검색..." />
        <select id="order-search-status">
          <option value="">주문 상태 전체</option>
          <option value="PAID">결제 완료</option>
          <option value="PREPARING">배송 준비중</option>
          <option value="SHIPPED">배송중</option>
          <option value="DELIVERED">배송 완료</option>
          <option value="CANCELLED">취소</option>
          <option value="REFUNDED">환불</option>
        </select>
        <input type="date" id="order-search-start-date" /> ~
        <input type="date" id="order-search-end-date" />
        <button class="btn secondary btn-sm" onclick="loadOrders(1)">검색</button>
      </div>
      <table class="data-table">
        <thead>
        <tr>
          <th>주문번호</th>
          <th>주문일시</th>
          <th>구매자</th>
          <th>상품명</th>
          <th>수량</th>
          <th>결제금액</th>
          <th>주문상태</th>
          <th>작업</th>
        </tr>
        </thead>
        <tbody id="order-list-body">
        <!-- 주문 목록이 여기에 동적으로 채워집니다 -->
        </tbody>
      </table>
      <div id="order-pagination" class="pagination"></div>
    </section>

    <!-- 다른 모든 섹션들은 기존과 동일... -->
    <section id="seller-returns" class="content-section">
      <h2>반품/교환 관리</h2>
      <div class="filter-controls">
        <input type="text" id="return-search-keyword" placeholder="주문번호, 요청번호 검색..." />
        <select id="return-search-status">
          <option value="">상태 전체</option>
          <option value="REQUESTED">요청</option>
          <option value="IN_TRANSIT">수거중</option>
          <option value="RECEIVED">입고완료</option>
          <option value="INSPECTED">검수완료</option>
          <option value="COMPLETED">처리완료</option>
          <option value="REJECTED">반려</option>
        </select>
        <button class="btn secondary btn-sm" onclick="loadReturns(1)">검색</button>
      </div>
      <table id="returns-table" class="data-table">
        <thead>
        <tr>
          <th>요청번호</th>
          <th>관련 주문번호</th>
          <th>요청일</th>
          <th>유형</th>
          <th>상품 요약</th>
          <th>상태</th>
          <th>작업</th>
        </tr>
        </thead>
        <tbody id="returns-list-body">
        <!-- 반품/교환 목록이 여기에 동적으로 채워집니다 -->
        </tbody>
      </table>
      <div id="returns-pagination" class="pagination"></div>
    </section>

    <!-- 기타 모든 섹션들은 기존과 동일하게 유지... -->
    <section id="seller-settlements" class="content-section">
      <h2>정산 관리</h2>
      <div class="dashboard-cards">
        <div class="card settlement" style="border-top-color: #6f42c1">
          <h3>총 판매 금액 (이번달)</h3>
          <div class="value">8,500,000원</div>
        </div>
        <div class="card settlement" style="border-top-color: #fd7e14">
          <h3>수수료 (이번달)</h3>
          <div class="value">850,000원</div>
        </div>
        <div class="card settlement" style="border-top-color: #20c997">
          <h3>정산 예정 금액</h3>
          <div class="value">7,650,000원</div>
        </div>
        <div class="card settlement">
          <h3>최근 정산일</h3>
          <div class="value" style="font-size: 1.4em">2025-04-15</div>
        </div>
      </div>
      <hr />
      <h3>정산 내역</h3>
      <table class="data-table">
        <thead>
        <tr>
          <th>정산 ID</th>
          <th>정산 기간</th>
          <th>총 판매액</th>
          <th>수수료</th>
          <th>정산 금액</th>
          <th>정산일</th>
          <th>상태</th>
        </tr>
        </thead>
        <tbody>
        <tr>
          <td>SET20250415</td>
          <td>2025-04-01 ~ 2025-04-15</td>
          <td>5,000,000원</td>
          <td>500,000원</td>
          <td>4,500,000원</td>
          <td>2025-04-15</td>
          <td><span class="status-success">정산 완료</span></td>
        </tr>
        <tr>
          <td>SET20250401</td>
          <td>2025-03-16 ~ 2025-03-31</td>
          <td>4,200,000원</td>
          <td>420,000원</td>
          <td>3,780,000원</td>
          <td>2025-04-01</td>
          <td><span class="status-success">정산 완료</span></td>
        </tr>
        </tbody>
      </table>
    </section>

    <!-- 계속해서 다른 섹션들... (생략) -->
    <section id="seller-promotions" class="content-section">
      <h2>프로모션 관리</h2>
      <button class="btn info" onclick="openPromotionModal('add')">+ 새 프로모션 등록</button>
      <table class="data-table">
        <thead>
        <tr>
          <th>프로모션명</th>
          <th>유형</th>
          <th>할인 내용</th>
          <th>기간</th>
          <th>상태</th>
          <th>작업</th>
        </tr>
        </thead>
        <tbody id="promotion-list-body">
        <!-- 프로모션 목록이 여기에 동적으로 채워집니다 -->
        </tbody>
      </table>
      <div id="promotion-pagination" class="pagination"></div>
    </section>

    <section id="seller-coupons" class="content-section">
      <h2>쿠폰 관리</h2>
      <button class="btn warning" onclick="openCouponModal('add')">+ 새 쿠폰 발급</button>
      <table class="data-table">
        <thead>
        <tr>
          <th>쿠폰명</th>
          <th>쿠폰 코드</th>
          <th>할인 내용</th>
          <th>발급 기간</th>
          <th>사용 기간</th>
          <th>사용/발급 현황</th>
          <th>상태</th>
          <th>작업</th>
        </tr>
        </thead>
        <tbody id="coupon-list-body">
        <!-- 쿠폰 목록이 여기에 동적으로 채워집니다 -->
        </tbody>
      </table>
      <div id="coupon-pagination" class="pagination"></div>
    </section>

    <section id="seller-info" class="content-section" data-verified-at="2025-01-15T10:00:00">
      <h2>판매자 정보 관리</h2>
      <form id="seller-info-form" onsubmit="saveSellerInfo(); return false;">
        <div class="form-group">
          <label for="storeName">상점 이름</label>
          <input type="text" id="storeName" value="내 상점 이름" required />
        </div>
        <div class="form-group">
          <label for="storeDescription">상점 소개</label>
          <textarea id="storeDescription">고객님께 최고의 상품을 제공하는 내 상점입니다.</textarea>
        </div>
        <div class="form-group">
          <label for="contactPerson">담당자명</label>
          <input type="text" id="contactPerson" value="홍길동" required />
        </div>
        <div class="form-group">
          <label for="contactNumber">연락처</label>
          <input type="text" id="contactNumber" value="010-1234-5678" required />
        </div>
        <hr />
        <h3>사업자 정보</h3>
        <div class="form-group">
          <label for="businessNumber">사업자 등록번호</label>
          <input type="text" id="businessNumber" value="123-45-67890" required />
          <span id="verification-status"></span>
        </div>
        <div class="form-group">
          <label for="companyName">상호명</label>
          <input type="text" id="companyName" value="(주)내상점컴퍼니" required />
        </div>
        <hr />
        <h3>정산 계좌 정보</h3>
        <div class="form-group">
          <label for="bankName">은행명</label>
          <select id="bankName" required>
            <option value="KB">국민은행</option>
            <option value="Shinhan" selected>신한은행</option>
            <option value="Woori">우리은행</option>
          </select>
        </div>
        <div class="form-group">
          <label for="accountNumber">계좌번호</label>
          <input type="text" id="accountNumber" value="110-123-456789" required />
        </div>
        <div class="form-group">
          <label for="accountHolder">예금주명</label>
          <input type="text" id="accountHolder" value="홍길동" required />
        </div>
        <button type="submit" class="btn">정보 저장</button>
      </form>
    </section>

    <section id="seller-qnas" class="content-section">
      <h2>상품 QnA 관리 (상품 Q&A)</h2>
      <div class="filter-controls">
        <select id="QnA-search-status">
          <option value="">상태 전체</option>
          <option value="pending">답변 대기</option>
          <option value="answered">답변 완료</option>
        </select>
        <input type="text" id="QnA-search-keyword" placeholder="상품명 또는 작성자 검색..." />
        <button class="btn secondary btn-sm" onclick="loadQnAs(1)">검색</button>
      </div>
      <table class="data-table">
        <thead>
        <tr>
          <th>ID</th>
          <th>상품명</th>
          <th>작성자</th>
          <th>문의 내용 요약</th>
          <th>문의일</th>
          <th>상태</th>
          <th>작업</th>
        </tr>
        </thead>
        <tbody id="QnA-list-body">
        <!-- 문의 목록이 여기에 동적으로 채워집니다 -->
        </tbody>
      </table>
      <div id="QnA-pagination" class="pagination"></div>
    </section>

    <section id="seller-inquiries" class="content-section">
      <h2>고객 1:1 문의 관리</h2>
      <div class="filter-controls">
        <select id="inquiry-search-status">
          <option value="">상태 전체</option>
          <option value="PENDING">답변 대기</option>
          <option value="ANSWERED">답변 완료</option>
        </select>
        <input type="text" id="inquiry-search-keyword" placeholder="제목 또는 문의 유형 검색..." />
        <button class="btn secondary btn-sm" onclick="loadInquiries(1)">검색</button>
      </div>
      <table class="data-table">
        <thead>
        <tr>
          <th>ID</th>
          <th>문의 유형</th>
          <th>제목</th>
          <th>문의 내용 요약</th>
          <th>문의일</th>
          <th>상태</th>
          <th>작업</th>
        </tr>
        </thead>
        <tbody id="inquiry-list-body">
        <!-- 문의 목록이 여기에 동적으로 채워집니다 -->
        </tbody>
      </table>
      <div id="inquiry-pagination" class="pagination"></div>
    </section>

    <section id="seller-reviews" class="content-section">
      <h2>내 상품 리뷰 관리</h2>
      <div class="filter-controls">
        <input type="text" id="review-search-keyword" placeholder="상품명 또는 작성자 검색..." />
        <select id="review-search-rating">
          <option value="">별점 전체</option>
          <option value="5">★★★★★</option>
          <option value="4">★★★★☆</option>
          <option value="3">★★★☆☆</option>
          <option value="2">★★☆☆☆</option>
          <option value="1">★☆☆☆☆</option>
        </select>
        <button class="btn secondary btn-sm" onclick="loadReviews(1)">검색</button>
      </div>
      <table class="data-table">
        <thead>
        <tr>
          <th>상품명</th>
          <th>작성자</th>
          <th>별점</th>
          <th>리뷰 요약</th>
          <th>작성일</th>
          <th>작업</th>
        </tr>
        </thead>
        <tbody id="review-list-body">
        </tbody>
      </table>
      <div id="review-pagination" class="pagination"></div>
    </section>

    <section id="seller-account-settings" class="content-section">
      <h2>계정 설정</h2>
      <h3>로그인 정보</h3>
      <div class="form-group">
        <label for="loginId">로그인 아이디</label>
        <input type="text" id="loginId" value="seller_A" readonly />
      </div>
      <hr />
      <h3>비밀번호 변경</h3>
      <form id="passwordChangeForm" onsubmit="changePassword(); return false;">
        <div class="form-group">
          <label for="currentPassword">현재 비밀번호</label>
          <input type="password" id="currentPassword" required />
        </div>
        <div class="form-group">
          <label for="newPassword">새 비밀번호</label>
          <input type="password" id="newPassword" required />
        </div>
        <div class="form-group">
          <label for="confirmNewPassword">새 비밀번호 확인</label>
          <input type="password" id="confirmNewPassword" required />
        </div>
        <button type="submit" class="btn">비밀번호 변경</button>
      </form>
      <hr />
      <h3>계정 상태 관리</h3>
      <div class="deactivation-zone">
        <h4>계정 비활성화 요청</h4>
        <p>계정 비활성화를 요청하시면 관리자 검토 후 처리됩니다.</p>
        <button class="btn danger" onclick="requestAccountDeactivation()">계정 비활성화 요청</button>
      </div>
    </section>
  </main>
</div>

<!-- 상품 등록/수정 모달 -->
<div id="product-modal" class="modal">
  <div class="modal-content">
    <div class="modal-header">
      <h3 id="product-modal-title">새 상품 등록</h3>
      <span class="close" onclick="closeAllModals()">&times;</span>
    </div>
    <div class="modal-body">
      <form id="product-form" onsubmit="saveProduct(); return false;">
        <input type="hidden" id="product-id" />

        <h4>상품 기본 정보</h4>
        <table class="form-table">
          <tr>
            <th>상품명</th>
            <td><input type="text" id="product-name" placeholder="상품명을 입력해주세요" required /></td>
          </tr>
          <tr>
            <th>상품 설명</th>
            <td><input type="text" id="product-description" placeholder="상품 설명을 입력해주세요" required /></td>
          </tr>
          <tr class="single-product-field">
            <th>가격(원)</th>
            <td><input type="number" id="price" placeholder="상품 가격을 입력하세요" /></td>
          </tr>
          <tr class="single-product-field">
            <th>재고</th>
            <td><input type="number" id="inventory" placeholder="재고량을 입력하세요" /></td>
          </tr>
          <tr>
            <th>배송 방법</th>
            <td>
              <select id="shipping-method" required>
                <option value="">-- 배송 방법을 선택해주세요 --</option>
              </select>
            </td>
          </tr>
          <tr>
            <th>상태</th>
            <td class=".status-radio-group">
              <input type="radio" id="radio-act" value="selling" name="state" checked />
              <label for="radio-act">판매중</label>
              <input type="radio" id="radio-unact" value="stopped" name="state" />
              <label for="radio-unact">판매중지</label>
            </td>
          </tr>
        </table>

        <hr />

        <h4>상품 옵션 설정</h4>
        <div class="form-group">
          <input type="checkbox" id="use-options-checkbox" onchange="handleUseOptionsChange(this.checked)" />
          <label for="use-options-checkbox">옵션 사용하기 (색상, 사이즈 등)</label>
        </div>

        <div id="options-ui" style="display: none;">
          <div id="option-sets-container"></div>
          <button type="button" class="btn secondary btn-sm" onclick="addOptionSet()">+ 옵션 추가</button>
        </div>

        <hr />

        <div id="variants-ui" style="display: none;">
          <h4>판매단위(SKU) 관리</h4>
          <p style="font-size:0.9em; color:#666;">옵션 조합에 따라 생성된 판매단위(SKU)별로 가격과 재고를 설정해주세요.</p>
          <table id="variants-table" class="data-table">
            <thead>
            <tr>
              <th>옵션</th>
              <th>SKU</th>
              <th>가격(원)</th>
              <th>재고</th>
              <th>상태</th>
            </tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>

        <hr />

        <h4>카테고리</h4>
        <div class="form-group" id="category-selectors-container"></div>
        <input type="hidden" id="selected-category-id">

        <hr />

        <!-- 개선된 이미지 업로드 섹션 -->
        <div class="image-upload-section">
          <h4>상품 이미지</h4>
          <div class="alert alert-info">
            <strong>이미지 업로드 가이드:</strong><br>
            • PRIMARY: 상품 목록에서 보여지는 대표 이미지 (필수)<br>
            • GALLERY: 상품 상세 페이지의 갤러리 이미지<br>
            • DETAIL: 상품 상세 설명에 사용되는 이미지
          </div>

          <div class="image-upload-grid">
            <div class="image-upload-item">
              <h4>대표 이미지 (PRIMARY)</h4>
              <div class="description">상품 목록에서 보여지는 메인 이미지입니다. 필수 항목입니다.</div>
              <div class="file-input-wrapper">
                <input type="file" id="primary-images" accept="image/*" />
              </div>
              <div class="image-preview-container empty" id="primary-preview">
                선택된 이미지가 없습니다.
              </div>
            </div>

            <div class="image-upload-item">
              <h4>갤러리 이미지 (GALLERY)</h4>
              <div class="description">상품 상세 페이지의 갤러리 이미지입니다.</div>
              <div class="file-input-wrapper">
                <input type="file" id="gallery-images" accept="image/*" multiple />
              </div>
              <div class="image-preview-container empty" id="gallery-preview">
                선택된 이미지가 없습니다.
              </div>
            </div>

            <div class="image-upload-item">
              <h4>상세 이미지 (DETAIL)</h4>
              <div class="description">상품 상세 설명에 사용되는 이미지입니다.</div>
              <div class="file-input-wrapper">
                <input type="file" id="detail-images" accept="image/*" multiple />
              </div>
              <div class="image-preview-container empty" id="detail-preview">
                선택된 이미지가 없습니다.
              </div>
            </div>
          </div>
        </div>

        <hr />

        <h4>상품 상세 설명</h4>
        <div id="input-container">
          <div id="tool-bar">
            <select id="font-family" title="글꼴">
              <option value="기본서체">기본서체</option>
              <option value="Nanum Gothic, sans-serif">나눔고딕</option>
              <option value="Malgun Gothic, sans-serif">맑은고딕</option>
              <option value="Dotum, sans-serif">돋움</option>
            </select>
            <select id="font-size" title="글자크기">
              <option value="3">16px</option>
              <option value="1">10px</option>
              <option value="2">13px</option>
              <option value="4">18px</option>
              <option value="5">24px</option>
              <option value="6">32px</option>
            </select>
            <button type="button" class="tool-btn" data-command="bold" title="굵게"><b>B</b></button>
            <button type="button" class="tool-btn" data-command="italic" title="기울기"><i>I</i></button>
            <button type="button" class="tool-btn" data-command="underline" title="밑줄"><u>U</u></button>
            <button type="button" class="tool-btn" data-command="strikeThrough" title="취소선"><s>S</s></button>
            <button type="button" class="tool-btn color-btn" title="글자색" onclick="openColorPicker(event)">A</button>
            <input type="color" id="font-color" style="position: absolute; left: -9999px; opacity: 0;" />
          </div>
          <div id="input-detail" class="form-control" contenteditable="true"></div>
        </div>

        <hr />

        <h4>상품 속성 정보</h4>
        <div id="product-attributes-container">
          <p style="color: #888;">카테고리를 먼저 선택해주세요.</p>
        </div>

        <hr />
      </form>
    </div>
    <div class="modal-footer">
      <p id="product-last-updated" style="margin-right: auto; font-size: 0.8em; color: #666"></p>
      <button type="button" class="btn secondary" onclick="closeAllModals()">취소</button>
      <button type="submit" class="btn" form="product-form">저장하기</button>
    </div>
  </div>
</div>

<div id="groupbuy-modal" class="modal">
  <div class="modal-content" style="max-width: 700px">
    <div class="modal-header">
      <h3 id="groupbuy-modal-title">새 공동구매 생성</h3>
      <span class="close" onclick="closeAllModals()">&times;</span>
    </div>
    <div class="modal-body" style="max-height: 75vh; overflow-y: auto">
      <form id="groupbuy-form" onsubmit="saveGroupBuy(); return false;">
        <input type="hidden" id="groupbuy-id" />
        <div class="form-group">
          <label for="groupbuy-product-variant">대상 상품 선택</label>
          <select id="groupbuy-product-variant" required onchange="updateGroupBuyProductInfo()">
            <option value="">-- 판매중인 상품 선택 --</option>
          </select>
        </div>
        <div class="form-group">
          <label for="groupbuy-name">공동구매 이름</label>
          <input type="text" id="groupbuy-name" placeholder="예: [특별할인] 오가닉 코튼 티셔츠 공구" required />
        </div>
        <div class="form-group">
          <label for="groupbuy-description">공동구매 상세 설명</label>
          <textarea id="groupbuy-description" rows="4" placeholder="공동구매에 대한 설명을 입력하세요."></textarea>
        </div>
        <table class="data-table">
          <tr>
            <th><label for="groupbuy-original-price">원래 가격(원)</label></th>
            <td><input type="number" id="groupbuy-original-price" readonly /></td>
            <th><label for="groupbuy-price">공동구매 가격(원)</label></th>
            <td><input type="number" id="groupbuy-price" required /></td>
          </tr>
          <tr>
            <th><label for="groupbuy-target-qty">목표 수량</label></th>
            <td><input type="number" id="groupbuy-target-qty" required /></td>
            <th></th>
            <td></td>
          </tr>
          <tr>
            <th><label for="groupbuy-min-qty">개인 최소 구매 수량</label></th>
            <td><input type="number" id="groupbuy-min-qty" value="1" required /></td>
            <th><label for="groupbuy-max-qty">개인 최대 구매 수량</label></th>
            <td><input type="number" id="groupbuy-max-qty" placeholder="미입력 시 무제한" /></td>
          </tr>
          <tr>
            <th><label for="groupbuy-start-date">시작 일시</label></th>
            <td><input type="datetime-local" id="groupbuy-start-date" required /></td>
            <th><label for="groupbuy-end-date">종료 일시</label></th>
            <td><input type="datetime-local" id="groupbuy-end-date" required /></td>
          </tr>
        </table>
      </form>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn secondary" onclick="closeAllModals()">취소</button>
      <button type="submit" class="btn success" form="groupbuy-form">저장하기</button>
    </div>
  </div>
</div>

<div id="groupbuy-participants-modal" class="modal">
  <div class="modal-content">
    <div class="modal-header">
      <h3 id="groupbuy-participants-modal-title">공동구매 참여자 목록</h3>
      <span class="close" onclick="closeAllModals()">&times;</span>
    </div>
    <div class="modal-body">
      <p><strong>공동구매 ID:</strong> <span id="p-gb-id"></span></p>
      <table class="data-table">
        <thead>
        <tr>
          <th>주문번호</th>
          <th>참여자</th>
          <th>수량</th>
          <th>결제일</th>
        </tr>
        </thead>
        <tbody id="p-gb-list"></tbody>
      </table>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn" onclick="closeAllModals()">
        닫기
      </button>
    </div>
  </div>
</div>

<div id="order-details-modal" class="modal">
  <div class="modal-content">
    <div class="modal-header">
      <h3>주문 상세 정보</h3>
      <span class="close" onclick="closeAllModals()">&times;</span>
    </div>
    <div class="modal-body">
      <p><strong>주문번호:</strong> <span id="detail-order-id"></span></p>
      <p>
        <strong>주문일시:</strong> <span id="detail-order-datetime"></span>
      </p>
      <p>
        <strong>구매자:</strong> <span id="detail-order-customer"></span>
      </p>
      <p>
        <strong>상품명:</strong> <span id="detail-order-product"></span>
      </p>
      <p><strong>수량:</strong> <span id="detail-order-quantity"></span></p>
      <p>
        <strong>결제금액:</strong> <span id="detail-order-amount"></span>
      </p>
      <hr />
      <h4>배송 정보</h4>
      <p><strong>수령인:</strong> 홍길동</p>
      <p><strong>연락처:</strong> 010-1234-5678</p>
      <p>
        <strong>주소:</strong> 서울특별시 강남구 테헤란로 123, A동 101호
      </p>
      <hr />
      <h4>배송 요청사항</h4>
      <p id="detail-order-deliv-msg" style="color: #007bff; font-weight: bold;">-</p>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn" onclick="closeAllModals()">
        닫기
      </button>
    </div>
  </div>
</div>

<div id="tracking-info-modal" class="modal">
  <div class="modal-content">
    <div class="modal-header">
      <h3>송장 정보 입력</h3>
      <span class="close" onclick="closeAllModals()">&times;</span>
    </div>
    <div class="modal-body">
      <form id="tracking-form" onsubmit="saveTrackingInfo(); return false;">
        <p>
          <strong>주문번호:</strong> <span id="tracking-order-id"></span>
        </p>
        <div class="form-group">
          <label for="tracking-courier">택배사</label>
          <select id="tracking-courier" required>
          </select>
        </div>
        <div class="form-group">
          <label for="tracking-number">송장 번호</label>
          <input type="text" id="tracking-number" required />
        </div>
      </form>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn secondary" onclick="closeAllModals()">
        취소
      </button>
      <button type="submit" class="btn" form="tracking-form">
        입력 완료
      </button>
    </div>
  </div>
</div>

<div id="return-request-modal" class="modal">
  <div class="modal-content" style="max-width: 800px;">
    <div class="modal-header">
      <h3>반품 요청 접수</h3>
      <span class="close" onclick="closeAllModals()">&times;</span>
    </div>
    <div class="modal-body" style="max-height: 80vh; overflow-y: auto;">
      <form id="return-request-form" onsubmit="submitReturnRequest(); return false;">
        <input type="hidden" id="return-order-id" />

        <h4>주문 정보</h4>
        <table class="data-table">
          <tr>
            <th>주문번호</th>
            <td id="return-order-no"></td>
            <th>주문일시</th>
            <td id="return-order-date"></td>
          </tr>
          <tr>
            <th>고객명</th>
            <td id="return-customer-name"></td>
            <th>총 결제금액</th>
            <td id="return-order-amount"></td>
          </tr>
        </table>

        <hr>

        <h4>반품 요청 상품 선택</h4>
        <div id="return-items-container">
          <!-- 주문 상품 목록이 여기에 동적으로 채워짐 -->
        </div>

        <hr>

        <h4>반품 사유</h4>
        <div class="form-group">
          <label for="return-reason">반품 사유 코드</label>
          <select id="return-reason" required>
            <option value="">-- 사유를 선택해주세요 --</option>
            <option value="DEFECTIVE">상품 불량/하자</option>
            <option value="SIZE_MISMATCH">사이즈 불일치</option>
            <option value="COLOR_DIFFERENT">색상/디자인 차이</option>
            <option value="CHANGE_MIND">단순 변심</option>
            <option value="DAMAGED_SHIPPING">배송 중 파손</option>
            <option value="NOT_AS_DESCRIBED">상품설명과 다름</option>
            <option value="QUALITY_ISSUE">품질 문제</option>
          </select>
        </div>

        <div class="form-group">
          <label for="return-reason-detail">상세 사유</label>
          <textarea id="return-reason-detail" rows="4" placeholder="반품 사유에 대한 상세한 설명을 입력해주세요."></textarea>
        </div>

        <hr>

        <h4>처리 방법</h4>
        <div class="form-group">
          <input type="radio" id="process-return" name="process_type" value="RETURN" checked>
          <label for="process-return">반품 (환불 처리)</label>
        </div>
        <div class="form-group">
          <input type="radio" id="process-exchange" name="process_type" value="EXCHANGE">
          <label for="process-exchange">교환 (동일 상품으로 교환)</label>
        </div>

        <div id="exchange-options" style="display: none; margin-top: 15px; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
          <h5>교환 옵션 선택</h5>
          <p>교환할 새로운 옵션을 선택해주세요.</p>
          <div id="exchange-variant-options">
            <!-- 교환 가능한 옵션들이 여기에 표시됨 -->
          </div>
        </div>
      </form>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn secondary" onclick="closeAllModals()">취소</button>
      <button type="submit" class="btn danger" form="return-request-form">반품 요청 접수</button>
    </div>
  </div>
</div>

<div id="return-details-modal" class="modal">
  <div class="modal-content" style="max-width: 750px;">
    <div class="modal-header">
      <h3 id="return-modal-title">반품 요청 상세</h3>
      <span class="close" onclick="closeAllModals()">&times;</span>
    </div>
    <div class="modal-body">
      <form id="return-processing-form" onsubmit="saveReturnProcessing(); return false;">
        <input type="hidden" id="return-id-input">
        <h4>요청 정보</h4>
        <table class="data-table">
          <tr>
            <th>요청번호</th>
            <td id="detail-return-id"></td>
            <th>요청유형</th>
            <td id="detail-return-type"></td>
          </tr>
          <tr>
            <th>주문번호</th>
            <td id="detail-return-order-id"></td>
            <th>요청일</th>
            <td id="detail-return-date"></td>
          </tr>
          <tr>
            <th>고객명</th>
            <td id="detail-return-customer" colspan="3"></td>
          </tr>
        </table>

        <h4>요청 상품</h4>
        <table class="data-table">
          <thead>
          <tr>
            <th>상품명</th>
            <th>수량</th>
            <th>사유</th>
          </tr>
          </thead>
          <tbody id="detail-return-items"></tbody>
        </table>

        <hr>
        <h4>처리 상태 관리</h4>
        <div id="return-step-REQUESTED" class="return-step-group" style="display:none;">
          <h5>1. 반품 수거 처리</h5>
          <div class="form-group">
            <label for="pickup-carrier">회수 택배사</label>
            <select id="pickup-carrier">
            </select>
          </div>
          <div class="form-group">
            <label for="pickup-tracking">회수 운송장 번호</label>
            <input type="text" id="pickup-tracking" />
          </div>
        </div>
        <div id="return-step-IN_TRANSIT" class="return-step-group" style="display:none;">
          <h5>2. 상품 입고 처리</h5>
          <p>회수 상품이 판매자에게 도착했는지 확인 후 '입고 완료' 처리해주세요.</p>
        </div>
        <div id="return-step-RECEIVED" class="return-step-group" style="display:none;">
          <h5>3. 상품 검수 처리</h5>
          <div class="form-group">
            <label>검수 결과</label>
            <input type="radio" name="inspection_result" id="inspect-pass" value="PASS" checked><label
                  for="inspect-pass">정상</label>
            <input type="radio" name="inspection_result" id="inspect-fail" value="FAIL"><label
                  for="inspect-fail">훼손/문제있음</label>
          </div>
          <div class="form-group">
            <label for="inspection-memo">검수 메모 (문제 발생 시)</label>
            <textarea id="inspection-memo" rows="2"></textarea>
          </div>
        </div>
        <div id="return-step-INSPECTED" class="return-step-group" style="display:none;">
          <h5>4. 최종 처리</h5>
          <p id="final-process-guidance"></p>

          <div id="exchange-shipment-form"
               style="display:none; margin-top: 15px; padding-top:15px; border-top: 1px dashed #ddd;">
            <div class="form-group">
              <label for="exchange-carrier">새 배송사</label>
              <select id="exchange-carrier">
              </select>
            </div>
            <div class="form-group">
              <label for="exchange-tracking">새 운송장 번호</label>
              <input type="text" id="exchange-tracking" placeholder="교환 상품의 운송장 번호를 입력하세요." />
            </div>
          </div>
        </div>
        <div id="return-step-COMPLETED" class="return-step-group" style="display:none;">
          <h5>완료</h5>
          <p>모든 처리 과정이 완료되었습니다.</p>
        </div>
      </form>
    </div>
    <div id="return-modal-footer" class="modal-footer">
    </div>
  </div>
</div>

<div id="promotion-modal" class="modal">
  <div class="modal-content" style="max-width: 700px">
    <div class="modal-header">
      <h3 id="promotion-modal-title">새 프로모션 등록</h3>
      <span class="close" onclick="closeAllModals()">&times;</span>
    </div>
    <div class="modal-body" style="max-height: 80vh; overflow-y: auto;">
      <form id="promotion-form" onsubmit="savePromotion(); return false;">
        <input type="hidden" id="promo-id" />
        <h4>기본 정보</h4>
        <table class="data-table">
          <tr>
            <th><label for="promo-name">프로모션 이름</label></th>
            <td colspan="3"><input type="text" id="promo-name" required /></td>
          </tr>
          <tr>
            <th><label for="promo-type">프로모션 유형</label></th>
            <td>
              <select id="promo-type" required onchange="onPromoTypeChange()">
                <option value="PRODUCT_DISCOUNT">상품 할인</option>
                <option value="CART_DISCOUNT">장바구니 할인</option>
                <option value="SHIPPING_DISCOUNT">배송비 할인</option>
                <option value="CARD_BENEFIT">카드사 혜택</option>
                <option value="CODE_COUPON">쿠폰 코드형</option>
              </select>
            </td>
            <th><label>상태</label></th>
            <td>
              <input type="radio" id="promo-active-y" name="promo_active" value="Y" checked /> <label
                    for="promo-active-y">활성</label>
              <input type="radio" id="promo-active-n" name="promo_active" value="N" /> <label
                    for="promo-active-n">비활성</label>
            </td>
          </tr>
          <tr class="manual-discount-field">
            <th><label for="promo-discount-type">할인 방식</label></th>
            <td>
              <select id="promo-discount-type">
                <option value="PERCENTAGE">비율(%) 할인</option>
                <option value="FIXED_AMOUNT">정액(원) 할인</option>
              </select>
            </td>
            <th><label for="promo-discount-value">할인 값</label></th>
            <td><input type="number" id="promo-discount-value" /></td>
          </tr>
          <tr id="coupon-link-field" style="display: none;">
            <th><label for="promo-linked-coupon">연동 쿠폰 선택</label></th>
            <td colspan="3">
              <select id="promo-linked-coupon" style="width:100%"></select>
            </td>
          </tr>
          <tr>
            <th><label for="promo-start-date">시작일시</label></th>
            <td><input type="datetime-local" id="promo-start-date" required /></td>
            <th><label for="promo-end-date">종료일시</label></th>
            <td><input type="datetime-local" id="promo-end-date" /></td>
          </tr>
        </table>

        <hr />
        <h4>프로모션 조건 설정</h4>
        <div id="promo-conditions-container">
        </div>
        <div class="form-group" style="display:flex; gap:10px; align-items:center;">
          <select id="promo-add-condition-type" style="width:auto; flex-grow:1;">
            <option value="MIN_PURCHASE_AMOUNT">최소 구매 금액</option>
            <option value="CARD_ISSUER">특정 카드사</option>
          </select>
          <button type="button" class="btn secondary btn-sm" onclick="addPromotionCondition()">+ 조건 추가</button>
        </div>

        <div id="promo-target-product-ui">
          <hr />
          <h4>프로모션 적용 대상</h4>
          <div class="form-group" style="max-height: 200px; overflow-y: auto; border: 1px solid #ddd; padding: 10px;">
            <div id="promo-product-list">
            </div>
          </div>
        </div>

      </form>
    </div>
    <div class="modal-footer">
      <button class="btn secondary" type="button" onclick="closeAllModals()">취소</button>
      <button class="btn info" type="submit" form="promotion-form">저장하기</button>
    </div>
  </div>
</div>

<div id="coupon-modal" class="modal">
  <div class="modal-content" style="max-width: 600px">
    <div class="modal-header">
      <h3 id="coupon-modal-title">새 쿠폰 발급</h3>
      <span class="close" onclick="closeAllModals()">&times;</span>
    </div>
    <div class="modal-body">
      <form id="coupon-form" onsubmit="saveCoupon(); return false;">
        <input type="hidden" id="coupon-id-hidden"/>
        <div class="form-group">
          <label for="coupon-name">쿠폰 이름</label>
          <input type="text" id="coupon-name" required />
        </div>
        <div class="form-group">
          <label for="coupon-code">쿠폰 코드</label>
          <div style="display: flex; gap: 10px;">
            <input type="text" id="coupon-code" required style="flex-grow: 1;" />
            <button type="button" class="btn secondary" onclick="generateCouponCode()">자동 생성</button>
          </div>
        </div>
        <div class="form-group">
          <label for="coupon-discount-type">할인 방식</label>
          <select id="coupon-discount-type" required>
            <option value="PERCENTAGE">비율(%) 할인</option>
            <option value="FIXED_AMOUNT">정액(원) 할인</option>
          </select>
        </div>
        <div class="form-group">
          <label for="coupon-discount-value">할인 값</label>
          <input type="number" id="coupon-discount-value" required />
        </div>
        <div class="form-group">
          <label for="coupon-min-purchase">최소 주문 금액 (선택)</label>
          <input type="number" id="coupon-min-purchase" placeholder="미입력 시 조건 없음" />
        </div>
        <div class="form-row date-fields">
          <div class="form-group">
            <label for="coupon-issue-start-date">발급 시작일 (선택)</label>
            <input type="date" id="coupon-issue-start-date" />
          </div>
          <div class="form-group">
            <label for="coupon-issue-end-date">발급 종료일 (선택)</label>
            <input type="date" id="coupon-issue-end-date" />
          </div>
        </div>
        <div class="form-group">
          <label for="coupon-valid-to">사용 기한 (선택)</label>
          <input type="date" id="coupon-valid-to" />
        </div>
        <div class="form-group">
          <label for="coupon-total-limit">총 발급 수량 (선택)</label>
          <input type="number" id="coupon-total-limit" placeholder="미입력 시 무제한" />
        </div>
        <div class="form-group">
          <label for="coupon-user-limit">인당 사용 가능 횟수 (선택)</label>
          <input type="number" id="coupon-user-limit" value="1" />
        </div>
        <div class="form-group">
          <label>상태</label>
          <input type="radio" id="coupon-active-y" name="coupon_active" value="Y" checked> <label
                for="coupon-active-y">활성</label>
          <input type="radio" id="coupon-active-n" name="coupon_active" value="N"> <label
                for="coupon-active-n">비활성</label>
        </div>
      </form>
    </div>
    <div class="modal-footer">
      <button class="btn secondary" type="button" onclick="closeAllModals()">취소</button>
      <button id="coupon-save-btn" type="submit" class="btn warning" form="coupon-form">발급하기</button>
    </div>
  </div>
</div>

<div id="QnA-modal" class="modal">
  <div class="modal-content" style="max-width: 600px">
    <div class="modal-header">
      <h3 id="QnA-modal-title">상품 QnA 답변</h3>
      <span class="close" onclick="closeAllModals()">&times;</span>
    </div>
    <div class="modal-body">
      <form id="QnA-form" onsubmit="saveQnAReply(); return false;">
        <input type="hidden" id="QnA-id" />
        <p>
          <strong>상품명:</strong> <span id="QnA-product-name"></span>
        </p>
        <p><strong>작성자:</strong> <span id="QnA-customer"></span></p>
        <hr />
        <h4>문의 내용</h4>
        <p id="QnA-question" style="
                background-color: #f8f9fa;
                padding: 10px;
                border-radius: 4px;
              "></p>
        <div class="form-group">
          <label for="QnA-answer">답변 작성</label>
          <textarea id="QnA-answer" rows="5"></textarea>
        </div>
      </form>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn secondary" onclick="closeAllModals()">
        닫기
      </button>
      <button type="submit" class="btn" id="QnA-save-btn" form="QnA-form">
        답변 저장
      </button>
    </div>
  </div>
</div>

<div id="inquiry-modal" class="modal">
  <div class="modal-content" style="max-width: 600px">
    <div class="modal-header">
      <h3 id="inquiry-modal-title">1:1 문의 답변</h3>
      <span class="close" onclick="closeAllModals()">&times;</span>
    </div>
    <div class="modal-body">
      <form id="inquiry-form" onsubmit="saveInquiryReply(); return false;">
        <input type="hidden" id="inquiry-id" />
        <p><strong>문의 유형:</strong> <span id="inquiry-type"></span></p>
        <p><strong>제목:</strong> <span id="inquiry-title"></span></p>
        <hr />
        <h4>문의 내용</h4>
        <p id="inquiry-question" style="
              background-color: #f8f9fa;
              padding: 10px;
              border-radius: 4px;
            "></p>
        <div class="form-group">
          <label for="inquiry-answer">답변 작성</label>
          <textarea id="inquiry-answer" rows="5"></textarea>
        </div>
      </form>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn secondary" onclick="closeAllModals()">
        닫기
      </button>
      <button type="submit" class="btn" id="inquiry-save-btn" form="inquiry-form">
        답변 저장
      </button>
    </div>
  </div>
</div>

<div id="review-details-modal" class="modal">
  <div class="modal-content" style="max-width: 700px;">
    <div class="modal-header">
      <h3>리뷰 상세 정보</h3>
      <span class="close" onclick="closeAllModals()">&times;</span>
    </div>
    <div class="modal-body">
      <h4>기본 정보</h4>
      <p><strong>상품명:</strong> <span id="review-product-name"></span></p>
      <p><strong>작성자:</strong> <span id="review-customer-name"></span></p>
      <p><strong>별점:</strong> <span id="review-rating"></span></p>
      <hr>
      <h4>리뷰 내용</h4>
      <div id="review-comment" style="background:#f9f9f9; padding:15px; border-radius:4px; min-height:80px; white-space:pre-wrap;"></div>
      <h4>첨부 사진</h4>
      <div id="review-images-container" style="display:flex; gap:10px; flex-wrap:wrap; margin-top:10px;">
      </div>
      <hr>
      <h4>판매자 댓글</h4>
      <div class="form-group">
        <textarea id="review-reply-content" rows="4" placeholder="고객의 리뷰에 댓글을 남겨보세요..."></textarea>
      </div>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn secondary" onclick="closeAllModals()">닫기</button>
      <button id="review-reply-save-btn" type="button" class="btn" onclick="saveReviewReply()">댓글 저장</button>
    </div>
  </div>
</div>
</body>

</html>