// user.js - 사용자 관리 관련 기능

// 사용자 상세 보기 함수
function viewUser(userId) {
    alert(userId + " 사용자 상세 보기 기능 구현 필요");
}

// 사용자 정지 함수
function suspendUser(userId) {
    if (confirm(userId + " 사용자를 정지시키겠습니까?")) {
        alert(userId + " 사용자 정지 처리 구현 필요");
    }
}

// 사용자 활성화 함수
function activateUser(userId) {
    if (confirm(userId + " 사용자를 활성화시키겠습니까?")) {
        alert(userId + " 사용자 활성화 처리 구현 필요");
    }
}
