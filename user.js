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

// user.js - 사용자 관리 관련 기능

// 사용자 상세 보기 함수
function viewUser(userId) {
    console.log("상세 보기 버튼 클릭: " + userId);

    // *** API 없이 그냥 여기서 가짜 데이터를 찾아서 보여줄 거야 ***
    // 실제 DB 데이터는 아니지만, 보여주는 연습용!
    const dummyUserData = {
        'user_gildong': { name: '홍길동', email: 'gildong@email.com', status: '정상' },
        'user_chulsu': { name: '김철수', email: 'chulsu@email.com', status: '정상' },
        'user_test': { name: '테스트', email: 'test@email.com', status: '정지' }
        // 여기에 필요한 만큼 사용자 데이터 추가해!
    };

    const userData = dummyUserData[userId];

    if (!userData) {
        // 데이터가 없으면 그냥 없다고 알려주자
        alert("사용자 정보를 찾을 수 없습니다. (더미 데이터에 없음)");
        return;
    }

    // 상세 정보 모달과 오버레이 엘리먼트 찾기
    const modal = document.getElementById('userDetailModal');
    const overlay = document.getElementById('userDetailOverlay');
    const detailContent = document.getElementById('userDetailContent');

    if (!modal || !overlay || !detailContent) {
        console.error("사용자 상세 모달 관련 엘리먼트가 없습니다. HTML을 확인해주세요.");
        alert("상세 보기 기능을 표시할 수 없습니다. (HTML 확인 필요)");
        return;
    }

    // 가져온 가짜 데이터로 모달 내용 채우기
    document.getElementById('detail-userId').textContent = userId;
    document.getElementById('detail-userName').textContent = userData.name;
    document.getElementById('detail-userEmail').textContent = userData.email;
    document.getElementById('detail-userStatus').textContent = userData.status;
    // TODO: 필요한 다른 정보들도 여기에 채워 넣으세요.

    // 모달과 오버레이 보이기
    modal.style.display = 'block';
    overlay.style.display = 'block';

    // 모달 닫기 기능 연결
    // 1. 닫기 버튼 (클래스 이름 .close-modal) 클릭 시 닫기
    const closeButton = modal.querySelector('.close-modal');
    closeButton.onclick = function() {
        modal.style.display = 'none'; // 모달 숨기기
        overlay.style.display = 'none'; // 오버레이 숨기기
    }

    // 2. 모달 외부 (오버레이) 클릭 시 닫기
    overlay.onclick = function(event) {
        if (event.target == overlay) { // 클릭된 요소가 오버레이 자체인지 확인
            modal.style.display = 'none';
            overlay.style.display = 'none';
        }
    }

    // 기존 alert는 이제 필요 없으니 주석 처리하거나 지워!
    // alert(userId + " 사용자 상세 보기 기능 구현 필요");
}

// 사용자 정지 함수 (기존 코드 유지)
function suspendUser(userId) {
    if (confirm(userId + " 사용자를 정지시키겠습니까?")) {
        alert(userId + " 사용자 정지 처리 구현 필요 (이것도 실제 기능은 백엔드 필요)");
        // TODO: 실제 정지 처리 로직 (서버 요청 등) 추가
    }
}

// 사용자 활성화 함수 (기존 코드 유지)
function activateUser(userId) {
    if (confirm(userId + " 사용자를 활성화시키겠습니까?")) {
        alert(userId + " 사용자를 활성화시키겠습니다. (이것도 실제 기능은 백엔드 필요)");
        // TODO: 실제 활성화 처리 로직 (서버 요청 등) 추가
    }
}
