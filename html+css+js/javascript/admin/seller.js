// seller.js - 판매자 관리 관련 기능

// 판매자 상세 정보 보기 함수
function viewSellerDetails(sellerId) {
    alert(sellerId + " 판매자 상세 정보 보기 기능 구현 필요");
}

// 판매자 가입 승인 함수
function approveSeller(sellerId) {
    if (confirm(sellerId + " 판매자의 가입을 승인하시겠습니까?")) {
        alert(sellerId + " 판매자 승인 처리 구현 필요");
    }
}

// 판매자 가입 거절 함수
function rejectSeller(sellerId) {
    if (confirm(sellerId + " 판매자의 가입을 거절하시겠습니까? (사유 입력 필요)")) {
        alert(sellerId + " 판매자 거절 처리 구현 필요");
    }
}

// 판매자 계정 정지 함수
function suspendSeller(sellerId) {
    if (confirm(sellerId + " 판매자 계정을 정지시키겠습니까?")) {
        alert(sellerId + " 판매자 계정 정지 처리 구현 필요");
    }
}

// 판매자 계정 활성화 함수
function activateSeller(sellerId) {
    if (confirm(sellerId + " 판매자 계정을 다시 활성화시키겠습니까?")) {
        alert(sellerId + " 판매자 계정 활성화 처리 구현 필요");
    }
}
