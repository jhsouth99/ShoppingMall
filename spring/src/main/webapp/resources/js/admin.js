// ========== 전역 변수 설정 ==========
let csrfToken = '';
let csrfHeader = '';

// 쿠폰 관리 전역 변수
let currentCouponsPage = 1;
let couponsPerPage = 5;
let currentCouponFilter = {
    keyword: '',
    status: ''
};

// 공동구매 관리 전역 변수
let currentGroupBuysPage = 1;
let groupBuysPerPage = 10;
let currentGroupBuyFilter = {
    keyword: '',
    status: ''
};

// 주문 관리 전역 변수
let currentOrdersPage = 1;
let ordersPerPage = 10;
let currentOrderFilter = {
    keyword: '',
    status: ''
};

// 속성 관리 전역 변수
let currentAttributesPage = 1;
let attributesPerPage = 10;
let currentAttributeFilter = {
    keyword: '',
    dataType: '',
    attributeGroup: ''
};

// 속성 옵션 관리 전역 변수
let currentAttributeIdForOptions = null;
let attributeOptions = [];

// ========== 메인 초기화 함수 ==========
document.addEventListener("DOMContentLoaded", function () {
    initCSRFToken();
    initModalElements();
    initSidebarNavigation();
    initDashboard();
    initCouponManagement();
    initCategoryManagement();
    initAttributeManagement();
    initGroupBuyManagement();
    initOrderManagement();
    initGlobalEventListeners();
    initUserManagement();
});

// ========== CSRF 토큰 관련 함수들 ==========
function initCSRFToken() {
    const tokenMeta = document.querySelector('meta[name="_csrf"]');
    const headerMeta = document.querySelector('meta[name="_csrf_header"]');

    if (tokenMeta && headerMeta) {
        csrfToken = tokenMeta.getAttribute('content');
        csrfHeader = headerMeta.getAttribute('content');
    }
}

function getCSRFHeaders() {
    const headers = {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
    };

    if (csrfToken && csrfHeader) {
        headers[csrfHeader] = csrfToken;
    }

    return headers;
}

// ========== 전역 이벤트 리스너 ==========
function initGlobalEventListeners() {
    // ESC 키로 모달 닫기
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            const modals = document.querySelectorAll('.modal');
            modals.forEach(modal => {
                if (modal.style.display === 'block') {
                    hideModal(modal);
                }
            });
        }
    });

    // 모달 외부 클릭 시 닫기
    window.addEventListener('click', function(event) {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (event.target === modal) {
                hideModal(modal);
            }
        });
    });
}

// ========== 모달 관련 함수들 ==========
function initModalElements() {
    // 모든 모달의 닫기 버튼에 이벤트 리스너 추가
    const closeModalButtons = document.querySelectorAll('.close-modal');
    closeModalButtons.forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                hideModal(modal);
            }
        });
    });
}

function showModal(modal) {
    if (modal) {
        modal.style.display = "block";
    }
}

function hideModal(modal) {
    if (modal) {
        modal.style.display = "none";
    }
}

// ========== 사이드바 네비게이션 ==========
function initSidebarNavigation() {
    const navLinks = document.querySelectorAll(".sidebar-nav .nav-link");
    const contentSections = document.querySelectorAll(".admin-main .content-section");

    function setActiveSection(link, section) {
        navLinks.forEach((l) => l.classList.remove("active"));
        contentSections.forEach((s) => s.classList.remove("active"));
        if (link) link.classList.add("active");
        if (section) section.classList.add("active");
    }

    const currentHash = window.location.hash || "#dashboard";
    let initialLink = document.querySelector(`.sidebar-nav a[href="${currentHash}"]`);
    let initialSection = document.querySelector(currentHash);

    if (!initialLink || !initialSection) {
        initialLink = document.querySelector('.sidebar-nav a[href="#dashboard"]');
        initialSection = document.getElementById("dashboard");
    }

    setActiveSection(initialLink, initialSection);

    navLinks.forEach((link) => {
        link.addEventListener("click", function (event) {
            event.preventDefault();
            const targetId = this.getAttribute("href");
            const targetSection = document.querySelector(targetId);
            if (targetSection) {
                setActiveSection(this, targetSection);
                history.pushState(null, null, targetId);

                // 각 섹션별 데이터 로드
                if (targetId === '#category-management') {
                    loadCategoryTree();
                } else if (targetId === '#attribute-management') {
                    loadAttributesList();
                } else if (targetId === '#groupbuy-management') {
                    loadGroupBuysList();
                } else if (targetId === '#order-management') {
                    loadOrdersList();
                } else if (targetId === '#coupon-management') {
                    loadCouponsList();
                }
            }
        });
    });

    window.addEventListener("popstate", function () {
        const hash = window.location.hash || "#dashboard";
        let targetLink = document.querySelector(`.sidebar-nav a[href="${hash}"]`);
        let targetSection = document.querySelector(hash);

        if (!targetLink || !targetSection) {
            targetLink = document.querySelector('.sidebar-nav a[href="#dashboard"]');
            targetSection = document.getElementById("dashboard");
        }
        setActiveSection(targetLink, targetSection);
    });

    initUserTabs();
}

function initUserTabs() {
    const userManagementSection = document.getElementById("user-management");
    if (userManagementSection) {
        const userTabButtons = userManagementSection.querySelectorAll(".user-tabs .user-tab-button");
        const userTabContents = userManagementSection.querySelectorAll(".user-tab-content");

        function setActiveUserTab(button, content) {
            userTabButtons.forEach((btn) => btn.classList.remove("active"));
            userTabContents.forEach((c) => c.classList.remove("active"));
            if (button) button.classList.add("active");
            if (content) content.classList.add("active");
        }

        if (userTabButtons.length > 0 && userTabContents.length > 0) {
            const initialActiveTabButton = userManagementSection.querySelector(".user-tabs .user-tab-button");
            const initialActiveTabContentId = initialActiveTabButton?.getAttribute("data-tab");
            const initialActiveTabContent = initialActiveTabContentId
                ? userManagementSection.querySelector(`#${initialActiveTabContentId}`)
                : null;
            setActiveUserTab(initialActiveTabButton, initialActiveTabContent);

            userTabButtons.forEach((button) => {
                button.addEventListener("click", function () {
                    const targetTabId = this.getAttribute("data-tab");
                    const targetTabContent = userManagementSection.querySelector(`#${targetTabId}`);
                    if (targetTabContent) {
                        setActiveUserTab(this, targetTabContent);
                    }
                });
            });
        }
    }
}

// ========== 대시보드 관련 함수들 ==========
function initDashboard() {
    loadDashboardData();
    // 5분마다 대시보드 데이터 자동 새로고침
    setInterval(loadDashboardData, 5 * 60 * 1000);
}

async function loadDashboardData() {
    try {
        showDashboardLoading();

        const response = await fetch('/ecommerce/api/admin/dashboard-summary', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        updateDashboardDisplay(data);

    } catch (error) {
        console.error('대시보드 데이터 로드 실패:', error);
        showDashboardError();
    }
}

function showDashboardLoading() {
    const loadingText = '로딩 중...';
    const elements = [
        'dashboard-today-sales',
        'dashboard-orders',
        'dashboard-new-users',
        'dashboard-reports'
    ];

    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = loadingText;
            element.style.color = '#666';
        }
    });
}

function showDashboardError() {
    const errorText = '로드 실패';
    const elements = [
        'dashboard-today-sales',
        'dashboard-orders',
        'dashboard-new-users',
        'dashboard-reports'
    ];

    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = errorText;
            element.style.color = '#dc3545';
        }
    });
}

function updateDashboardDisplay(data) {
    // 매출 (오늘) 업데이트
    const todaySalesElement = document.getElementById('dashboard-today-sales');
    if (todaySalesElement) {
        todaySalesElement.textContent = formatCurrency(data.todaySales);
        todaySalesElement.style.color = '#333';
        animateValue(todaySalesElement, 0, data.todaySales, 1000, formatCurrency);
    }

    // 새 주문 (오늘) 업데이트
    const ordersElement = document.getElementById('dashboard-orders');
    if (ordersElement) {
        ordersElement.textContent = data.newOrders + '건';
        ordersElement.style.color = '#333';
        animateValue(ordersElement, 0, data.newOrders, 800, (val) => val + '건');
    }

    // 신규 가입 회원 (오늘) 업데이트
    const newUsersElement = document.getElementById('dashboard-new-users');
    if (newUsersElement) {
        newUsersElement.textContent = data.newUsersToday + '명';
        newUsersElement.style.color = '#333';
        animateValue(newUsersElement, 0, data.newUsersToday, 800, (val) => val + '명');
    }

    // 미처리 신고 업데이트
    const reportsElement = document.getElementById('dashboard-reports');
    if (reportsElement) {
        reportsElement.textContent = data.unprocessedReports + '건';
        reportsElement.style.color = data.unprocessedReports > 0 ? '#dc3545' : '#333';
        animateValue(reportsElement, 0, data.unprocessedReports, 800, (val) => val + '건');
    }

    updateLastRefreshTime();
}

function formatCurrency(amount) {
    if (amount === 0) return '0원';

    if (amount >= 100000000) {
        const billion = Math.floor(amount / 100000000);
        const remainder = amount % 100000000;
        if (remainder === 0) {
            return billion + '억원';
        } else {
            return billion + '억 ' + formatCurrency(remainder);
        }
    } else if (amount >= 10000) {
        const man = Math.floor(amount / 10000);
        const remainder = amount % 10000;
        if (remainder === 0) {
            return man + '만원';
        } else {
            return man + '만 ' + amount.toString().slice(-4).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '원';
        }
    } else {
        return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '원';
    }
}

function animateValue(element, start, end, duration, formatter) {
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = 1 - Math.pow(1 - progress, 4);
        const currentValue = Math.round(start + (end - start) * easedProgress);

        element.textContent = formatter(currentValue);

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

function updateLastRefreshTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    const dashboardSection = document.getElementById('dashboard');
    if (dashboardSection) {
        let refreshInfo = dashboardSection.querySelector('.refresh-info');
        if (!refreshInfo) {
            refreshInfo = document.createElement('p');
            refreshInfo.className = 'refresh-info';
            refreshInfo.style.cssText = 'margin-top: 20px; color: #666; font-size: 0.9em; text-align: right;';
            dashboardSection.appendChild(refreshInfo);
        }
        refreshInfo.textContent = `마지막 업데이트: ${timeString}`;
    }
}

// ========== 쿠폰 관리 관련 함수들 ==========
function initCouponManagement() {
    // 쿠폰 추가 버튼
    const addCouponBtn = document.querySelector("#coupon-management .btn-primary");
    if (addCouponBtn) {
        addCouponBtn.addEventListener("click", addCoupon);
    }

    // 검색 기능
    const searchButton = document.querySelector("#coupon-management .filter-controls .btn-secondary");
    if (searchButton) {
        searchButton.addEventListener("click", handleCouponSearch);
    }

    // 검색 입력 필드에서 엔터키 처리
    const searchInput = document.querySelector("#coupon-management .filter-controls input[type='text']");
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleCouponSearch();
            }
        });
    }

    // 상태 필터 변경 이벤트
    const statusSelect = document.querySelector("#coupon-management .filter-controls select");
    if (statusSelect) {
        statusSelect.addEventListener('change', handleCouponSearch);
    }

    // 쿠폰 생성 폼
    const couponForm = document.getElementById("couponForm");
    if (couponForm) {
        couponForm.addEventListener("submit", handleCouponFormSubmit);
    }

    // 쿠폰 수정 폼
    const editCouponForm = document.getElementById("editCouponForm");
    if (editCouponForm) {
        editCouponForm.addEventListener("submit", handleEditCouponFormSubmit);
    }

    // 취소 버튼들
    const cancelCouponBtn = document.getElementById("cancelCoupon");
    if (cancelCouponBtn) {
        cancelCouponBtn.addEventListener("click", function() {
            hideModal(document.getElementById("couponModal"));
        });
    }

    const cancelEditCouponBtn = document.getElementById("cancelEditCoupon");
    if (cancelEditCouponBtn) {
        cancelEditCouponBtn.addEventListener("click", function() {
            hideModal(document.getElementById("editCouponModal"));
        });
    }

    // 페이지 로드 시 쿠폰 목록 불러오기
    if (window.location.hash === '#coupon-management') {
        loadCouponsList();
    }
}

function addCoupon() {
    const modal = document.getElementById("couponModal");
    const form = document.getElementById("couponForm");

    // 폼 초기화
    form.reset();
    initDateFields();

    // 모달 제목 변경
    const modalTitle = document.querySelector("#couponModal .modal-header h3");
    if (modalTitle) {
        modalTitle.textContent = "새 쿠폰 등록";
    }

    showModal(modal);
}

function handleCouponSearch() {
    const searchInput = document.querySelector("#coupon-management .filter-controls input[type='text']");
    const statusSelect = document.querySelector("#coupon-management .filter-controls select");

    currentCouponFilter.keyword = searchInput ? searchInput.value.trim() : '';
    currentCouponFilter.status = statusSelect ? statusSelect.value : '';
    currentCouponsPage = 1;

    loadCouponsList();
}

async function loadCouponsList() {
    try {
        showCouponListLoading();

        const params = new URLSearchParams({
            page: currentCouponsPage.toString(),
            size: couponsPerPage.toString(),
            keyword: currentCouponFilter.keyword || '',
            status: currentCouponFilter.status || ''
        });

        const response = await fetch(`/ecommerce/api/admin/coupons?${params}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const pageResult = await response.json();
        updateCouponTable(pageResult.content);
        updateCouponPagination(pageResult);

    } catch (error) {
        console.error('쿠폰 목록 로드 실패:', error);
        showCouponListError();
    }
}

function showCouponListLoading() {
    const tbody = document.querySelector("#coupon-management .data-table tbody");
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">쿠폰 목록을 불러오는 중...</td></tr>';
    }
}

function showCouponListError() {
    const tbody = document.querySelector("#coupon-management .data-table tbody");
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center" style="color: red;">쿠폰 목록을 불러오는데 실패했습니다.</td></tr>';
    }
}

function updateCouponTable(coupons) {
    const tbody = document.querySelector("#coupon-management .data-table tbody");
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!coupons || coupons.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">등록된 쿠폰이 없습니다.</td></tr>';
        return;
    }

    coupons.forEach((coupon, index) => {
        const row = document.createElement('tr');

        const discountInfo = coupon.discountType === 'PERCENTAGE'
            ? coupon.discountValue + '%'
            : formatPrice(coupon.discountValue) + '원';

        row.innerHTML = `
            <td>${(currentCouponsPage - 1) * couponsPerPage + index + 1}</td>
            <td>${coupon.code}</td>
            <td>${coupon.name}</td>
            <td>${discountInfo}</td>
            <td>${coupon.currentUsageCount || 0}/${coupon.totalUsageLimit || '∞'}</td>
            <td>${formatDate(coupon.issueStartDate)} ~ ${formatDate(coupon.issueEndDate)}</td>
            <td>${formatDate(coupon.validFrom)} ~ ${formatDate(coupon.validTo)}</td>
            <td class="actions">
                <button class="btn btn-secondary btn-sm" onclick="editCoupon(${coupon.id})">수정</button>
                <button class="btn btn-danger btn-sm" onclick="deleteCoupon(${coupon.id})">삭제</button>
            </td>
        `;

        tbody.appendChild(row);
    });
}

function updateCouponPagination(pageResult) {
    updatePaginationUI('coupon-management', pageResult, (page) => {
        currentCouponsPage = page;
        loadCouponsList();
    });
}

async function handleCouponFormSubmit(e) {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);

    const couponData = {
        code: formData.get('coupon-code'),
        name: formData.get('coupon-name'),
        discountType: 'PERCENTAGE',
        discountValue: parseInt(formData.get('discount-rate')),
        totalUsageLimit: parseInt(formData.get('coupon-count')),
        issueStartDate: formData.get('issue-start-date'),
        issueEndDate: formData.get('issue-end-date'),
        validFrom: formData.get('usage-start-date'),
        validTo: formData.get('usage-end-date'),
        isActive: true
    };

    try {
        const response = await fetch('/ecommerce/api/admin/coupons', {
            method: 'POST',
            headers: getCSRFHeaders(),
            body: JSON.stringify(couponData)
        });

        if (!response.ok) {
            throw new Error(`쿠폰 생성 실패: ${response.status}`);
        }

        alert('쿠폰이 성공적으로 생성되었습니다.');
        hideModal(document.getElementById("couponModal"));
        loadCouponsList();

    } catch (error) {
        console.error('쿠폰 생성 오류:', error);
        alert('쿠폰 생성 중 오류가 발생했습니다: ' + error.message);
    }
}

async function editCoupon(couponId) {
    try {
        const response = await fetch(`/ecommerce/api/admin/coupons/${couponId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        if (!response.ok) {
            throw new Error(`쿠폰 조회 실패: ${response.status}`);
        }

        const coupon = await response.json();
        populateEditCouponModal(coupon);

        const modal = document.getElementById("editCouponModal");
        showModal(modal);

    } catch (error) {
        console.error('쿠폰 상세 정보 로드 실패:', error);
        alert('쿠폰 정보를 불러오는데 실패했습니다.');
    }
}

function populateEditCouponModal(coupon) {
    document.getElementById('edit-coupon-id').value = coupon.id;
    document.getElementById('edit-coupon-code').value = coupon.code;
    document.getElementById('edit-coupon-name').value = coupon.name;
    document.getElementById('edit-coupon-count').value = coupon.totalUsageLimit || '';
    document.getElementById('edit-discount-rate').value = coupon.discountValue;
    document.getElementById('edit-issue-start-date').value = formatDateForInput(coupon.issueStartDate);
    document.getElementById('edit-issue-end-date').value = formatDateForInput(coupon.issueEndDate);
    document.getElementById('edit-usage-start-date').value = formatDateForInput(coupon.validFrom);
    document.getElementById('edit-usage-end-date').value = formatDateForInput(coupon.validTo);
}

async function handleEditCouponFormSubmit(e) {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);
    const couponId = formData.get('edit-coupon-id');

    const couponData = {
        id: parseInt(couponId),
        code: formData.get('edit-coupon-code'),
        name: formData.get('edit-coupon-name'),
        discountType: 'PERCENTAGE',
        discountValue: parseInt(formData.get('edit-discount-rate')),
        totalUsageLimit: parseInt(formData.get('edit-coupon-count')),
        issueStartDate: formData.get('edit-issue-start-date'),
        issueEndDate: formData.get('edit-issue-end-date'),
        validFrom: formData.get('edit-usage-start-date'),
        validTo: formData.get('edit-usage-end-date'),
        isActive: true
    };

    try {
        const response = await fetch(`/ecommerce/api/admin/coupons/${couponId}`, {
            method: 'PUT',
            headers: getCSRFHeaders(),
            body: JSON.stringify(couponData)
        });

        if (!response.ok) {
            throw new Error(`쿠폰 수정 실패: ${response.status}`);
        }

        alert('쿠폰이 성공적으로 수정되었습니다.');
        hideModal(document.getElementById("editCouponModal"));
        loadCouponsList();

    } catch (error) {
        console.error('쿠폰 수정 오류:', error);
        alert('쿠폰 수정 중 오류가 발생했습니다: ' + error.message);
    }
}

async function deleteCoupon(couponId) {
    if (!confirm('정말로 이 쿠폰을 삭제하시겠습니까?\n(삭제 시 비활성화 상태로 변경됩니다)')) {
        return;
    }

    try {
        const response = await fetch(`/ecommerce/api/admin/coupons/${couponId}`, {
            method: 'DELETE',
            headers: getCSRFHeaders()
        });

        if (!response.ok) {
            throw new Error(`쿠폰 삭제 실패: ${response.status}`);
        }

        alert('쿠폰이 성공적으로 삭제되었습니다.');
        loadCouponsList();

    } catch (error) {
        console.error('쿠폰 삭제 오류:', error);
        alert('쿠폰 삭제 중 오류가 발생했습니다: ' + error.message);
    }
}

function initDateFields() {
    const today = new Date().toISOString().split('T')[0];
    const issueStartDateInput = document.getElementById('issue-start-date');
    const issueEndDateInput = document.getElementById('issue-end-date');
    const usageStartDateInput = document.getElementById('usage-start-date');
    const usageEndDateInput = document.getElementById('usage-end-date');

    if (issueStartDateInput) issueStartDateInput.value = today;
    if (issueEndDateInput) issueEndDateInput.value = today;
    if (usageStartDateInput) usageStartDateInput.value = today;
    if (usageEndDateInput) usageEndDateInput.value = today;
}

// ========== 카테고리 관리 관련 함수들 (속성 연결 기능 추가) ==========
function initCategoryManagement() {
    const addTopCategoryBtn = document.getElementById("addTopCategoryBtn");
    if (addTopCategoryBtn) {
        addTopCategoryBtn.addEventListener("click", () => openCategoryModal(null));
    }

    const categoryForm = document.getElementById("categoryForm");
    if (categoryForm) {
        categoryForm.addEventListener("submit", handleCategoryFormSubmit);
    }

    if (window.location.hash === '#category-management') {
        loadCategoryTree();
    }
}

async function loadCategoryTree() {
    console.log("카테고리 트리 로드를 시작합니다.");
    const tbody = document.getElementById("category-tree-body");
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="4" class="text-center">카테고리 로딩 중...</td></tr>';

    try {
        const response = await fetch('/ecommerce/api/admin/categories', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const categories = await response.json();

        tbody.innerHTML = '';
        if (categories && categories.length > 0) {
            renderCategoryTree(categories, tbody, 0);
        } else {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center">등록된 카테고리가 없습니다.</td></tr>';
        }
    } catch (error) {
        console.error("카테고리 트리 로드 실패:", error);
        tbody.innerHTML = `<tr><td colspan="4" class="text-center" style="color:red;">카테고리 정보를 불러오는데 실패했습니다.</td></tr>`;
    }
}

function renderCategoryTree(categories, parentElement, level) {
    categories.forEach(category => {
        const row = document.createElement('tr');
        row.dataset.categoryId = category.id;
        row.dataset.categoryName = category.name;
        row.dataset.category = JSON.stringify(category);

        const nameCell = document.createElement('td');
        nameCell.className = 'category-name';
        nameCell.innerHTML = `<span class="tree-indent" style="padding-left: ${level * 25}px;"></span><span class="category-icon">📁</span> ${category.name}`;

        const idCell = document.createElement('td');
        idCell.textContent = category.id;

        const productCountCell = document.createElement('td');
        productCountCell.textContent = category.productCount || 0;

        const actionsCell = document.createElement('td');
        actionsCell.className = 'actions';
        actionsCell.innerHTML = `
            <button class="btn btn-success btn-sm" onclick="addChildCategory(this)">+ 추가</button>
            <button class="btn btn-secondary btn-sm" onclick="editCategory(this)">수정</button>
            <button class="btn btn-danger btn-sm" onclick="deleteCategory(this, ${category.id})">삭제</button>
        `;

        row.append(nameCell, idCell, productCountCell, actionsCell);
        parentElement.appendChild(row);

        if (category.children && category.children.length > 0) {
            renderCategoryTree(category.children, parentElement, level + 1);
        }
    });
}

function openCategoryModal(category = null, parentCategory = null) {
    const modal = document.getElementById("categoryModal");
    const form = document.getElementById("categoryForm");
    const modalTitle = document.getElementById("categoryModalTitle");

    form.reset();

    if (category) {
        modalTitle.textContent = "카테고리 수정";
        document.getElementById("categoryId").value = category.id;
        document.getElementById("parentId").value = category.parentId || '';
        document.getElementById("categoryName").value = category.name;
        document.getElementById("categoryDescription").value = category.description || '';
        document.getElementById("categoryImageUrl").value = category.imageUrl || '';
        document.getElementById("parentCategoryName").value = category.parentId ? `(ID: ${category.parentId})` : '최상위 카테고리';

        // 카테고리 수정 시 속성 로드
        loadCategoryAttributes(category.id);
    } else if (parentCategory) {
        modalTitle.textContent = "하위 카테고리 추가";
        document.getElementById("categoryId").value = '';
        document.getElementById("parentId").value = parentCategory.id;
        document.getElementById("parentCategoryName").value = `${parentCategory.name} (ID: ${parentCategory.id})`;

        // 새 카테고리 생성 시 속성 로드
        loadCategoryAttributes(null);
    } else {
        modalTitle.textContent = "새 최상위 카테고리 추가";
        document.getElementById("categoryId").value = '';
        document.getElementById("parentId").value = '';
        document.getElementById("parentCategoryName").value = "최상위 카테고리";

        // 새 카테고리 생성 시 속성 로드
        loadCategoryAttributes(null);
    }

    showModal(modal);
}

// 카테고리에 연결된 속성 로드 및 표시
async function loadCategoryAttributes(categoryId) {
    const attributesLoading = document.getElementById('attributesLoading');
    const attributesContainer = document.getElementById('attributesContainer');
    const attributesGrid = document.getElementById('attributesGrid');

    if (attributesLoading) attributesLoading.style.display = 'block';
    if (attributesContainer) attributesContainer.style.display = 'none';

    try {
        // 모든 속성 목록 가져오기 (페이징 없이 전체)
        const attributesResponse = await fetch('/ecommerce/api/admin/attributes?size=1000', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        if (!attributesResponse.ok) {
            throw new Error('속성 목록 로드 실패');
        }

        const attributesResult = await attributesResponse.json();
        // PageResult 형태로 받으므로 content 속성에서 실제 데이터 추출
        const attributes = attributesResult.content || attributesResult;

        // 카테고리에 연결된 속성 정보 가져오기 (수정 모드인 경우)
        let categoryAttributes = [];
        if (categoryId) {
            const categoryAttrResponse = await fetch(`/ecommerce/api/admin/categories/${categoryId}/attributes`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (categoryAttrResponse.ok) {
                categoryAttributes = await categoryAttrResponse.json();
            }
        }

        // 속성 그리드 생성
        attributesGrid.innerHTML = '';

        if (attributes.length === 0) {
            attributesGrid.innerHTML = '<p>등록된 속성이 없습니다. 먼저 속성 관리에서 속성을 생성해주세요.</p>';
        } else {
            attributes.forEach(attr => {
                const categoryAttr = categoryAttributes.find(ca => ca.attributeId === attr.id);
                const isChecked = !!categoryAttr;
                const isRequired = categoryAttr ? (categoryAttr.isRequired === true || categoryAttr.isRequired === 'Y') : false;

                const attrElement = document.createElement('div');
                attrElement.className = 'attribute-item';
                attrElement.innerHTML = `
                    <label class="attribute-checkbox">
                        <input type="checkbox" name="attributeIds" value="${attr.id}" ${isChecked ? 'checked' : ''}>
                        <span class="attribute-name">${attr.name}</span>
                        <span class="attribute-type">(${getDataTypeDisplayName(attr.dataType)})</span>
                    </label>
                    <label class="required-checkbox" style="margin-left: 20px; ${isChecked ? '' : 'display: none;'}">
                        <input type="checkbox" name="requiredAttributes" value="${attr.id}" ${isRequired ? 'checked' : ''}>
                        필수
                    </label>
                `;

                // 체크박스 상태 변경 이벤트
                const mainCheckbox = attrElement.querySelector('input[name="attributeIds"]');
                const requiredCheckbox = attrElement.querySelector('input[name="requiredAttributes"]');
                const requiredLabel = attrElement.querySelector('.required-checkbox');

                mainCheckbox.addEventListener('change', function() {
                    if (this.checked) {
                        requiredLabel.style.display = '';
                    } else {
                        requiredLabel.style.display = 'none';
                        requiredCheckbox.checked = false;
                    }
                });

                attributesGrid.appendChild(attrElement);
            });
        }

        if (attributesLoading) attributesLoading.style.display = 'none';
        if (attributesContainer) attributesContainer.style.display = 'block';

    } catch (error) {
        console.error('속성 로드 실패:', error);
        if (attributesLoading) {
            attributesLoading.textContent = '속성 로드에 실패했습니다.';
            attributesLoading.style.color = 'red';
        }
    }
}

function getDataTypeDisplayName(dataType) {
    switch (dataType) {
        case 'TEXT': return '텍스트';
        case 'NUMBER': return '숫자';
        case 'BOOLEAN': return '불린';
        case 'DATE': return '날짜';
        case 'LIST': return '목록';
        default: return dataType;
    }
}

function editCategory(button) {
    const row = button.closest('tr');
    const categoryData = JSON.parse(row.dataset.category);
    openCategoryModal(categoryData);
}

function addChildCategory(button) {
    const row = button.closest('tr');
    const parentCategoryData = {
        id: row.dataset.categoryId,
        name: row.dataset.categoryName
    };
    openCategoryModal(null, parentCategoryData);
}

async function deleteCategory(button, categoryId) {
    if (confirm(`[ID: ${categoryId}] 카테고리를 정말 삭제하시겠습니까?\n하위 카테고리가 있는 경우 삭제할 수 없습니다.`)) {
        try {
            const response = await fetch(`/ecommerce/api/admin/categories/${categoryId}`, {
                method: 'DELETE',
                headers: getCSRFHeaders()
            });

            if (response.ok) {
                alert("카테고리가 삭제되었습니다.");
                button.closest('tr').remove();
            } else if (response.status === 409) {
                alert("하위 카테고리가 존재하여 삭제할 수 없습니다.");
            } else {
                throw new Error(`삭제 실패: ${response.statusText}`);
            }
        } catch (error) {
            console.error("카테고리 삭제 API 호출 실패:", error);
            alert("카테고리 삭제 중 오류가 발생했습니다.");
        }
    }
}

async function handleCategoryFormSubmit(e) {
    e.preventDefault();
    const form = e.target;

    const data = {
        id: form.categoryId.value ? parseInt(form.categoryId.value) : null,
        parentId: form.parentId.value ? parseInt(form.parentId.value) : null,
        name: form.categoryName.value.trim(),
        description: form.categoryDescription.value.trim(),
        imageUrl: form.categoryImageUrl.value.trim(),
    };

    if (!data.name) {
        alert("카테고리명은 필수입니다.");
        return;
    }

    // 속성 연결 정보 수집
    const selectedAttributes = [];
    const attributeCheckboxes = form.querySelectorAll('input[name="attributeIds"]:checked');
    const requiredCheckboxes = form.querySelectorAll('input[name="requiredAttributes"]:checked');
    const requiredAttributeIds = Array.from(requiredCheckboxes).map(cb => parseInt(cb.value));

    attributeCheckboxes.forEach(checkbox => {
        const attributeId = parseInt(checkbox.value);
        selectedAttributes.push({
            attributeId: attributeId,
            isRequired: requiredAttributeIds.includes(attributeId)
        });
    });

    data.attributes = selectedAttributes;

    const isUpdating = !!data.id;
    const url = isUpdating ? `/ecommerce/api/admin/categories/${data.id}` : '/ecommerce/api/admin/categories';
    const method = isUpdating ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: getCSRFHeaders(),
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`${isUpdating ? '수정' : '생성'} 실패: ${response.statusText}`);
        }

        hideModal(document.getElementById('categoryModal'));
        loadCategoryTree();
        alert(`카테고리가 성공적으로 ${isUpdating ? '수정' : '생성'}되었습니다.`);

    } catch (error) {
        console.error('API 요청 실패:', error);
        alert(`작업 중 오류가 발생했습니다: ${error.message}`);
    }
}

// ========== 속성 관리 관련 함수들 ==========
function initAttributeManagement() {
    // 속성 추가 버튼
    const addAttributeBtn = document.getElementById("addAttributeBtn");
    if (addAttributeBtn) {
        addAttributeBtn.addEventListener("click", () => openAttributeModal());
    }

    // 검색 기능
    const searchBtn = document.getElementById("attributeSearchBtn");
    if (searchBtn) {
        searchBtn.addEventListener("click", handleAttributeSearch);
    }

    const searchInput = document.getElementById("attributeSearchInput");
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleAttributeSearch();
            }
        });
    }

    // 필터 변경 이벤트
    const dataTypeFilter = document.getElementById("attributeDataTypeFilter");
    const groupFilter = document.getElementById("attributeGroupFilter");

    if (dataTypeFilter) {
        dataTypeFilter.addEventListener('change', handleAttributeSearch);
    }
    if (groupFilter) {
        groupFilter.addEventListener('change', handleAttributeSearch);
    }

    // 속성 폼
    const attributeForm = document.getElementById("attributeForm");
    if (attributeForm) {
        attributeForm.addEventListener("submit", handleAttributeFormSubmit);
    }

    // 데이터 타입 변경 이벤트
    const dataTypeSelect = document.getElementById("attributeDataType");
    if (dataTypeSelect) {
        dataTypeSelect.addEventListener('change', handleDataTypeChange);
    }

    // 옵션 추가 버튼
    const addOptionBtn = document.getElementById("addOptionBtn");
    if (addOptionBtn) {
        addOptionBtn.addEventListener("click", addAttributeOption);
    }

    const newOptionInput = document.getElementById("newOptionValue");
    if (newOptionInput) {
        newOptionInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                addAttributeOption();
            }
        });
    }

    // 옵션 모달 관련
    const addOptionForModalBtn = document.getElementById("addOptionForModalBtn");
    if (addOptionForModalBtn) {
        addOptionForModalBtn.addEventListener("click", addOptionToModal);
    }

    const newOptionForModalInput = document.getElementById("newOptionValueForModal");
    if (newOptionForModalInput) {
        newOptionForModalInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                addOptionToModal();
            }
        });
    }

    // 페이지 로드 시 속성 목록 불러오기
    if (window.location.hash === '#attribute-management') {
        loadAttributesList();
    }
}

function openAttributeModal(attributeData = null) {
    const modal = document.getElementById("attributeModal");
    const form = document.getElementById("attributeForm");
    const modalTitle = document.getElementById("attributeModalTitle");

    // 폼 초기화
    form.reset();
    attributeOptions = [];
    updateOptionsList();

    // 옵션 섹션 숨기기
    const optionsSection = document.getElementById("attributeOptionsSection");
    if (optionsSection) {
        optionsSection.style.display = 'none';
    }

    if (attributeData) {
        // 수정 모드
        modalTitle.textContent = "속성 수정";

        document.getElementById("attributeId").value = attributeData.id;
        document.getElementById("attributeName").value = attributeData.name;
        document.getElementById("attributeGroup").value = attributeData.attributeGroup || '';
        document.getElementById("attributeDataType").value = attributeData.dataType;
        document.getElementById("attributeDisplayOrder").value = attributeData.displayOrder || 0;
        document.getElementById("attributeIsSearchable").checked = attributeData.isSearchable === true || attributeData.isSearchable === 'Y';
        document.getElementById("attributeIsRequired").checked = attributeData.isRequired === true || attributeData.isRequired === 'Y';

        // LIST 타입인 경우 옵션 로드
        if (attributeData.dataType === 'LIST') {
            loadAttributeOptions(attributeData.id);
            optionsSection.style.display = 'block';
        }
    } else {
        // 생성 모드
        modalTitle.textContent = "새 속성 추가";
        document.getElementById("attributeId").value = '';
    }

    showModal(modal);
}

function handleDataTypeChange() {
    const dataType = document.getElementById("attributeDataType").value;
    const optionsSection = document.getElementById("attributeOptionsSection");

    if (dataType === 'LIST') {
        optionsSection.style.display = 'block';
    } else {
        optionsSection.style.display = 'none';
        // 옵션 초기화
        attributeOptions = [];
        updateOptionsList();
    }
}

function addAttributeOption() {
    const newOptionInput = document.getElementById("newOptionValue");
    const optionValue = newOptionInput.value.trim();

    if (!optionValue) {
        alert('옵션값을 입력해주세요.');
        return;
    }

    if (attributeOptions.some(opt => opt.value === optionValue)) {
        alert('이미 존재하는 옵션값입니다.');
        return;
    }

    attributeOptions.push({
        id: null, // 새로 추가하는 옵션
        value: optionValue,
        displayOrder: attributeOptions.length
    });

    newOptionInput.value = '';
    updateOptionsList();
}

function updateOptionsList() {
    const optionsList = document.getElementById("optionsList");

    optionsList.innerHTML = '';

    attributeOptions.forEach((option, index) => {
        const optionElement = document.createElement('div');
        optionElement.className = 'option-item';
        optionElement.innerHTML = `
            <span class="option-value">${option.value}</span>
            <button type="button" class="btn btn-danger btn-sm" onclick="removeAttributeOption(${index})">삭제</button>
        `;
        optionsList.appendChild(optionElement);
    });
}

function removeAttributeOption(index) {
    attributeOptions.splice(index, 1);
    updateOptionsList();
}

async function loadAttributeOptions(attributeId) {
    try {
        const response = await fetch(`/ecommerce/api/admin/attributes/${attributeId}/options`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        if (response.ok) {
            attributeOptions = await response.json();
            updateOptionsList();
        }
    } catch (error) {
        console.error('속성 옵션 로드 실패:', error);
    }
}

function handleAttributeSearch() {
    const searchInput = document.getElementById("attributeSearchInput");
    const dataTypeFilter = document.getElementById("attributeDataTypeFilter");
    const groupFilter = document.getElementById("attributeGroupFilter");

    currentAttributeFilter.keyword = searchInput ? searchInput.value.trim() : '';
    currentAttributeFilter.dataType = dataTypeFilter ? dataTypeFilter.value : '';
    currentAttributeFilter.attributeGroup = groupFilter ? groupFilter.value : '';
    currentAttributesPage = 1;

    loadAttributesList();
}

async function loadAttributesList() {
    try {
        showAttributeListLoading();

        const params = new URLSearchParams({
            page: currentAttributesPage.toString(),
            size: attributesPerPage.toString(),
            keyword: currentAttributeFilter.keyword || '',
            dataType: currentAttributeFilter.dataType || '',
            attributeGroup: currentAttributeFilter.attributeGroup || ''
        });

        const response = await fetch(`/ecommerce/api/admin/attributes?${params}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const pageResult = await response.json();
        updateAttributeTable(pageResult.content || pageResult);

        if (pageResult.content) {
            updateAttributePagination(pageResult);
        }

    } catch (error) {
        console.error('속성 목록 로드 실패:', error);
        showAttributeListError();
    }
}

function showAttributeListLoading() {
    const tbody = document.getElementById("attributeTableBody");
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">속성 목록을 불러오는 중...</td></tr>';
    }
}

function showAttributeListError() {
    const tbody = document.getElementById("attributeTableBody");
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center" style="color: red;">속성 목록을 불러오는데 실패했습니다.</td></tr>';
    }
}

function updateAttributeTable(attributes) {
    const tbody = document.getElementById("attributeTableBody");
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!attributes || attributes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">등록된 속성이 없습니다.</td></tr>';
        return;
    }

    attributes.forEach(attr => {
        const row = document.createElement('tr');

        row.innerHTML = `
            <td>${attr.id}</td>
            <td>${attr.name}</td>
            <td>${getDataTypeDisplayName(attr.dataType)}</td>
            <td>${attr.attributeGroup || '-'}</td>
            <td>${attr.isSearchable === true || attr.isSearchable === 'Y' ? '✓' : ''}</td>
            <td>${attr.isRequired === true || attr.isRequired === 'Y' ? '✓' : ''}</td>
            <td>${attr.optionCount || 0}</td>
            <td class="actions">
                <button class="btn btn-secondary btn-sm" onclick="editAttribute(${attr.id})">수정</button>
                ${attr.dataType === 'LIST' ?
            `<button class="btn btn-info btn-sm" onclick="manageAttributeOptions(${attr.id}, '${attr.name}', '${attr.dataType}')">옵션 관리</button>` : ''}
                <button class="btn btn-danger btn-sm" onclick="deleteAttribute(${attr.id})">삭제</button>
            </td>
        `;

        tbody.appendChild(row);
    });
}

function updateAttributePagination(pageResult) {
    updatePaginationUI('attribute-management', pageResult, (page) => {
        currentAttributesPage = page;
        loadAttributesList();
    });
}

async function editAttribute(attributeId) {
    try {
        const response = await fetch(`/ecommerce/api/admin/attributes/${attributeId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        if (!response.ok) {
            throw new Error(`속성 조회 실패: ${response.status}`);
        }

        const attribute = await response.json();
        openAttributeModal(attribute);

    } catch (error) {
        console.error('속성 상세 정보 로드 실패:', error);
        alert('속성 정보를 불러오는데 실패했습니다.');
    }
}

async function deleteAttribute(attributeId) {
    if (!confirm('정말로 이 속성을 삭제하시겠습니까?\n카테고리나 상품에서 사용 중인 속성은 삭제할 수 없습니다.')) {
        return;
    }

    try {
        const response = await fetch(`/ecommerce/api/admin/attributes/${attributeId}`, {
            method: 'DELETE',
            headers: getCSRFHeaders()
        });

        if (response.ok) {
            alert('속성이 성공적으로 삭제되었습니다.');
            loadAttributesList();
        } else if (response.status === 409) {
            alert('이 속성은 카테고리나 상품에서 사용 중이므로 삭제할 수 없습니다.');
        } else {
            throw new Error(`삭제 실패: ${response.statusText}`);
        }

    } catch (error) {
        console.error('속성 삭제 오류:', error);
        alert('속성 삭제 중 오류가 발생했습니다.');
    }
}

async function handleAttributeFormSubmit(e) {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);

    const attributeData = {
        id: formData.get('id') ? parseInt(formData.get('id')) : null,
        name: formData.get('name').trim(),
        dataType: formData.get('dataType'),
        attributeGroup: formData.get('attributeGroup') || null,
        isSearchable: formData.get('isSearchable') ? true : false,
        isRequired: formData.get('isRequired') ? true : false,
        displayOrder: parseInt(formData.get('displayOrder')) || 0
    };

    if (!attributeData.name || !attributeData.dataType) {
        alert('속성명과 데이터 타입은 필수입니다.');
        return;
    }

    // LIST 타입인 경우 옵션 데이터 포함
    if (attributeData.dataType === 'LIST') {
        if (attributeOptions.length === 0) {
            alert('LIST 타입 속성은 최소 1개 이상의 옵션이 필요합니다.');
            return;
        }
        attributeData.options = attributeOptions;
    }

    const isUpdating = !!attributeData.id;
    const url = isUpdating ? `/ecommerce/api/admin/attributes/${attributeData.id}` : '/ecommerce/api/admin/attributes';
    const method = isUpdating ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: getCSRFHeaders(),
            body: JSON.stringify(attributeData)
        });

        if (!response.ok) {
            throw new Error(`${isUpdating ? '수정' : '생성'} 실패: ${response.statusText}`);
        }

        alert(`속성이 성공적으로 ${isUpdating ? '수정' : '생성'}되었습니다.`);
        hideModal(document.getElementById('attributeModal'));
        loadAttributesList();

    } catch (error) {
        console.error('속성 저장 오류:', error);
        alert(`속성 저장 중 오류가 발생했습니다: ${error.message}`);
    }
}

// 속성 옵션 관리 모달
async function manageAttributeOptions(attributeId, attributeName, dataType) {
    currentAttributeIdForOptions = attributeId;

    const modal = document.getElementById("attributeOptionsModal");
    const modalTitle = document.getElementById("attributeOptionsModalTitle");

    modalTitle.textContent = `속성 옵션 관리 - ${attributeName}`;

    document.getElementById("optionAttributeName").textContent = attributeName;
    document.getElementById("optionAttributeDataType").textContent = getDataTypeDisplayName(dataType);

    // 옵션 목록 로드
    await loadAttributeOptionsForModal(attributeId);

    showModal(modal);
}

async function loadAttributeOptionsForModal(attributeId) {
    try {
        const response = await fetch(`/ecommerce/api/admin/attributes/${attributeId}/options`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        if (response.ok) {
            const options = await response.json();
            updateOptionsTable(options);
        } else {
            throw new Error('옵션 로드 실패');
        }
    } catch (error) {
        console.error('속성 옵션 로드 실패:', error);
        document.getElementById("optionsTableBody").innerHTML =
            '<tr><td colspan="3" class="text-center" style="color: red;">옵션을 불러오는데 실패했습니다.</td></tr>';
    }
}

function updateOptionsTable(options) {
    const tbody = document.getElementById("optionsTableBody");

    tbody.innerHTML = '';

    if (!options || options.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center">등록된 옵션이 없습니다.</td></tr>';
        return;
    }

    options.forEach(option => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${option.value}</td>
            <td>${option.displayOrder}</td>
            <td class="actions">
                <button class="btn btn-danger btn-sm" onclick="deleteAttributeOption(${option.id})">삭제</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

async function addOptionToModal() {
    const newOptionInput = document.getElementById("newOptionValueForModal");
    const optionValue = newOptionInput.value.trim();

    if (!optionValue) {
        alert('옵션값을 입력해주세요.');
        return;
    }

    try {
        const response = await fetch(`/ecommerce/api/admin/attributes/${currentAttributeIdForOptions}/options`, {
            method: 'POST',
            headers: getCSRFHeaders(),
            body: JSON.stringify({
                optionValue: optionValue
            })
        });

        if (response.ok) {
            newOptionInput.value = '';
            await loadAttributeOptionsForModal(currentAttributeIdForOptions);
            alert('옵션이 추가되었습니다.');
        } else {
            throw new Error('옵션 추가 실패');
        }
    } catch (error) {
        console.error('옵션 추가 오류:', error);
        alert('옵션 추가 중 오류가 발생했습니다.');
    }
}

async function deleteAttributeOption(optionId) {
    if (!confirm('이 옵션을 삭제하시겠습니까?')) {
        return;
    }

    try {
        const response = await fetch(`/ecommerce/api/admin/attribute-options/${optionId}`, {
            method: 'DELETE',
            headers: getCSRFHeaders()
        });

        if (response.ok) {
            await loadAttributeOptionsForModal(currentAttributeIdForOptions);
            alert('옵션이 삭제되었습니다.');
        } else {
            throw new Error('옵션 삭제 실패');
        }
    } catch (error) {
        console.error('옵션 삭제 오류:', error);
        alert('옵션 삭제 중 오류가 발생했습니다.');
    }
}

// ========== 공동구매 관리 관련 함수들 ==========
function initGroupBuyManagement() {
    const groupBuySearchBtn = document.querySelector('#groupbuy-management .filter-controls .btn-secondary');
    if (groupBuySearchBtn) {
        groupBuySearchBtn.addEventListener('click', handleGroupBuySearch);
    }

    const groupBuySearchInput = document.querySelector('#groupbuy-management .filter-controls input[type="text"]');
    if (groupBuySearchInput) {
        groupBuySearchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleGroupBuySearch();
            }
        });
    }

    const groupBuyStatusSelect = document.querySelector('#groupbuy-management .filter-controls select');
    if (groupBuyStatusSelect) {
        groupBuyStatusSelect.addEventListener('change', handleGroupBuySearch);
    }

    if (window.location.hash === '#groupbuy-management') {
        loadGroupBuysList();
    }
}

function handleGroupBuySearch() {
    const searchInput = document.querySelector('#groupbuy-management .filter-controls input[type="text"]');
    const statusSelect = document.querySelector('#groupbuy-management .filter-controls select');

    currentGroupBuyFilter.keyword = searchInput ? searchInput.value.trim() : '';
    currentGroupBuyFilter.status = statusSelect ? statusSelect.value : '';
    currentGroupBuysPage = 1;

    loadGroupBuysList();
}

async function loadGroupBuysList() {
    try {
        showGroupBuyListLoading();

        const params = new URLSearchParams({
            page: currentGroupBuysPage.toString(),
            size: groupBuysPerPage.toString(),
            keyword: currentGroupBuyFilter.keyword,
            status: currentGroupBuyFilter.status
        });

        const response = await fetch(`/ecommerce/api/admin/group-buys?${params}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const pageResult = await response.json();
        updateGroupBuyTable(pageResult.content);
        updateGroupBuyPagination(pageResult);

    } catch (error) {
        console.error('공동구매 목록 로드 실패:', error);
        showGroupBuyListError();
    }
}

function showGroupBuyListLoading() {
    const tbody = document.querySelector('#groupbuy-management .data-table tbody');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">공동구매 목록을 불러오는 중...</td></tr>';
    }
}

function showGroupBuyListError() {
    const tbody = document.querySelector('#groupbuy-management .data-table tbody');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center" style="color: red;">공동구매 목록을 불러오는데 실패했습니다.</td></tr>';
    }
}

function updateGroupBuyTable(groupBuys) {
    const tbody = document.querySelector('#groupbuy-management .data-table tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!groupBuys || groupBuys.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">등록된 공동구매가 없습니다.</td></tr>';
        return;
    }

    groupBuys.forEach(gb => {
        const row = document.createElement('tr');
        const statusColor = getGroupBuyStatusColor(gb.status);
        const formattedStatus = getGroupBuyStatusText(gb.status);

        row.innerHTML = `
            <td>${gb.id}</td>
            <td>${gb.name || '제목 없음'}</td>
            <td>${gb.creatorName || '-'}</td>
            <td>${gb.targetQuantity || 0} / ${gb.currentQuantity || 0}</td>
            <td>${formatDate(gb.startDate)}</td>
            <td>${formatDate(gb.endDate)}</td>
            <td><span style="color: ${statusColor}">${formattedStatus}</span></td>
            <td class="actions">
                <button class="btn btn-secondary btn-sm" onclick="viewGroupBuy(${gb.id})">
                    상세
                </button>
            </td>
        `;

        tbody.appendChild(row);
    });
}

function updateGroupBuyPagination(pageResult) {
    updatePaginationUI('groupbuy-management', pageResult, (page) => {
        currentGroupBuysPage = page;
        loadGroupBuysList();
    });
}

function getGroupBuyStatusColor(status) {
    switch (status) {
        case 'COMPLETED':
        case 'SUCCEEDED':
            return 'green';
        case 'PENDING':
            return 'orange';
        case 'ACTIVE':
            return 'blue';
        case 'FAILED':
            return 'red';
        default:
            return 'black';
    }
}

function getGroupBuyStatusText(status) {
    switch (status) {
        case 'COMPLETED':
        case 'SUCCEEDED':
            return '성공';
        case 'PENDING':
            return '시작 전';
        case 'ACTIVE':
            return '진행중';
        case 'FAILED':
            return '실패';
        case 'CANCELLED':
            return '취소됨';
        default:
            return status;
    }
}

async function viewGroupBuy(groupBuyId) {
    try {
        const response = await fetch(`/ecommerce/api/admin/group-buys/${groupBuyId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const groupBuyData = await response.json();
        populateGroupBuyModal(groupBuyData);

        const modal = document.getElementById('groupBuyDetailModal');
        if (modal) {
            showModal(modal);
        }

    } catch (error) {
        console.error('공동구매 상세 정보 로드 실패:', error);
        alert('공동구매 상세 정보를 불러오는데 실패했습니다.');
    }
}

function populateGroupBuyModal(groupBuyData) {
    document.getElementById('gb-id').textContent = groupBuyData.id || '-';
    document.getElementById('gb-title').textContent = groupBuyData.name || '-';
    document.getElementById('gb-creator').textContent = groupBuyData.creatorName || '-';
    document.getElementById('gb-status').textContent = getGroupBuyStatusText(groupBuyData.status);

    document.getElementById('gb-target').textContent = (groupBuyData.targetQuantity || 0);
    document.getElementById('gb-current').textContent = (groupBuyData.currentQuantity || 0);

    document.getElementById('gb-start-date').textContent = formatDate(groupBuyData.startDate);
    document.getElementById('gb-end-date').textContent = formatDate(groupBuyData.endDate);

    document.getElementById('gb-price').textContent = formatPrice(groupBuyData.groupPrice) + '원';
    document.getElementById('gb-original-price').textContent = formatPrice(groupBuyData.originalVariantPrice) + '원';

    const discountRate = groupBuyData.originalVariantPrice > 0
        ? Math.round((1 - groupBuyData.groupPrice / groupBuyData.originalVariantPrice) * 100)
        : 0;
    document.getElementById('gb-discount-rate').textContent = discountRate + '%';

    document.getElementById('gb-description').textContent = groupBuyData.description || '설명이 없습니다.';

    const optionsContainer = document.getElementById('gb-options');
    optionsContainer.innerHTML = '';

    if (groupBuyData.options && groupBuyData.options.length > 0) {
        groupBuyData.options.forEach(option => {
            const optionElement = document.createElement('span');
            optionElement.className = 'option-badge';
            optionElement.textContent = option;
            optionsContainer.appendChild(optionElement);
        });
    } else {
        optionsContainer.innerHTML = '<span>옵션 정보가 없습니다.</span>';
    }

    const targetQty = groupBuyData.targetQuantity || 1;
    const currentQty = groupBuyData.currentQuantity || 0;
    const progressPercent = Math.min(100, Math.round((currentQty / targetQty) * 100));

    const progressBar = document.getElementById('gb-progress-bar');
    const progressText = document.getElementById('gb-progress-text');

    if (progressBar) {
        progressBar.style.width = progressPercent + '%';
        progressBar.className = 'progress-bar';

        if (progressPercent >= 100) {
            progressBar.classList.add('progress-success');
        } else if (progressPercent >= 70) {
            progressBar.classList.add('progress-good');
        } else if (progressPercent >= 40) {
            progressBar.classList.add('progress-warning');
        } else {
            progressBar.classList.add('progress-danger');
        }
    }

    if (progressText) {
        progressText.textContent = progressPercent + '%';
    }

    const productImage = document.querySelector('#groupBuyDetailModal .gb-thumbnail img');
    if (productImage && groupBuyData.productImageUrl) {
        productImage.src = groupBuyData.productImageUrl;
        productImage.alt = groupBuyData.name || '공동구매 상품 이미지';
    }
}

// ========== 주문 관리 관련 함수들 ==========
function initOrderManagement() {
    const orderSearchBtn = document.querySelector('#order-management .filter-controls .btn-secondary');
    if (orderSearchBtn) {
        orderSearchBtn.addEventListener('click', handleOrderSearch);
    }

    const orderSearchInput = document.querySelector('#order-management .filter-controls input[type="text"]');
    if (orderSearchInput) {
        orderSearchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleOrderSearch();
            }
        });
    }

    const orderStatusSelect = document.querySelector('#order-management .filter-controls select');
    if (orderStatusSelect) {
        orderStatusSelect.addEventListener('change', handleOrderSearch);
    }

    if (window.location.hash === '#order-management') {
        loadOrdersList();
    }
}

function handleOrderSearch() {
    const searchInput = document.querySelector('#order-management .filter-controls input[type="text"]');
    const statusSelect = document.querySelector('#order-management .filter-controls select');

    currentOrderFilter.keyword = searchInput ? searchInput.value.trim() : '';
    currentOrderFilter.status = statusSelect ? statusSelect.value : '';
    currentOrdersPage = 1;

    loadOrdersList();
}

async function loadOrdersList() {
    try {
        showOrderListLoading();

        const params = new URLSearchParams({
            page: currentOrdersPage.toString(),
            size: ordersPerPage.toString(),
            keyword: currentOrderFilter.keyword,
            status: currentOrderFilter.status
        });

        const response = await fetch(`/ecommerce/api/admin/orders?${params}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const pageResult = await response.json();
        updateOrderTable(pageResult.content);
        updateOrderPagination(pageResult);

    } catch (error) {
        console.error('주문 목록 로드 실패:', error);
        showOrderListError();
    }
}

function showOrderListLoading() {
    const tbody = document.querySelector('#order-management .data-table tbody');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">주문 목록을 불러오는 중...</td></tr>';
    }
}

function showOrderListError() {
    const tbody = document.querySelector('#order-management .data-table tbody');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center" style="color: red;">주문 목록을 불러오는데 실패했습니다.</td></tr>';
    }
}

function updateOrderTable(orders) {
    const tbody = document.querySelector('#order-management .data-table tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!orders || orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">주문이 없습니다.</td></tr>';
        return;
    }

    orders.forEach(order => {
        const row = document.createElement('tr');
        const orderType = order.hasReturnRequest ? '공동' : '단독';
        const statusColor = getOrderStatusColor(order.orderStatus);
        const formattedStatus = getOrderStatusText(order.orderStatus);

        row.innerHTML = `
            <td>${order.orderNo}</td>
            <td>${order.customerName}(${order.username})</td>
            <td>${formatDate(order.orderDate)}</td>
            <td>${order.productName} (${order.quantity})</td>
            <td>${formatPrice(order.finalAmount)}원</td>
            <td>${orderType}</td>
            <td><span style="color: ${statusColor}">${formattedStatus}</span></td>
            <td class="actions">
                <button class="btn btn-secondary btn-sm" onclick="viewOrder('${order.orderNo}')">
                    상세
                </button>
            </td>
        `;

        tbody.appendChild(row);
    });
}

function updateOrderPagination(pageResult) {
    updatePaginationUI('order-management', pageResult, (page) => {
        currentOrdersPage = page;
        loadOrdersList();
    });
}

function getOrderStatusColor(status) {
    switch (status) {
        case 'PENDING_PAYMENT':
            return 'orange';
        case 'PAID':
        case 'CONFIRMED':
            return 'blue';
        case 'SHIPPED':
            return 'purple';
        case 'DELIVERED':
            return 'green';
        case 'CANCELLED':
            return 'red';
        case 'REFUNDED':
            return 'gray';
        default:
            return 'black';
    }
}

function getOrderStatusText(status) {
    switch (status) {
        case 'PENDING':
        case 'PENDING_PAYMENT':
            return '결제 대기';
        case 'PAID':
            return '결제 완료';
        case 'CONFIRMED':
            return '주문 확인';
        case 'SHIPPED':
            return '배송중';
        case 'DELIVERED':
            return '배송 완료';
        case 'CANCELLED':
            return '주문 취소';
        case 'REFUNDED':
            return '환불 완료';
        default:
            return status;
    }
}

async function viewOrder(orderNo) {
    try {
        const response = await fetch(`/ecommerce/api/admin/orders/${orderNo}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const orderData = await response.json();
        populateOrderModal(orderData);

        const modal = document.getElementById('orderDetailModal');
        if (modal) {
            showModal(modal);
        }

    } catch (error) {
        console.error('주문 상세 정보 로드 실패:', error);
        alert('주문 상세 정보를 불러오는데 실패했습니다.');
    }
}

function populateOrderModal(orderData) {
    document.getElementById('order-id').textContent = orderData.orderNo || '-';
    document.getElementById('order-date').textContent = formatDateTime(orderData.createdAt);
    document.getElementById('order-status').textContent = getOrderStatusText(orderData.status);
    document.getElementById('order-type').textContent = orderData.isGroupBuy ? '공동구매' : '단독구매';

    document.getElementById('buyer-id').textContent = orderData.username || '-';
    document.getElementById('buyer-name').textContent = orderData.customerName || '-';
    document.getElementById('buyer-phone').textContent = orderData.recipientPhone || '-';

    const fullAddress = [
        orderData.recipientAddress,
        orderData.recipientAddressDetail
    ].filter(Boolean).join(' ');

    document.getElementById('buyer-address').textContent = fullAddress || '-';

    const productsContainer = document.getElementById('order-products');
    productsContainer.innerHTML = '';

    if (orderData.items && orderData.items.length > 0) {
        orderData.items.forEach(item => {
            const productElement = document.createElement('div');
            productElement.className = 'product-item';
            productElement.innerHTML = `
                <p><strong>상품 번호:</strong> ${item.productId}</p>
                <p><strong>상품명:</strong> ${item.productName}</p>
                <p><strong>옵션:</strong> ${item.optionCombination || '기본 옵션'}</p>
                <p><strong>가격:</strong> ${formatPrice(item.priceAtPurchase)}원 x ${item.quantity}개 = ${formatPrice(item.totalPriceAtPurchase)}원</p>
                <hr>
            `;
            productsContainer.appendChild(productElement);
        });
    } else {
        productsContainer.innerHTML = '<p>상품 정보가 없습니다.</p>';
    }

    document.getElementById('total-amount').textContent = formatPrice(orderData.finalAmount) + '원';

    if (orderData.payment) {
        document.getElementById('payment-method').textContent = orderData.payment.paymentMethod || '-';
        document.getElementById('payment-status').textContent = orderData.payment.paymentStatus || '-';

        const totalItemPrice = orderData.items ?
            orderData.items.reduce((sum, item) => sum + item.totalPriceAtPurchase, 0) : 0;
        document.getElementById('product-price').textContent = formatPrice(totalItemPrice) + '원';
        document.getElementById('shipping-fee').textContent = formatPrice(orderData.shippingFee) + '원';
        document.getElementById('discount-amount').textContent = '0원';
    } else {
        document.getElementById('payment-method').textContent = '-';
        document.getElementById('payment-status').textContent = '-';
        document.getElementById('product-price').textContent = formatPrice(orderData.finalAmount) + '원';
        document.getElementById('shipping-fee').textContent = '0원';
        document.getElementById('discount-amount').textContent = '0원';
    }

    if (orderData.shippingInfo) {
        document.getElementById('courier-name').textContent = orderData.shippingInfo.courierName || '-';
        document.getElementById('tracking-number').textContent = orderData.shippingInfo.trackingNumber || '-';
        document.getElementById('shipping-status').textContent = orderData.shippingInfo.shippingStatus || '-';
        document.getElementById('shipping-date').textContent = formatDate(orderData.shippingInfo.shippingDate) || '-';
        document.getElementById('arrival-date').textContent = formatDate(orderData.shippingInfo.arrivalDate) || '-';
    } else {
        document.getElementById('courier-name').textContent = '-';
        document.getElementById('tracking-number').textContent = '-';
        document.getElementById('shipping-status').textContent = getOrderStatusText(orderData.status);
        document.getElementById('shipping-date').textContent = '-';
        document.getElementById('arrival-date').textContent = '-';
    }

    const deliveryMessage = orderData.recipientDelivReqMsg || '배송 요청사항 없음';
    let deliveryMsgElement = document.getElementById('delivery-message');
    if (!deliveryMsgElement) {
        const shippingSection = document.querySelector('#orderDetailModal .order-info-section:last-child');
        if (shippingSection) {
            const deliveryMsgPara = document.createElement('p');
            deliveryMsgPara.innerHTML = `<strong>배송 요청사항:</strong> <span id="delivery-message">${deliveryMessage}</span>`;
            shippingSection.appendChild(deliveryMsgPara);
        }
    } else {
        deliveryMsgElement.textContent = deliveryMessage;
    }
}

// ========== 페이지네이션 공통 함수 ==========
function updatePaginationUI(sectionId, pageResult, onPageChange) {
    let paginationContainer = document.querySelector(`#${sectionId} .pagination-container`);

    if (!paginationContainer) {
        const section = document.getElementById(sectionId);
        if (section) {
            // 기존 pagination 요소가 있으면 제거
            const existingPagination = section.querySelector('.pagination');
            if (existingPagination) {
                existingPagination.remove();
            }

            paginationContainer = document.createElement('div');
            paginationContainer.className = 'pagination-container';
            paginationContainer.style.cssText = 'margin-top: 20px; text-align: center;';
            section.appendChild(paginationContainer);
        } else {
            return;
        }
    }

    paginationContainer.innerHTML = '';

    const { page, totalPages, totalElements } = pageResult;

    if (totalPages <= 1) return;

    let paginationHTML = '<div class="pagination">';

    // 이전 버튼
    if (page > 1) {
        paginationHTML += `<button type="button" onclick="changePage_${sectionId.replace('-', '_')}(${page - 1})" class="page-btn">이전</button>`;
    }

    // 페이지 번호들
    const startPage = Math.max(1, page - 2);
    const endPage = Math.min(totalPages, page + 2);

    for (let i = startPage; i <= endPage; i++) {
        const activeClass = i === page ? 'active' : '';
        paginationHTML += `<button type="button" onclick="changePage_${sectionId.replace('-', '_')}(${i})" class="page-btn ${activeClass}">${i}</button>`;
    }

    // 다음 버튼
    if (page < totalPages) {
        paginationHTML += `<button type="button" onclick="changePage_${sectionId.replace('-', '_')}(${page + 1})" class="page-btn">다음</button>`;
    }

    paginationHTML += '</div>';
    paginationHTML += `<p style="margin-top: 10px; color: #666; font-size: 0.9em;">총 ${totalElements}건 (${page}/${totalPages} 페이지)</p>`;

    paginationContainer.innerHTML = paginationHTML;

    // 페이지 변경 함수를 섹션별로 등록
    window[`changePage_${sectionId.replace('-', '_')}`] = onPageChange;
}

// ========== 유틸리티 함수들 ==========
function formatDate(date) {
    if (!date) return '-';

    try {
        const dateObj = date instanceof Date ? date : new Date(date);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    } catch (error) {
        console.error('날짜 포맷팅 오류:', error);
        return '-';
    }
}

function formatDateTime(dateTimeString) {
    if (!dateTimeString) return '-';

    try {
        const date = new Date(dateTimeString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');

        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    } catch (error) {
        console.error('날짜 시간 포맷팅 오류:', error);
        return dateTimeString;
    }
}

function formatPrice(price) {
    if (price === null || price === undefined) return '0';
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatDateForInput(dateString) {
    if (!dateString) return '';

    try {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    } catch (error) {
        console.error('날짜 포맷 변환 오류:', error);
        return '';
    }
}

// ========== 신고 관리 관련 함수들 ==========

// 임시 신고 데이터 (실제로는 DB에서 가져올 데이터)
const reportsData = {
    'R101': {
        id: 'R101',
        reportDate: '2025-04-21 14:30:25',
        status: '처리 대기',
        opponent: {
            id: 'user_abuser',
            name: '김불량',
            email: 'abuser@email.com',
            phone: '010-8675-4321'
        },
        reporter: {
            id: 'user_normal',
            name: '이정상',
            email: 'normal@email.com',
            phone: '010-1234-5678'
        },
        reason: {
            summary: '부적절한 언어 사용',
            detail: '커뮤니티 게시판에서 지속적으로 타 사용자에게 욕설과 비하 발언을 하고 있습니다. 특히 특정 사용자를 지속적으로 괴롭히는 행동이 목격되었습니다.'
        },
        evidence: [
            '게시판 댓글 #1254에서 욕설 사용',
            '채팅방에서 부적절한 발언 스크린샷',
            '다수의 사용자가 유사한 내용으로 신고'
        ]
    },
    'R102': {
        id: 'R102',
        reportDate: '2025-04-22 09:15:42',
        status: '처리 대기',
        opponent: {
            id: 'user_spammer',
            name: '박스팸',
            email: 'spammer@email.com',
            phone: '010-9999-8888'
        },
        reporter: {
            id: 'user_gildong',
            name: '홍길동',
            email: 'gildong@email.com',
            phone: '010-2222-3333'
        },
        reason: {
            summary: '홍보성 게시글 도배',
            detail: '외부 사이트 홍보 링크를 포함한 게시글을 짧은 시간 내에 여러 게시판에 반복 게시하고 있습니다. 일부 게시글에는 불법 제품 홍보로 의심되는 내용도 포함되어 있습니다.'
        },
        evidence: [
            '게시판 목록 스크린샷 (1시간 내 15개 게시글)',
            '링크된 외부 사이트 캡처',
            '타 사용자 신고 내역 3건'
        ]
    }
};

function viewReport(reportId) {
    const reportData = reportsData[reportId];
    if (!reportData) {
        console.error('Report data not found for ID:', reportId);
        return;
    }

    // 모달에 기본 데이터 채우기
    document.getElementById('report-id').textContent = reportData.id;
    document.getElementById('report-date').textContent = reportData.reportDate;
    document.getElementById('report-status').textContent = reportData.status;

    document.getElementById('opponent-id').textContent = reportData.opponent.id;
    document.getElementById('opponent-name').textContent = reportData.opponent.name;
    document.getElementById('opponent-email').textContent = reportData.opponent.email;
    document.getElementById('opponent-phone').textContent = reportData.opponent.phone;

    document.getElementById('reporter-id').textContent = reportData.reporter.id;
    document.getElementById('reporter-name').textContent = reportData.reporter.name;
    document.getElementById('reporter-email').textContent = reportData.reporter.email;
    document.getElementById('reporter-phone').textContent = reportData.reporter.phone;

    // 신고 사유 및 증거 자료 섹션 처리
    const reportDetailContainer = document.querySelector('#reportDetailModal .report-detail-container');

    // 이전에 추가된 동적 섹션들 제거 (기존 고정 섹션 3개 이후의 모든 섹션 제거)
    const staticSections = reportDetailContainer.querySelectorAll('.report-info-section');
    for (let i = 3; i < staticSections.length; i++) {
        staticSections[i].remove();
    }

    // 신고 사유 섹션 추가
    const reasonSection = document.createElement('div');
    reasonSection.className = 'report-info-section full-width';
    reasonSection.innerHTML = `
        <h4>신고 사유</h4>
        <p><strong>요약:</strong> ${reportData.reason.summary}</p>
        <p><strong>상세 내용:</strong> ${reportData.reason.detail}</p>
    `;
    reportDetailContainer.appendChild(reasonSection);

    // 증거 자료 섹션 추가
    const evidenceSection = document.createElement('div');
    evidenceSection.className = 'report-info-section full-width';
    let evidenceHTML = '<h4>증거 자료</h4><ul>';
    reportData.evidence.forEach(item => {
        evidenceHTML += `<li>${item}</li>`;
    });
    evidenceHTML += '</ul>';
    evidenceSection.innerHTML = evidenceHTML;
    reportDetailContainer.appendChild(evidenceSection);

    // 상태에 따른 스타일 적용
    const statusElement = document.getElementById('report-status');
    statusElement.className = '';

    if (reportData.status === '처리 대기') {
        statusElement.classList.add('status-pending');
    } else if (reportData.status === '검토 완료') {
        statusElement.classList.add('status-ongoing');
    } else if (reportData.status === '조치 완료') {
        statusElement.classList.add('status-approved');
    }

    // 모달 제목 업데이트
    document.querySelector('#reportDetailModal .modal-header h3').textContent = `신고 상세 정보 - ${reportData.id}`;

    const reportDetailModal = document.getElementById('reportDetailModal');
    if (reportDetailModal) {
        showModal(reportDetailModal);
    } else {
        console.error('Modal element with ID "reportDetailModal" not found.');
    }
}

function processReport(reportId) {
    alert(`신고 ${reportId}의 처리 페이지로 이동합니다. (실제 기능은 구현되지 않았습니다)`);
}

// ========== 판매자 관리 관련 함수들 ==========

function viewSellerDetails(sellerId) {
    alert(sellerId + " 판매자 상세 정보 보기 기능 구현 필요");
}

function approveSeller(sellerId) {
    if (confirm(sellerId + " 판매자의 가입을 승인하시겠습니까?")) {
        alert(sellerId + " 판매자 승인 처리 구현 필요");
    }
}

function rejectSeller(sellerId) {
    if (confirm(sellerId + " 판매자의 가입을 거절하시겠습니까? (사유 입력 필요)")) {
        alert(sellerId + " 판매자 거절 처리 구현 필요");
    }
}

function suspendSeller(sellerId) {
    if (confirm(sellerId + " 판매자 계정을 정지시키겠습니까?")) {
        alert(sellerId + " 판매자 계정 정지 처리 구현 필요");
    }
}

function activateSeller(sellerId) {
    if (confirm(sellerId + " 판매자 계정을 다시 활성화시키겠습니까?")) {
        alert(sellerId + " 판매자 계정 활성화 처리 구현 필요");
    }
}

// ========== 사용자 관리 관련 함수들 ==========

function viewUser(userId) {
    alert(userId + " 사용자 상세 보기 기능 구현 필요");
}

function suspendUser(userId) {
    if (confirm(userId + " 사용자를 정지시키겠습니까?")) {
        alert(userId + " 사용자 정지 처리 구현 필요");
    }
}

function activateUser(userId) {
    if (confirm(userId + " 사용자를 활성화시키겠습니까?")) {
        alert(userId + " 사용자 활성화 처리 구현 필요");
    }
}

// ========== 대시보드 수동 새로고침 함수 ==========

function refreshDashboard() {
    loadDashboardData();
}

// admin.js에 추가할 사용자 관리 관련 함수들

// ========== 사용자 관리 전역 변수 ==========
let currentUsersPage = 1;
let usersPerPage = 10;
let currentUserFilter = {
    keyword: '',
    status: ''
};

let currentReportsPage = 1;
let reportsPerPage = 10;
let currentReportFilter = {
    keyword: '',
    status: '',
    reportType: ''
};

// ========== 사용자 관리 초기화 함수 ==========
function initUserManagement() {
    // 사용자 검색 기능
    const userSearchBtn = document.querySelector('#all-users .filter-controls .btn-secondary');
    if (userSearchBtn) {
        userSearchBtn.addEventListener('click', handleUserSearch);
    }

    const userSearchInput = document.querySelector('#all-users .filter-controls input[type="text"]');
    if (userSearchInput) {
        userSearchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleUserSearch();
            }
        });
    }

    const userStatusSelect = document.querySelector('#all-users .filter-controls select');
    if (userStatusSelect) {
        userStatusSelect.addEventListener('change', handleUserSearch);
    }

    // 신고 검색 기능
    const reportSearchBtn = document.querySelector('#reported-users .filter-controls .btn-secondary');
    if (reportSearchBtn) {
        reportSearchBtn.addEventListener('click', handleReportSearch);
    }

    const reportSearchInput = document.querySelector('#reported-users .filter-controls input[type="text"]');
    if (reportSearchInput) {
        reportSearchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleReportSearch();
            }
        });
    }

    const reportStatusSelect = document.querySelector('#reported-users .filter-controls select');
    if (reportStatusSelect) {
        reportStatusSelect.addEventListener('change', handleReportSearch);
    }

    // 현재 활성 탭에 따라 데이터 로드
    const activeTab = document.querySelector('.user-tab-button.active');
    if (activeTab) {
        const tabName = activeTab.getAttribute('data-tab');
        if (tabName === 'all-users') {
            loadUsersList();
        } else if (tabName === 'reported-users') {
            loadReportsList();
        }
    }
}

// ========== 사용자 목록 관련 함수들 ==========
function handleUserSearch() {
    const searchInput = document.querySelector('#all-users .filter-controls input[type="text"]');
    const statusSelect = document.querySelector('#all-users .filter-controls select');

    currentUserFilter.keyword = searchInput ? searchInput.value.trim() : '';
    currentUserFilter.status = statusSelect ? statusSelect.value : '';
    currentUsersPage = 1;

    loadUsersList();
}

async function loadUsersList() {
    try {
        showUserListLoading();

        const params = new URLSearchParams({
            page: currentUsersPage.toString(),
            size: usersPerPage.toString(),
            keyword: currentUserFilter.keyword,
            status: currentUserFilter.status
        });

        const response = await fetch(`/ecommerce/api/admin/users?${params}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const pageResult = await response.json();
        updateUserTable(pageResult.content);
        updateUserPagination(pageResult);

    } catch (error) {
        console.error('사용자 목록 로드 실패:', error);
        showUserListError();
    }
}

function showUserListLoading() {
    const tbody = document.querySelector('#all-users .data-table tbody');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">사용자 목록을 불러오는 중...</td></tr>';
    }
}

function showUserListError() {
    const tbody = document.querySelector('#all-users .data-table tbody');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center" style="color: red;">사용자 목록을 불러오는데 실패했습니다.</td></tr>';
    }
}

function updateUserTable(users) {
    const tbody = document.querySelector('#all-users .data-table tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!users || users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">등록된 사용자가 없습니다.</td></tr>';
        return;
    }

    users.forEach(user => {
        const row = document.createElement('tr');
        const statusClass = getStatusClass(user.status);
        const statusText = getStatusText(user.status);

        row.innerHTML = `
            <td>${user.username}</td>
            <td>${user.name}</td>
            <td>${user.email || '-'}</td>
            <td>${formatDate(user.createdAt)}</td>
            <td><span class="${statusClass}">${statusText}</span></td>
            <td class="actions">
                <button class="btn btn-secondary btn-sm" onclick="viewUserDetail(${user.id})">
                    상세
                </button>
                ${user.status === 'ACTIVE' ?
            `<button class="btn btn-warning btn-sm" onclick="showSuspendUserModal(${user.id}, '${user.username}')">
                        정지
                    </button>` : ''}
                ${user.status === 'SUSPENDED' ?
            `<button class="btn btn-primary btn-sm" onclick="resumeUser(${user.id}, '${user.username}')">
                        활성화
                    </button>` : ''}
                ${user.status === 'ACTIVE' || user.status === 'SUSPENDED' ?
            `<button class="btn btn-danger btn-sm" onclick="showTerminateUserModal(${user.id}, '${user.username}')">
                        해지
                    </button>` : ''}
            </td>
        `;

        tbody.appendChild(row);
    });
}

function updateUserPagination(pageResult) {
    updatePaginationUI('all-users', pageResult, (page) => {
        currentUsersPage = page;
        loadUsersList();
    });
}

function getStatusClass(status) {
    switch (status) {
        case 'ACTIVE': return 'status-active';
        case 'SUSPENDED': return 'status-suspended';
        case 'TERMINATED': return 'status-terminated';
        case 'DELETED': return 'status-deleted';
        default: return '';
    }
}

function getStatusText(status) {
    switch (status) {
        case 'ACTIVE': return '활성';
        case 'SUSPENDED': return '정지';
        case 'TERMINATED': return '해지';
        case 'DELETED': return '삭제';
        default: return status;
    }
}

// ========== 신고 목록 관련 함수들 ==========
function handleReportSearch() {
    const searchInput = document.querySelector('#reported-users .filter-controls input[type="text"]');
    const statusSelect = document.querySelector('#reported-users .filter-controls select');

    currentReportFilter.keyword = searchInput ? searchInput.value.trim() : '';
    currentReportFilter.status = statusSelect ? statusSelect.value : '';
    currentReportsPage = 1;

    loadReportsList();
}

async function loadReportsList() {
    try {
        showReportListLoading();

        const params = new URLSearchParams({
            page: currentReportsPage.toString(),
            size: reportsPerPage.toString(),
            keyword: currentReportFilter.keyword,
            status: currentReportFilter.status,
            reportType: currentReportFilter.reportType
        });

        const response = await fetch(`/ecommerce/api/admin/reports?${params}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const pageResult = await response.json();
        updateReportTable(pageResult.content);
        updateReportPagination(pageResult);

    } catch (error) {
        console.error('신고 목록 로드 실패:', error);
        showReportListError();
    }
}

function showReportListLoading() {
    const tbody = document.querySelector('#reported-users .data-table tbody');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">신고 목록을 불러오는 중...</td></tr>';
    }
}

function showReportListError() {
    const tbody = document.querySelector('#reported-users .data-table tbody');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center" style="color: red;">신고 목록을 불러오는데 실패했습니다.</td></tr>';
    }
}

function updateReportTable(reports) {
    const tbody = document.querySelector('#reported-users .data-table tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!reports || reports.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">신고가 없습니다.</td></tr>';
        return;
    }

    reports.forEach(report => {
        const row = document.createElement('tr');
        const statusClass = getReportStatusClass(report.status);
        const statusText = getReportStatusText(report.status);

        const reportTarget = getReportTarget(report);

        row.innerHTML = `
            <td>R${report.id}</td>
            <td>${reportTarget}</td>
            <td>${report.reporterUsername}</td>
            <td>${formatDate(report.createdAt)}</td>
            <td title="${report.detail}">${truncateText(report.reason, 20)}</td>
            <td><span class="${statusClass}">${statusText}</span></td>
            <td class="actions">
                <button class="btn btn-secondary btn-sm" onclick="viewReportDetail(${report.id})">
                    상세 보기
                </button>
                ${report.status === 'PENDING' ?
            `<button class="btn btn-warning btn-sm" onclick="showProcessReportModal(${report.id})">
                        처리하기
                    </button>` : ''}
            </td>
        `;

        tbody.appendChild(row);
    });
}

function updateReportPagination(pageResult) {
    updatePaginationUI('reported-users', pageResult, (page) => {
        currentReportsPage = page;
        loadReportsList();
    });
}

function getReportTarget(report) {
    if (report.reportedUsername) {
        return report.reportedUsername;
    } else if (report.reportedProductName) {
        return truncateText(report.reportedProductName, 15);
    } else if (report.reportedReviewId) {
        return `리뷰 #${report.reportedReviewId}`;
    }
    return '-';
}

function getReportStatusClass(status) {
    switch (status) {
        case 'PENDING': return 'status-pending';
        case 'REVIEWING': return 'status-reviewing';
        case 'RESOLVED': return 'status-resolved';
        case 'REJECTED': return 'status-rejected';
        default: return '';
    }
}

function getReportStatusText(status) {
    switch (status) {
        case 'PENDING': return '처리 대기';
        case 'REVIEWING': return '검토 중';
        case 'RESOLVED': return '처리 완료';
        case 'REJECTED': return '거절됨';
        default: return status;
    }
}

// ========== 사용자 상세 정보 모달 ==========
async function viewUserDetail(userId) {
    try {
        const response = await fetch(`/ecommerce/api/admin/users/${userId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const userDetail = await response.json();
        showUserDetailModal(userDetail);

    } catch (error) {
        console.error('사용자 상세 정보 로드 실패:', error);
        alert('사용자 상세 정보를 불러오는데 실패했습니다.');
    }
}

function showUserDetailModal(userDetail) {
    // 사용자 상세 정보 모달이 없다면 동적으로 생성
    let modal = document.getElementById('userDetailModal');
    if (!modal) {
        modal = createUserDetailModal();
        document.body.appendChild(modal);
    }

    // 모달 내용 채우기
    document.getElementById('user-detail-id').textContent = userDetail.username;
    document.getElementById('user-detail-name').textContent = userDetail.name;
    document.getElementById('user-detail-email').textContent = userDetail.email || '-';
    document.getElementById('user-detail-phone').textContent = userDetail.phone || '-';
    document.getElementById('user-detail-status').textContent = getStatusText(userDetail.status);
    document.getElementById('user-detail-status').className = getStatusClass(userDetail.status);
    document.getElementById('user-detail-roles').textContent = userDetail.roles ? userDetail.roles.join(', ') : '-';
    document.getElementById('user-detail-created').textContent = formatDateTime(userDetail.createdAt);

    // 활동 통계
    document.getElementById('user-detail-orders').textContent = userDetail.totalOrders + '건';
    document.getElementById('user-detail-spent').textContent = formatPrice(userDetail.totalSpent) + '원';
    document.getElementById('user-detail-reviews').textContent = userDetail.totalReviews + '건';
    document.getElementById('user-detail-reports').textContent = userDetail.totalReports + '건';

    // 최근 활동
    document.getElementById('user-detail-last-order').textContent =
        userDetail.lastOrderAt ? formatDate(userDetail.lastOrderAt) : '없음';
    document.getElementById('user-detail-last-review').textContent =
        userDetail.lastReviewAt ? formatDate(userDetail.lastReviewAt) : '없음';

    showModal(modal);
}

function createUserDetailModal() {
    const modal = document.createElement('div');
    modal.id = 'userDetailModal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>사용자 상세 정보</h3>
                <span class="close-modal">&times;</span>
            </div>
            <div class="modal-body">
                <div class="user-detail-container">
                    <div class="user-info-section">
                        <h4>기본 정보</h4>
                        <p><strong>사용자 ID:</strong> <span id="user-detail-id"></span></p>
                        <p><strong>이름:</strong> <span id="user-detail-name"></span></p>
                        <p><strong>이메일:</strong> <span id="user-detail-email"></span></p>
                        <p><strong>연락처:</strong> <span id="user-detail-phone"></span></p>
                        <p><strong>상태:</strong> <span id="user-detail-status"></span></p>
                        <p><strong>역할:</strong> <span id="user-detail-roles"></span></p>
                        <p><strong>가입일:</strong> <span id="user-detail-created"></span></p>
                    </div>
                    <div class="user-info-section">
                        <h4>활동 통계</h4>
                        <p><strong>총 주문:</strong> <span id="user-detail-orders"></span></p>
                        <p><strong>총 구매액:</strong> <span id="user-detail-spent"></span></p>
                        <p><strong>총 리뷰:</strong> <span id="user-detail-reviews"></span></p>
                        <p><strong>신고 당한 횟수:</strong> <span id="user-detail-reports"></span></p>
                    </div>
                    <div class="user-info-section">
                        <h4>최근 활동</h4>
                        <p><strong>최근 주문일:</strong> <span id="user-detail-last-order"></span></p>
                        <p><strong>최근 리뷰 작성일:</strong> <span id="user-detail-last-review"></span></p>
                    </div>
                </div>
            </div>
        </div>
    `;

    // 닫기 버튼 이벤트 추가
    const closeBtn = modal.querySelector('.close-modal');
    closeBtn.addEventListener('click', () => hideModal(modal));

    return modal;
}

// ========== 유틸리티 함수들 ==========
function updateElementText(container, selector, text) {
    const element = container.querySelector(selector);
    if (element) {
        element.textContent = text;
    }
}

function truncateText(text, maxLength) {
    if (!text) return '-';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// ========== 전역 페이지 변경 함수들 등록 ==========
window.changePage_all_users = function(page) {
    currentUsersPage = page;
    loadUsersList();
};

window.changePage_reported_users = function(page) {
    currentReportsPage = page;
    loadReportsList();
};

window.changePage_attribute_management = function(page) {
    currentAttributesPage = page;
    loadAttributesList();
};