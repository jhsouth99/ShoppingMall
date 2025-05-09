// 전역 변수 설정
let totalCoupons = 12;      // 총 쿠폰 수 (임의 설정)
let couponsPerPage = 5;     // 페이지당 쿠폰 수
let currentPage = 1;        // 현재 페이지

// 임의의 쿠폰 데이터
let couponsData = [
    {id: 1, couponCode: 'WELCOME2025', name: '신규가입쿠폰', discount: '25%', usage: '100회', issueStart: '2025-02-01', issueEnd: '2025-03-14', useStart: '2025-03-15', useEnd: '2025-05-06'},
    {id: 2, couponCode: 'F1R5T5HOPP1NG', name: '☆★첫구매★☆ 20% 할인 쿠폰', discount: '20%', usage: '100회', issueStart: '2022-03-01', issueEnd: '2022-03-14', useStart: '2022-03-15', useEnd: '2022-05-06'},
    {id: 3, couponCode: 'CRA2YSAJANG', name: '사장님이 미쳤어요 30% 할인 쿠폰', discount: '30%', usage: '50회', issueStart: '2022-03-04', issueEnd: '2022-03-14', useStart: '2022-03-15', useEnd: '2022-05-06'},
    {id: 4, couponCode: 'HAPPY15OFF', name: '!!생일을축하합니다!!', discount: '15%', usage: '75회', issueStart: '2022-03-03', issueEnd: '2022-03-14', useStart: '2022-03-15', useEnd: '2022-05-21'},
    {id: 5, couponCode: 'SPRINGTIME', name: '봄맞이 특별 할인', discount: '10%', usage: '200회', issueStart: '2025-03-01', issueEnd: '2025-03-31', useStart: '2025-04-01', useEnd: '2025-04-30'},
    {id: 6, couponCode: 'SUMMERCOOL', name: '시원한 여름 할인', discount: '20%', usage: '150회', issueStart: '2025-06-01', issueEnd: '2025-06-30', useStart: '2025-07-01', useEnd: '2025-07-31'},
    {id: 7, couponCode: 'AUTUMNLEAVES', name: '가을 단풍 할인', discount: '12%', usage: '180회', issueStart: '2025-09-01', issueEnd: '2025-09-30', useStart: '2025-10-01', useEnd: '2025-10-31'},
    {id: 8, couponCode: 'WINTERSALE', name: '따뜻한 겨울 할인', discount: '22%', usage: '120회', issueStart: '2025-12-01', issueEnd: '2025-12-31', useStart: '2026-01-01', useEnd: '2026-01-31'},
    {id: 9, couponCode: 'LUCKYDAY', name: '행운의 날 특별 쿠폰', discount: '5%', usage: '500회', issueStart: '2025-05-05', issueEnd: '2025-05-05', useStart: '2025-05-06', useEnd: '2025-05-12'},
    {id: 10, couponCode: 'WEEKENDOFF', name: '주말 특별 할인', discount: '18%', usage: '80회', issueStart: '2025-04-26', issueEnd: '2025-04-28', useStart: '2025-04-29', useEnd: '2025-05-05'},
    {id: 11, couponCode: 'ANNIVERSARY', name: '창립 기념 감사 쿠폰', discount: '30%', usage: '300회', issueStart: '2025-07-15', issueEnd: '2025-07-31', useStart: '2025-08-01', useEnd: '2025-08-15'},
    {id: 12, couponCode: 'NEWYEAR2026', name: '2026년 새해맞이 쿠폰', discount: '26%', usage: '250회', issueStart: '2025-12-25', issueEnd: '2026-01-05', useStart: '2026-01-01', useEnd: '2026-01-31'}
];

// 페이지 로드 완료 시 실행되는 메인 함수
document.addEventListener("DOMContentLoaded", function () {
    // 모달 관련 요소 초기화
    initModalElements();
    
    // 쿠폰 관리 초기화
    initCouponManagement();
    
    // 사이드바 네비게이션 초기화
    initSidebarNavigation();
});

// 모달 요소 초기화
function initModalElements() {
    // 쿠폰 모달 관련 요소 초기화
    const couponModal = document.getElementById("couponModal");
    const addCouponBtn = document.querySelector("#coupon-management button.btn-primary");
    const closeCouponModal = document.querySelector("#couponModal .close-modal");
    const cancelCouponBtn = document.getElementById("cancelCoupon");
    const couponForm = document.getElementById("couponForm");

    // 이벤트 리스너 등록
    if (addCouponBtn) {
        addCouponBtn.addEventListener("click", function () {
            showModal(couponModal);
            initDateFields();
        });
    }

    if (closeCouponModal) {
        closeCouponModal.addEventListener("click", function () {
            hideModal(couponModal);
        });
    }

    if (cancelCouponBtn) {
        cancelCouponBtn.addEventListener("click", function () {
            hideModal(couponModal);
        });
    }

    if (couponForm) {
        couponForm.addEventListener("submit", function (e) {
            e.preventDefault();
            handleCouponFormSubmit();
        });
    }
}

// 쿠폰 관리 초기화
function initCouponManagement() {
    // 검색 기능 이벤트 리스너
    const searchButton = document.querySelector("#coupon-management .filter-controls .btn-secondary");
    if (searchButton) {
        searchButton.addEventListener("click", function () {
            const searchText = document.querySelector("#coupon-management .filter-controls input[type='text']").value;
            const statusFilter = document.querySelector("#coupon-management .filter-controls select").value;
            searchCoupons(searchText, statusFilter);
        });
    }

    // 페이지네이션 초기화
    initializePagination(couponsData.length);
}
