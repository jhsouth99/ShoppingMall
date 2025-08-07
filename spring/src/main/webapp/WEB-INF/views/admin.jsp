<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="sec" uri="http://www.springframework.org/security/tags" %>
<!DOCTYPE html>
<html lang="ko">

<head>
    <meta charset="UTF-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <meta name="_csrf" content="${_csrf.token}"/>
    <meta name="_csrf_header" content="${_csrf.headerName}"/>
    <title>관리자 페이지</title>

    <link rel="stylesheet" href="/ecommerce/resources/css/admin.css"/>
    <script src="/ecommerce/resources/js/admin.js"></script>
</head>

<body>
<aside class="admin-sidebar">
    <div class="sidebar-header">
        <h1>관리자 시스템</h1>
        <div class="admin-info">
            <sec:authentication property="principal.username" var="adminId" />
            <span class="admin-name">${adminId}</span>
            <span class="admin-role">관리자</span>
        </div>
    </div>

    <nav class="sidebar-nav">
        <ul>
            <li><a href="#dashboard" class="nav-link active">대시보드</a></li>
            <li><a href="#groupbuy-management" class="nav-link">공동구매 관리</a></li>
            <li><a href="#order-management" class="nav-link">주문 관리</a></li>
            <li><a href="#coupon-management" class="nav-link">쿠폰 관리</a></li>
            <li><a href="#user-management" class="nav-link">사용자 관리</a></li>
            <li><a href="#seller-account-management" class="nav-link">판매자 계정 관리</a></li>
            <li><a href="#category-management" class="nav-link">카테고리 관리</a></li>
            <li><a href="#attribute-management" class="nav-link">속성 관리</a></li>
        </ul>
    </nav>

    <div class="sidebar-footer">
        <div class="sidebar-actions">
            <a href="/ecommerce/" class="action-btn home-btn" title="홈으로 이동">
                <span class="btn-icon">🏠</span>
                <span class="btn-text">홈으로</span>
            </a>
            <form action="/ecommerce/perform-logout" method="post" class="logout-form">
                <input type="hidden" name="${_csrf.parameterName}" value="${_csrf.token}"/>
                <button type="submit" class="action-btn logout-btn" title="로그아웃">
                    <span class="btn-icon">🚪</span>
                    <span class="btn-text">로그아웃</span>
                </button>
            </form>
        </div>
    </div>
</aside>

<main class="admin-main">
    <section id="dashboard"
             class="content-section active">
        <h2>대시보드</h2>
        <div class="dashboard-cards">
            <div class="card today-sales">
                <h3>매출 (오늘)</h3>
                <div class="value" id="dashboard-today-sales"></div>
            </div>
            <%--<div class="card group-buys">

         <h3>진행중인 공동구매</h3>
                <div class="value" id="dashboard-group-buys"></div>
            </div>--%>
            <div class="card orders">
                <h3>새 주문 (오늘)</h3>
                <div class="value" id="dashboard-orders"></div>

            </div>
            <div class="card users">
                <h3>신규 가입 회원 (오늘)</h3>
                <div class="value" id="dashboard-new-users"></div>
            </div>
            <div class="card reports">
                <h3>미처리 신고</h3>

                <div class="value" id="dashboard-reports"></div>
            </div>
        </div>
        <p>이곳에 주요 지표나 요약 정보를 표시할 수 있습니다.</p>
    </section>

    <section id="groupbuy-management" class="content-section">
        <h2>공동구매 관리</h2>
        <div class="filter-controls">
            <input type="text" placeholder="상품명 또는 생성자 검색..."/>

            <select>
                <option value="">상태 전체</option>
                <option value="PENDING">시작 전</option>
                <option value="ONGOING">진행 중</option>
                <option value="SUCCESS">성공</option>
                <option value="FAILED">실패</option>

            </select>
            <button class="btn btn-secondary btn-sm">검색</button>
        </div>
        <table class="data-table">
            <thead>
            <tr>
                <th>ID</th>
                <th>상품명</th>

                <th>생성자</th>
                <th>목표/현재</th>
                <th>시작일</th>
                <th>종료일</th>
                <th>상태</th>
                <th>작업</th>

            </tr>
            </thead>
            <tbody>
            <tr>
                <td>GB201</td>
                <td>[공동구매] 대용량 보조배터리</td>
                <td>user_A</td>

                <td>50 / 55</td>
                <td>2025-04-15</td>
                <td>2025-04-25</td>
                <td><span style="color: green">성공</span></td>
                <td class="actions">
                    <button class="btn btn-secondary btn-sm" onclick="viewGroupBuy('GB201')">

                        상세
                    </button>
                </td>
            </tr>
            <tr>
                <td>GB202</td>

                <td>[공동구매] 스마트 워치</td>
                <td>admin_01</td>
                <td>100 / 30</td>
                <td>2025-04-22</td>
                <td>2025-05-05</td>
                <td><span style="color: blue">진행
중</span></td>
                <td class="actions">
                    <button class="btn btn-secondary btn-sm" onclick="viewGroupBuy('GB202')">
                        상세
                    </button>

                </td>
            </tr>
            <tr>
                <td>GB200</td>
                <td>[공동구매] 접이식 키보드</td>
                <td>user_B</td>
                <td>30 / 10</td>

                <td>2025-04-10</td>
                <td>2025-04-20</td>
                <td><span style="color: red">실패</span></td>
                <td class="actions">
                    <button class="btn btn-secondary btn-sm" onclick="viewGroupBuy('GB200')">

                        상세
                    </button>
                </td>
            </tr>
            </tbody>
        </table>

        <div id="groupBuyDetailModal" class="modal">

            <div class="modal-content">
                <div class="modal-header">
                    <h3>공동구매 상세 정보</h3>
                    <span class="close-modal">&times;</span>
                </div>

                <div class="modal-body">
                    <div class="gb-detail-container">
                        <div class="gb-info-section">

                            <h4>기본 정보</h4>
                            <p><strong>ID:</strong> <span id="gb-id"></span></p>
                            <p><strong>제목:</strong> <span id="gb-title"></span></p>
                            <p><strong>생성자:</strong> <span id="gb-creator"></span></p>

                            <p><strong>상태:</strong> <span id="gb-status"></span></p>

                            <div class="gb-thumbnail">
                                <img src="/api/placeholder/400/320" alt="공동구매 상품 이미지">

                            </div>
                        </div>

                        <div class="gb-info-section">

                            <h4>공동구매 정보</h4>
                            <p><strong>목표 수량:</strong> <span id="gb-target"></span>개</p>
                            <p><strong>현재 수량:</strong> <span id="gb-current"></span>개</p>

                            <p><strong>시작일:</strong> <span id="gb-start-date"></span></p>
                            <p><strong>종료일:</strong> <span id="gb-end-date"></span></p>

                            <div class="progress-container">
                                <div id="gb-progress-bar" class="progress-bar"></div>
                                <div id="gb-progress-text" class="progress-text"></div>

                            </div>
                        </div>

                        <div class="gb-info-section">

                            <h4>가격 정보</h4>
                            <div class="price-comparison">
                                <span class="original-price">정가: <span id="gb-original-price"></span></span>

                                <span class="current-price">판매가: <span id="gb-price"></span></span>
                                <span class="discount-rate"><span id="gb-discount-rate"></span> 할인</span>
                            </div>
                        </div>


                        <div class="gb-info-section">
                            <h4>옵션 정보</h4>

                            <div id="gb-options">
                            </div>
                        </div>


                        <div class="gb-info-section full-width">
                            <h4>상품 설명</h4>

                            <div class="gb-description" id="gb-description">
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    </section>

    <section id="order-management" class="content-section">
        <h2>주문 관리</h2>
        <div class="filter-controls">
            <input type="text" placeholder="주문번호 또는 사용자 검색..."/>

            <select>
                <option value="">상태 전체</option>
                <option value="PENDING_PAYMENT">결제 대기</option>
                <option value="PROCESSING">처리중</option>
                <option value="SHIPPED">배송중</option>
                <option value="DELIVERED">배송 완료</option>

                <option value="CANCELLED">취소</option>
                <option value="REFUNDED">환불</option>
            </select>
            <select>
                <option value="">유형 전체</option>
                <option value="solo">단독구매</option>

                <option value="group">공동구매</option>
            </select>
            <button class="btn btn-secondary btn-sm">검색</button>
        </div>
        <table class="data-table">
            <thead>
            <tr>
                <th>주문번호</th>

                <th>사용자</th>
                <th>주문일</th>
                <th>상품(개수)</th>
                <th>총 금액</th>
                <th>유형</th>
                <th>상태</th>

                <th>작업</th>
            </tr>
            </thead>
            <tbody>
            <tr>
                <td>S20250422001</td>
                <td>홍길동(user_gildong)</td>

                <td>2025-04-22</td>
                <td>일반 상품 A (1)</td>
                <td>55,000원</td>
                <td>단독</td>
                <td>배송 준비중</td>
                <td class="actions">

                    <button class="btn btn-secondary btn-sm" onclick="viewOrder('S20250422001')">
                        상세
                    </button>
                </td>
            </tr>
            <tr>

                <td>G20250420005</td>
                <td>김철수(user_chulsu)</td>
                <td>2025-04-20</td>
                <td>[공동구매] 특별 상품 D (1)</td>
                <td>45,000원</td>
                <td>공동</td>

                <td>상품 준비중 (성공)</td>
                <td class="actions">
                    <button class="btn btn-secondary btn-sm" onclick="viewOrder('G20250420005')">
                        상세
                    </button>

                </td>
            </tr>
            </tbody>
        </table>

        <div id="orderDetailModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">

                    <h3>주문 상세 정보</h3>
                    <span class="close-modal">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="order-detail-container">

                        <div class="order-info-section">
                            <h4>주문 정보</h4>
                            <p><strong>주문번호:</strong> <span id="order-id">S20250422001</span></p>

                            <p><strong>주문 일시:</strong> <span id="order-date">2025-04-22 14:30:25</span></p>
                            <p><strong>주문 상태:</strong> <span id="order-status">배송 준비중</span></p>
                            <p><strong>주문 유형:</strong> <span id="order-type">단독</span></p>
                        </div>


                        <div class="order-info-section">
                            <h4>구매자 정보</h4>
                            <p><strong>아이디:</strong> <span id="buyer-id">user_gildong</span></p>

                            <p><strong>이름:</strong> <span id="buyer-name">홍길동</span></p>
                            <p><strong>연락처:</strong> <span id="buyer-phone">010-1234-5678</span></p>
                            <p><strong>주소:</strong> <span id="buyer-address">서울특별시 강남구 테헤란로 123, 456동 789호</span>

                            </p>
                        </div>

                        <div class="order-info-section full-width">
                            <h4>상품 정보</h4>

                            <div id="order-products">
                                <div class="product-item">
                                    <p><strong>상품 번호:</strong> P001</p>

                                    <p><strong>상품명:</strong> 일반 상품 A</p>
                                    <p><strong>옵션:</strong> 기본 옵션</p>
                                    <p><strong>가격:</strong> 55,000원 x
                                        1개 = 55,000원</p>
                                </div>
                            </div>
                        </div>


                        <div class="order-info-section">
                            <h4>결제 정보</h4>
                            <p><strong>상품 금액:</strong> <span id="product-price">55,000원</span></p>
                            <p><strong>배송비:</strong>
                                <span id="shipping-fee">3,000원</span></p>
                            <p><strong>할인 금액:</strong> <span id="discount-amount">0원</span></p>
                            <p><strong>총 결제 금액:</strong> <span id="total-amount">58,000원</span></p>
                            <p><strong>결제 방법:</strong> <span id="payment-method">신용카드</span></p>

                            <p><strong>결제 상태:</strong> <span id="payment-status">결제 완료</span></p>
                        </div>

                        <div class="order-info-section">

                            <h4>배송 정보</h4>
                            <p><strong>택배사:</strong> <span id="courier-name">CJ대한통운</span></p>
                            <p><strong>운송장 번호:</strong> <span id="tracking-number">12345678901</span></p>
                            <p><strong>배송 상태:</strong> <span id="shipping-status">배송 준비중</span></p>

                            <p><strong>발송일:</strong> <span id="shipping-date">-</span></p>
                            <p><strong>도착 예정일:</strong> <span id="arrival-date">-</span></p>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    </section>

    <section id="coupon-management" class="content-section">
        <h2>쿠폰 관리</h2>
        <button class="btn btn-primary" onclick="addCoupon()">+ 새 쿠폰 등록</button>

        <div class="filter-controls">
            <input type="text" placeholder="쿠폰명 검색..."/>

            <select>
                <option value="">상태 전체</option>
                <option value="active">활성</option>
                <option value="inactive">비활성</option>
            </select>
            <button class="btn btn-secondary btn-sm">검색</button>
        </div>


        <div class="coupon-table-container">
            <table class="data-table">
                <thead>
                <tr>
                    <th>번호</th>
                    <th>쿠폰번호</th>

                    <th>쿠폰명</th>
                    <th>할인율/액</th>
                    <th>사용횟수</th>
                    <th>발급기간</th>
                    <th>사용기간</th>

                    <th>작업</th>
                </tr>
                </thead>
                <tbody>
                </tbody>
            </table>
            <div class="pagination">

                <a href="#" class="prev-page">◀</a>
                <a href="#" class="page-number active">1</a>
                <a href="#" class="page-number">2</a>
                <a href="#" class="page-number">3</a>
                <a href="#" class="next-page">▶</a>

            </div>
        </div>

        <div id="couponModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>쿠폰 생성</h3>

                    <span class="close-modal">&times;</span>
                </div>
                <div class="modal-body">
                    <form id="couponForm">
                        <div class="form-group">

                            <label for="coupon-code">쿠폰 번호</label>
                            <input type="text" id="coupon-code" placeholder="영문, 숫자 조합으로 입력해주세요."
                                   required>
                        </div>

                        <div class="form-group">
                            <label for="coupon-name">쿠폰이름</label>

                            <input type="text" id="coupon-name" placeholder="20자 이내로 작성해주세요."
                                   maxlength="20"
                                   required>
                        </div>

                        <div class="form-row">

                            <div class="form-group">
                                <label for="coupon-count">쿠폰수량</label>
                                <input type="number" id="coupon-count" min="1" value="1" required>

                            </div>
                            <div class="form-group">
                                <label for="discount-rate">할인율(%)</label>

                                <input type="number" id="discount-rate" min="1" max="100" value="10" required>
                            </div>
                        </div>

                        <div class="form-row date-fields">

                            <div class="form-group">
                                <label for="issue-start-date">발급시작일</label>
                                <input type="date" id="issue-start-date" required>

                            </div>
                            <div class="form-group">
                                <label for="issue-end-date">발급종료일</label>

                                <input type="date" id="issue-end-date" required>
                            </div>
                        </div>

                        <div class="form-row date-fields">

                            <div class="form-group">
                                <label for="usage-start-date">사용시작일</label>
                                <input type="date" id="usage-start-date" required>

                            </div>
                            <div class="form-group">
                                <label for="usage-end-date">사용종료일</label>

                                <input type="date" id="usage-end-date" required>
                            </div>
                        </div>

                        <div class="form-buttons">

                            <button type="submit" class="btn btn-primary">생성</button>
                            <button type="button" class="btn btn-secondary" id="cancelCoupon">취소</button>
                        </div>
                    </form>

                </div>
            </div>
        </div>

        <div id="editCouponModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">

                    <h3>쿠폰 수정</h3>
                    <span class="close-modal">&times;</span>
                </div>
                <div class="modal-body">
                    <form id="editCouponForm">

                        <input type="hidden" id="edit-coupon-id">
                        <div class="form-group">
                            <label for="edit-coupon-code">쿠폰 번호</label>
                            <input type="text" id="edit-coupon-code" placeholder="영문, 숫자 조합으로 입력해주세요."
                                   required>
                        </div>

                        <div class="form-group">
                            <label for="edit-coupon-name">쿠폰이름</label>

                            <input type="text" id="edit-coupon-name" placeholder="20자 이내로 작성해주세요."
                                   maxlength="20"
                                   required>
                        </div>

                        <div class="form-row">

                            <div class="form-group">
                                <label for="edit-coupon-count">쿠폰수량</label>
                                <input type="number" id="edit-coupon-count" min="1" required>

                            </div>
                            <div class="form-group">
                                <label for="edit-discount-rate">할인율(%)</label>

                                <input type="number" id="edit-discount-rate" min="1" max="100" required>
                            </div>
                        </div>

                        <div class="form-row date-fields">

                            <div class="form-group">
                                <label for="edit-issue-start-date">발급시작일</label>
                                <input type="date" id="edit-issue-start-date" required>

                            </div>
                            <div class="form-group">
                                <label for="edit-issue-end-date">발급종료일</label>

                                <input type="date" id="edit-issue-end-date" required>
                            </div>
                        </div>

                        <div class="form-row date-fields">

                            <div class="form-group">
                                <label for="edit-usage-start-date">사용시작일</label>
                                <input type="date" id="edit-usage-start-date" required>

                            </div>
                            <div class="form-group">
                                <label for="edit-usage-end-date">사용종료일</label>

                                <input type="date" id="edit-usage-end-date" required>
                            </div>
                        </div>

                        <div class="form-buttons">

                            <button type="submit" class="btn btn-primary">수정</button>
                            <button type="button" class="btn btn-secondary" id="cancelEditCoupon">취소</button>
                        </div>
                    </form>

                </div>
            </div>
        </div>
    </section>

    <section id="user-management" class="content-section">
        <h2>사용자 관리</h2>
        <div class="user-tabs">
            <button data-tab="all-users" class="user-tab-button active">
                전체 사용자

            </button>
            <button data-tab="reported-users" class="user-tab-button">
                신고 관리
            </button>
        </div>

        <div id="all-users" class="user-tab-content active">
            <h3>전체 사용자 목록</h3>
            <div class="filter-controls">

                <input type="text" placeholder="아이디, 이름, 이메일 검색..."/>
                <select>
                    <option value="">상태 전체</option>
                    <option value="active">활성</option>
                    <option value="suspended">정지</option>

                </select>
                <button class="btn btn-secondary btn-sm">검색</button>
            </div>
            <table class="data-table">
                <thead>
                <tr>

                    <th>ID</th>
                    <th>이름</th>
                    <th>이메일</th>
                    <th>가입일</th>
                    <th>상태</th>

                    <th>작업</th>
                </tr>
                </thead>
                <tbody>
                <tr>
                    <td>user_gildong</td>

                    <td>홍길동</td>
                    <td>gildong@email.com</td>
                    <td>2025-01-10</td>
                    <td>활성</td>
                    <td class="actions">

                        <button class="btn btn-secondary btn-sm" onclick="viewUser('user_gildong')">
                            상세
                        </button>
                        <button class="btn btn-warning btn-sm" onclick="suspendUser('user_gildong')">

                            정지
                        </button>
                    </td>
                </tr>

                <tr>
                    <td>user_chulsu</td>
                    <td>김철수</td>
                    <td>chulsu@email.com</td>
                    <td>2025-02-15</td>

                    <td>활성</td>
                    <td class="actions">
                        <button class="btn btn-secondary btn-sm" onclick="viewUser('user_chulsu')">
                            상세

                        </button>
                        <button class="btn btn-warning btn-sm" onclick="suspendUser('user_chulsu')">
                            정지
                        </button>

                    </td>
                </tr>
                <tr>
                    <td>user_test</td>
                    <td>테스트</td>
                    <td>test@email.com</td>

                    <td>2025-03-01</td>
                    <td><span style="color: red">정지</span></td>
                    <td class="actions">
                        <button class="btn btn-secondary btn-sm" onclick="viewUser('user_test')">

                            상세
                        </button>
                        <button class="btn btn-primary btn-sm" onclick="activateUser('user_test')">
                            활성화

                        </button>
                    </td>
                </tr>
                </tbody>
            </table>
        </div>

        <div id="reported-users" class="user-tab-content">

            <h3>신고된 사용자 및 내용</h3>
            <div class="filter-controls">
                <select>
                    <option value="">상태 전체</option>
                    <option value="PENDING">처리 대기</option>
                    <option value="REVIEWING">처리 중</option>

                    <option value="RESOLVED">처리 완료</option>
                    <option value="REJECTED">거절됨</option>
                </select>
                <button class="btn btn-secondary btn-sm">검색</button>
            </div>
            <table class="data-table">

                <thead>
                <tr>
                    <th>신고 ID</th>
                    <th>신고된 사용자</th>
                    <th>신고자</th>

                    <th>신고일</th>
                    <th>사유 요약</th>
                    <th>상태</th>
                    <th>작업</th>
                </tr>
                </thead>

                <tbody>
                <tr>
                    <td>R101</td>
                    <td>user_abuser</td>
                    <td>user_normal</td>

                    <td>2025-04-21</td>
                    <td>부적절한 언어 사용...</td>
                    <td>처리 대기</td>
                    <td class="actions">
                        <button class="btn btn-secondary
btn-sm" onclick="viewReport('R101')">
                            상세 보기
                        </button>
                        <button class="btn btn-warning btn-sm" onclick="processReport('R101')">

                            처리하기
                        </button>
                    </td>
                </tr>
                <tr>

                    <td>R102</td>
                    <td>user_spammer</td>
                    <td>user_gildong</td>
                    <td>2025-04-22</td>
                    <td>홍보성 게시글 도배...</td>

                    <td>처리 대기</td>
                    <td class="actions">
                        <button class="btn btn-secondary btn-sm" onclick="viewReport('R102')">
                            상세 보기

                        </button>
                        <button class="btn btn-warning btn-sm" onclick="processReport('R102')">
                            처리하기
                        </button>

                    </td>
                </tr>
                </tbody>
            </table>
        </div>

        <div id="reportDetailModal" class="modal">
            <div class="modal-content">

                <div class="modal-header">
                    <h3>신고 상세 정보</h3>
                    <span class="close-modal">&times;</span>
                </div>
                <div class="modal-body">

                    <div class="report-detail-container">
                        <div class="report-info-section full-width">
                            <h4>신고 정보</h4>
                            <p><strong>신고 ID:</strong> <span id="report-id">R101</span></p>

                            <p><strong>신고 일시:</strong> <span id="report-date">2025-04-21 14:30:25</span></p>
                            <p><strong>신고 상태:</strong> <span id="report-status" class="status-pending">처리 대기</span>
                            </p>

                        </div>

                        <div class="report-info-section">
                            <h4>신고 대상 정보</h4>
                            <p><strong>아이디:</strong> <span
                                    id="opponent-id">user_abuser</span></p>
                            <p><strong>이름:</strong> <span id="opponent-name">김불량</span></p>
                            <p><strong>이메일:</strong> <span id="opponent-email">abuser@email.com</span></p>
                            <p><strong>연락처:</strong> <span id="opponent-phone">010-8675-4321</span></p>

                        </div>

                        <div class="report-info-section">
                            <h4>신고자 정보</h4>
                            <p><strong>아이디:</strong> <span id="reporter-id">user_normal</span></p>

                            <p><strong>이름:</strong> <span id="reporter-name">이정상</span></p>
                            <p><strong>이메일:</strong> <span id="reporter-email">normal@email.com</span></p>
                            <p><strong>연락처:</strong> <span id="reporter-phone">010-1234-5678</span></p>

                        </div>

                        <div class="report-info-section full-width">
                            <h4>신고 사유</h4>
                            <p><strong>요약:</strong> <span>부적절한 언어 사용</span></p>

                            <p><strong>상세 내용:</strong> <span>커뮤니티 게시판에서 지속적으로 타 사용자에게 욕설과 비하 발언을 하고 있습니다.
특히 특정 사용자를
										지속적으로 괴롭히는 행동이 목격되었습니다.</span></p>
                        </div>

                        <div class="report-info-section full-width">
                            <h4>증거 자료</h4>

                            <ul>
                                <li>게시판 댓글 #1254에서 욕설 사용</li>
                                <li>채팅방에서 부적절한 발언 스크린샷</li>

                                <li>다수의 사용자가 유사한 내용으로 신고</li>
                            </ul>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    </section>

    <section id="seller-account-management" class="content-section">
        <h2>판매자 계정 관리</h2>
        <div class="filter-controls">
            <input type="text" placeholder="판매자 ID, 상점명 검색..."/>
            <select>

                <option value="">상태 전체</option>
                <option value="pending">승인 대기</option>
                <option value="approved">승인 완료 (활동중)</option>
                <option value="suspended">이용 정지</option>
            </select>
            <button class="btn btn-secondary btn-sm">검색</button>
        </div>

        <table class="data-table">
            <thead>
            <tr>
                <th>판매자 ID</th>
                <th>상점명</th>
                <th>담당자</th>
                <th>연락처</th>

                <th>사업자번호</th>
                <th>가입(신청)일</th>
                <th>상태</th>
                <th>작업</th>
            </tr>
            </thead>
            <tbody>

            <tr>
                <td>seller_A</td>
                <td>A 스토어</td>
                <td>김판매</td>
                <td>010-1111-2222</td>
                <td>111-22-33333</td>

                <td>2025-04-20</td>
                <td><span class="status-approved">승인 완료</span></td>
                <td class="actions">
                    <button class="btn btn-secondary btn-sm" onclick="viewSellerDetails('seller_A')">
                        상세

                    </button>
                    <button class="btn btn-danger btn-sm" onclick="suspendSeller('seller_A')">
                        정지
                    </button>
                </td>
            </tr>

            <tr>
                <td>seller_B_pending</td>
                <td>B 스토어 (준비중)</td>
                <td>박준비</td>
                <td>010-3333-4444</td>
                <td>222-33-44444</td>

                <td>2025-04-22</td>
                <td><span class="status-pending">승인 대기</span></td>
                <td class="actions">
                    <button class="btn btn-secondary btn-sm" onclick="viewSellerDetails('seller_B_pending')">
                        상세

                    </button>
                    <button class="btn btn-success btn-sm" onclick="approveSeller('seller_B_pending')">
                        승인
                    </button>

                    <button class="btn btn-danger btn-sm" onclick="rejectSeller('seller_B_pending')">
                        거절
                    </button>
                </td>
            </tr>
            <tr>

                <td>seller_C_suspended</td>
                <td>C 스토어</td>
                <td>최정지</td>
                <td>010-5555-6666</td>
                <td>333-44-55555</td>
                <td>2025-03-10</td>

                <td><span class="status-suspended">이용 정지</span></td>
                <td class="actions">
                    <button class="btn btn-secondary btn-sm" onclick="viewSellerDetails('seller_C_suspended')">
                        상세
                    </button>

                    <button class="btn btn-primary btn-sm" onclick="activateSeller('seller_C_suspended')">
                        활성화
                    </button>
                </td>
            </tr>
            </tbody>

        </table>
    </section>

    <%-- ===================================================================================== --%>
    <%-- ============================ 카테고리 관리 섹션 (속성 연결 기능 추가) ============================ --%>
    <%-- ===================================================================================== --%>
    <section id="category-management" class="content-section">
        <h2>카테고리 관리</h2>
        <div class="toolbar">
            <button class="btn btn-primary" id="addTopCategoryBtn">+ 새 최상위 카테고리 추가</button>
            <p class="description">카테고리 목록을 드래그하여 순서를 변경할 수 있습니다. (구현 예정)</p>
        </div>

        <div class="category-tree-container">
            <table class="data-table category-table">
                <thead>
                <tr>
                    <th class="col-name">카테고리명</th>
                    <th class="col-id">ID</th>
                    <th class="col-products">상품 수</th>
                    <th class="col-actions">작업</th>
                </tr>
                </thead>
                <tbody id="category-tree-body">
                <%-- 카테고리 트리 내용은 JavaScript로 동적 생성됩니다. --%>
                </tbody>
            </table>
        </div>
    </section>

    <%-- 카테고리 모달 (속성 연결 기능 추가) --%>
    <div id="categoryModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3 id="categoryModalTitle">카테고리 추가</h3>
                <span class="close-modal">&times;</span>
            </div>
            <div class="modal-body">
                <form id="categoryForm">
                    <input type="hidden" id="categoryId" name="id">
                    <input type="hidden" id="parentId" name="parentId">

                    <div class="form-group">
                        <label>상위 카테고리</label>
                        <input type="text" id="parentCategoryName" disabled>
                    </div>

                    <div class="form-group">
                        <label for="categoryName">카테고리명</label>
                        <input type="text" id="categoryName" name="name" placeholder="카테고리 이름을 입력하세요" required>
                    </div>

                    <div class="form-group">
                        <label for="categoryDescription">카테고리 설명</label>
                        <textarea id="categoryDescription" name="description" rows="4"
                                  placeholder="카테고리에 대한 설명을 입력하세요"></textarea>
                    </div>

                    <div class="form-group">
                        <label for="categoryImageUrl">이미지 URL</label>
                        <input type="text" id="categoryImageUrl" name="imageUrl"
                               placeholder="카테고리 대표 이미지 URL을 입력하세요">
                    </div>

                    <%-- 속성 연결 섹션 추가 --%>
                    <div class="form-group category-attributes-section">
                        <label>이 카테고리에 적용할 속성</label>
                        <div class="attributes-loading" id="attributesLoading">속성 목록을 불러오는 중...</div>
                        <div class="attributes-container" id="attributesContainer" style="display: none;">
                            <div class="attributes-grid" id="attributesGrid">
                                <%-- 속성 체크박스들이 동적으로 생성됩니다 --%>
                            </div>
                        </div>
                    </div>

                    <div class="form-buttons">
                        <button type="submit" class="btn btn-primary">저장</button>
                        <button type="button" class="btn btn-secondary close-modal">취소</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <%-- ===================================================================================== --%>
    <%-- ================================ 속성 관리 섹션 (신규 추가) ================================ --%>
    <%-- ===================================================================================== --%>
    <section id="attribute-management" class="content-section">
        <h2>속성 관리</h2>

        <div class="toolbar">
            <button class="btn btn-primary" id="addAttributeBtn">+ 새 속성 추가</button>
            <p class="description">상품의 속성을 정의하고 관리합니다. (색상, 사이즈, 브랜드 등)</p>
        </div>

        <div class="filter-controls">
            <input type="text" id="attributeSearchInput" placeholder="속성명 검색..."/>
            <select id="attributeDataTypeFilter">
                <option value="">데이터 타입 전체</option>
                <option value="TEXT">텍스트</option>
                <option value="NUMBER">숫자</option>
                <option value="BOOLEAN">불린</option>
                <option value="DATE">날짜</option>
                <option value="LIST">목록</option>
            </select>
            <select id="attributeGroupFilter">
                <option value="">속성 그룹 전체</option>
                <option value="기본정보">기본정보</option>
                <option value="사이즈정보">사이즈정보</option>
                <option value="성능정보">성능정보</option>
                <option value="디자인정보">디자인정보</option>
            </select>
            <button class="btn btn-secondary btn-sm" id="attributeSearchBtn">검색</button>
        </div>

        <table class="data-table" id="attributeTable">
            <thead>
            <tr>
                <th class="col-id">ID</th>
                <th class="col-name">속성명</th>
                <th class="col-data-type">데이터 타입</th>
                <th class="col-group">속성 그룹</th>
                <th class="col-searchable">검색 가능</th>
                <th class="col-required">필수</th>
                <th class="col-options">옵션 수</th>
                <th class="col-actions">작업</th>
            </tr>
            </thead>
            <tbody id="attributeTableBody">
            <%-- 속성 목록은 JavaScript로 동적 생성됩니다. --%>
            </tbody>
        </table>
    </section>

    <%-- 속성 생성/수정 모달 --%>
    <div id="attributeModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3 id="attributeModalTitle">속성 추가</h3>
                <span class="close-modal">&times;</span>
            </div>
            <div class="modal-body">
                <form id="attributeForm">
                    <input type="hidden" id="attributeId" name="id">

                    <div class="form-row">
                        <div class="form-group">
                            <label for="attributeName">속성명 *</label>
                            <input type="text" id="attributeName" name="name" placeholder="예: 색상, 사이즈, 브랜드" required>
                        </div>
                        <div class="form-group">
                            <label for="attributeGroup">속성 그룹</label>
                            <select id="attributeGroup" name="attributeGroup">
                                <option value="">그룹 선택</option>
                                <option value="기본정보">기본정보</option>
                                <option value="사이즈정보">사이즈정보</option>
                                <option value="성능정보">성능정보</option>
                                <option value="디자인정보">디자인정보</option>
                                <option value="기타">기타</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="attributeDataType">데이터 타입 *</label>
                            <select id="attributeDataType" name="dataType" required>
                                <option value="">타입 선택</option>
                                <option value="TEXT">텍스트 (자유 입력)</option>
                                <option value="NUMBER">숫자</option>
                                <option value="BOOLEAN">불린 (예/아니오)</option>
                                <option value="DATE">날짜</option>
                                <option value="LIST">목록 (선택형)</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="attributeDisplayOrder">표시 순서</label>
                            <input type="number" id="attributeDisplayOrder" name="displayOrder" min="0" value="0">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="attributeIsSearchable" name="isSearchable">
                                검색 필터로 사용 가능
                            </label>
                        </div>
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="attributeIsRequired" name="isRequired">
                                필수 입력 속성
                            </label>
                        </div>
                    </div>

                    <%-- LIST 타입일 때만 보이는 옵션 관리 섹션 --%>
                    <div class="form-group" id="attributeOptionsSection" style="display: none;">
                        <label>속성 옵션값 (LIST 타입)</label>
                        <div class="options-container">
                            <div class="options-input-area">
                                <input type="text" id="newOptionValue" placeholder="옵션값 입력 (예: 빨강, 파랑, 노랑)">
                                <button type="button" class="btn btn-secondary btn-sm" id="addOptionBtn">추가</button>
                            </div>
                            <div class="options-list" id="optionsList">
                                <%-- 옵션 목록이 동적으로 생성됩니다 --%>
                            </div>
                        </div>
                    </div>

                    <div class="form-buttons">
                        <button type="submit" class="btn btn-primary">저장</button>
                        <button type="button" class="btn btn-secondary close-modal">취소</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <%-- 속성 옵션 관리 모달 --%>
    <div id="attributeOptionsModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3 id="attributeOptionsModalTitle">속성 옵션 관리</h3>
                <span class="close-modal">&times;</span>
            </div>
            <div class="modal-body">
                <div class="attribute-info">
                    <p><strong>속성명:</strong> <span id="optionAttributeName"></span></p>
                    <p><strong>데이터 타입:</strong> <span id="optionAttributeDataType"></span></p>
                </div>

                <div class="options-input-area">
                    <input type="text" id="newOptionValueForModal" placeholder="새 옵션값 입력">
                    <button type="button" class="btn btn-primary btn-sm" id="addOptionForModalBtn">추가</button>
                </div>

                <div class="options-table-container">
                    <table class="data-table options-table">
                        <thead>
                        <tr>
                            <th>옵션값</th>
                            <th>표시 순서</th>
                            <th>작업</th>
                        </tr>
                        </thead>
                        <tbody id="optionsTableBody">
                        <%-- 옵션 목록이 동적으로 생성됩니다 --%>
                        </tbody>
                    </table>
                </div>

                <div class="form-buttons">
                    <button type="button" class="btn btn-secondary close-modal">닫기</button>
                </div>
            </div>
        </div>
    </div>

</main>
</body>
</html>