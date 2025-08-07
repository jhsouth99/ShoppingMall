// JSP 헤더에서 CSRF 토큰과 헤더 이름을 전역 변수로 가져오기
const csrfToken = document.querySelector("meta[name='_csrf']")?.getAttribute("content");
const csrfHeader = document.querySelector("meta[name='_csrf_header']")?.getAttribute("content");

/**
 * =================================================================
 * 헬퍼(Helper) 및 공용 함수
 * =================================================================
 */

/**
 * CSRF 토큰을 포함한 fetch 요청을 보내는 헬퍼 함수
 */
async function fetchWithCsrf(url, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...options.headers
    };
    if (csrfToken && csrfHeader) {
        headers[csrfHeader] = csrfToken;
    }

    try {
        const response = await fetch(contextPath + url, { ...options, headers });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'HTTP 에러: ' + response.status }));
            throw new Error(errorData.message || '서버에서 응답을 받지 못했습니다.');
        }
        if (response.status === 204 || response.headers.get('Content-Length') === '0') {
            return true;
        }
        return await response.json();
    } catch (error) {
        console.error('API 요청 실패:', url, error);
        alert('오류가 발생했습니다: ' + error.message);
        return null;
    }
}

/**
 * 알림 메시지 닫기 함수
 */
function closeAlert(alertId) {
    const alertElement = document.getElementById(alertId);
    if (alertElement) {
        // 페이드 아웃 효과
        alertElement.style.transition = 'opacity 0.3s ease';
        alertElement.style.opacity = '0';

        // 애니메이션 후 요소 제거
        setTimeout(() => {
            alertElement.remove();
        }, 300);
    }
}

// 페이지 로드 시 자동으로 알림 메시지 숨기기
document.addEventListener('DOMContentLoaded', function() {
    // 5초 후 자동으로 알림 메시지 숨기기
    setTimeout(() => {
        const alerts = document.querySelectorAll('.alert.alert-dismissible');
        alerts.forEach(alert => {
            if (alert.id === 'link-success-alert' || alert.id === 'link-error-alert') {
                closeAlert(alert.id);
            }
        });
    }, 5000);
});

/**
 * 배송지 목록 데이터를 받아와서 화면에 렌더링하는 함수
 * @param {Array} addresses - 서버에서 받아온 배송지 DTO 목록
 */
function renderAddresses(addresses) {
    const addressesContainer = document.querySelector(".shipping-addresses ul");
    if (!addressesContainer) return;

    // 기존 배송지 목록을 비웁니다.
    addressesContainer.innerHTML = "";

    if (addresses && addresses.length > 0) {
        addresses.forEach(address => {
            const li = document.createElement("li");

            // 1. 기본 배송지 뱃지 및 주소 별칭 생성
            let titleHtml = '';
            if (address.isDefault) {
                titleHtml += '<span class="default-badge">기본 배송지</span>';
            }
            titleHtml += '<strong>[' + address.name + ']</strong> (' + address.recipientName + ')';

            // 2. 주소 상세 정보 생성
            const addressDetailsHtml = '<div class="address-details">' +
                address.phone + '<br/>' +
                '(' + address.zipcode + ') ' + address.address + ', ' + address.addressDetail +
                '</div>';

            // 3. 버튼 생성
            let buttonsHtml = '';
            if (!address.isDefault) {
                buttonsHtml += '<button class="button-style" onclick="setDefaultAddress(' + address.id + ')">기본 배송지로 설정</button>';
            }
            buttonsHtml += '<button class="button-style secondary" onclick="openAddressModal(\'edit\', ' + address.id + ')">수정</button>';
            buttonsHtml += '<button class="button-style danger" onclick="deleteAddress(' + address.id + ')">삭제</button>';

            // 4. 생성된 모든 HTML을 li 요소에 삽입
            li.innerHTML = titleHtml + addressDetailsHtml + buttonsHtml;
            addressesContainer.appendChild(li);
        });
    } else {
        addressesContainer.innerHTML = '<p style="text-align:center; color:#666;">등록된 배송지가 없습니다.</p>';
    }
}

/** 날짜 포맷팅 함수 (YYYY-MM-DD) */
function formatDate(dateString) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ko-KR').split('T')[0];
}

/** 숫자 포맷팅 함수 (1,000 단위 콤마) */
function formatNumber(num) {
    return num ? num.toLocaleString('ko-KR') : '0';
}

/**
 * =================================================================
 * 페이징 관련 전역 변수
 * =================================================================
 */

// 주문 내역 페이징
let currentSoloPage = 1;
let currentGroupPage = 1;
let soloOrdersTotalPages = 1;
let groupOrdersTotalPages = 1;
let ordersPerPage = 5;

// 리뷰 관리 페이징
let currentReviewPage = 1;
let reviewTotalPages = 1;
let reviewsPerPage = 5;

// 상품 문의 페이징
let currentQnaPage = 1;
let qnaTotalPages = 1;
let qnaPerPage = 5;

// 1:1 문의 페이징
let currentInquiryPage = 1;
let inquiryTotalPages = 1;
let inquiryPerPage = 5;

/**
 * =================================================================
 * 각 탭별 데이터 로딩 및 UI 렌더링 함수
 * =================================================================
 */

// --- 회원 정보 탭 ---
async function loadMemberInfo() {
    // 배송지 목록 동적 로드
    const addresses = await fetchWithCsrf('/api/user/shipping-addresses');
    if (addresses) renderAddresses(addresses);

    // 마케팅 동의 정보 동적 로드
    const consents = await fetchWithCsrf('/api/user/marketing-consents');
    if(consents) {
        document.getElementById('consent-email').checked = consents.emailConsent;
        document.getElementById('consent-sms').checked = consents.smsConsent;
    }

    // 소셜 계정 연동 정보 로드
    await loadSocialAccounts();
}

// 소셜 계정 목록 로드
async function loadSocialAccounts() {
    const accounts = await fetchWithCsrf('/api/user/social-accounts');
    renderSocialAccounts(accounts);
}

// 소셜 계정 UI 렌더링
function renderSocialAccounts(accounts) {
    const container = document.getElementById('social-accounts-container');
    if (!container) return;

    let html = '<div class="social-accounts-list">';

    // 지원하는 소셜 프로바이더 목록
    const providers = ['GOOGLE', 'NAVER', 'KAKAO'];

    providers.forEach(provider => {
        const isLinked = accounts && accounts.some(acc => acc.providerId.toUpperCase() === provider.toUpperCase());
        const providerName = getProviderDisplayName(provider);

        html += `
            <div class="social-account-item">
                <span class="provider-name">${providerName}</span>
                ${isLinked ?
            `<span class="status-linked">연동됨</span>
                     <button class="btn btn-sm btn-danger" onclick="unlinkSocialAccount('${provider}')">연동 해제</button>` :
            `<span class="status-unlinked">미연동</span>
                     <button class="btn btn-sm btn-primary" onclick="linkSocialAccount('${provider}')">연동하기</button>`
        }
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

// 소셜 계정 연동
function linkSocialAccount(provider) {
    // OAuth2 인증 URL로 리다이렉트
    window.location.href = `${contextPath}/oauth2/authorization/${provider.toLowerCase()}?mode=link`;
}

// 소셜 계정 연동 해제
async function unlinkSocialAccount(provider) {
    if (!confirm(`${getProviderDisplayName(provider)} 계정 연동을 해제하시겠습니까?`)) {
        return;
    }

    const result = await fetchWithCsrf(`/api/user/social-accounts/${provider}`, {
        method: 'DELETE'
    });

    if (result) {
        alert('소셜 계정 연동이 해제되었습니다.');
        loadSocialAccounts(); // 목록 새로고침
    }
}

// 프로바이더 표시명 반환
function getProviderDisplayName(provider) {
    const names = {
        'GOOGLE': '구글',
        'NAVER': '네이버',
        'KAKAO': '카카오'
    };
    return names[provider] || provider;
}

// --- 주문 내역 탭 ---
/**
 * 단독 구매 목록을 서버에서 불러와 렌더링하는 함수
 */
async function loadSoloOrders(page = 1) {
    try {
        const result = await fetchWithCsrf(`/api/user/orders/single?page=${page}&size=${ordersPerPage}`);
        if (result) {
            // 페이징 정보 업데이트
            currentSoloPage = page;
            soloOrdersTotalPages = result.totalPages || 1;

            // 주문 목록 렌더링
            renderOrderCards('solo-orders-container', result.content, 'solo');

            // 페이징 UI 렌더링
            renderOrderPagination('solo-pagination', currentSoloPage, soloOrdersTotalPages, loadSoloOrders);

            // 페이징 정보 표시
            updateOrderPaginationInfo('solo-pagination-info', page, result.totalElements, result.totalPages);
        }
    } catch (error) {
        console.error('단독 구매 목록 로드 실패:', error);
        alert('주문 목록을 불러오는데 실패했습니다.');
    }
}

/**
 * 공동구매 참여 목록을 서버에서 불러와 렌더링하는 함수
 */
async function loadGroupBuyOrders(page = 1) {
    try {
        const result = await fetchWithCsrf(`/api/user/orders/groupbuys?page=${page}&size=${ordersPerPage}`);
        if (result) {
            // 페이징 정보 업데이트
            currentGroupPage = page;
            groupOrdersTotalPages = result.totalPages || 1;

            // 주문 목록 렌더링
            renderOrderCards('group-orders-container', result.content, 'group');

            // 페이징 UI 렌더링
            renderOrderPagination('group-pagination', currentGroupPage, groupOrdersTotalPages, loadGroupBuyOrders);

            // 페이징 정보 표시
            updateOrderPaginationInfo('group-pagination-info', page, result.totalElements, result.totalPages);
        }
    } catch (error) {
        console.error('공동구매 주문 목록 로드 실패:', error);
        alert('공동구매 주문 목록을 불러오는데 실패했습니다.');
    }
}

// --- 쿠폰 내역 탭 ---
async function loadCoupons() {
    const coupons = await fetchWithCsrf('/api/user/coupons');
    const tbody = document.getElementById("coupon-list-body");
    tbody.innerHTML = '';
    if (coupons && coupons.length > 0) {
        coupons.forEach(coupon => {
            const discountText = coupon.discountType === 'PERCENTAGE' ? coupon.discountValue + '%' : formatNumber(coupon.discountValue) + '원';
            const rowHtml = '<tr>' +
                '<td>' + coupon.couponCode + '</td>' +
                '<td>' + coupon.name + '</td>' +
                '<td>' + discountText + '</td>' +
                '<td>' + formatDate(coupon.issuedAt) + '</td>' +
                '<td>' + formatDate(coupon.validFrom) + ' ~ ' + formatDate(coupon.validTo) + '</td>' +
                '</tr>';
            tbody.innerHTML += rowHtml;
        });
    } else {
        tbody.innerHTML = '<tr><td colspan="5" class="no-data">사용 가능한 쿠폰이 없습니다.</td></tr>';
    }
}

// --- 리뷰 관리 탭 ---
async function loadReviews(page = 1) {
    try {
        const result = await fetchWithCsrf(`/api/user/reviews?page=${page}&size=${reviewsPerPage}`);
        if (result) {
            // 페이징 정보 업데이트
            currentReviewPage = page;
            reviewTotalPages = result.totalPages || 1;

            // 리뷰 목록 렌더링
            renderReviews(result.content);

            // 페이징 UI 렌더링
            renderGenericPagination('reviews-pagination', currentReviewPage, reviewTotalPages, loadReviews);

            // 페이징 정보 표시
            updateGenericPaginationInfo('reviews-pagination-info', page, result.totalElements, result.totalPages, '리뷰');
        }
    } catch (error) {
        console.error('리뷰 목록 로드 실패:', error);
        alert('리뷰 목록을 불러오는데 실패했습니다.');
    }
}

function renderReviews(reviews) {
    const container = document.getElementById('reviews-container');
    if (!container) return;

    // 기존 내용 제거
    const existingPagination = container.querySelector('.pagination-wrapper');
    container.innerHTML = '';

    if (reviews && reviews.length > 0) {
        reviews.forEach(review => {
            const reviewHtml = `
                <div class="review-item">
                    <div class="review-header">
                        <div>
                            <strong>${review.productName}</strong>
                            <div class="review-rating">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</div>
                        </div>
                        <div class="review-date">${formatDate(review.createdAt)}</div>
                    </div>
                    <div class="review-content">
                        <strong>리뷰:</strong> ${review.comment}
                    </div>
                    ${review.imageUrls && review.imageUrls.length > 0 ? `
                        <div class="review-images">
                            ${review.imageUrls.map(img => `<img src="${contextPath}${img}" alt="리뷰 이미지" class="review-image" onclick="showImageModal('${contextPath}${img}')">`).join('')}
                        </div>
                    ` : ''}
                    ${review.reply ? `
                        <div class="qna-answer">
                            <strong>판매자 답변:</strong> ${review.reply}
                        </div>
                    ` : ''}
                    <div style="margin-top: 15px; padding-top: 12px; border-top: 1px solid #f0f0f0; display: flex; gap: 8px; flex-wrap: wrap;">
                        <button class="button-style secondary" onclick="editReview(${review.id})">수정</button>
                        <button class="button-style danger" onclick="deleteReview(${review.id})">삭제</button>
                    </div>
                </div>
            `;
            container.innerHTML += reviewHtml;
        });
    } else {
        container.innerHTML = '<div class="no-data">작성한 리뷰가 없습니다.</div>';
    }

    // 페이징 UI 추가
    addPaginationContainer(container, 'reviews');
}

// --- 상품 문의 관리 탭 ---
async function loadProductQnA(page = 1) {
    try {
        const result = await fetchWithCsrf(`/api/user/product-qnas?page=${page}&size=${qnaPerPage}`);
        if (result) {
            // 페이징 정보 업데이트
            currentQnaPage = page;
            qnaTotalPages = result.totalPages || 1;

            // QnA 목록 렌더링
            renderProductQnA(result.content);

            // 페이징 UI 렌더링
            renderGenericPagination('qna-pagination', currentQnaPage, qnaTotalPages, loadProductQnA);

            // 페이징 정보 표시
            updateGenericPaginationInfo('qna-pagination-info', page, result.totalElements, result.totalPages, '상품 문의');
        }
    } catch (error) {
        console.error('상품 문의 목록 로드 실패:', error);
        alert('상품 문의 목록을 불러오는데 실패했습니다.');
    }
}

function renderProductQnA(qnas) {
    const container = document.getElementById('product-qna-container');
    if (!container) return;

    // 기존 내용 제거
    container.innerHTML = '';

    if (qnas && qnas.length > 0) {
        qnas.forEach(qna => {
            const qnaHtml = `
                <div class="qna-item">
                    <div class="qna-header">
                        <div>
                            <strong>${qna.productName}</strong>
                            ${qna.isSecret ? '<span style="background: linear-gradient(135deg, #f8d7da, #f5c6cb) !important; color: #721c24 !important; padding: 4px 12px; border-radius: 16px; font-size: 12px; font-weight: 600; border: 1px solid #f5c6cb; white-space: nowrap; text-transform: uppercase; letter-spacing: 0.5px;">[비밀글]</span>' : ''}
                        </div>
                        <div class="qna-date">${formatDate(qna.questionedAt)}</div>
                    </div>
                    <div class="qna-content">
                        <strong>Q:</strong> ${qna.question}
                    </div>
                    ${qna.answer ? `
                        <div class="qna-answer">
                            <strong>A:</strong> ${qna.answer}
                            <div style="text-align: right; font-size: 12px; color: #6c757d; margin-top: 5px;">
                                답변일: ${formatDate(qna.answeredAt)}
                            </div>
                        </div>
                    ` : '<div style="background: linear-gradient(135deg, #fff3cd, #ffeaa7); border: 1px dashed #ffc107; border-radius: 6px; padding: 14px; margin-top: 12px; text-align: center; font-style: italic; color: #856404; font-size: 14px; font-weight: 500;">⏳ 답변 대기중</div>'}
                    <div style="margin-top: 15px; padding-top: 12px; border-top: 1px solid #f0f0f0; display: flex; gap: 8px; flex-wrap: wrap;">
                        <button class="button-style secondary" onclick="editProductQnA(${qna.id})">수정</button>
                        <button class="button-style danger" onclick="deleteProductQnA(${qna.id})">삭제</button>
                    </div>
                </div>
            `;
            container.innerHTML += qnaHtml;
        });
    } else {
        container.innerHTML = '<div class="no-data">작성한 상품 문의가 없습니다.</div>';
    }

    // 페이징 UI 추가
    addPaginationContainer(container, 'qna');
}

// --- 1:1 문의 관리 탭 ---
async function loadPersonalInquiry(page = 1) {
    try {
        const result = await fetchWithCsrf(`/api/user/inquiries?page=${page}&size=${inquiryPerPage}`);
        if (result) {
            // 페이징 정보 업데이트
            currentInquiryPage = page;
            inquiryTotalPages = result.totalPages || 1;

            // 문의 목록 렌더링
            renderPersonalInquiry(result.content);

            // 페이징 UI 렌더링
            renderGenericPagination('inquiry-pagination', currentInquiryPage, inquiryTotalPages, loadPersonalInquiry);

            // 페이징 정보 표시
            updateGenericPaginationInfo('inquiry-pagination-info', page, result.totalElements, result.totalPages, '1:1 문의');
        }
    } catch (error) {
        console.error('1:1 문의 목록 로드 실패:', error);
        alert('1:1 문의 목록을 불러오는데 실패했습니다.');
    }
}

function renderPersonalInquiry(inquiries) {
    const container = document.getElementById('personal-inquiry-container');
    if (!container) return;

    // 기존 내용 제거
    container.innerHTML = '';

    if (inquiries && inquiries.length > 0) {
        inquiries.forEach(inquiry => {
            const typeText = {
                'ORDER': '주문',
                'PRODUCT': '상품',
                'SHIPPING': '배송',
                'REFUND': '환불',
                'SELLER': '판매자',
                'OTHER': '기타'
            }[inquiry.inquiryType] || inquiry.type;

            const statusText = inquiry.status === 'ANSWERED' ? '답변 완료' : '답변 대기';
            const statusClass = inquiry.status === 'ANSWERED' ? 'status-success' : 'status-ongoing';

            const inquiryHtml = `
                <div class="inquiry-item">
                    <div class="inquiry-header">
                        <div>
                            <span style="background: linear-gradient(135deg, #e9ecef, #f8f9fa); color: #495057; padding: 4px 12px; border-radius: 16px; font-size: 12px; font-weight: 600; border: 1px solid #dee2e6; white-space: nowrap; text-transform: uppercase; letter-spacing: 0.5px;">${typeText}</span>
                            <strong style="margin-left: 8px;">${inquiry.title}</strong>
                        </div>
                        <div>
                            <span class="${statusClass}">${statusText}</span>
                            <span class="inquiry-date" style="margin-left: 8px;">${formatDate(inquiry.createdAt)}</span>
                        </div>
                    </div>
                    <div class="inquiry-content">
                        <strong>Q:</strong> ${inquiry.question}
                    </div>
                    ${inquiry.answer ? `
                        <div class="qna-answer">
                            <strong>A:</strong> ${inquiry.answer}
                            <div style="text-align: right; font-size: 12px; color: #6c757d; margin-top: 5px;">
                                답변일: ${formatDate(inquiry.answeredAt)}
                            </div>
                        </div>
                    ` : '<div style="background: linear-gradient(135deg, #fff3cd, #ffeaa7); border: 1px dashed #ffc107; border-radius: 6px; padding: 14px; margin-top: 12px; text-align: center; font-style: italic; color: #856404; font-size: 14px; font-weight: 500;">⏳ 답변 대기중</div>'}
                </div>
            `;
            container.innerHTML += inquiryHtml;
        });
    } else {
        container.innerHTML = '<div class="no-data">작성한 1:1 문의가 없습니다.</div>';
    }

    // 페이징 UI 추가
    addPaginationContainer(container, 'inquiry');
}

// 내가 참여한 공동구매 페이징 관련 전역 변수
let currentParticipatedGBPage = 1;
let participatedGBTotalPages = 1;
let participatedGBPerPage = 10;

/**
 * 내가 참여한 공동구매 목록을 서버에서 불러와 테이블에 렌더링
 */
async function loadParticipatedGroupBuys(page = 1) {
    try {
        const result = await fetchWithCsrf(`/api/user/orders/group-buys/participated?page=${page}&size=${participatedGBPerPage}`);
        if (!result) return;

        // 페이징 정보 업데이트
        currentParticipatedGBPage = page;
        participatedGBTotalPages = result.totalPages || 1;

        // 테이블 렌더링
        renderParticipatedGroupBuysCards(result.content);

        // 페이징 UI 렌더링
        renderGenericPagination('participated-gb-pagination', currentParticipatedGBPage, participatedGBTotalPages, loadParticipatedGroupBuys);

        // 페이징 정보 표시
        updateGenericPaginationInfo('participated-gb-pagination-info', page, result.totalElements, result.totalPages, '참여 공동구매');

    } catch (error) {
        console.error('참여한 공동구매 목록 로드 실패:', error);
        alert('참여한 공동구매 목록을 불러오는데 실패했습니다.');
    }
}

/**
 * 내가 참여한 공동구매 카드 렌더링
 */
function renderParticipatedGroupBuysCards(participations) {
    const container = document.getElementById('joined-gb-container');
    container.innerHTML = '';

    if (participations && participations.length > 0) {
        participations.forEach(gbp => {
            const card = createParticipatedGBCard(gbp);
            container.appendChild(card);
        });
    } else {
        container.innerHTML = '<div class="no-data">참여한 공동구매가 없습니다.</div>';
    }
}

/**
 * 참여한 공동구매 카드 생성
 */
function createParticipatedGBCard(gbp) {
    const card = document.createElement('div');
    card.className = 'participated-gb-card';

    const progressPercentage = gbp.targetQuantity > 0
        ? Math.min((gbp.currentQuantity / gbp.targetQuantity) * 100, 100)
        : 0;

    card.innerHTML = `
        <div class="participated-gb-header">
            <div class="participated-gb-title">
                <a href="javascript:void(0)" class="participated-gb-name" 
                   onclick="showGroupBuyDetail(${gbp.groupBuyId}, ${gbp.quantity || 0}, ${gbp.paidAmount || 0}, '${gbp.joinedAt}', '${gbp.myOrderNo || ''}')">
                    ${gbp.groupBuyName || '공동구매'}
                </a>
                <div class="participated-gb-product">
                    ${gbp.productName ? `상품: ${gbp.productName}` : ''}
                    ${gbp.optionCombination ? `<span class="product-options">${gbp.optionCombination}</span>` : ''}
                </div>
            </div>
            <div class="participated-gb-status">
                ${getParticipatedGBStatus(gbp)}
                ${gbp.myOrderNo && gbp.myOrderNo !== 'null' ?
        `<a href="javascript:void(0)" onclick="showOrderDetail('${gbp.myOrderNo}')">${gbp.myOrderNo}</a>` :
        '<span class="no-order">주문 생성 대기</span>'
    }
            </div>
        </div>
        
        <div class="participated-gb-body">
            <div class="participated-gb-info-item">
                <span class="participated-gb-label">참여일</span>
                <span class="participated-gb-value">${formatDate(gbp.joinedAt)}</span>
            </div>
            <div class="participated-gb-info-item">
                <span class="participated-gb-label">마감일</span>
                <span class="participated-gb-value">${formatDate(gbp.endDate)}</span>
            </div>
            <div class="participated-gb-info-item">
                <span class="participated-gb-label">구매수량</span>
                <span class="participated-gb-value">${gbp.quantity || 0}개</span>
            </div>
            <div class="participated-gb-info-item">
                <span class="participated-gb-label">결제금액</span>
                <span class="participated-gb-value">${formatNumber(gbp.paidAmount || 0)}원</span>
            </div>
        </div>
        
        ${gbp.currentQuantity !== undefined && gbp.targetQuantity !== undefined ? `
            <div class="participated-gb-progress">
                <div class="progress-bar-card">
                    <div class="progress-fill-card" style="width: ${progressPercentage}%"></div>
                </div>
                <div class="progress-text-card">
                    <span>${gbp.currentQuantity || 0}/${gbp.targetQuantity || 0}명</span>
                    <span>${progressPercentage.toFixed(1)}%</span>
                </div>
            </div>
        ` : ''}
        
        <div class="participated-gb-actions">
            ${getParticipatedGBActions(gbp)}
        </div>
    `;

    return card;
}

/**
 * 내가 참여한 공동구매 테이블 렌더링
 */
function renderParticipatedGroupBuysTable(participations) {
    const tbody = document.getElementById('joined-gb-tbody');
    tbody.innerHTML = '';

    if (participations && participations.length > 0) {
        participations.forEach(gbp => {
            const tr = document.createElement('tr');

            // 공동구매 정보 셀
            const groupBuyInfoHtml = renderParticipatedGroupBuyInfo(gbp);
            tr.innerHTML += `<td class="product-info-cell">${groupBuyInfoHtml}</td>`;

            // 참여일 - joinedAt 사용
            tr.innerHTML += `<td>${formatDate(gbp.joinedAt)}</td>`;

            // 마감일
            tr.innerHTML += `<td>${formatDate(gbp.endDate)}</td>`;

            // 진행 상태 (더 상세한 상태 표시)
            const statusHtml = getParticipatedGBStatus(gbp);
            tr.innerHTML += `<td>${statusHtml}</td>`;

            // 주문번호 - myOrderNo 사용
            const orderLink = gbp.orderNo && gbp.orderNo !== 'null'
                ? `<a href="javascript:void(0)" onclick="showOrderDetail('${gbp.orderNo}')">${gbp.orderNo}</a>`
                : '<span class="no-order">주문 생성 대기</span>';
            tr.innerHTML += `<td>${orderLink}</td>`;

            // 액션 버튼
            const actionButtons = getParticipatedGBActions(gbp);
            tr.innerHTML += `<td class="action-buttons">${actionButtons}</td>`;

            tbody.appendChild(tr);
        });
    } else {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="no-data">참여한 공동구매가 없습니다.</td>
            </tr>
        `;
    }
}

/**
 * 참여한 공동구매 액션 버튼
 */
function getParticipatedGBActions(gbp) {
    let buttons = '';

    // 공동구매 상세보기는 항상 제공
    buttons += `<button class="action-btn info-btn" 
                    onclick="showGroupBuyDetail(${gbp.groupBuyId}, ${gbp.quantity || 0}, ${gbp.paidAmount || 0}, '${gbp.joinedAt}', '${gbp.myOrderNo || ''}')">
                    상세보기
                </button>`;

    // 주문이 생성되었고 주문 상태가 있는 경우
    if (gbp.myOrderNo && gbp.myOrderNo !== 'null' && gbp.orderStatus) {
        // 배송 추적 (배송중/배송완료)
        if (['SHIPPED', 'DELIVERED'].includes(gbp.orderStatus)) {
            buttons += `<button class="action-btn tracking-btn" onclick="trackShipment('${gbp.myOrderNo}')">배송추적</button>`;
        }

        // 리뷰 작성 (배송완료 상태)
        if (gbp.orderStatus === 'DELIVERED' && !gbp.reviewWritten) {
            buttons += `<button class="action-btn review-btn" 
                            onclick="openReviewModal('${gbp.myOrderNo}', '${gbp.id}', '${gbp.productName || '상품'}')">
                            리뷰작성
                        </button>`;
        }
    }

    // 공동구매가 실패한 경우
    if (gbp.gbStatus === 'FAILED' /*&& gbp.refundStatus !== 'COMPLETED'*/) {
        buttons += `<button class="action-btn danger" onclick="checkRefundStatus('${gbp.orderNo}')">환불확인</button>`;
    }

    return buttons || '<span class="no-actions">-</span>';
}

/**
 * 환불 상태 확인
 */
async function checkRefundStatus(orderNo) {
    try {
        const orderDetail = await fetchWithCsrf(`/api/orders/${orderNo}/detail`);
        if (orderDetail && orderDetail.refunds && orderDetail.refunds.length > 0) {
            alert(`환불 상태: ${getRefundStatusText(orderDetail.refunds[0].status)}`);
        } else {
            alert('환불 정보를 확인할 수 없습니다. 고객센터에 문의해주세요.');
        }
    } catch (error) {
        console.error('환불 상태 확인 실패:', error);
        alert('환불 상태를 확인하는데 실패했습니다.');
    }
}

/**
 * 환불 상태를 한국어로 변환하는 함수
 */
function getRefundStatusText(status) {
    const statusMap = {
        'REQUESTED': '환불 요청',
        'APPROVED': '환불 승인',
        'PROCESSING': '환불 처리중',
        'COMPLETED': '환불 완료',
        'REJECTED': '환불 거부',
        'CANCELLED': '환불 취소',
        'NONE': '-'
    };
    return statusMap[status] || status;
}

/**
 * 참여한 공동구매 목록 새로고침
 */
function refreshParticipatedGB() {
    loadParticipatedGroupBuys(currentParticipatedGBPage);
}

/**
 * 참여한 공동구매 특정 페이지로 이동
 */
function goToParticipatedGBPage() {
    const pageInput = document.getElementById('participated-gb-page-input');
    const page = parseInt(pageInput.value);

    if (page && page >= 1 && page <= participatedGBTotalPages) {
        loadParticipatedGroupBuys(page);
        pageInput.value = '';
    } else {
        alert(`1부터 ${participatedGBTotalPages} 사이의 페이지 번호를 입력해주세요.`);
        pageInput.value = '';
    }
}

/**
 * 참여한 공동구매 페이지 크기 변경
 */
async function changeParticipatedGBPerPage(newSize) {
    const confirmChange = confirm(`페이지당 ${newSize}개씩 표시하시겠습니까?`);
    if (!confirmChange) return;

    const currentFirstItem = (currentParticipatedGBPage - 1) * participatedGBPerPage + 1;
    const newPage = Math.ceil(currentFirstItem / newSize);
    participatedGBPerPage = parseInt(newSize);
    await loadParticipatedGroupBuys(newPage);
}

/**
 * 참여한 공동구매 페이지 이동 (엔터 키)
 */
function handleParticipatedGBPageInputKeyPress(event) {
    if (event.key === 'Enter') {
        goToParticipatedGBPage();
    }
}

/**
 * 참여한 공동구매 상태 표시
 */
function getParticipatedGBStatus(gbp) {
    const statusMap = {
        'SUCCESS': { text: '성공', class: 'status-success' },
        'IN_PROGRESS': { text: '진행중', class: 'status-active' },
        'FAILED': { text: '실패', class: 'status-failed' },
        'PENDING': { text: '대기중', class: 'status-pending' },
        'ACTIVE': { text: '진행중', class: 'status-active' },
        'COMPLETED': { text: '성공', class: 'status-success' },
        'SUCCEEDED': { text: '성공', class: 'status-success' }
    };

    const statusInfo = statusMap[gbp.gbStatus] || { text: gbp.gbStatus || '알 수 없음', class: 'status-unknown' };

    // 주문 상태도 함께 표시
    let orderStatusHtml = '';
    if (gbp.orderStatus) {
        orderStatusHtml = `<br><small>${getOrderStatusDisplay(gbp.orderStatus)}</small>`;
    }

    return `<span class="${statusInfo.class}">${statusInfo.text}</span>${orderStatusHtml}`;
}

/**
 * 참여한 공동구매 정보 렌더링
 */
function renderParticipatedGroupBuyInfo(gbp) {
    // 진행률 계산 (currentQuantity, targetQuantity가 없을 수 있음)
    const progressPercentage = gbp.targetQuantity > 0
        ? Math.min((gbp.currentQuantity / gbp.targetQuantity) * 100, 100)
        : 0;

    // 기본 정보 표시
    const groupBuyName = gbp.groupBuyName || '공동구매';
    const quantity = gbp.quantity || 0;
    const paidAmount = gbp.paidAmount || 0;

    return `
        <div class="participated-gb-info-container">
            <div class="gb-main-info-with-image">
                ${gbp.productImageUrl ? `
                    <img src="${contextPath}${gbp.productImageUrl}" 
                         alt="${gbp.productName}" 
                         class="product-thumbnail" 
                         onerror="this.src='${contextPath}/resources/images/no-image.jpg'">
                ` : `
                    <img src="${contextPath}/resources/images/no-image.jpg" 
                         alt="상품 이미지 없음" 
                         class="product-thumbnail">
                `}
                
                <div class="gb-info-details">
                    <div class="gb-name-wrapper">
                        <a href="javascript:void(0)" class="gb-name" 
                           onclick="showGroupBuyDetail(${gbp.groupBuyId}, ${quantity}, ${paidAmount}, '${gbp.joinedAt}', '${gbp.myOrderNo || ''}')">
                            ${groupBuyName}
                        </a>
                    </div>
                    
                    ${gbp.productName ? `
                        <div class="product-info-compact">
                            <span class="product-label">상품:</span>
                            <a href="${contextPath}/products/${gbp.productId}" class="product-name-compact">${gbp.productName}</a>
                            ${gbp.optionCombination ? `<span class="product-options">${gbp.optionCombination}</span>` : ''}
                        </div>
                    ` : ''}
                    
                    <div class="participation-details">
                        <span class="detail-item">
                            <span class="label">구매수량:</span>
                            <span class="value">${quantity}개</span>
                        </span>
                        <span class="detail-item">
                            <span class="label">결제금액:</span>
                            <span class="value">${formatNumber(paidAmount)}원</span>
                        </span>
                    </div>
                    
                    ${gbp.currentQuantity !== undefined && gbp.targetQuantity !== undefined ? `
                        <div class="gb-progress-info">
                            <div class="progress-bar-small">
                                <div class="progress-fill-small" style="width: ${progressPercentage}%"></div>
                            </div>
                            <div class="progress-text-small">
                                ${gbp.currentQuantity || 0}/${gbp.targetQuantity || 0}명 
                                (${progressPercentage.toFixed(1)}%)
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}



/**
 * 서버에서 알림 설정 정보를 불러와 체크박스에 반영하는 함수
 */
async function loadNotifications() {
    const settings = await fetchWithCsrf('/api/user/notification-settings');
    if (!settings) return;

    // DTO의 필드명과 체크박스의 id를 일치시켜 동적으로 값을 설정합니다.
    document.getElementById('notify-gb-end').checked = settings.gbEnd;
    document.getElementById('notify-gb-success').checked = settings.gbSuccess;
    document.getElementById('notify-gb-fail').checked = settings.gbFail;
    document.getElementById('notify-order-shipped').checked = settings.orderShipped;
    document.getElementById('notify-refund-update').checked = settings.refundUpdate;
    document.getElementById('notify-my-gb-update').checked = settings.myGbUpdate;
}

/**
 * =================================================================
 * 페이징 관련 공통 함수
 * =================================================================
 */

/**
 * 주문 페이징 UI를 렌더링하는 함수
 */
function renderOrderPagination(containerId, currentPage, totalPages, loadFunction) {
    const container = document.getElementById(containerId);
    if (!container || totalPages <= 1) {
        if (container) container.innerHTML = '';
        return;
    }

    let paginationHtml = '<div class="pagination-container">';

    // 이전 페이지 버튼
    if (currentPage > 1) {
        paginationHtml += `
            <button class="pagination-btn prev-btn" onclick="${loadFunction.name}(${currentPage - 1})" title="이전 페이지">
                &laquo; 이전
            </button>
        `;
    }

    // 페이지 번호 버튼들
    const { startPage, endPage } = calculatePageRange(currentPage, totalPages);

    // 첫 페이지로 가는 버튼 (시작 페이지가 1이 아닌 경우)
    if (startPage > 1) {
        paginationHtml += `
            <button class="pagination-btn page-btn" onclick="${loadFunction.name}(1)">1</button>
        `;
        if (startPage > 2) {
            paginationHtml += '<span class="pagination-ellipsis">...</span>';
        }
    }

    // 페이지 번호 버튼들
    for (let i = startPage; i <= endPage; i++) {
        const isActive = i === currentPage ? 'active' : '';
        paginationHtml += `
            <button class="pagination-btn page-btn ${isActive}" onclick="${loadFunction.name}(${i})" ${i === currentPage ? 'disabled' : ''}>
                ${i}
            </button>
        `;
    }

    // 마지막 페이지로 가는 버튼 (끝 페이지가 총 페이지 수가 아닌 경우)
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHtml += '<span class="pagination-ellipsis">...</span>';
        }
        paginationHtml += `
            <button class="pagination-btn page-btn" onclick="${loadFunction.name}(${totalPages})">${totalPages}</button>
        `;
    }

    // 다음 페이지 버튼
    if (currentPage < totalPages) {
        paginationHtml += `
            <button class="pagination-btn next-btn" onclick="${loadFunction.name}(${currentPage + 1})" title="다음 페이지">
                다음 &raquo;
            </button>
        `;
    }

    paginationHtml += '</div>';
    container.innerHTML = paginationHtml;
}

/**
 * 리뷰/QnA/문의용 페이징 UI를 렌더링하는 함수
 */
function renderGenericPagination(containerId, currentPage, totalPages, loadFunction) {
    const container = document.getElementById(containerId);
    if (!container || totalPages <= 1) {
        if (container) container.innerHTML = '';
        return;
    }

    let paginationHtml = '<div class="pagination-container">';

    // 이전 페이지 버튼
    if (currentPage > 1) {
        paginationHtml += `
            <button class="pagination-btn prev-btn" onclick="${loadFunction.name}(${currentPage - 1})" title="이전 페이지">
                &laquo; 이전
            </button>
        `;
    }

    // 페이지 번호 버튼들
    const { startPage, endPage } = calculatePageRange(currentPage, totalPages);

    // 첫 페이지로 가는 버튼 (시작 페이지가 1이 아닌 경우)
    if (startPage > 1) {
        paginationHtml += `
            <button class="pagination-btn page-btn" onclick="${loadFunction.name}(1)">1</button>
        `;
        if (startPage > 2) {
            paginationHtml += '<span class="pagination-ellipsis">...</span>';
        }
    }

    // 페이지 번호 버튼들
    for (let i = startPage; i <= endPage; i++) {
        const isActive = i === currentPage ? 'active' : '';
        paginationHtml += `
            <button class="pagination-btn page-btn ${isActive}" onclick="${loadFunction.name}(${i})" ${i === currentPage ? 'disabled' : ''}>
                ${i}
            </button>
        `;
    }

    // 마지막 페이지로 가는 버튼 (끝 페이지가 총 페이지 수가 아닌 경우)
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHtml += '<span class="pagination-ellipsis">...</span>';
        }
        paginationHtml += `
            <button class="pagination-btn page-btn" onclick="${loadFunction.name}(${totalPages})">${totalPages}</button>
        `;
    }

    // 다음 페이지 버튼
    if (currentPage < totalPages) {
        paginationHtml += `
            <button class="pagination-btn next-btn" onclick="${loadFunction.name}(${currentPage + 1})" title="다음 페이지">
                다음 &raquo;
            </button>
        `;
    }

    paginationHtml += '</div>';
    container.innerHTML = paginationHtml;
}

/**
 * 페이지 범위를 계산하는 함수
 */
function calculatePageRange(currentPage, totalPages) {
    const maxVisiblePages = 5; // 한 번에 보여줄 최대 페이지 수
    const halfVisible = Math.floor(maxVisiblePages / 2);

    let startPage = Math.max(1, currentPage - halfVisible);
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // 끝 페이지 기준으로 시작 페이지 재조정
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    return { startPage, endPage };
}

/**
 * 페이징 정보를 업데이트하는 함수 (주문용)
 */
function updateOrderPaginationInfo(infoId, currentPage, totalElements, totalPages) {
    const infoElement = document.getElementById(infoId);
    if (!infoElement || !totalElements) return;

    const startItem = ((currentPage - 1) * ordersPerPage) + 1;
    const endItem = Math.min(currentPage * ordersPerPage, totalElements);

    infoElement.innerHTML = `
        <span class="pagination-info">
            총 ${totalElements.toLocaleString()}건 중 ${startItem}-${endItem}번째 표시 
            (${currentPage}/${totalPages} 페이지)
        </span>
    `;
}

/**
 * 페이징 정보를 업데이트하는 함수 (일반용)
 */
function updateGenericPaginationInfo(infoId, currentPage, totalElements, totalPages, itemType) {
    const infoElement = document.getElementById(infoId);
    if (!infoElement || !totalElements) return;

    let perPage;
    switch(itemType) {
        case '리뷰': perPage = reviewsPerPage; break;
        case '상품 문의': perPage = qnaPerPage; break;
        case '1:1 문의': perPage = inquiryPerPage; break;
        default: perPage = 5;
    }

    const startItem = ((currentPage - 1) * perPage) + 1;
    const endItem = Math.min(currentPage * perPage, totalElements);

    infoElement.innerHTML = `
        <span class="pagination-info">
            총 ${totalElements.toLocaleString()}건 중 ${startItem}-${endItem}번째 표시 
            (${currentPage}/${totalPages} 페이지)
        </span>
    `;
}

/**
 * 컨테이너에 페이징 UI를 추가하는 함수
 */
function addPaginationContainer(container, type) {
    const paginationHtml = `
        <div class="pagination-wrapper">
            <div id="${type}-pagination-info" class="pagination-info"></div>
            <div id="${type}-pagination"></div>
            <div class="pagination-controls">
                <div class="page-jump">
                    <span>페이지 이동:</span>
                    <input type="number" id="${type}-page-input" placeholder="페이지" min="1" 
                           onkeypress="handleGenericPageInputKeyPress(event, '${type}')">
                    <button onclick="goToGenericPage('${type}')">이동</button>
                </div>
                <div class="page-size-selector">
                    <span>페이지당 표시:</span>
                    <select onchange="changeGenericPerPage('${type}', this.value)">
                        <option value="5" selected>5개</option>
                        <option value="10">10개</option>
                        <option value="15">15개</option>
                        <option value="20">20개</option>
                    </select>
                </div>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', paginationHtml);
}

/**
 * 특정 페이지로 직접 이동하는 함수들
 */
function goToSoloPage() {
    const pageInput = document.getElementById('solo-page-input');
    const page = parseInt(pageInput.value);

    if (page && page >= 1 && page <= soloOrdersTotalPages) {
        loadSoloOrders(page);
        pageInput.value = '';
    } else {
        alert(`1부터 ${soloOrdersTotalPages} 사이의 페이지 번호를 입력해주세요.`);
        pageInput.value = '';
    }
}

function goToGroupPage() {
    const pageInput = document.getElementById('group-page-input');
    const page = parseInt(pageInput.value);

    if (page && page >= 1 && page <= groupOrdersTotalPages) {
        loadGroupBuyOrders(page);
        pageInput.value = '';
    } else {
        alert(`1부터 ${groupOrdersTotalPages} 사이의 페이지 번호를 입력해주세요.`);
        pageInput.value = '';
    }
}

function goToGenericPage(type) {
    const pageInput = document.getElementById(`${type}-page-input`);
    const page = parseInt(pageInput.value);

    let totalPages, loadFunction;

    switch(type) {
        case 'reviews':
            totalPages = reviewTotalPages;
            loadFunction = loadReviews;
            break;
        case 'qna':
            totalPages = qnaTotalPages;
            loadFunction = loadProductQnA;
            break;
        case 'inquiry':
            totalPages = inquiryTotalPages;
            loadFunction = loadPersonalInquiry;
            break;
    }

    if (page && page >= 1 && page <= totalPages) {
        loadFunction(page);
        pageInput.value = '';
    } else {
        alert(`1부터 ${totalPages} 사이의 페이지 번호를 입력해주세요.`);
        pageInput.value = '';
    }
}

/**
 * 페이지 크기 변경 함수들
 */
async function changeOrdersPerPage(type, newSize) {
    const confirmChange = confirm(`페이지당 ${newSize}개씩 표시하시겠습니까?`);
    if (!confirmChange) return;

    if (type === 'solo') {
        const currentFirstItem = (currentSoloPage - 1) * ordersPerPage + 1;
        const newPage = Math.ceil(currentFirstItem / newSize);
        ordersPerPage = newSize;
        await loadSoloOrders(newPage);
    } else if (type === 'group') {
        const currentFirstItem = (currentGroupPage - 1) * ordersPerPage + 1;
        const newPage = Math.ceil(currentFirstItem / newSize);
        ordersPerPage = newSize;
        await loadGroupBuyOrders(newPage);
    }
}

async function changeGenericPerPage(type, newSize) {
    const confirmChange = confirm(`페이지당 ${newSize}개씩 표시하시겠습니까?`);
    if (!confirmChange) return;

    newSize = parseInt(newSize);

    switch(type) {
        case 'reviews':
            const currentFirstReview = (currentReviewPage - 1) * reviewsPerPage + 1;
            const newReviewPage = Math.ceil(currentFirstReview / newSize);
            reviewsPerPage = newSize;
            await loadReviews(newReviewPage);
            break;
        case 'qna':
            const currentFirstQna = (currentQnaPage - 1) * qnaPerPage + 1;
            const newQnaPage = Math.ceil(currentFirstQna / newSize);
            qnaPerPage = newSize;
            await loadProductQnA(newQnaPage);
            break;
        case 'inquiry':
            const currentFirstInquiry = (currentInquiryPage - 1) * inquiryPerPage + 1;
            const newInquiryPage = Math.ceil(currentFirstInquiry / newSize);
            inquiryPerPage = newSize;
            await loadPersonalInquiry(newInquiryPage);
            break;
    }
}

/**
 * 목록 새로고침 함수들
 */
function refreshOrderList(type) {
    if (type === 'solo') {
        loadSoloOrders(currentSoloPage);
    } else if (type === 'group') {
        loadGroupBuyOrders(currentGroupPage);
    }
}

function refreshGenericList(type) {
    switch(type) {
        case 'reviews':
            loadReviews(currentReviewPage);
            break;
        case 'qna':
            loadProductQnA(currentQnaPage);
            break;
        case 'inquiry':
            loadPersonalInquiry(currentInquiryPage);
            break;
    }
}

/**
 * 키보드 이벤트로 페이지 이동 (엔터 키)
 */
function handlePageInputKeyPress(event, type) {
    if (event.key === 'Enter') {
        if (type === 'solo') {
            goToSoloPage();
        } else if (type === 'group') {
            goToGroupPage();
        }
    }
}

function handleGenericPageInputKeyPress(event, type) {
    if (event.key === 'Enter') {
        goToGenericPage(type);
    }
}

/**
 * 주문 상태별 필터링 함수
 */
async function filterOrdersByStatus(type, status) {
    const apiUrl = type === 'solo'
        ? `/api/user/orders/single?status=${status}&page=1&size=${ordersPerPage}`
        : `/api/user/orders/groupbuys?status=${status}&page=1&size=${ordersPerPage}`;

    try {
        const result = await fetchWithCsrf(apiUrl);
        if (result) {
            if (type === 'solo') {
                currentSoloPage = 1;
                soloOrdersTotalPages = result.totalPages || 1;
                renderOrderCards('solo-orders-container', result.content, 'solo');
                renderOrderPagination('solo-pagination', currentSoloPage, soloOrdersTotalPages, loadSoloOrders);
                updateOrderPaginationInfo('solo-pagination-info', 1, result.totalElements, result.totalPages);
            } else {
                currentGroupPage = 1;
                groupOrdersTotalPages = result.totalPages || 1;
                renderOrderCards('group-orders-container', result.content, 'group');
                renderOrderPagination('group-pagination', currentGroupPage, groupOrdersTotalPages, loadGroupBuyOrders);
                updateOrderPaginationInfo('group-pagination-info', 1, result.totalElements, result.totalPages);
            }
        }
    } catch (error) {
        console.error('주문 필터링 실패:', error);
        alert('주문 필터링에 실패했습니다.');
    }
}

/**
 * 필터 초기화 함수
 */
function clearOrderFilter(type) {
    if (type === 'solo') {
        loadSoloOrders(1);
    } else if (type === 'group') {
        loadGroupBuyOrders(1);
    }

    // 필터 선택박스 초기화
    const filterSelect = document.getElementById(`${type}-status-filter`);
    if (filterSelect) {
        filterSelect.value = '';
    }
}

/**
 * 주문 상태를 사용자 친화적으로 표시하는 헬퍼 함수
 */
function getOrderStatusDisplay(orderStatus) {
    if (!orderStatus) return '-';

    const statusMap = {
        'PENDING': '<span class="order-status pending">결제 대기</span>',
        'PAID': '<span class="order-status paid">결제 완료</span>',
        'PREPARING': '<span class="order-status preparing">배송 준비중</span>',
        'SHIPPED': '<span class="order-status shipped">배송중</span>',
        'DELIVERED': '<span class="order-status delivered">배송 완료</span>',
        'CONFIRMED': '<span class="order-status confirmed">구매 확정</span>',
        'CANCELLED': '<span class="order-status cancelled">취소</span>',
        'REFUNDED': '<span class="order-status refunded">환불 완료</span>',
        'RETURN_REQUESTED': '<span class="order-status return-requested">반품 요청</span>',
        'EXCHANGE_REQUESTED': '<span class="order-status exchange-requested">교환 요청</span>',
        'PARTIAL_RETURN': '<span class="order-status partial-return">부분 반품</span>',
        'PARTIAL_EXCHANGE': '<span class="order-status partial-exchange">부분 교환</span>'
    };

    return statusMap[orderStatus] || '<span class="order-status">' + orderStatus + '</span>';
}

/**
 * 주문별 액션 버튼을 생성하는 함수
 */
function getOrderActionButtons(order) {
    let buttons = '';

    // 구매 확정된 주문은 액션 버튼 없음
    if (order.orderStatus === 'CONFIRMED') {
        return '<span class="completed-order">구매 완료</span>';
    }

    // 취소/환불/반품/교환 처리된 주문도 액션 버튼 없음
    if (['CANCELLED', 'REFUNDED', 'RETURN_REQUESTED', 'EXCHANGE_REQUESTED', 'PARTIAL_RETURN', 'PARTIAL_EXCHANGE'].includes(order.orderStatus)) {
        return '<span class="no-actions">처리중</span>';
    }

    // 리뷰 작성 버튼 (배송완료 상태이고 리뷰를 아직 작성하지 않은 경우)
    if (order.orderStatus === 'DELIVERED' && order.canWriteReview === true) {
        buttons += '<button class="action-btn review-btn" onclick="openReviewModal(\'' + order.orderNo + '\', \'' + order.orderItemId + '\', \'' + order.productName + '\')">리뷰 작성</button>';
    }

    // 구매 확정 버튼 (배송완료 상태이고 아직 구매 확정되지 않은 경우)
    if (order.orderStatus === 'DELIVERED' && order.confirmedAt == null) {
        buttons += '<button class="action-btn confirm-btn" onclick="confirmPurchase(\'' + order.orderNo + '\')">구매 확정</button>';
    }

    // 반품/교환 버튼 (배송완료 상태이고 아직 구매 확정되지 않은 경우)
    if (order.orderStatus === 'DELIVERED' && order.confirmedAt == null) {
        buttons += '<button class="action-btn return-btn" onclick="requestReturn(\'' + order.orderNo + '\')">반품/교환</button>';
    }

    // 배송 추적 버튼 (배송중이거나 배송완료된 경우)
    if ((order.orderStatus === 'SHIPPED' || order.orderStatus === 'DELIVERED') && order.trackingNumber) {
        buttons += '<button class="action-btn tracking-btn" onclick="trackShipment(\'' + order.trackingNumber + '\')">배송 추적</button>';
    }

    // 취소 버튼 (결제완료/배송준비중/배송중 상태인 경우)
    if (['PAID', 'PREPARING', 'SHIPPED'].includes(order.orderStatus)) {
        const buttonText = order.orderStatus === 'SHIPPED' ? '배송 중단 요청' : '주문 취소';
        buttons += '<button class="action-btn cancel-btn" onclick="requestCancellation(\'' + order.orderNo + '\')">' + buttonText + '</button>';
    }

    return buttons || '<span class="no-actions">-</span>';
}

/**
 * 리뷰 작성 모달 열기
 */
async function openReviewModal(orderNo, orderItemId, productName) {
    try {
        // 리뷰 작성 가능 여부 확인
        const availability = await fetchWithCsrf(`/api/orders/${orderItemId}/review-availability`);

        if (!availability) {
            alert('리뷰 작성 가능 여부를 확인할 수 없습니다.');
            return;
        }

        if (availability.existingReview !== undefined) {
            alert(`이미 리뷰를 작성하신 상품입니다. : ${availability.existingReview}`);
            return;
        }

        const modal = createReviewModal(orderNo, orderItemId, productName);
        document.body.appendChild(modal);
        modal.style.display = 'block';
    } catch (error) {
        console.error('리뷰 모달 열기 실패:', error);
        alert('리뷰 작성 화면을 열 수 없습니다.');
    }
}

/**
 * 리뷰 작성 모달 생성
 */
function createReviewModal(orderNo, orderItemId, productName) {
    const modal = document.createElement('div');
    modal.className = 'modal review-write-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>리뷰 작성</h3>
                <span class="close" onclick="closeReviewWriteModal()">&times;</span>
            </div>
            <div class="modal-body">
                <div class="product-info">
                    <h4>${productName}</h4>
                    <p>주문번호: ${orderNo}</p>
                    <p class="review-notice">구매하신 상품에 대한 솔직한 후기를 작성해주세요. 리뷰 작성 시 구매가 자동으로 확정됩니다.</p>
                </div>
                
                <form id="review-write-form" onsubmit="submitReview('${orderItemId}'); return false;">
                    <div class="form-group">
                        <label>평점 <span class="required">*</span></label>
                        <div class="star-rating" id="star-rating">
                            <span class="star" data-rating="1">★</span>
                            <span class="star" data-rating="2">★</span>
                            <span class="star" data-rating="3">★</span>
                            <span class="star" data-rating="4">★</span>
                            <span class="star" data-rating="5">★</span>
                        </div>
                        <div class="rating-text" id="rating-text">평점을 선택해주세요</div>
                    </div>
                    
                    <div class="form-group">
                        <label for="review-comment">리뷰 내용 <span class="required">*</span></label>
                        <textarea id="review-comment" rows="5" maxlength="1000" 
                                placeholder="상품에 대한 솔직한 후기를 작성해주세요.&#10;&#10;• 상품의 품질, 배송, 서비스 등에 대해 자세히 작성해주시면 다른 고객들에게 도움이 됩니다.&#10;• 단순히 '좋아요', '나빠요' 보다는 구체적인 이유를 함께 작성해주세요." required></textarea>
                        <div class="char-count">0 / 1000자</div>
                        <div class="review-guidelines">
                            <small>
                                <strong>리뷰 작성 가이드:</strong><br>
                                • 욕설, 비방, 광고성 내용은 삭제될 수 있습니다<br>
                                • 상품과 관련 없는 내용은 피해주세요<br>
                                • 사진 첨부 시 더 유용한 리뷰가 됩니다
                            </small>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="review-images">사진 첨부 (선택사항)</label>
                        <div class="image-upload-area" id="image-upload-area">
                            <input type="file" id="review-images" multiple accept="image/*" 
                                   onchange="previewReviewImages(this)">
                            <label for="review-images" class="image-upload-label">
                                <span class="upload-icon">📷</span>
                                <span class="upload-text">사진 선택 또는 드래그</span>
                                <span class="upload-limit">최대 5장, 각 파일 최대 5MB</span>
                            </label>
                        </div>
                        <div id="image-preview" class="image-preview"></div>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" onclick="closeReviewWriteModal()">취소</button>
                        <button type="submit" class="primary" id="submit-review-btn" disabled>리뷰 등록</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    // 이벤트 리스너 설정
    setupReviewModalEventListeners(modal);

    return modal;
}

/**
 * 리뷰 작성 모달 이벤트 리스너 설정
 */
function setupReviewModalEventListeners(modal) {
    // 별점 클릭 이벤트
    const stars = modal.querySelectorAll('.star');
    const ratingText = modal.querySelector('#rating-text');
    const ratingTexts = ['', '별로예요', '그냥 그래요', '보통이에요', '좋아요', '아주 좋아요'];

    stars.forEach(star => {
        star.addEventListener('click', function() {
            const rating = parseInt(this.dataset.rating);
            updateStarRating(stars, rating);
            ratingText.textContent = ratingTexts[rating];
            ratingText.style.color = rating >= 4 ? '#4CAF50' : rating >= 3 ? '#FF9800' : '#F44336';
            validateReviewForm(modal);
        });

        star.addEventListener('mouseenter', function() {
            const rating = parseInt(this.dataset.rating);
            highlightStars(stars, rating);
        });
    });

    modal.querySelector('.star-rating').addEventListener('mouseleave', function() {
        const activeRating = modal.querySelectorAll('.star.active').length;
        updateStarRating(stars, activeRating);
    });

    // 글자 수 카운트 및 유효성 검사
    const textarea = modal.querySelector('#review-comment');
    const charCount = modal.querySelector('.char-count');
    textarea.addEventListener('input', function() {
        const count = this.value.length;
        charCount.textContent = count + ' / 1000자';
        charCount.style.color = count >= 900 ? '#dc3545' : count >= 800 ? '#ffc107' : '#666';
        validateReviewForm(modal);
    });

    // 이미지 드래그 앤 드롭
    const uploadArea = modal.querySelector('#image-upload-area');
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.classList.add('dragover');
        validateReviewForm(modal);
    });

    uploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        this.classList.remove('dragover');
        validateReviewForm(modal);
    });

    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        this.classList.remove('dragover');
        const files = e.dataTransfer.files;
        handleReviewImageFiles(files, modal);
        validateReviewForm(modal);
    });
}

/**
 * 별점 하이라이트 (호버 효과)
 */
function highlightStars(stars, rating) {
    stars.forEach((star, index) => {
        star.style.color = index < rating ? '#ffc107' : '#ddd';
    });
}

/**
 * 리뷰 폼 유효성 검사
 */
function validateReviewForm(modal) {
    const rating = modal.querySelectorAll('.star.active').length;
    const comment = modal.querySelector('#review-comment').value.trim();
    const submitBtn = modal.querySelector('#submit-review-btn');

    const isValid = rating > 0 && comment.length >= 1;
    submitBtn.disabled = !isValid;

    return isValid;
}

/**
 * 리뷰 이미지 파일 처리 (개선된 버전)
 */
function handleReviewImageFiles(files, modal) {
    const maxFiles = 5;
    const maxFileSize = 5 * 1024 * 1024; // 5MB
    const preview = modal.querySelector('#image-preview');
    const currentImages = preview.querySelectorAll('.preview-image').length;

    if (currentImages >= maxFiles) {
        alert(`최대 ${maxFiles}장까지 업로드할 수 있습니다.`);
        return;
    }

    Array.from(files).forEach((file, index) => {
        if (currentImages + index >= maxFiles) {
            alert(`최대 ${maxFiles}장까지 업로드할 수 있습니다.`);
            return;
        }

        if (file.size > maxFileSize) {
            alert(`${file.name}의 크기가 너무 큽니다. (최대 5MB)`);
            return;
        }

        if (!file.type.startsWith('image/')) {
            alert(`${file.name}은 이미지 파일이 아닙니다.`);
            return;
        }

        addImagePreview(file, preview);
    });
}

/**
 * 리뷰 이미지 미리보기 (개선된 버전)
 */
function previewReviewImages(input) {
    const modal = input.closest('.review-write-modal');
    handleReviewImageFiles(input.files, modal);
}

/**
 * 이미지 미리보기 추가
 */
function addImagePreview(file, container) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const imageContainer = document.createElement('div');
        imageContainer.className = 'preview-image-container';
        imageContainer.innerHTML = `
            <img src="${e.target.result}" alt="미리보기" class="preview-image">
            <button type="button" class="remove-image-btn" onclick="removeImagePreview(this)">×</button>
            <div class="image-info">${file.name}</div>
        `;

        // 파일 객체를 DOM 요소에 저장
        imageContainer.imageFile = file;
        container.appendChild(imageContainer);
    };
    reader.readAsDataURL(file);
}

/**
 * 이미지 미리보기 제거
 */
function removeImagePreview(button) {
    button.parentElement.remove();
}

/**
 * 별점 업데이트
 */
function updateStarRating(stars, rating) {
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

/**
 * 리뷰 이미지 미리보기
 */
function previewReviewImages(input) {
    const preview = document.getElementById('image-preview');
    preview.innerHTML = '';

    if (input.files) {
        Array.from(input.files).forEach((file, index) => {
            if (index >= 5) return; // 최대 5장

            const reader = new FileReader();
            reader.onload = function(e) {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.className = 'preview-image';
                preview.appendChild(img);
            };
            reader.readAsDataURL(file);
        });
    }
}

/**
 * 리뷰 제출
 */
async function submitReview(orderItemId) {
    const modal = document.querySelector('.review-write-modal');
    const rating = modal.querySelectorAll('.star.active').length;
    const comment = modal.querySelector('#review-comment').value.trim();
    const imageContainers = modal.querySelectorAll('.preview-image-container');

    if (!validateReviewForm(modal)) {
        if (rating === 0) {
            alert('평점을 선택해주세요.');
        } else if (comment.length < 10) {
            alert('리뷰 내용을 10자 이상 입력해주세요.');
        }
        return;
    }

    if (!confirm('리뷰를 등록하시겠습니까?\n리뷰 등록 시 해당 상품의 구매가 자동으로 확정됩니다.')) {
        return;
    }

    try {
        // 제출 버튼 비활성화
        const submitBtn = modal.querySelector('#submit-review-btn');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = '등록 중...';

        const formData = new FormData();

        // reviewData를 JSON 문자열로 변환하여 추가
        const reviewData = {
            orderItemId: orderItemId,
            rating: rating,
            comment: comment
        };
        formData.append('reviewData', JSON.stringify(reviewData));

        // 이미지 파일 추가
        imageContainers.forEach(container => {
            if (container.imageFile) {
                formData.append('images', container.imageFile);
            }
        });

        const response = await fetch(contextPath + '/api/reviews', {
            method: 'POST',
            headers: {
                [csrfHeader]: csrfToken,
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: formData
        });

        if (response.ok) {
            const result = await response.json();
            alert('리뷰가 등록되었습니다. 구매가 자동으로 확정됩니다.');
            closeReviewWriteModal();

            // 주문 목록 새로고침
            loadSoloOrders(currentSoloPage);
            loadGroupBuyOrders(currentGroupPage);
        } else {
            const error = await response.json().catch(() => ({
                error: '리뷰 등록에 실패했습니다.'
            }));
            alert('리뷰 등록에 실패했습니다: ' + (error.error || error.message || '알 수 없는 오류'));
        }
    } catch (error) {
        console.error('리뷰 제출 실패:', error);
        alert('리뷰 등록 중 오류가 발생했습니다.');
    } finally {
        // 제출 버튼 복원
        const submitBtn = modal.querySelector('#submit-review-btn');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = '리뷰 등록';
        }
    }
}

/**
 * 리뷰 작성 모달 닫기
 */
function closeReviewWriteModal() {
    const modal = document.querySelector('.review-write-modal');
    if (modal) {
        document.body.removeChild(modal);
    }
}

/**
 * 구매 확정
 */
async function confirmPurchase(orderNo) {
    if (!confirm('구매를 확정하시겠습니까?\n확정 후에는 취소할 수 없습니다.')) {
        return;
    }

    try {
        const result = await fetchWithCsrf('/api/orders/' + orderNo + '/confirm', {
            method: 'POST'
        });

        if (result) {
            alert('구매가 확정되었습니다.');
            // 주문 목록 새로고침
            loadSoloOrders();
            loadGroupBuyOrders();
        }
    } catch (error) {
        console.error('구매 확정 실패:', error);
        alert('구매 확정 중 오류가 발생했습니다.');
    }
}

/**
 * 배송 추적
 */
function trackShipment(trackingNumber) {
    // 배송 추적 새 창으로 열기 (실제로는 택배사 API 연동)
    const trackingUrl = contextPath + '/shipping/track?number=' + trackingNumber;
    window.open(trackingUrl, '_blank', 'width=800,height=600');
}

/**
 * 반품/교환 요청
 */
async function requestReturn(orderNo) {
    try {
        // 반품/교환 모달 열기
        const modal = createReturnModal(orderNo);
        document.body.appendChild(modal);
        modal.style.display = 'block';
    } catch (error) {
        console.error('반품/교환 모달 열기 실패:', error);
        alert('반품/교환 신청 화면을 열 수 없습니다.');
    }
}

/**
 * 반품/교환 모달 생성
 */
function createReturnModal(orderNo) {
    const modal = document.createElement('div');
    modal.className = 'modal return-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>반품/교환 신청</h3>
                <span class="close" onclick="closeReturnModal()">&times;</span>
            </div>
            <div class="modal-body">
                <div class="order-info">
                    <h4>주문번호: ${orderNo}</h4>
                    <p class="notice">배송완료 후 7일 이내에만 반품/교환이 가능합니다.</p>
                </div>
                
                <form id="return-form" onsubmit="submitReturnRequest('${orderNo}'); return false;">
                    <div class="form-group">
                        <label>신청 유형</label>
                        <div class="radio-group">
                            <label><input type="radio" name="requestType" value="RETURN" checked> 반품 (환불)</label>
                            <label><input type="radio" name="requestType" value="EXCHANGE"> 교환</label>
                            <label><input type="radio" name="requestType" value="RETURN_EXCHANGE"> 부분 반품 + 부분 교환</label>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="return-reason">사유</label>
                        <select id="return-reason" required>
                            <option value="">사유를 선택하세요</option>
                            <option value="DEFECTIVE">상품 불량/하자</option>
                            <option value="SIZE_MISMATCH">사이즈/색상 불일치</option>
                            <option value="COLOR_DIFFERENT">사진과 색상 차이</option>
                            <option value="NOT_AS_DESCRIBED">상품설명과 다름</option>
                            <option value="DAMAGED_SHIPPING">배송 중 파손</option>
                            <option value="CHANGE_MIND">단순 변심</option>
                            <option value="QUALITY_ISSUE">품질 문제</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="return-detail">상세 사유</label>
                        <textarea id="return-detail" rows="4" maxlength="500" 
                                placeholder="반품/교환 사유를 상세히 입력해주세요." required></textarea>
                        <div class="char-count">0 / 500자</div>
                    </div>
                    
                    <div class="form-group">
                        <label for="return-images">증빙 사진 (선택사항)</label>
                        <input type="file" id="return-images" multiple accept="image/*" 
                               onchange="previewReturnImages(this)">
                        <div id="return-image-preview" class="image-preview"></div>
                        <small class="form-help">상품 불량이나 파손의 경우 사진을 첨부해주세요.</small>
                    </div>
                    
                    <div class="return-notice">
                        <h5>반품/교환 안내사항</h5>
                        <ul>
                            <li>단순 변심으로 인한 반품 시 배송비는 고객 부담입니다.</li>
                            <li>상품 불량이나 오배송의 경우 무료로 교환/환불 처리됩니다.</li>
                            <li>사용하거나 훼손된 상품은 반품이 불가능합니다.</li>
                            <li>신선식품, 맞춤제작 상품 등은 반품이 제한될 수 있습니다.</li>
                        </ul>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" onclick="closeReturnModal()">취소</button>
                        <button type="submit" class="primary">신청하기</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    // 글자 수 카운트
    const textarea = modal.querySelector('#return-detail');
    const charCount = modal.querySelector('.char-count');
    textarea.addEventListener('input', function() {
        const count = this.value.length;
        charCount.textContent = count + ' / 500자';
        charCount.style.color = count >= 450 ? '#dc3545' : '#666';
    });

    return modal;
}

/**
 * 반품/교환 이미지 미리보기
 */
function previewReturnImages(input) {
    const preview = document.getElementById('return-image-preview');
    preview.innerHTML = '';

    if (input.files) {
        Array.from(input.files).forEach((file, index) => {
            if (index >= 5) return; // 최대 5장

            const reader = new FileReader();
            reader.onload = function(e) {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.className = 'preview-image';
                preview.appendChild(img);
            };
            reader.readAsDataURL(file);
        });
    }
}

/**
 * 반품/교환 신청 제출
 */
async function submitReturnRequest(orderNo) {
    const requestType = document.querySelector('input[name="requestType"]:checked').value;
    const reason = document.getElementById('return-reason').value;
    const detail = document.getElementById('return-detail').value.trim();
    const imageFiles = document.getElementById('return-images').files;

    if (!reason) {
        alert('반품/교환 사유를 선택해주세요.');
        return;
    }

    if (!detail) {
        alert('상세 사유를 입력해주세요.');
        return;
    }

    if (!confirm('반품/교환을 신청하시겠습니까?\n신청 후에는 고객센터를 통해서만 취소가 가능합니다.')) {
        return;
    }

    try {
        const formData = new FormData();
        formData.append('orderNo', orderNo);
        formData.append('requestType', requestType);
        formData.append('reason', reason);
        formData.append('detail', detail);

        // 이미지 파일 추가
        for (let i = 0; i < imageFiles.length && i < 5; i++) {
            formData.append('images', imageFiles[i]);
        }

        const response = await fetch(contextPath + '/api/after-sales/requests', {
            method: 'POST',
            headers: {
                [csrfHeader]: csrfToken,
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: formData
        });

        if (response.ok) {
            const result = await response.json();
            alert('반품/교환 신청이 완료되었습니다.\n신청번호: ' + result.requestNo + '\n처리 현황은 마이페이지에서 확인하실 수 있습니다.');
            closeReturnModal();

            // 주문 목록 새로고침
            loadSoloOrders();
            loadGroupBuyOrders();
        } else {
            const error = await response.json();
            alert('반품/교환 신청에 실패했습니다: ' + (error.message || '알 수 없는 오류'));
        }
    } catch (error) {
        console.error('반품/교환 신청 실패:', error);
        alert('반품/교환 신청 중 오류가 발생했습니다.');
    }
}

/**
 * 반품/교환 모달 닫기
 */
function closeReturnModal() {
    const modal = document.querySelector('.return-modal');
    if (modal) {
        document.body.removeChild(modal);
    }
}

/**
 * 주문 취소 요청
 */
async function requestCancellation(orderNo, orderStatus) {
    let confirmMessage = '주문을 취소하시겠습니까?';
    let apiEndpoint = `/api/orders/${orderNo}/cancel`;

    // 배송중인 경우 다른 메시지와 API 사용
    if (orderStatus && orderStatus.includes('배송중')) {
        confirmMessage = '배송 중단을 요청하시겠습니까?\n배송업체와 협의 후 처리됩니다.';
        apiEndpoint = `/api/orders/${orderNo}/stop-shipping`;
    }

    if (!confirm(confirmMessage)) {
        return;
    }

    try {
        const result = await fetchWithCsrf(apiEndpoint, {
            method: 'POST'
        });

        if (result) {
            const successMessage = orderStatus && orderStatus.includes('배송중') ?
                '배송 중단이 요청되었습니다. 처리 현황은 고객센터로 문의해주세요.' :
                '주문 취소가 요청되었습니다.';
            alert(successMessage);

            // 주문 목록 새로고침
            loadSoloOrders();
            loadGroupBuyOrders();
        }
    } catch (error) {
        console.error('주문 취소/배송 중단 실패:', error);
        alert('요청 처리 중 오류가 발생했습니다.');
    }
}

/**
 * 주문 카드를 동적으로 그리는 함수
 */
function renderOrderCards(containerId, orders, type) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    if (orders && orders.length > 0) {
        orders.forEach(order => {
            const orderCard = createOrderCard(order, type);
            container.appendChild(orderCard);
        });
    } else {
        container.innerHTML = '<div class="no-data">주문 내역이 없습니다.</div>';
    }
}

/**
 * 주문 카드 생성 함수
 */
function createOrderCard(order, type) {
    const card = document.createElement('div');
    card.className = 'order-card';

    // 카드 헤더
    const header = document.createElement('div');
    header.className = 'order-card-header';
    header.innerHTML = `
        <div class="order-header-left">
            <a href="javascript:void(0)" onclick="showOrderDetail('${order.orderNo}')" class="order-no-link">
                주문번호: ${order.orderNo}
            </a>
            <div class="order-date">${formatDate(order.orderDate || order.joinedAt)}</div>
        </div>
        <div class="order-header-right">
            <div class="order-amount">${formatNumber(order.paidAmount)}원</div>
        </div>
    `;
    card.appendChild(header);

    // 카드 바디
    const body = document.createElement('div');
    body.className = 'order-card-body';

    if (type === 'group' && order.groupBuyName) {
        // 공동구매 정보
        const groupBuyInfo = document.createElement('div');
        groupBuyInfo.className = 'group-buy-card-info';
        groupBuyInfo.innerHTML = renderGroupBuyCardInfo(order);
        body.appendChild(groupBuyInfo);
    }

    // 주문 아이템 목록
    const itemsList = document.createElement('div');
    itemsList.className = 'order-items-list';

    if (order.orderItems && order.orderItems.length > 0) {
        order.orderItems.forEach(item => {
            itemsList.appendChild(createOrderItemElement(order, item));
        });
    } else {
        // 레거시 데이터 (단일 상품)
        itemsList.appendChild(createOrderItemElement(order, null));
    }

    body.appendChild(itemsList);
    card.appendChild(body);

    return card;
}

/**
 * 주문 아이템 요소 생성
 */
function createOrderItemElement(order, item) {
    const itemElement = document.createElement('div');
    itemElement.className = 'order-item';

    const productName = item ? item.productName : order.productName;
    const productImageUrl = item ? item.productImageUrl : order.productImageUrl;
    const optionCombination = item ? item.optionCombination : null;
    const quantity = item ? item.quantity : order.quantity || 1;
    const status = item ? item.status : order.orderStatus;

    itemElement.innerHTML = `
        <div class="order-item-image">
            <img src="${productImageUrl || '/images/default-product.jpg'}" 
                 alt="${productName}" 
                 onerror="this.src='${contextPath}/resources/images/no-image.jpg'">
        </div>
        <div class="order-item-details">
            <a href="${contextPath}/products/${item?.productId || order.productId}" class="order-item-name">
                ${productName}
            </a>
            ${optionCombination ? `<div class="order-item-options">${optionCombination}</div>` : ''}
            <div class="order-item-quantity">수량: ${quantity}개</div>
            ${item ? `<div class="order-item-price">${formatNumber(item.totalPriceAtPurchase || 0)}원</div>` : ''}
        </div>
        <div class="order-item-status">
            <div>${getOrderStatusDisplay(status)}</div>
            <div class="order-item-actions">
                ${getOrderItemActionButtons(order, item, 0, 1)}
            </div>
        </div>
    `;

    return itemElement;
}

/**
 * 공동구매 카드 정보 렌더링
 */
function renderGroupBuyCardInfo(order) {
    const progressPercentage = order.targetQuantity > 0
        ? Math.min((order.currentQuantity / order.targetQuantity) * 100, 100)
        : 0;

    return `
        <div class="group-buy-card-header">
            <a href="javascript:void(0)" class="group-buy-card-name" 
               onclick="showGroupBuyDetail(${order.groupBuyId}, ${order.quantity}, ${order.paidAmount}, '${order.joinedAt}', '${order.orderNo}')">
                ${order.groupBuyName}
            </a>
            ${getGroupBuyStatusBadge(order)}
        </div>
        <div class="group-buy-progress-card">
            <div class="progress-bar-card">
                <div class="progress-fill-card" style="width: ${progressPercentage}%"></div>
            </div>
            <div class="progress-text-card">
                <span>${order.currentQuantity || 0}/${order.targetQuantity || 0}명 참여</span>
                <span>${progressPercentage.toFixed(1)}%</span>
            </div>
        </div>
        ${order.endDate ? `<div class="group-buy-end-date">마감: ${formatDateTime(order.endDate)}</div>` : ''}
    `;
}

/**
 * 주문 테이블을 동적으로 그리는 함수 (주문번호 클릭 시 모달 표시)
 */
function renderOrderTable(tbodyId, orders, type) {
    const tbody = document.getElementById(tbodyId);
    tbody.innerHTML = '';

    if (orders && orders.length > 0) {
        orders.forEach(order => {
            // orderItems가 없거나 비어있는 경우 기본 처리
            if (!order.orderItems || order.orderItems.length === 0) {
                renderSingleOrderRow(tbody, order, type, null, 0, 1);
                return;
            }

            // 각 주문 아이템별로 행 생성
            order.orderItems.forEach((item, itemIndex) => {
                renderSingleOrderRow(tbody, order, type, item, itemIndex, order.orderItems.length);
            });
        });
    } else {
        tbody.innerHTML = '<tr><td colspan="7" class="no-data">주문 내역이 없습니다.</td></tr>';
    }
}

/**
 * 단일 주문 행을 렌더링하는 함수
 */
function renderSingleOrderRow(tbody, order, type, orderItem, itemIndex, totalItems) {
    const tr = document.createElement('tr');

    // 첫 번째 아이템인 경우만 주문 공통 정보 표시 (rowspan 적용)
    if (itemIndex === 0) {
        // 주문번호 (rowspan)
        tr.innerHTML += `
            <td rowspan="${totalItems}">
                <a href="javascript:void(0)" onclick="showOrderDetail('${order.orderNo}')">${order.orderNo}</a>
            </td>
        `;

        // 주문일 (rowspan)
        tr.innerHTML += `
            <td rowspan="${totalItems}">${formatDate(order.orderDate)}</td>
        `;

        // 결제금액 (rowspan)
        tr.innerHTML += `
            <td rowspan="${totalItems}">${formatNumber(order.paidAmount)}원</td>
        `;
    }

    // 상품정보 (각 아이템별)
    const productInfo = renderProductInfoCell(order, orderItem, type);
    tr.innerHTML += `<td class="product-info-cell">${productInfo}</td>`;

    // 주문상태 (각 아이템별 또는 공통)
    const orderStatusDisplay = getOrderStatusDisplay(orderItem ? orderItem.status : order.orderStatus);
    if (hasUniformStatus(order.orderItems) && itemIndex === 0) {
        // 모든 아이템의 상태가 같은 경우 rowspan 적용
        tr.innerHTML += `<td rowspan="${totalItems}">${orderStatusDisplay}</td>`;
    } else if (!hasUniformStatus(order.orderItems)) {
        // 아이템별로 상태가 다른 경우 개별 표시
        tr.innerHTML += `<td>${orderStatusDisplay}</td>`;
    }

    // 환불상태 (각 아이템별)
    const refundStatusDisplay = getRefundStatusDisplay(orderItem ? orderItem.refundStatus : order.refundStatus);
    tr.innerHTML += `<td>${refundStatusDisplay}</td>`;

    // 액션 버튼 (각 아이템별) - 수정된 부분
    const actionButtonsHtml = getOrderItemActionButtons(order, orderItem, itemIndex, totalItems);
    tr.innerHTML += `<td class="action-buttons">${actionButtonsHtml}</td>`;

    tbody.appendChild(tr);
}

/**
 * 상품 정보 셀 렌더링
 */
function renderProductInfoCell(order, orderItem, type) {
    let productName, productImageUrl, optionCombination;

    if (orderItem) {
        productName = orderItem.productName || order.productName;
        productImageUrl = orderItem.productImageUrl || order.productImageUrl;
        optionCombination = orderItem.optionCombination;
    } else {
        productName = order.productName;
        productImageUrl = order.productImageUrl;
        optionCombination = null;
    }

    return `
        <div class="product-info-container">
            <img src="${productImageUrl || '/images/default-product.jpg'}" 
                 alt="${productName}" 
                 class="product-thumbnail" 
                 onerror="this.src='${contextPath}/resources/images/no-image.jpg'">
            <div class="product-details">
                <a href="${contextPath}/products/${orderItem.productId}" class="product-name">${productName}</a>
                ${optionCombination ? `<div class="product-options">${optionCombination}</div>` : ''}
                ${orderItem ? `<div class="item-quantity">수량: ${orderItem.quantity}개</div>` : ''}
            </div>
        </div>
    `;
}

/**
 * 공동구매 주문 테이블을 동적으로 그리는 함수
 */
function renderGroupBuyOrderTable(tbodyId, orders) {
    const tbody = document.getElementById(tbodyId);
    tbody.innerHTML = '';

    if (orders && orders.length > 0) {
        orders.forEach(order => {
            renderGroupBuyOrderRow(tbody, order);
        });
    } else {
        tbody.innerHTML = '<tr><td colspan="7" class="no-data">공동구매 주문 내역이 없습니다.</td></tr>';
    }
}

/**
 * 단일 공동구매 주문 행을 렌더링하는 함수
 */
function renderGroupBuyOrderRow(tbody, order) {
    const tr = document.createElement('tr');

    // 주문번호 (클릭 시 주문 상세 모달)
    tr.innerHTML += `
        <td>
            <a href="javascript:void(0)" onclick="showOrderDetail('${order.orderNo}')">${order.orderNo !== null ? order.orderNo : '-'}</a>
        </td>
    `;

    // 참여일
    tr.innerHTML += `
        <td>${formatDate(order.joinedAt)}</td>
    `;

    // 결제금액
    tr.innerHTML += `
        <td>${formatNumber(order.paidAmount)}원</td>
    `;

    // 공동구매 정보 (상품명, 공동구매명, 진행상황)
    const groupBuyInfo = renderGroupBuyInfoCell(order);
    tr.innerHTML += `<td class="product-info-cell">${groupBuyInfo}</td>`;

    // 주문상태
    const orderStatusDisplay = getOrderStatusDisplay(order.orderStatus);
    tr.innerHTML += `<td>${orderStatusDisplay}</td>`;

    // 환불상태
    const refundStatusDisplay = getRefundStatusDisplay(order.refundStatus);
    tr.innerHTML += `<td>${refundStatusDisplay}</td>`;

    // 액션 버튼
    const actionButtonsHtml = getGroupBuyOrderActionButtons(order);
    tr.innerHTML += `<td class="action-buttons">${actionButtonsHtml}</td>`;

    tbody.appendChild(tr);
}

/**
 * 공동구매 정보 셀 렌더링
 */
function renderGroupBuyInfoCell(order) {
    // 진행률 계산
    const progressPercentage = order.targetQuantity > 0
        ? Math.min((order.currentQuantity / order.targetQuantity) * 100, 100)
        : 0;

    // 공동구매 상태 표시
    const statusBadge = getGroupBuyStatusBadge(order);

    return `
        <div class="group-buy-info-container">
            <div class="product-section">
                <img src="${order.productImageUrl || '/images/default-product.jpg'}" 
                     alt="${order.productName}" 
                     class="product-thumbnail" 
                     onerror="this.src='${contextPath}/resources/images/no-image.jpg'">
                <div class="product-details">
                    <a href="${contextPath}/products/${order.productId}" class="product-name">${order.productName}</a>
                    ${order.optionCombination ? `<div class="product-options">${order.optionCombination}</div>` : ''}
                    <div class="item-quantity">구매 수량: ${order.quantity}개</div>
                </div>
            </div>
            
            <div class="group-buy-section">
                <div class="group-buy-name">
                    <a href="javascript:void(0)" onclick="showGroupBuyDetail(${order.groupBuyId}, ${order.quantity}, ${order.paidAmount}, '${order.joinedAt}', '${order.orderNo}')">
                        ${order.groupBuyName}
                    </a>
                    ${statusBadge}
                </div>
                
                <div class="group-buy-progress">
                    <div class="progress-bar-small">
                        <div class="progress-fill-small" style="width: ${progressPercentage}%"></div>
                    </div>
                    <div class="progress-text-small">
                        ${order.currentQuantity || 0}/${order.targetQuantity || 0}명 참여 (${progressPercentage.toFixed(1)}%)
                    </div>
                </div>
                
                ${order.endDate ? `
                    <div class="group-buy-end-date">
                        마감: ${formatDateTime(order.endDate)}
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

/**
 * 공동구매 상태 배지 생성
 */
function getGroupBuyStatusBadge(order) {
    // order.status 또는 endDate를 기반으로 상태 판단
    const now = new Date();
    const endDate = order.endDate ? new Date(order.endDate) : null;

    let status = '';
    let statusClass = '';

    if (endDate) {
        if (endDate > now) {
            if (order.currentQuantity >= order.targetQuantity) {
                status = '목표달성';
                statusClass = 'status-achieved';
            } else {
                status = '진행중';
                statusClass = 'status-active';
            }
        } else {
            if (order.currentQuantity >= order.targetQuantity) {
                status = '성공';
                statusClass = 'status-success';
            } else {
                status = '실패';
                statusClass = 'status-failed';
            }
        }
    } else {
        status = '알 수 없음';
        statusClass = 'status-unknown';
    }

    return `<span class="group-buy-status ${statusClass}">${status}</span>`;
}

/**
 * 공동구매 주문별 액션 버튼을 생성하는 함수
 */
function getGroupBuyOrderActionButtons(order) {
    let buttons = '';

    const orderStatus = order.orderStatus;

    // 구매 확정된 주문은 액션 버튼 없음
    if (orderStatus === 'CONFIRMED') {
        return '<span class="completed-order">구매 완료</span>';
    }

    // 취소/환불/반품/교환 관련 상태는 액션 버튼 없음
    if (['CANCELLED', 'REFUNDED', 'RETURN_REQUESTED', 'EXCHANGE_REQUESTED',
        'RETURN_PROCESSING', 'EXCHANGE_PROCESSING', 'RETURN_COMPLETED',
        'EXCHANGE_COMPLETED', 'RETURN_REJECTED', 'EXCHANGE_REJECTED'].includes(orderStatus)) {
        return '<span class="no-actions">처리중</span>';
    }

    // 리뷰 작성 버튼 (배송완료 상태이고 리뷰를 아직 작성하지 않은 경우)
    if (orderStatus === 'DELIVERED' && order.canWriteReview === true) {
        buttons += `<button class="action-btn review-btn" onclick="openReviewModal('${order.orderNo}', '${order.id}', '${order.productName}')">리뷰 작성</button>`;
    }

    // 구매 확정 버튼 (배송완료 상태이고 아직 구매 확정되지 않은 경우)
    if (orderStatus === 'DELIVERED' && !order.confirmedAt) {
        buttons += `<button class="action-btn confirm-btn" onclick="confirmPurchase('${order.orderNo}')">구매 확정</button>`;
    }

    // 반품/교환 버튼 (배송완료 상태이고 아직 구매 확정되지 않은 경우)
    if (orderStatus === 'DELIVERED' && !order.confirmedAt) {
        buttons += `<button class="action-btn return-btn" onclick="requestReturn('${order.orderNo}')">반품/교환</button>`;
    }

    // 배송 추적 버튼 (배송중이거나 배송완료된 경우)
    if (['SHIPPED', 'DELIVERED'].includes(orderStatus) && order.trackingNumber) {
        buttons += `<button class="action-btn tracking-btn" onclick="trackShipment('${order.trackingNumber}')">배송 추적</button>`;
    }

    // 취소 버튼 (결제완료/배송준비중 상태인 경우)
    if (['PAID', 'PREPARING'].includes(orderStatus)) {
        buttons += `<button class="action-btn cancel-btn" onclick="requestCancellation('${order.orderNo}')">주문 취소</button>`;
    }

    // 공동구매 상세보기 버튼
    buttons += `<button class="action-btn info-btn" onclick="showGroupBuyDetail(${order.groupBuyId}, ${order.quantity}, ${order.paidAmount}, '${order.joinedAt}', '${order.orderNo}')">공동구매 상세</button>`;

    return buttons || '<span class="no-actions">-</span>';
}

/**
 * 주문 아이템들의 상태가 모두 동일한지 확인
 */
function hasUniformStatus(orderItems) {
    if (!orderItems || orderItems.length <= 1) return true;

    const firstStatus = orderItems[0].status;
    return orderItems.every(item => item.status === firstStatus);
}

/**
 * 주문 아이템별 액션 버튼을 생성하는 함수
 */
function getOrderItemActionButtons(order, orderItem, itemIndex, totalItems) {
    let buttons = '';

    // orderItem이 없는 경우 (레거시 데이터) 기존 로직 사용
    if (!orderItem) {
        return getOrderActionButtons(order);
    }

    const itemStatus = orderItem.status || order.orderStatus;

    // 구매 확정된 주문 아이템은 액션 버튼 없음
    if (itemStatus === 'CONFIRMED' || orderItem.confirmedAt) {
        return '<span class="completed-order">구매 완료</span>';
    }

    // 취소/환불/반품/교환 관련 상태도 액션 버튼 없음
    if (itemStatus === 'CANCELLED') {
        return '<span class="no-actions">취소됨</span>';
    }

    if (itemStatus === 'REFUNDED') {
        return '<span class="no-actions">환불됨</span>';
    }

    if (['RETURN_REQUESTED', 'EXCHANGE_REQUESTED', 'RETURN_PROCESSING', 'EXCHANGE_PROCESSING',].includes(itemStatus)) {
        return '<span class="no-actions">처리중</span>';
    }

    if (itemStatus === 'RETURN_COMPLETED') {
        return '<span class="no-actions">반품 완료</span>';
    }

    if (itemStatus === 'EXCHANGE_COMPLETED') {
        return '<span class="no-actions">교환 완료</span>';
    }

    if (itemStatus === 'RETURN_REJECTED') {
        return '<span class="no-actions">반품 거절됨</span>';
    }

    if (itemStatus === 'EXCHANGE_REJECTED') {
        return '<span class="no-actions">교환 거절됨</span>';
    }

    // 리뷰 작성 버튼 (배송완료 상태이고 리뷰를 아직 작성하지 않은 경우)
    if (itemStatus === 'DELIVERED' && canWriteReviewForItem(order, orderItem)) {
        buttons += '<button class="action-btn review-btn" onclick="openReviewModal(\'' + order.orderNo + '\', \'' + orderItem.id + '\', \'' + (orderItem.productName || order.productName) + '\')">리뷰 작성</button>';
    }

    // 구매 확정 버튼 (배송완료 상태이고 아직 구매 확정되지 않은 경우)
    if (itemStatus === 'DELIVERED' && !orderItem.confirmedAt) {
        buttons += '<button class="action-btn confirm-btn" onclick="confirmItemPurchase(\'' + order.orderNo + '\', \'' + orderItem.id + '\')">구매 확정</button>';
    }

    // 반품/교환 버튼 (배송완료 상태이고 아직 구매 확정되지 않은 경우)
    if (itemStatus === 'DELIVERED' && !orderItem.confirmedAt) {
        buttons += '<button class="action-btn return-btn" onclick="requestItemReturn(\'' + order.orderNo + '\', \'' + orderItem.id + '\')">반품/교환</button>';
    }

    // 주문 단위 버튼들은 첫 번째 아이템에만 표시
    if (itemIndex === 0) {
        // 배송 추적 버튼 (배송중이거나 배송완료된 경우 - 주문 단위)
        if (['SHIPPED', 'DELIVERED'].includes(order.orderStatus) && order.trackingNumber) {
            buttons += '<button class="action-btn tracking-btn" onclick="trackShipment(\'' + order.trackingNumber + '\')">배송 추적</button>';
        }

        // 취소 버튼 (결제완료/배송준비중/배송중 상태인 경우 - 주문 단위)
        if (['PAID', 'PREPARING', 'SHIPPED'].includes(order.orderStatus)) {
            const orderStatusText = getOrderStatusText(order.orderStatus); // 상태를 텍스트로 변환
            if (order.orderStatus !== 'SHIPPED') {
                buttons += '<button class="action-btn cancel-btn" onclick="requestCancellation(\'' + order.orderNo + '\', \'' + orderStatusText + '\')">' + '주문 취소' + '</button>';
            }
            else {
                buttons += '<span class="no-actions">-</span>';
            }
        }
    }

    return buttons || '<span class="no-actions">-</span>';
}

// 주문 상태를 텍스트로 변환하는 헬퍼 함수
function getOrderStatusText(orderStatus) {
    const statusMap = {
        'PENDING': '결제 대기',
        'PAID': '결제 완료',
        'PREPARING': '배송 준비중',
        'SHIPPED': '배송중',
        'DELIVERED': '배송 완료',
        'CONFIRMED': '구매 확정',
        'CANCELLED': '취소',
        'REFUNDED': '환불 완료',
        'RETURN_REQUESTED': '반품 요청',
        'EXCHANGE_REQUESTED': '교환 요청',
        'PARTIAL_RETURN': '일부 반품',
        'PARTIAL_EXCHANGE': '일부 교환'
    };
    return statusMap[orderStatus] || orderStatus;
}

/**
 * 개별 아이템 반품/교환 요청
 */
async function requestItemReturn(orderNo, orderItemId) {
    try {
        // 반품/교환 모달 열기 (아이템 단위)
        const modal = createItemReturnModal(orderNo, orderItemId);
        document.body.appendChild(modal);
        modal.style.display = 'block';
    } catch (error) {
        console.error('반품/교환 모달 열기 실패:', error);
        alert('반품/교환 신청 화면을 열 수 없습니다.');
    }
}

/**
 * 아이템별 반품/교환 모달 생성
 */
function createItemReturnModal(orderNo, orderItemId) {
    const modal = document.createElement('div');
    modal.className = 'modal return-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>반품/교환 신청</h3>
                <span class="close" onclick="closeReturnModal()">&times;</span>
            </div>
            <div class="modal-body">
                <div class="order-info">
                    <h4>주문번호: ${orderNo}</h4>
                    <p class="notice">배송완료 후 7일 이내에만 반품/교환이 가능합니다.</p>
                </div>
                
                <form id="return-form" onsubmit="submitItemReturnRequest('${orderNo}', '${orderItemId}'); return false;">
                    <div class="form-group">
                        <label>신청 유형</label>
                        <div class="radio-group">
                            <label><input type="radio" name="requestType" value="RETURN" checked> 반품 (환불)</label>
                            <label><input type="radio" name="requestType" value="EXCHANGE"> 교환</label>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="return-reason">사유</label>
                        <select id="return-reason" required>
                            <option value="">사유를 선택하세요</option>
                            <option value="DEFECTIVE">상품 불량/하자</option>
                            <option value="SIZE_MISMATCH">사이즈/색상 불일치</option>
                            <option value="COLOR_DIFFERENT">사진과 색상 차이</option>
                            <option value="NOT_AS_DESCRIBED">상품설명과 다름</option>
                            <option value="DAMAGED_SHIPPING">배송 중 파손</option>
                            <option value="CHANGE_MIND">단순 변심</option>
                            <option value="QUALITY_ISSUE">품질 문제</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="return-detail">상세 사유</label>
                        <textarea id="return-detail" rows="4" maxlength="500" 
                                placeholder="반품/교환 사유를 상세히 입력해주세요." required></textarea>
                        <div class="char-count">0 / 500자</div>
                    </div>
                    
                    <div class="form-group">
                        <label for="return-images">증빙 사진 (선택사항)</label>
                        <input type="file" id="return-images" multiple accept="image/*" 
                               onchange="previewReturnImages(this)">
                        <div id="return-image-preview" class="image-preview"></div>
                        <small class="form-help">상품 불량이나 파손의 경우 사진을 첨부해주세요.</small>
                    </div>
                    
                    <div class="return-notice">
                        <h5>반품/교환 안내사항</h5>
                        <ul>
                            <li>단순 변심으로 인한 반품 시 배송비는 고객 부담입니다.</li>
                            <li>상품 불량이나 오배송의 경우 무료로 교환/환불 처리됩니다.</li>
                            <li>사용하거나 훼손된 상품은 반품이 불가능합니다.</li>
                            <li>신선식품, 맞춤제작 상품 등은 반품이 제한될 수 있습니다.</li>
                        </ul>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" onclick="closeReturnModal()">취소</button>
                        <button type="submit" class="primary">신청하기</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    // 글자 수 카운트 이벤트 리스너 추가
    const textarea = modal.querySelector('#return-detail');
    const charCount = modal.querySelector('.char-count');
    textarea.addEventListener('input', function() {
        const count = this.value.length;
        charCount.textContent = count + ' / 500자';
        charCount.style.color = count >= 450 ? '#dc3545' : '#666';
    });

    return modal;
}

/**
 * 아이템별 반품/교환 신청 제출
 */
async function submitItemReturnRequest(orderNo, orderItemId) {
    const requestType = document.querySelector('input[name="requestType"]:checked').value;
    const reason = document.getElementById('return-reason').value;
    const detail = document.getElementById('return-detail').value.trim();
    const imageFiles = document.getElementById('return-images').files;

    if (!reason) {
        alert('반품/교환 사유를 선택해주세요.');
        return;
    }

    if (!detail) {
        alert('상세 사유를 입력해주세요.');
        return;
    }

    if (!confirm('반품/교환을 신청하시겠습니까?\n신청 후에는 고객센터를 통해서만 취소가 가능합니다.')) {
        return;
    }

    try {
        const formData = new FormData();
        formData.append('orderNo', orderNo);
        formData.append('orderItemId', orderItemId);
        formData.append('requestType', requestType);
        formData.append('reason', reason);
        formData.append('detail', detail);

        // 이미지 파일 추가
        for (let i = 0; i < imageFiles.length && i < 5; i++) {
            formData.append('images', imageFiles[i]);
        }

        const response = await fetch(contextPath + '/api/after-sales/item-requests', {
            method: 'POST',
            headers: {
                [csrfHeader]: csrfToken,
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: formData
        });

        if (response.ok) {
            const result = await response.json();
            alert('반품/교환 신청이 완료되었습니다.\n신청번호: ' + result.requestNo + '\n처리 현황은 마이페이지에서 확인하실 수 있습니다.');
            closeReturnModal();

            // 주문 목록 새로고침
            loadSoloOrders(currentSoloPage);
            loadGroupBuyOrders(currentGroupPage);
        } else {
            const error = await response.json();
            alert('반품/교환 신청에 실패했습니다: ' + (error.message || '알 수 없는 오류'));
        }
    } catch (error) {
        console.error('반품/교환 신청 실패:', error);
        alert('반품/교환 신청 중 오류가 발생했습니다.');
    }
}

/**
 * 특정 아이템에 대해 리뷰 작성이 가능한지 확인
 */
function canWriteReviewForItem(order, orderItem) {
    // 이미 리뷰를 작성했는지 확인 (서버에서 제공하는 정보 기반)
    if (orderItem.reviewWritten === true) {
        return false;
    }

    // 구매 확정되지 않았고, 배송 완료 상태인 경우 리뷰 작성 가능
    return !orderItem.confirmedAt && orderItem.status === 'DELIVERED';
}

/**
 * 개별 아이템 구매 확정
 */
async function confirmItemPurchase(orderNo, orderItemId) {
    if (!confirm('이 상품의 구매를 확정하시겠습니까?\n확정 후에는 취소할 수 없습니다.')) {
        return;
    }

    try {
        const result = await fetchWithCsrf(`/api/orders/${orderNo}/items/${orderItemId}/confirm`, {
            method: 'POST'
        });

        if (result) {
            alert('구매가 확정되었습니다.');
            // 주문 목록 새로고침
            loadSoloOrders(currentSoloPage);
            loadGroupBuyOrders(currentGroupPage);
        }
    } catch (error) {
        console.error('구매 확정 실패:', error);
        alert('구매 확정 중 오류가 발생했습니다.');
    }
}

/**
 * 환불 상태를 사용자 친화적으로 표시하는 헬퍼 함수
 */
function getRefundStatusDisplay(refundStatus) {
    if (!refundStatus || refundStatus === 'NONE') {
        return '-';
    }

    const statusMap = {
        'REQUESTED': '<span class="refund-requested">환불 요청</span>',
        'APPROVED': '<span class="refund-processing">환불 승인</span>',
        'PROCESSING': '<span class="refund-processing">환불 처리중</span>',
        'COMPLETED': '<span class="refund-completed">환불 완료</span>',
        'REJECTED': '<span class="refund-rejected">환불 거부</span>'
    };

    return statusMap[refundStatus] || refundStatus;
}

/**
 * 주문 상세 정보를 모달로 표시하는 함수
 */
async function showOrderDetail(orderNo) {
    if (orderNo === null || orderNo === '' || orderNo === 'null') {
        return;
    }
  const orderDetail = await fetchWithCsrf('/api/orders/' + orderNo + '/detail');

    renderOrderDetailModal(orderDetail);
    document.getElementById('order-detail-modal').style.display = 'block';
}

/**
 * 공동구매 상세 정보를 모달로 표시하는 함수
 * @param {number} groupBuyId - 공동구매 ID
 */
async function showGroupBuyDetail(groupBuyId, myQuantity, myTotalAmount, myJoinedAt, myOrderNo) {
    try {
        // 공동구매 상세 정보 가져오기
        const groupBuyDetail = await fetchWithCsrf('/api/user/orders/groupbuy?gbId=' + groupBuyId);

        if (groupBuyDetail) {
            renderGroupBuyDetailModal(groupBuyDetail, myQuantity, myTotalAmount, myJoinedAt, myOrderNo);
            // 기존 주문 상세 모달을 재사용하거나 새로운 모달 생성
            document.getElementById('group-buy-detail-modal').style.display = 'block';
        }
    } catch (error) {
        console.error('공동구매 상세 정보를 불러오는데 실패했습니다:', error);
        alert('공동구매 정보를 불러올 수 없습니다.');
    }
}

/**
 * 공동구매 상세 모달 렌더링
 * @param {Object} groupBuyDetail - 공동구매 상세 정보
 */
function renderGroupBuyDetailModal(groupBuyDetail, myQuantity, myTotalAmount, myJoinedAt, myOrderNo) {
    // 새로운 모달을 생성하거나 기존 모달 HTML에 추가
    let modal = document.getElementById('group-buy-detail-modal');

    if (!modal) {
        // 모달이 없으면 동적으로 생성
        modal = document.createElement('div');
        modal.id = 'group-buy-detail-modal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>공동구매 상세 정보</h3>
                    <span class="close" onclick="closeGroupBuyDetailModal()">&times;</span>
                </div>
                <div class="modal-body" id="group-buy-detail-body">
                    <!-- 동적으로 채워질 내용 -->
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    const modalBody = modal.querySelector('#group-buy-detail-body');

    // 공동구매 진행률 계산
    const progressPercentage = Math.min((groupBuyDetail.currentQuantity / groupBuyDetail.targetQuantity) * 100, 100);
    const remainingTime = calculateRemainingTime(groupBuyDetail.endDate);

    modalBody.innerHTML = `
        <div class="group-buy-detail-section">
            <h4>공동구매 기본 정보</h4>
            <div class="group-buy-detail-grid">
                <div class="group-buy-detail-item">
                    <span class="detail-label">공동구매명:</span>
                    <span class="detail-value">${groupBuyDetail.name}</span>
                </div>
                <div class="group-buy-detail-item">
                    <span class="detail-label">상품명:</span>
                    <span class="detail-value">${groupBuyDetail.productName}</span>
                </div>
                <div class="group-buy-detail-item">
                    <span class="detail-label">판매자:</span>
                    <span class="detail-value">${groupBuyDetail.sellerName}</span>
                </div>
                <div class="group-buy-detail-item">
                    <span class="detail-label">상태:</span>
                    <span class="detail-value status-${groupBuyDetail.status.toLowerCase()}">${getGroupBuyStatusText(groupBuyDetail.status)}</span>
                </div>
            </div>
        </div>

        <div class="group-buy-detail-section">
            <h4>가격 정보</h4>
            <div class="price-comparison">
                <div class="price-item">
                    <span class="price-label">일반 가격:</span>
                    <span class="original-price">${formatNumber(groupBuyDetail.originalVariantPrice)}원</span>
                </div>
                <div class="price-item">
                    <span class="price-label">공동구매 가격:</span>
                    <span class="group-price">${formatNumber(groupBuyDetail.groupPrice)}원</span>
                </div>
                <div class="price-item discount-info">
                    <span class="price-label">할인율:</span>
                    <span class="discount-rate">${calculateDiscountRate(groupBuyDetail.originalVariantPrice, groupBuyDetail.groupPrice)}% 할인</span>
                </div>
            </div>
        </div>

        <div class="group-buy-detail-section">
            <h4>진행 현황</h4>
            <div class="progress-info">
                <div class="progress-bar-container">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progressPercentage}%"></div>
                    </div>
                    <div class="progress-text">${groupBuyDetail.currentQuantity} / ${groupBuyDetail.targetQuantity}개 (${progressPercentage.toFixed(1)}%)</div>
                </div>
                <div class="time-info">
                    <div class="detail-item">
                        <span class="detail-label">시작일:</span>
                        <span class="detail-value">${formatDateTime(groupBuyDetail.startDate)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">종료일:</span>
                        <span class="detail-value">${formatDateTime(groupBuyDetail.endDate)}</span>
                    </div>
                    ${remainingTime ? `
                        <div class="detail-item">
                            <span class="detail-label">남은 시간:</span>
                            <span class="detail-value remaining-time">${remainingTime}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>

        <div class="group-buy-detail-section">
            <h4>내 참여 정보</h4>
            <div class="my-participation">
                <div class="detail-item">
                    <span class="detail-label">참여 수량:</span>
                    <span class="detail-value">${myQuantity}개</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">결제 금액:</span>
                    <span class="detail-value">${formatNumber(myTotalAmount)}원</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">참여일:</span>
                    <span class="detail-value">${formatDateTime(myJoinedAt)}</span>
                </div>
                ${myOrderNo ? `
                    <div class="detail-item">
                        <span class="detail-label">주문번호:</span>
                        <span class="detail-value">
                            <a href="javascript:void(0)" onclick="closeGroupBuyDetailModal();showOrderDetail('${myOrderNo}')">${myOrderNo}</a>
                        </span>
                    </div>
                ` : ''}
            </div>
        </div>

        ${groupBuyDetail.description ? `
            <div class="group-buy-detail-section">
                <h4>상세 설명</h4>
                <div class="description-content">${groupBuyDetail.description}</div>
            </div>
        ` : ''}
    `;
}

/**
 * 공동구매 상세 모달 닫기
 */
function closeGroupBuyDetailModal() {
    const modal = document.getElementById('group-buy-detail-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * 공동구매 상태를 한국어로 변환
 */
function getGroupBuyStatusText(status) {
    const statusMap = {
        'PENDING': '대기중',
        'ACTIVE': '진행중',
        'SUCCESS': '성공',
        'FAILED': '실패',
        'CANCELLED': '취소됨'
    };
    return statusMap[status] || status;
}

/**
 * 할인율 계산
 */
function calculateDiscountRate(originalPrice, groupPrice) {
    return Math.round(((originalPrice - groupPrice) / originalPrice) * 100);
}

/**
 * 남은 시간 계산 (진행중인 공동구매만)
 */
function calculateRemainingTime(endDate) {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end - now;

    if (diff <= 0) return null;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
        return `${days}일 ${hours}시간`;
    } else if (hours > 0) {
        return `${hours}시간 ${minutes}분`;
    } else {
        return `${minutes}분`;
    }
}

/**
 * 주문 상세 모달 렌더링
 */
function renderOrderDetailModal(orderDetail) {
    const modal = document.getElementById('order-detail-modal');
    const modalBody = modal.querySelector('.modal-body');

    modalBody.innerHTML = `
                <div class="order-detail-section">
                    <h4>주문 정보</h4>
                    <div class="order-detail-grid">
                        <div>
                            <div class="order-detail-item">
                                <span class="order-detail-label">주문번호:</span>
                                <span class="order-detail-value">${orderDetail.orderNo}</span>
                            </div>
                            <div class="order-detail-item">
                                <span class="order-detail-label">주문일시:</span>
                                <span class="order-detail-value">${formatDateTime(orderDetail.createdAt)}</span>
                            </div>
                            <div class="order-detail-item">
                                <span class="order-detail-label">주문상태:</span>
                                <span class="order-detail-value">${getOrderStatusDisplay(orderDetail.status)}</span>
                            </div>
                        </div>
                        <div>
                            <div class="order-detail-item">
                                <span class="order-detail-label">주문자:</span>
                                <span class="order-detail-value">${orderDetail.customerName}</span>
                            </div>
                            <div class="order-detail-item">
                                <span class="order-detail-label">결제금액:</span>
                                <span class="order-detail-value">${formatNumber(orderDetail.finalAmount)}원</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="order-detail-section">
                    <h4>배송지 정보</h4>
                    <div class="order-detail-item">
                        <span class="order-detail-label">수령인:</span>
                        <span class="order-detail-value">${orderDetail.recipientName}</span>
                    </div>
                    <div class="order-detail-item">
                        <span class="order-detail-label">연락처:</span>
                        <span class="order-detail-value">${orderDetail.recipientPhone}</span>
                    </div>
                    <div class="order-detail-item">
                        <span class="order-detail-label">주소:</span>
                        <span class="order-detail-value">
                            (${orderDetail.recipientZipcode}) ${orderDetail.recipientAddress} ${orderDetail.recipientAddressDetail}
                        </span>
                    </div>
                    ${orderDetail.recipientDelivReqMsg ? `
        <div class="order-detail-item">
        <span class="order-detail-label">배송 요청사항:</span>
    <span class="order-detail-value">${orderDetail.recipientDelivReqMsg}</span>
</div>
    ` : ''}
                </div>

                <div class="order-detail-section">
                    <h4>주문 상품</h4>
                    <table class="order-items-table">
                        <thead>
                            <tr>
                                <th>상품명</th>
                                <th>옵션</th>
                                <th>수량</th>
                                <th>단가</th>
                                <th>합계</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${orderDetail.items.map(item => `
    <tr>
    <td>${item.productName}</td>
    <td>${item.optionCombination || '-'}</td>
    <td>${item.quantity}</td>
    <td>${formatNumber(item.priceAtPurchase)}원</td>
    <td>${formatNumber(item.totalPriceAtPurchase)}원</td>
</tr>
    `).join('')}
                        </tbody>
                    </table>
                </div>

                <div class="order-detail-section">
                    <h4>결제 정보</h4>
                    <div class="order-detail-item">
                        <span class="order-detail-label">상품금액:</span>
                        <span class="order-detail-value">${formatNumber(orderDetail.subTotalAmount)}원</span>
                    </div>
                    <div class="order-detail-item">
                        <span class="order-detail-label">배송비:</span>
                        <span class="order-detail-value">${formatNumber(orderDetail.shippingFee)}원</span>
                    </div>
                    ${orderDetail.discount > 0 ? `
    <div class="order-detail-item">
        <span class="order-detail-label">할인금액:</span>
    <span class="order-detail-value">-${formatNumber(orderDetail.discount)}원</span>
</div>
    ` : ''}
                    <div class="order-detail-item" style="border-top: 1px solid #eee; padding-top: 8px; font-weight: bold;">
                        <span class="order-detail-label">총 결제금액:</span>
                        <span class="order-detail-value">${formatNumber(orderDetail.finalAmount)}원</span>
                    </div>
                </div>

                ${orderDetail.shipping ? `
    <div class="order-detail-section">
        <h4>배송 정보</h4>
    <div class="tracking-info">
        <div class="order-detail-item">
            <span class="order-detail-label">택배사:</span>
            <span class="order-detail-value">${orderDetail.shipping.carrier}</span>
        </div>
        <div class="order-detail-item">
            <span class="order-detail-label">운송장번호:</span>
            <span class="order-detail-value tracking-number">${orderDetail.shipping.trackingNumber}</span>
        </div>
        <div class="order-detail-item">
            <span class="order-detail-label">배송상태:</span>
            <span class="order-detail-value">${orderDetail.shipping.status}</span>
        </div>
        ${orderDetail.shipping.shippedAt ? `
                                <div class="order-detail-item">
                                    <span class="order-detail-label">발송일:</span>
                                    <span class="order-detail-value">${formatDateTime(orderDetail.shipping.shippedAt)}</span>
                                </div>
                            ` : ''}
        ${orderDetail.shipping.deliveredAt ? `
                                <div class="order-detail-item">
                                    <span class="order-detail-label">배송완료일:</span>
                                    <span class="order-detail-value">${formatDateTime(orderDetail.shipping.deliveredAt)}</span>
                                </div>
                            ` : ''}
    </div>
</div>
    ` : ''}
            `;
}

/**
 * 주문 상세 모달 닫기
 */
function closeOrderDetailModal() {
    document.getElementById('order-detail-modal').style.display = 'none';
}

/**
 * 날짜시간 포맷팅 함수
 */
function formatDateTime(dateTimeString) {
    if (!dateTimeString) return '-';
    const date = new Date(dateTimeString);
    return date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showImageModal(imageUrl) {
    // 이미지 확대 보기 모달을 만들 수 있습니다
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2000;
    `;

    const img = document.createElement('img');
    img.src = imageUrl;
    img.style.cssText = `
        max-width: 90%;
        max-height: 90%;
        object-fit: contain;
    `;

    modal.appendChild(img);
    document.body.appendChild(modal);

    modal.addEventListener('click', function() {
        document.body.removeChild(modal);
    });
}

// 리뷰 수정 모달 관련 전역 변수
let currentEditingReviewId = null;
let currentReviewData = null;
let existingImagesToDelete = [];
let newImagesToAdd = [];

/**
 * 리뷰 수정 모달을 여는 함수
 */
async function editReview(reviewId) {
    try {
        // 리뷰 상세 정보 가져오기
        const reviewData = await fetchWithCsrf(`/api/reviews/${reviewId}`);
        if (!reviewData) {
            alert('리뷰 정보를 가져올 수 없습니다.');
            return;
        }

        currentEditingReviewId = reviewId;
        currentReviewData = reviewData;
        existingImagesToDelete = [];
        newImagesToAdd = [];

        // 모달 데이터 설정
        setupReviewEditModal(reviewData);

        // 모달 표시
        document.getElementById('review-edit-modal').style.display = 'block';

    } catch (error) {
        console.error('리뷰 수정 모달 열기 실패:', error);
        alert('리뷰를 불러오는 중 오류가 발생했습니다.');
    }
}

/**
 * 리뷰 수정 모달 데이터 설정
 */
function setupReviewEditModal(reviewData) {
    // 상품 정보 설정
    document.getElementById('review-product-name').textContent = reviewData.productName;
    document.getElementById('review-product-details').textContent = '주문일: ' + formatDate(reviewData.createdAt);

    // 별점 설정
    setStarRating(reviewData.rating);

    // 리뷰 내용 설정
    document.getElementById('review-content').value = reviewData.comment || '';

    // 기존 이미지 렌더링
    renderExistingImages(reviewData.imageUrls || []);

    // 새 이미지 초기화
    clearNewImages();

    // 이벤트 리스너 설정
    setupReviewEditEventListeners();
}

/**
 * 별점 설정
 */
function setStarRating(rating) {
    const stars = document.querySelectorAll('#review-star-rating .star');
    stars.forEach((star, index) => {
        star.classList.toggle('active', index < rating);
    });
}

/**
 * 기존 이미지 렌더링
 */
function renderExistingImages(imageUrls) {
    const existingImagesContainer = document.getElementById('existing-images');
    const noExistingImagesDiv = document.getElementById('no-existing-images');

    existingImagesContainer.innerHTML = '';

    if (imageUrls && imageUrls.length > 0) {
        noExistingImagesDiv.style.display = 'none';

        imageUrls.forEach((imageUrl, index) => {
            const imageItem = document.createElement('div');
            imageItem.className = 'existing-image-item';
            imageItem.innerHTML = `
                <img src="${contextPath}${imageUrl}" alt="리뷰 이미지 ${index + 1}" class="existing-image-thumbnail">
                <button type="button" class="existing-image-delete" onclick="deleteExistingImage('${imageUrl}', this)">
                    ×
                </button>
            `;
            existingImagesContainer.appendChild(imageItem);
        });
    } else {
        noExistingImagesDiv.style.display = 'block';
    }
}

/**
 * 기존 이미지 삭제
 */
function deleteExistingImage(imageUrl, buttonElement) {
    if (confirm('이 이미지를 삭제하시겠습니까?')) {
        // 삭제할 이미지 목록에 추가
        existingImagesToDelete.push(imageUrl);

        // UI에서 제거
        buttonElement.parentElement.remove();

        // 기존 이미지가 모두 삭제되었는지 확인
        const remainingImages = document.querySelectorAll('.existing-image-item');
        if (remainingImages.length === 0) {
            document.getElementById('no-existing-images').style.display = 'block';
        }
    }
}

/**
 * 새 이미지 미리보기 초기화
 */
function clearNewImages() {
    newImagesToAdd = [];
    document.getElementById('new-images-preview').innerHTML = '';
    document.getElementById('new-images-input').value = '';
}

/**
 * 새 이미지 추가 처리
 */
function handleNewImageFiles(files) {
    const maxFiles = 5;
    const maxFileSize = 5 * 1024 * 1024; // 5MB

    // 현재 이미지 수 체크
    const currentImageCount = newImagesToAdd.length +
        (currentReviewData.imageUrls ? currentReviewData.imageUrls.length : 0) -
        existingImagesToDelete.length;

    if (currentImageCount >= maxFiles) {
        alert(`최대 ${maxFiles}장까지 업로드할 수 있습니다.`);
        return;
    }

    Array.from(files).forEach(file => {
        // 파일 크기 체크
        if (file.size > maxFileSize) {
            alert(`${file.name}의 크기가 너무 큽니다. (최대 5MB)`);
            return;
        }

        // 이미지 파일 체크
        if (!file.type.startsWith('image/')) {
            alert(`${file.name}은 이미지 파일이 아닙니다.`);
            return;
        }

        // 중복 체크
        if (newImagesToAdd.some(f => f.name === file.name && f.size === file.size)) {
            return;
        }

        // 최대 개수 체크
        if (newImagesToAdd.length >= maxFiles) {
            alert(`최대 ${maxFiles}장까지 업로드할 수 있습니다.`);
            return;
        }

        newImagesToAdd.push(file);
        addNewImagePreview(file);
    });
}

/**
 * 새 이미지 미리보기 추가
 */
function addNewImagePreview(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById('new-images-preview');
        const imageItem = document.createElement('div');
        imageItem.className = 'new-image-item';
        imageItem.innerHTML = `
            <img src="${e.target.result}" alt="새 이미지" class="new-image-thumbnail">
            <button type="button" class="new-image-delete" onclick="deleteNewImage('${file.name}', this)">
                ×
            </button>
        `;
        preview.appendChild(imageItem);
    };
    reader.readAsDataURL(file);
}

/**
 * 새 이미지 삭제
 */
function deleteNewImage(fileName, buttonElement) {
    // 배열에서 제거
    newImagesToAdd = newImagesToAdd.filter(file => file.name !== fileName);

    // UI에서 제거
    buttonElement.parentElement.remove();
}

/**
 * 리뷰 수정 이벤트 리스너 설정
 */
function setupReviewEditEventListeners() {
    // 별점 클릭 이벤트
    const stars = document.querySelectorAll('#review-star-rating .star');
    stars.forEach(star => {
        star.addEventListener('click', function() {
            const rating = parseInt(this.dataset.rating);
            setStarRating(rating);
        });
    });

    // 파일 선택 이벤트
    const fileInput = document.getElementById('new-images-input');
    fileInput.addEventListener('change', function(e) {
        handleNewImageFiles(e.target.files);
    });

    // 드래그 앤 드롭 이벤트
    const dropArea = document.getElementById('new-images-section');

    dropArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        dropArea.classList.add('dragover');
    });

    dropArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        dropArea.classList.remove('dragover');
    });

    dropArea.addEventListener('drop', function(e) {
        e.preventDefault();
        dropArea.classList.remove('dragover');
        handleNewImageFiles(e.dataTransfer.files);
    });
}

/**
 * 리뷰 수정 저장
 */
async function saveReviewEdit() {
    if (!currentEditingReviewId) return;

    // 유효성 검사
    const rating = document.querySelectorAll('#review-star-rating .star.active').length;
    const content = document.getElementById('review-content').value.trim();

    if (rating === 0) {
        alert('별점을 선택해주세요.');
        return;
    }

    if (!content) {
        alert('리뷰 내용을 입력해주세요.');
        return;
    }

    try {
        // 저장 버튼 비활성화
        const saveBtn = document.querySelector('.review-edit-save-btn');
        saveBtn.disabled = true;
        saveBtn.textContent = '저장 중...';

        // 1. 먼저 기존 이미지 삭제
        for (const imageUrl of existingImagesToDelete) {
            // 이미지 ID 추출 (URL에서 파일명 추출하여 ID로 사용)
            const imageFileName = imageUrl.split('/').pop();
            await fetchWithCsrf(`/api/reviews/${currentEditingReviewId}/images/${imageFileName}`, {
                method: 'DELETE'
            });
        }

        // 2. 리뷰 기본 정보 업데이트
        const formData = new FormData();

        const reviewData = {
            rating: rating,
            comment: content,
        };

        formData.append('reviewData', JSON.stringify(reviewData));

        // 3. 새 이미지 추가
        newImagesToAdd.forEach(file => {
            formData.append('images', file);
        });

        // 기존 이미지 유지 여부 (삭제된 이미지가 있으면 false)
        formData.append('keepExistingImages', existingImagesToDelete.length === 0 ? 'true' : 'false');

        // 4. 리뷰 업데이트 요청
        const response = await fetch(contextPath + `/api/reviews/${currentEditingReviewId}`, {
            method: 'PUT',
            headers: {
                [csrfHeader]: csrfToken,
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: formData
        });

        if (response.ok) {
            alert('리뷰가 성공적으로 수정되었습니다.');
            closeReviewEditModal();
            loadReviews(currentReviewPage); // 현재 페이지 새로고침
        } else {
            const errorData = await response.json().catch(() => ({ message: '리뷰 수정에 실패했습니다.' }));
            alert(errorData.message || '리뷰 수정에 실패했습니다.');
        }

    } catch (error) {
        console.error('리뷰 수정 중 오류:', error);
        alert('리뷰 수정 중 오류가 발생했습니다.');
    } finally {
        // 저장 버튼 복원
        const saveBtn = document.querySelector('.review-edit-save-btn');
        saveBtn.disabled = false;
        saveBtn.textContent = '저장';
    }
}

/**
 * 리뷰 수정 모달 닫기
 */
function closeReviewEditModal() {
    document.getElementById('review-edit-modal').style.display = 'none';
    currentEditingReviewId = null;
    currentReviewData = null;
    existingImagesToDelete = [];
    newImagesToAdd = [];
}

/**
 * 모달 외부 클릭 시 닫기
 */
document.addEventListener('click', function(e) {
    const modal = document.getElementById('review-edit-modal');
    if (e.target === modal) {
        closeReviewEditModal();
    }
});

/**
 * ESC 키로 모달 닫기
 */
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const modal = document.getElementById('review-edit-modal');
        if (modal && modal.style.display === 'block') {
            closeReviewEditModal();
        }
    }
});

// 리뷰 삭제 함수
async function deleteReview(reviewId) {
    if (confirm('이 리뷰를 삭제하시겠습니까?')) {
        const result = await fetchWithCsrf('/api/user/reviews/' + reviewId, { method: 'DELETE' });
        if (result !== null) {
            alert('리뷰가 삭제되었습니다.');
            loadReviews(currentReviewPage); // 현재 페이지 새로고침
        }
    }
}

// QnA 수정 모달 관련 전역 변수
let currentEditingQnAId = null;
let currentQnAData = null;

// 상품 문의 수정 함수
async function editProductQnA(qnaId) {
    try {
        // QnA 상세 정보 가져오기
        const qnaData = await fetchWithCsrf(`/api/user/product-qnas/${qnaId}`);
        if (!qnaData) {
            alert('문의 정보를 가져올 수 없습니다.');
            return;
        }

        // 답변이 이미 달린 문의는 수정 불가
        if (qnaData.answer) {
            alert('이미 답변이 달린 문의는 수정할 수 없습니다.');
            return;
        }

        currentEditingQnAId = qnaId;
        currentQnAData = qnaData;

        // 모달 표시
        showQnAEditModal();

        // 모달 데이터 설정
        setupQnAEditModal(qnaData);

    } catch (error) {
        console.error('QnA 수정 모달 열기 실패:', error);
        alert('문의를 불러오는 중 오류가 발생했습니다.');
    }
}

/**
 * QnA 수정 모달 표시
 */
function showQnAEditModal() {
    // 기존 모달이 있다면 제거
    const existingModal = document.getElementById('qna-edit-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // 새 모달 HTML 생성
    const modalHtml = `
        <div id="qna-edit-modal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>상품 문의 수정</h3>
                    <span class="close" onclick="closeQnAEditModal()">&times;</span>
                </div>
                <div class="modal-body">
                    <form id="qna-edit-form">
                        <!-- 상품 정보 -->
                        <div class="qna-product-info">
                            <div class="qna-product-name" id="qna-product-name">상품명</div>
                            <div class="qna-product-details" id="qna-product-details">문의 작성일</div>
                        </div>

                        <!-- 문의 제목 -->
                        <div class="form-group">
                            <label for="qna-title">문의 제목 *</label>
                            <input 
                                type="text" 
                                id="qna-title" 
                                class="form-control" 
                                placeholder="문의 제목을 입력하세요"
                                maxlength="100"
                                required
                            >
                            <div class="error-message" id="title-validation">
                                제목은 1자 이상 100자 이하로 입력해주세요.
                            </div>
                        </div>

                        <!-- 문의 내용 -->
                        <div class="form-group">
                            <label for="qna-content">문의 내용 *</label>
                            <textarea 
                                id="qna-content" 
                                class="form-control" 
                                placeholder="문의하고 싶은 내용을 자세히 작성해주세요."
                                maxlength="1000"
                                rows="6"
                                required
                            ></textarea>
                            <div class="qna-char-count" id="qna-char-count">0 / 1000자</div>
                            <div class="error-message" id="content-validation">
                                문의 내용은 10자 이상 1000자 이하로 입력해주세요.
                            </div>
                        </div>

                        <!-- 비밀글 설정 -->
                        <div class="checkbox-group">
                            <input type="checkbox" id="qna-is-secret" name="is_secret">
                            <label for="qna-is-secret">비밀글로 작성 (판매자만 확인 가능)</label>
                        </div>
                    </form>
                </div>
                <div class="form-actions">
                    <button type="button" class="button-style" onclick="closeQnAEditModal()">취소</button>
                    <button type="button" class="button-style primary" onclick="saveQnAEdit()" id="qna-save-btn" disabled>수정 완료</button>
                </div>
            </div>
        </div>
    `;

    // DOM에 모달 추가
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.getElementById('qna-edit-modal').style.display = 'block';
}

/**
 * QnA 수정 모달 데이터 설정
 */
function setupQnAEditModal(qnaData) {
    // 상품 정보 설정
    document.getElementById('qna-product-name').textContent = qnaData.productName;
    document.getElementById('qna-product-details').textContent =
        `작성일: ${formatDate(qnaData.questionedAt)}`;

    // 폼 데이터 설정
    document.getElementById('qna-title').value = qnaData.title || '';
    document.getElementById('qna-content').value = qnaData.question || '';
    document.getElementById('qna-is-secret').checked = qnaData.isSecret || false;

    // 글자 수 업데이트
    updateQnACharCount();

    // 이벤트 리스너 설정
    setupQnAEditEventListeners();

    // 유효성 검사
    validateQnAForm();
}

/**
 * QnA 수정 이벤트 리스너 설정
 */
function setupQnAEditEventListeners() {
    const titleInput = document.getElementById('qna-title');
    const contentTextarea = document.getElementById('qna-content');

    // 제목 입력 이벤트
    titleInput.addEventListener('input', function() {
        validateQnAForm();
    });

    // 내용 입력 이벤트
    contentTextarea.addEventListener('input', function() {
        updateQnACharCount();
        validateQnAForm();
    });

    // 비밀글 체크박스 이벤트
    document.getElementById('qna-is-secret').addEventListener('change', function() {
        validateQnAForm();
    });
}

/**
 * QnA 글자 수 업데이트
 */
function updateQnACharCount() {
    const content = document.getElementById('qna-content').value;
    const charCount = content.length;
    const charCountElement = document.getElementById('qna-char-count');

    charCountElement.textContent = `${charCount} / 1000자`;

    // 글자 수에 따른 색상 변경
    charCountElement.style.color = charCount >= 900 ? '#dc3545' : charCount >= 800 ? '#ffc107' : '#666';
}

/**
 * QnA 폼 유효성 검사
 */
function validateQnAForm() {
    const title = document.getElementById('qna-title').value.trim();
    const content = document.getElementById('qna-content').value.trim();
    const saveBtn = document.getElementById('qna-save-btn');

    let isValid = true;

    // 제목 유효성 검사
    const titleValidation = document.getElementById('title-validation');
    if (title.length === 0 || title.length > 100) {
        titleValidation.style.display = 'block';
        isValid = false;
    } else {
        titleValidation.style.display = 'none';
    }

    // 내용 유효성 검사
    const contentValidation = document.getElementById('content-validation');
    if (content.length < 10 || content.length > 1000) {
        contentValidation.style.display = 'block';
        isValid = false;
    } else {
        contentValidation.style.display = 'none';
    }

    // 저장 버튼 활성화/비활성화
    if (saveBtn) {
        saveBtn.disabled = !isValid;
    }

    return isValid;
}

/**
 * QnA 수정 저장
 */
async function saveQnAEdit() {
    if (!currentEditingQnAId || !validateQnAForm()) return;

    const title = document.getElementById('qna-title').value.trim();
    const content = document.getElementById('qna-content').value.trim();
    const isSecret = document.getElementById('qna-is-secret').checked;

    try {
        // 저장 버튼 비활성화
        const saveBtn = document.getElementById('qna-save-btn');
        saveBtn.disabled = true;
        saveBtn.textContent = '저장 중...';

        // QnA 수정 요청
        const qnaData = {
            title: title,
            question: content,
            isSecret: isSecret
        };

        const response = await fetchWithCsrf(`/api/user/product-qnas/${currentEditingQnAId}`, {
            method: 'PUT',
            body: JSON.stringify(qnaData)
        });

        if (response) {
            alert('문의가 성공적으로 수정되었습니다.');
            closeQnAEditModal();
            loadProductQnA(currentQnaPage); // 현재 페이지 새로고침
        }

    } catch (error) {
        console.error('QnA 수정 중 오류:', error);
        alert('문의 수정 중 오류가 발생했습니다.');
    } finally {
        // 저장 버튼 복원
        const saveBtn = document.getElementById('qna-save-btn');
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = '수정 완료';
        }
    }
}

/**
 * QnA 수정 모달 닫기
 */
function closeQnAEditModal() {
    const modal = document.getElementById('qna-edit-modal');
    if (modal) {
        modal.style.display = 'none';
        modal.remove();
    }

    currentEditingQnAId = null;
    currentQnAData = null;
}

// 상품 문의 삭제 함수
async function deleteProductQnA(qnaId) {
    if (confirm('이 상품 문의를 삭제하시겠습니까?')) {
        const result = await fetchWithCsrf('/api/user/product-qnas/' + qnaId, { method: 'DELETE' });
        if (result !== null) {
            alert('상품 문의가 삭제되었습니다.');
            loadProductQnA(currentQnaPage); // 현재 페이지 새로고침
        }
    }
}

/**
 * =================================================================
 * 페이지 초기화 및 이벤트 바인딩
 * =================================================================
 */

document.addEventListener("DOMContentLoaded", function () {
    const navLinks = document.querySelectorAll(".mypage-nav .nav-link");
    const orderHistorySection = document.getElementById("order-history-content");

    // --- 메인 탭 제어 로직 ---
    function setActive(link, section) {
        navLinks.forEach(l => l.classList.remove("active"));
        document.querySelectorAll(".mypage-content .content-section").forEach(s => s.classList.remove("active"));
        if (link) link.classList.add("active");
        if (section) section.classList.add("active");
    }

    // 각 메인 탭을 처음 클릭했을 때 데이터를 로드하는 함수
    function handleMainTabClick(targetId) {
        const link = document.querySelector('.mypage-nav a[href="#' + targetId + '"]');

        switch(targetId) {
            case 'member-info-content': loadMemberInfo(); break;
            case 'order-history-content':
                // 주문 내역 탭이 처음 로드될 때, 그 안의 기본 활성 탭(단독 구매)을 클릭해줌
                orderHistorySection?.querySelector('.tabs .tab-button.active')?.click();
                break;
            case 'coupon-history-content': loadCoupons(); break;
            case 'review-management-content': loadReviews(); break;
            case 'product-qna-content': loadProductQnA(); break;
            case 'personal-inquiry-content': loadPersonalInquiry(); break;
            case 'joined-gb-content': loadParticipatedGroupBuys(); break;
            case 'notifications-content': loadNotifications(); break;
        }
    }

    navLinks.forEach(link => {
        link.addEventListener("click", function (event) {
            event.preventDefault();
            const targetId = this.getAttribute("href").substring(1);
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                setActive(this, targetSection);
                history.pushState(null, null, "#" + targetId);
                handleMainTabClick(targetId);
            }
        });
    });

    // --- 주문 내역 내부 탭 제어 로직 ---
    if (orderHistorySection) {
        const tabButtons = orderHistorySection.querySelectorAll(".tabs .tab-button");
        const tabContents = orderHistorySection.querySelectorAll(".tab-content");

        tabButtons.forEach(button => {
            button.addEventListener("click", function () {
                const targetTabId = this.getAttribute("data-tab");
                const targetTabContent = orderHistorySection.querySelector('#' + targetTabId);

                tabButtons.forEach(btn => btn.classList.remove("active"));
                tabContents.forEach(content => content.classList.remove("active"));

                this.classList.add("active");
                if (targetTabContent) targetTabContent.classList.add("active");

                // 탭을 클릭했을 때, 아직 로드되지 않았다면 데이터를 불러옵니다.
                if (targetTabId === 'solo-orders') {
                    loadSoloOrders();
                } else if (targetTabId === 'group-orders') {
                    loadGroupBuyOrders();
                }
            });
        });
    }

    // --- 배송지 폼 이벤트 리스너 설정 ---
    setupFormListeners();

    // --- 초기 페이지 로딩 로직 ---
    const currentHash = window.location.hash || '#member-info-content';
    const initialLink = document.querySelector('.mypage-nav a[href="' + currentHash + '"]');
    if (initialLink) {
        initialLink.click();
    }
});

// --- 쿠폰 등록, 배송지 관리 등 사용자와 상호작용하는 함수들 ---
/*
* =================================================================
* 사용자 인터랙션 관련 함수 (모달, 저장, 삭제 등)
* =================================================================
*/

/**
 * '새 배송지 추가' 버튼 클릭 시 모달을 'add' 모드로 엽니다.
 */
function addAddress() {
    openAddressModal('add');
}

/**
 * '수정' 버튼 클릭 시 모달을 'edit' 모드로 엽니다.
 */
function editAddress(addressId) {
    openAddressModal('edit', addressId);
}

/**
 * 쿠폰 등록 기능
 */
async function addCoupon() {
    const couponInput = document.getElementById("coupon-code-input");
    const couponCode = couponInput.value.trim();

    if (!couponCode) {
        showMessage("쿠폰 번호를 입력해주세요.", "error");
        return;
    }

    const result = await fetchWithCsrf('/api/user/coupons', {
        method: 'POST',
        body: JSON.stringify({ couponCode: couponCode })
    });

    if (result) {
        showMessage(result.message || "쿠폰이 성공적으로 등록되었습니다.", "success");
        couponInput.value = "";
        await loadCoupons(); // 쿠폰 목록 새로고침
    }
}

/**
 * 쿠폰 등록 폼 아래에 잠시 메시지를 표시하는 함수
 */
function showMessage(text, type) {
    const messageElement = document.getElementById("coupon-add-message");
    if(messageElement) {
        messageElement.textContent = text;
        messageElement.className = "coupon-add-message " + type;
        setTimeout(() => {
            messageElement.textContent = "";
            messageElement.className = "coupon-add-message";
        }, 3000);
    }
}

/**
 * 마케팅 정보 수신 동의 설정을 저장하는 함수
 */
async function saveConsents() {
    const consentData = {
        emailConsent: document.getElementById('consent-email').checked,
        smsConsent: document.getElementById('consent-sms').checked
    };

    const result = await fetchWithCsrf('/api/user/marketing-consents', {
        method: 'PUT',
        body: JSON.stringify(consentData)
    });

    if (result) {
        alert('마케팅 수신 동의 설정이 저장되었습니다.');
    }
}

/**
 * 비밀번호 변경을 요청하는 함수
 */
async function changePassword() {
    const form = document.getElementById("passwordChangeForm");
    const currentPassword = form.currentPassword.value;
    const newPassword = form.newPassword.value;
    const confirmNewPassword = form.confirmNewPassword.value;

    if (newPassword !== confirmNewPassword) {
        alert("새 비밀번호가 일치하지 않습니다.");
        return;
    }
    if (!newPassword) {
        alert("새 비밀번호를 입력해주세요.");
        return;
    }

    const result = await fetchWithCsrf('/api/reset-password', {
        method: 'POST',
        body: JSON.stringify({
            currentPassword: currentPassword,
            newPassword: newPassword
        })
    });

    if(result) {
        alert('비밀번호가 성공적으로 변경되었습니다.');
        form.reset();
    }
}

/**
 * 회원 탈퇴를 요청하는 함수
 */
async function requestAccountDeactivation() {
    const password = prompt("계정을 영구적으로 비활성화하시려면, 본인 확인을 위해 비밀번호를 입력해주세요.");
    if (password === null) return; // 사용자가 '취소'를 누른 경우
    if (!password) {
        alert("비밀번호를 입력해야 탈퇴를 진행할 수 있습니다.");
        return;
    }

    if (confirm("정말로 회원 탈퇴를 진행하시겠습니까?\n모든 정보가 비식별화 처리되며 복구할 수 없습니다.")) {
        const result = await fetchWithCsrf('/api/account', {
            method: 'DELETE',
            body: JSON.stringify({ password: password })
        });
        if(result){
            alert("회원 탈퇴가 완료되었습니다. 이용해주셔서 감사합니다.");
            window.location.href = contextPath + "/logout"; // 로그아웃 처리 후 메인으로 이동
        }
    }
}

/**
 * 배송지 추가/수정 모달을 여는 함수
 */
async function openAddressModal(mode, addressId = null) {
    const modal = document.getElementById("address-modal");
    const modalTitle = document.getElementById("address-modal-title");
    resetAddressForm();

    if (mode === 'edit' && addressId) {
        modalTitle.textContent = "배송지 수정";
        const address = await fetchWithCsrf('/api/user/shipping-addresses/' + addressId);
        if (address) {
            document.getElementById('address-id').value = address.id;
            document.getElementById('address-label').value = address.name;
            document.getElementById('recipient-name').value = address.recipientName;
            document.getElementById('recipient-phone').value = address.phone;
            document.getElementById('address-display').value = '(' + address.zipcode + ') ' + address.address;
            document.getElementById('address-data').value = JSON.stringify({ zipcode: address.zipcode, address: address.address });
            document.getElementById('address-detail').value = address.addressDetail;
            document.getElementById('is-default-address').checked = address.isDefault;
            validateAddressForm();
        }
    } else {
        modalTitle.textContent = "새 배송지 추가";
    }
    modal.style.display = 'block';
}

/**
 * 배송지 모달을 닫는 함수
 */
function closeAddressModal() {
    const modal = document.getElementById("address-modal");
    if(modal) modal.style.display = "none";
}

/**
 * 새 주소 또는 수정된 주소 정보를 저장하는 함수
 */
async function saveAddress() {
    if (!validateAddressForm()) return;

    const addressId = document.getElementById('address-id').value;
    const addressDataRaw = document.getElementById('address-data').value;
    const addressParsed = JSON.parse(addressDataRaw);

    const dto = {
        name: document.getElementById('address-label').value.trim(),
        recipientName: document.getElementById('recipient-name').value.trim(),
        phone: document.getElementById('recipient-phone').value.trim(),
        zipcode: addressParsed.zipcode,
        address: addressParsed.address,
        addressDetail: document.getElementById('address-detail').value.trim(),
        isDefault: document.getElementById('is-default-address').checked,
    };

    const url = addressId ? '/api/user/shipping-addresses/' + addressId : '/api/user/shipping-addresses';
    const method = addressId ? 'PUT' : 'POST';

    const result = await fetchWithCsrf(url, { method: method, body: JSON.stringify(dto) });
    if (result) {
        alert('배송지가 저장되었습니다.');
        closeAddressModal();
        loadMemberInfo(); // 목록 새로고침
    }
}

/**
 * 배송지를 삭제하는 함수
 */
async function deleteAddress(addressId) {
    if (confirm('이 배송지를 삭제하시겠습니까?')) {
        const result = await fetchWithCsrf('/api/user/shipping-addresses/' + addressId, { method: 'DELETE' });
        if (result) {
            alert('배송지가 삭제되었습니다.');
            loadMemberInfo(); // 목록 새로고침
        }
    }
}

/**
 * 특정 배송지를 기본 배송지로 설정하는 함수
 */
async function setDefaultAddress(addressId) {
    if (confirm('기본 배송지로 설정하시겠습니까?')) {
        const result = await fetchWithCsrf('/api/user/shipping-addresses/' + addressId + '/default', { method: 'PUT' });
        if (result) {
            alert('기본 배송지가 변경되었습니다.');
            loadMemberInfo(); // 목록 새로고침
        }
    }
}

/**
 * =================================================================
 * 주소 검색, 폼 유효성 검사 등 기타 헬퍼 함수
 * =================================================================
 */

/**
 * 주소 폼을 초기 상태로 리셋하는 함수
 */
function resetAddressForm() {
    const form = document.getElementById("address-form");
    if (!form) return;

    form.reset();
    document.getElementById("address-id").value = "";
    document.getElementById("address-data").value = "";
    document.getElementById("address-display").value = "";

    // 모든 오류 메시지를 숨깁니다.
    const errorMessages = form.querySelectorAll(".error-message");
    errorMessages.forEach((msg) => (msg.style.display = "none"));

    // 저장 버튼을 비활성화합니다.
    document.getElementById("save-address-btn").disabled = true;
}

/**
 * 다음 우편번호 서비스를 호출하여 주소를 검색하는 함수
 */
function searchAddress() {
    new daum.Postcode({
        oncomplete: function (data) {
            // 주소 데이터를 JSON 형태로 hidden input에 저장
            const addressData = {
                zipcode: data.zonecode,
                address: data.address,
            };
            document.getElementById("address-data").value = JSON.stringify(addressData);

            // 사용자에게 보여질 주소 필드를 채웁니다.
            document.getElementById("address-display").value = '(' + data.zonecode + ') ' + data.address;

            // 상세 주소 입력란으로 포커스를 이동시킵니다.
            document.getElementById("address-detail").focus();

            // 주소가 선택되었음을 알려 유효성 검사를 트리거합니다.
            validateAddressForm();
        },
    }).open();
}

/**
 * 배송지 폼의 각 필드에 대한 유효성을 검사하는 함수
 * @returns {boolean} 폼이 유효하면 true, 아니면 false
 */
function validateAddressForm() {
    let isValid = true;
    const nameInput = document.getElementById("recipient-name");
    const phoneInput = document.getElementById("recipient-phone");
    const addressDataInput = document.getElementById("address-data");
    const nameError = document.getElementById("name-error");
    const phoneError = document.getElementById("phone-error");

    // 이름 유효성 검사
    if (!nameInput.value.trim()) {
        nameError.style.display = "block";
        isValid = false;
    } else {
        nameError.style.display = "none";
    }

    // 전화번호 유효성 검사
    if (!isValidPhoneNumber(phoneInput.value.trim())) {
        phoneError.style.display = "block";
        isValid = false;
    } else {
        phoneError.style.display = "none";
    }

    // 주소 검색 여부 검사
    if (!addressDataInput.value.trim()) {
        isValid = false;
    }

    // 최종 유효성에 따라 저장 버튼 활성화/비활성화
    document.getElementById("save-address-btn").disabled = !isValid;
    return isValid;
}

/**
 * 한국 휴대폰 번호 형식을 간단히 검사하는 정규식
 */
function isValidPhoneNumber(phone) {
    const phoneRegex = /^01[0-9]{1}-?\d{3,4}-?\d{4}$/;
    return phoneRegex.test(phone);
}

/**
 * 배송지 폼의 입력 필드에 이벤트 리스너를 설정하는 함수
 */
function setupFormListeners() {
    const nameInput = document.getElementById("recipient-name");
    const phoneInput = document.getElementById("recipient-phone");
    const addressDisplayInput = document.getElementById("address-display");

    if (nameInput) nameInput.addEventListener("input", validateAddressForm);
    if (phoneInput) phoneInput.addEventListener("input", validateAddressForm);

    // 주소 검색 버튼을 클릭하도록 유도
    if(addressDisplayInput) {
        addressDisplayInput.addEventListener('click', searchAddress);
    }

    // 사용자가 입력할 때 전화번호 형식 자동 변환
    if (phoneInput) {
        phoneInput.addEventListener("input", function (e) {
            let value = e.target.value.replace(/[^0-9]/g, "");
            let formattedValue = "";
            if (value.length > 3) {
                formattedValue += value.substring(0, 3) + "-";
                if (value.length > 7) {
                    formattedValue += value.substring(3, 7) + "-" + value.substring(7, 11);
                } else {
                    formattedValue += value.substring(3);
                }
            } else {
                formattedValue = value;
            }
            e.target.value = formattedValue;
        });
    }
}

/**
 * 알림 설정을 서버에 저장하는 함수
 */
async function saveNotifications() {
    // 1. 각 체크박스의 현재 상태를 읽어와 DTO와 동일한 구조의 객체를 생성합니다.
    const settingsData = {
        gbEnd: document.getElementById('notify-gb-end').checked,
        gbSuccess: document.getElementById('notify-gb-success').checked,
        gbFail: document.getElementById('notify-gb-fail').checked,
        orderShipped: document.getElementById('notify-order-shipped').checked,
        refundUpdate: document.getElementById('notify-refund-update').checked,
        myGbUpdate: document.getElementById('notify-my-gb-update').checked
    };

    // 2. 확인 절차를 거칩니다.
    if (!confirm('알림 설정을 저장하시겠습니까?')) {
        return;
    }

    // 3. fetchWithCsrf 헬퍼 함수를 사용하여 서버에 PUT 요청을 보냅니다.
    const result = await fetchWithCsrf('/api/user/notification-settings', {
        method: 'PUT',
        body: JSON.stringify(settingsData)
    });

    // 4. 요청 성공 시 사용자에게 알림을 표시합니다.
    if (result) {
        alert('알림 설정이 성공적으로 저장되었습니다.');
    }
    // 참고: fetchWithCsrf 함수는 요청 실패 시(네트워크 오류, 서버 오류 등)
    // 이미 alert 창으로 오류를 알려주므로 별도의 실패 처리가 필요 없습니다.
}

/**
 * 이메일이나 전화번호 수정 기능 (기존 코드와 호환성 유지)
 */
async function editInfo(field) {
    let currentValue = '';
    let newValue = '';
    let fieldLabel = '';

    if (field === 'email') {
        currentValue = document.getElementById('emailInput').value;
        fieldLabel = '이메일';
    } else if (field === 'phone') {
        currentValue = document.getElementById('phoneInput').value;
        fieldLabel = '휴대폰 번호';
    }

    newValue = prompt(`새로운 ${fieldLabel}을 입력하세요:`, currentValue);

    if (newValue === null || newValue.trim() === '') return;
    if (newValue === currentValue) {
        alert('동일한 값입니다.');
        return;
    }

    try {
        const updateData = {};
        updateData[field] = newValue.trim();

        const result = await fetchWithCsrf('/api/user/profile', {
            method: 'PUT',
            body: JSON.stringify(updateData)
        });

        if (result) {
            alert(`${fieldLabel}이 성공적으로 변경되었습니다.`);
            if (field === 'email') {
                document.getElementById('emailInput').value = newValue.trim();
            } else if (field === 'phone') {
                document.getElementById('phoneInput').value = newValue.trim();
            }
        }
    } catch (error) {
        console.error(`${fieldLabel} 변경 실패:`, error);
        alert(`${fieldLabel} 변경 중 오류가 발생했습니다.`);
    }
}

/**
 * 로그아웃 함수 - POST 방식으로 안전하게 처리
 */
function logout() {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = contextPath + '/perform-logout';

    // CSRF 토큰 추가
    if (csrfToken && csrfHeader) {
        const csrfInput = document.createElement('input');
        csrfInput.type = 'hidden';
        csrfInput.name = '_csrf';
        csrfInput.value = csrfToken;
        form.appendChild(csrfInput);
    }

    document.body.appendChild(form);
    form.submit();
}