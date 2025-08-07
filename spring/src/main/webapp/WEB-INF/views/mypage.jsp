<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core"%>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>
<%@ taglib prefix="sec" uri="http://www.springframework.org/security/tags" %>

<!DOCTYPE html>
<html>
<head>
	<jsp:include page="/WEB-INF/views/common/meta.jsp" />
	<title>마이페이지 - 이거어때</title>

	<!-- 마이페이지 전용 CSS -->
	<link rel="stylesheet" href="${pageContext.request.contextPath}/resources/css/mypage.css" />

	<!-- 마이페이지 전용 JavaScript -->
	<script src="${pageContext.request.contextPath}/resources/js/mypage.js"></script>
	<script src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"></script>
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
				<span class="breadcrumb-separator">></span>
				<span>마이페이지</span>
			</nav>
		</div>
	</section>

	<!-- 마이페이지 헤더 섹션 -->
	<section class="mypage-header">
		<div class="container">
			<div class="mypage-header-content">
				<h1 class="mypage-title">마이페이지</h1>
				<c:if test="${not empty user}">
					<div class="user-welcome">
						<p>안녕하세요, <strong>${user.name}</strong>님!</p>
					</div>
				</c:if>
			</div>
		</div>
	</section>

	<!-- 마이페이지 컨텐츠 섹션 -->
	<section class="mypage-section">
		<div class="container">
			<div class="mypage-container">
				<!-- 사이드바 네비게이션 -->
				<nav class="mypage-nav">
					<ul>
						<li><a href="#member-info-content" class="nav-link active">회원 정보 관리</a></li>
						<li><a href="#order-history-content" class="nav-link">주문 내역</a></li>
						<li><a href="#coupon-history-content" class="nav-link">쿠폰 내역</a></li>
						<li><a href="#review-management-content" class="nav-link">리뷰 관리</a></li>
						<li><a href="#product-qna-content" class="nav-link">상품 문의 관리</a></li>
						<li><a href="#personal-inquiry-content" class="nav-link">1:1 문의 관리</a></li>
						<li><a href="#joined-gb-content" class="nav-link">내가 참여한 공동구매</a></li>
					</ul>
				</nav>

				<!-- 메인 컨텐츠 영역 -->
				<div class="mypage-content">
					<!-- 회원 정보 관리 -->
					<section id="member-info-content" class="content-section active">
						<h2>회원 정보 관리</h2>
						<c:if test="${not empty user}">
							<div class="info-card">
								<div class="card-header">
									<h3>기본 정보</h3>
								</div>
								<div class="card-body">
									<dl class="info-list">
										<dt>아이디</dt>
										<dd>${user.username}</dd>
										<dt>이름</dt>
										<dd>${user.name}</dd>
										<dt>이메일</dt>
										<dd>
											<div class="input-group">
												<input type="email" id="emailInput" class="form-control" value="${user.email}"/>
												<button class="btn btn-secondary" onclick="editInfo('email');">변경</button>
											</div>
										</dd>
										<dt>휴대폰 번호</dt>
										<dd>
											<div class="input-group">
												<input type="tel" id="phoneInput" class="form-control" value="${user.phone}"/>
												<button class="btn btn-secondary" onclick="editInfo('phone');">변경</button>
											</div>
										</dd>
									</dl>
								</div>
							</div>

							<div class="info-card">
								<div class="card-header">
									<h3>비밀번호 변경</h3>
								</div>
								<div class="card-body">
									<form id="passwordChangeForm" onsubmit="changePassword(); return false;">
										<div class="form-group">
											<label for="currentPassword">현재 비밀번호</label>
											<input type="password" id="currentPassword" class="form-control" required />
										</div>
										<div class="form-group">
											<label for="newPassword">새 비밀번호</label>
											<input type="password" id="newPassword" class="form-control" required />
										</div>
										<div class="form-group">
											<label for="confirmNewPassword">새 비밀번호 확인</label>
											<input type="password" id="confirmNewPassword" class="form-control" required />
										</div>
										<button type="submit" class="btn btn-primary">비밀번호 변경</button>
									</form>
								</div>
							</div>

							<div class="info-card">
								<div class="card-header">
									<h3>배송지 관리</h3>
									<button class="btn btn-primary btn-sm" onclick="addAddress()">새 배송지 추가</button>
								</div>
								<div class="card-body">
									<div class="shipping-addresses">
										<ul>
											<!-- 동적으로 로드됨 -->
										</ul>
									</div>
								</div>
							</div>

							<div class="info-card">
								<div class="card-header">
									<h3>마케팅 정보 수신 동의</h3>
								</div>
								<div class="card-body">
									<form id="marketing-consent-form" onsubmit="saveConsents(); return false;">
										<div class="form-check">
											<input type="checkbox" id="consent-email" class="form-check-input" name="consent_email" value="1" />
											<label for="consent-email" class="form-check-label">이메일 수신 동의 (할인/이벤트 정보)</label>
										</div>
										<div class="form-check">
											<input type="checkbox" id="consent-sms" class="form-check-input" name="consent_sms" value="1" />
											<label for="consent-sms" class="form-check-label">SMS/MMS 수신 동의 (할인/이벤트 정보)</label>
										</div>
										<button type="submit" class="btn btn-primary mt-3">동의 설정 저장</button>
									</form>
								</div>
							</div>

							<c:if test="${param.link_success != null}">
								<div id="link-success-alert" class="alert alert-success alert-dismissible fade show" role="alert">
										${param.link_success} 계정이 성공적으로 연동되었습니다.
									<button type="button" class="close" onclick="closeAlert('link-success-alert')">&times;</button>
								</div>
							</c:if>
							<c:if test="${param.link_error == 'already_linked'}">
								<div id="link-error-alert" class="alert alert-danger alert-dismissible fade show" role="alert">
									이미 다른 계정에 연동되어 있는 소셜 계정입니다.
									<button type="button" class="close" onclick="closeAlert('link-error-alert')">&times;</button>
								</div>
							</c:if>

							<div class="info-card">
								<div class="card-header">
									<h3>계정 관리</h3>
								</div>
								<div class="card-body">
									<!-- 소셜 계정 연동 섹션 추가 -->
									<div class="social-account-section">
										<h4>소셜 계정 연동</h4>
										<div id="social-accounts-container">
											<!-- 동적으로 로드됨 -->
										</div>
									</div>
									<hr style="margin: 20px 0;">

									<!-- 기존 회원 탈퇴 링크 -->
									<a href="#" onclick="requestAccountDeactivation()" class="text-danger">회원 탈퇴</a>
								</div>
							</div>
						</c:if>
					</section>

					<!-- 주문 내역 -->
					<section id="order-history-content" class="content-section">
						<h2>주문 내역</h2>
						<div class="tabs">
							<button data-tab="solo-orders" class="tab-button active">단독 구매</button>
							<button data-tab="group-orders" class="tab-button">공동 구매 참여 (나의 주문)</button>
						</div>

						<div class="tab-content active" id="solo-orders">
							<div class="order-filter">
								<label for="solo-status-filter">주문 상태:</label>
								<select id="solo-status-filter" class="form-select" onchange="filterOrdersByStatus('solo', this.value)">
									<option value="">전체</option>
									<option value="PENDING_PAYMENT">결제 대기</option>
									<option value="PAID">결제 완료</option>
									<option value="PREPARING">배송 준비중</option>
									<option value="SHIPPED">배송중</option>
									<option value="DELIVERED">배송 완료</option>
									<option value="CONFIRMED">구매 확정</option>
									<option value="CANCELLED">취소</option>
									<option value="REFUNDED">환불 완료</option>
								</select>
								<button class="btn btn-primary btn-sm" onclick="filterOrdersByStatus('solo', document.getElementById('solo-status-filter').value)">
									필터 적용
								</button>
								<button class="btn btn-secondary btn-sm" onclick="clearOrderFilter('solo')">
									전체 보기
								</button>
								<button class="btn btn-success btn-sm" onclick="refreshOrderList('solo')" title="목록 새로고침">
									↻ 새로고침
								</button>
							</div>

							<div class="order-cards-container" id="solo-orders-container">
								<!-- 동적으로 채워질 카드들 -->
							</div>

							<!-- 페이징 UI -->
							<div class="pagination-wrapper">
								<div id="solo-pagination-info" class="pagination-info"></div>
								<div id="solo-pagination" class="pagination-container"></div>
								<div class="pagination-controls">
									<div class="page-jump">
										<span>페이지 이동:</span>
										<input type="number" id="solo-page-input" placeholder="페이지" min="1"
											   onkeypress="handlePageInputKeyPress(event, 'solo')">
										<button class="btn btn-sm btn-secondary" onclick="goToSoloPage()">이동</button>
									</div>
									<div class="page-size-selector">
										<span>페이지당 표시:</span>
										<select class="form-select form-select-sm" onchange="changeOrdersPerPage('solo', this.value)">
											<option value="5" selected>5개</option>
											<option value="10">10개</option>
											<option value="20">20개</option>
											<option value="50">50개</option>
										</select>
									</div>
								</div>
							</div>
						</div>

						<div class="tab-content" id="group-orders">
							<div class="order-filter">
								<label for="group-status-filter">주문 상태:</label>
								<select id="group-status-filter" class="form-select" onchange="filterOrdersByStatus('group', this.value)">
									<option value="">전체</option>
									<option value="PENDING_PAYMENT">결제 대기</option>
									<option value="PAID">결제 완료</option>
									<option value="PREPARING">배송 준비중</option>
									<option value="SHIPPED">배송중</option>
									<option value="DELIVERED">배송 완료</option>
									<option value="CONFIRMED">구매 확정</option>
									<option value="CANCELLED">취소</option>
									<option value="REFUNDED">환불 완료</option>
								</select>
								<button class="btn btn-primary btn-sm" onclick="filterOrdersByStatus('group', document.getElementById('group-status-filter').value)">
									필터 적용
								</button>
								<button class="btn btn-secondary btn-sm" onclick="clearOrderFilter('group')">
									전체 보기
								</button>
								<button class="btn btn-success btn-sm" onclick="refreshOrderList('group')" title="목록 새로고침">
									↻ 새로고침
								</button>
							</div>

							<div class="order-cards-container" id="group-orders-container">
								<!-- 동적으로 채워질 카드들 -->
							</div>

							<!-- 페이징 UI -->
							<div class="pagination-wrapper">
								<div id="group-pagination-info" class="pagination-info"></div>
								<div id="group-pagination" class="pagination-container"></div>
								<div class="pagination-controls">
									<div class="page-jump">
										<span>페이지 이동:</span>
										<input type="number" id="group-page-input" placeholder="페이지" min="1"
											   onkeypress="handlePageInputKeyPress(event, 'group')">
										<button class="btn btn-sm btn-secondary" onclick="goToGroupPage()">이동</button>
									</div>
									<div class="page-size-selector">
										<span>페이지당 표시:</span>
										<select class="form-select form-select-sm" onchange="changeOrdersPerPage('group', this.value)">
											<option value="5" selected>5개</option>
											<option value="10">10개</option>
											<option value="20">20개</option>
											<option value="50">50개</option>
										</select>
									</div>
								</div>
							</div>
						</div>

						<div id="orders-loading" class="loading" style="display: none;">
							주문 목록을 불러오는 중입니다...
						</div>
					</section>

					<!-- 쿠폰 내역 -->
					<section id="coupon-history-content" class="content-section">
						<h2>쿠폰 내역</h2>

						<div class="info-card">
							<div class="card-header">
								<h3>쿠폰 등록</h3>
							</div>
							<div class="card-body">
								<div class="coupon-input-group">
									<input type="text" id="coupon-code-input" class="form-control" placeholder="쿠폰 번호를 입력하세요" maxlength="20">
									<button class="btn btn-primary" onclick="addCoupon()">추가</button>
								</div>
								<p class="coupon-add-message" id="coupon-add-message"></p>
							</div>
						</div>

						<div class="info-card">
							<div class="card-header">
								<h3>사용 가능한 쿠폰</h3>
							</div>
							<div class="card-body">
								<div class="table-responsive">
									<table class="coupon-table">
										<thead>
										<tr>
											<th>쿠폰 번호</th>
											<th>쿠폰명</th>
											<th>할인율/액</th>
											<th>발급일자</th>
											<th>사용기간</th>
										</tr>
										</thead>
										<tbody id="coupon-list-body">
										<!-- 동적으로 로드됨 -->
										</tbody>
									</table>
								</div>
							</div>
						</div>
					</section>

					<!-- 리뷰 관리 -->
					<section id="review-management-content" class="content-section">
						<h2>리뷰 관리</h2>
						<div class="content-controls">
							<button class="btn btn-success btn-sm" onclick="refreshGenericList('reviews')" title="목록 새로고침">
								↻ 새로고침
							</button>
						</div>
						<div id="reviews-container">
							<!-- 동적으로 로드됨 -->
						</div>
					</section>

					<!-- 상품 문의 관리 -->
					<section id="product-qna-content" class="content-section">
						<h2>상품 문의 관리</h2>
						<div class="content-controls">
							<button class="btn btn-success btn-sm" onclick="refreshGenericList('qna')" title="목록 새로고침">
								↻ 새로고침
							</button>
						</div>
						<div id="product-qna-container">
							<!-- 동적으로 로드됨 -->
						</div>
					</section>

					<!-- 1:1 문의 관리 -->
					<section id="personal-inquiry-content" class="content-section">
						<h2>1:1 문의 관리</h2>
						<div class="content-controls">
							<button class="btn btn-success btn-sm" onclick="refreshGenericList('inquiry')" title="목록 새로고침">
								↻ 새로고침
							</button>
						</div>
						<div id="personal-inquiry-container">
							<!-- 동적으로 로드됨 -->
						</div>
					</section>

					<!-- 내가 참여한 공동구매 -->
					<section id="joined-gb-content" class="content-section">
						<h2>내가 참여한 공동구매</h2>
						<div class="content-controls">
							<button class="btn btn-success btn-sm" onclick="refreshParticipatedGB()" title="목록 새로고침">
								↻ 새로고침
							</button>
						</div>

						<div class="participated-gb-cards-container" id="joined-gb-container">
							<!-- 동적으로 로드됨 -->
						</div>

						<!-- 페이징 UI -->
						<div class="pagination-wrapper">
							<div id="participated-gb-pagination-info" class="pagination-info"></div>
							<div id="participated-gb-pagination" class="pagination-container"></div>
							<div class="pagination-controls">
								<div class="page-jump">
									<span>페이지 이동:</span>
									<input type="number" id="participated-gb-page-input" placeholder="페이지" min="1"
										   onkeypress="handleParticipatedGBPageInputKeyPress(event)">
									<button class="btn btn-sm btn-secondary" onclick="goToParticipatedGBPage()">이동</button>
								</div>
								<div class="page-size-selector">
									<span>페이지당 표시:</span>
									<select class="form-select form-select-sm" onchange="changeParticipatedGBPerPage(this.value)">
										<option value="5">5개</option>
										<option value="10" selected>10개</option>
										<option value="20">20개</option>
										<option value="50">50개</option>
									</select>
								</div>
							</div>
						</div>

						<div id="participated-gb-loading" class="loading" style="display: none;">
							공동구매 목록을 불러오는 중입니다...
						</div>
					</section>
				</div>
			</div>
		</div>
	</section>
</main>

<!-- 공통 푸터 -->
<jsp:include page="/WEB-INF/views/common/footer.jsp" />

<!-- 모달들 -->
<!-- 배송지 추가/수정 모달 -->
<div id="address-modal" class="modal">
	<div class="modal-content">
		<div class="modal-header">
			<h3 id="address-modal-title">새 주소 추가</h3>
			<span class="close" onclick="closeAddressModal()">&times;</span>
		</div>
		<div class="modal-body">
			<form id="address-form" onsubmit="saveAddress(); return false;">
				<input type="hidden" id="address-id" value="">

				<div class="form-group">
					<label for="address-label">배송지명</label>
					<input type="text" id="address-label" class="form-control" placeholder="예: 집, 회사, 학교 등">
				</div>

				<div class="form-group">
					<label for="recipient-name">이름 <span class="required">*</span></label>
					<input type="text" id="recipient-name" class="form-control" placeholder="홍길동" required>
					<div class="error-message" id="name-error">올바른 이름을 입력하세요</div>
				</div>

				<div class="form-group">
					<label for="recipient-phone">휴대폰 번호 <span class="required">*</span></label>
					<input type="text" id="recipient-phone" class="form-control" placeholder="-를 제외하고 입력하세요" required>
					<div class="error-message" id="phone-error">정확한 휴대폰 번호를 입력하세요</div>
				</div>

				<div class="form-group">
					<label for="address-search">주소 <span class="required">*</span></label>
					<div class="address-search-group">
						<input type="text" id="address-display" class="form-control" readonly placeholder="우편 번호 검색 후, 사용할 수 있습니다">
						<button type="button" class="btn btn-secondary" onclick="searchAddress()">우편번호</button>
					</div>
					<input type="hidden" id="address-data" value="">
				</div>

				<div class="form-group">
					<label for="address-detail">상세 주소</label>
					<input type="text" id="address-detail" class="form-control" placeholder="건물, 아파트, 동/호수 입력">
				</div>

				<div class="form-check">
					<input type="checkbox" id="is-default-address" class="form-check-input" name="is_default">
					<label for="is-default-address" class="form-check-label">기본 배송지로 설정</label>
				</div>

				<div class="form-actions">
					<button type="button" class="btn btn-secondary" onclick="closeAddressModal()">취소</button>
					<button type="submit" id="save-address-btn" class="btn btn-primary" disabled>저장하기</button>
				</div>
			</form>
		</div>
	</div>
</div>

<!-- 주문 상세 모달 -->
<div id="order-detail-modal" class="modal">
	<div class="modal-content">
		<div class="modal-header">
			<h3>주문 상세 정보</h3>
			<span class="close" onclick="closeOrderDetailModal()">&times;</span>
		</div>
		<div class="modal-body">
			<!-- 동적으로 렌더링됨 -->
		</div>
	</div>
</div>

<!-- 리뷰 수정 모달 -->
<div id="review-edit-modal" class="modal">
	<div class="modal-content">
		<div class="modal-header">
			<h3>리뷰 수정</h3>
			<span class="close" onclick="closeReviewEditModal()">&times;</span>
		</div>
		<div class="modal-body">
			<form id="review-edit-form">
				<div class="review-product-info">
					<div class="review-product-name" id="review-product-name">상품명</div>
					<div class="review-product-details" id="review-product-details">상품 옵션 정보</div>
				</div>

				<div class="form-group">
					<label>별점 <span class="required">*</span></label>
					<div class="star-rating" id="review-star-rating">
						<span class="star" data-rating="1">★</span>
						<span class="star" data-rating="2">★</span>
						<span class="star" data-rating="3">★</span>
						<span class="star" data-rating="4">★</span>
						<span class="star" data-rating="5">★</span>
					</div>
				</div>

				<div class="form-group">
					<label for="review-content">리뷰 내용 <span class="required">*</span></label>
					<textarea id="review-content" class="form-control review-content-textarea"
							  placeholder="상품에 대한 솔직한 후기를 작성해 주세요."
							  maxlength="1000" required></textarea>
					<div class="char-count">0 / 1000자</div>
				</div>

				<div class="review-images-section">
					<div class="form-group">
						<label>기존 첨부 이미지</label>
						<div id="existing-images-container">
							<div class="existing-images" id="existing-images">
								<!-- 기존 이미지들이 동적으로 추가됩니다 -->
							</div>
							<div class="no-existing-images" id="no-existing-images" style="display: none;">
								첨부된 이미지가 없습니다.
							</div>
						</div>
					</div>

					<div class="form-group">
						<label>새 이미지 추가</label>
						<div class="new-images-section" id="new-images-section">
							<input type="file" id="new-images-input" class="image-upload-input"
								   accept="image/*" multiple>
							<label for="new-images-input" class="image-upload-label">
								이미지 선택
							</label>
							<div class="image-upload-text">
								또는 이미지를 여기로 드래그하세요<br>
								<small>최대 5장, 각 파일 최대 5MB</small>
							</div>
							<div class="new-images-preview" id="new-images-preview">
								<!-- 새로 선택된 이미지 미리보기가 표시됩니다 -->
							</div>
						</div>
					</div>
				</div>
			</form>
		</div>
		<div class="modal-actions">
			<button type="button" class="btn btn-secondary" onclick="closeReviewEditModal()">취소</button>
			<button type="button" class="btn btn-primary" onclick="saveReviewEdit()">저장</button>
		</div>
	</div>
</div>

<!-- 공동구매 상세 모달 -->
<div id="group-buy-detail-modal" class="modal">
	<div class="modal-content">
		<div class="modal-header">
			<h3>공동구매 상세 정보</h3>
			<span class="close" onclick="closeGroupBuyDetailModal()">&times;</span>
		</div>
		<div class="modal-body" id="group-buy-detail-body">
			<!-- 동적으로 채워질 내용 -->
		</div>
	</div>
</div>

</body>
</html>