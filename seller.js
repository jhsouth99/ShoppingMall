// seller.js - 판매자 관리 관련 기능

// 판매자 상세 정보 보기 함수
function viewSellerDetails(sellerId) {
    console.log("판매자 상세 보기 버튼 클릭: " + sellerId);

    // *** API 없이 그냥 여기서 가짜 판매자 데이터를 찾아서 보여줄 거야 ***
    // 실제 DB 데이터는 아니지만, 보여주는 연습용!
    const dummySellerData = {
        'seller_A_approved': {
            storeName: 'A 스토어',
            contactName: '김승인',
            phoneNumber: '010-1111-2222',
            businessId: '111-22-33333',
            joinDate: '2024-01-15',
            status: '정상'
        },
        'seller_B_pending': {
            storeName: 'B 스토어',
            contactName: '박대기',
            phoneNumber: '010-3333-4444',
            businessId: '222-33-44444',
            joinDate: '2025-02-20',
            status: '승인 대기'
        },
        'seller_C_suspended': {
            storeName: 'C 스토어',
            contactName: '최정지',
            phoneNumber: '010-5555-6666',
            businessId: '333-44-55555',
            joinDate: '2025-03-10',
            status: '이용 정지'
        
        },
        'seller_KimPanmae': { // ⭐ 김판매씨 정보 추가! ID는 적당히 네가 정해봐
        storeName: '판매왕 스토어', // 예시 스토어 이름
        contactName: '김판매',      // ⭐ 김판매씨 이름!
        phoneNumber: '010-7777-8888', // 예시 연락처
        businessId: '444-55-66666',  // 예시 사업자 번호
        joinDate: '2023-11-01',      // 예시 가입일
        status: '정상'             // 예시 상태
    }
        
        // TODO: 여기에 필요한 만큼 판매자 데이터 추가해!
    };

    const sellerData = dummySellerData[sellerId];

    if (!sellerData) {
        // 데이터가 없으면 그냥 없다고 알려주자
        alert("판매자 정보를 찾을 수 없습니다. (더미 데이터에 없음)");
        return;
    }

    // 판매자 상세 정보 모달과 오버레이 엘리먼트 찾기
    const modal = document.getElementById('sellerDetailModal');
    const overlay = document.getElementById('sellerDetailOverlay');
    const detailContent = document.getElementById('sellerDetailContent');
    const closeButton = modal.querySelector('.close-seller-modal'); // 닫기 버튼 찾기

    if (!modal || !overlay || !detailContent || !closeButton) {
        console.error("판매자 상세 모달 관련 엘리먼트가 없습니다. HTML을 확인해주세요.");
        alert("상세 보기 기능을 표시할 수 없습니다. (HTML 확인 필요)");
        return;
    }

    // 가져온 가짜 데이터로 모달 내용 채우기
    document.getElementById('detail-sellerId').textContent = sellerId;
    document.getElementById('detail-storeName').textContent = sellerData.storeName;
    document.getElementById('detail-contactName').textContent = sellerData.contactName;
    document.getElementById('detail-phoneNumber').textContent = sellerData.phoneNumber;
    document.getElementById('detail-businessId').textContent = sellerData.businessId;
    document.getElementById('detail-joinDate').textContent = sellerData.joinDate;

    // 상태에 따라 글자색을 다르게 해서 좀 더 눈에 띄게 해볼까?
    const statusSpan = document.getElementById('detail-sellerStatus');
    statusSpan.textContent = sellerData.status;
    statusSpan.style.color = ''; // 기본 색상 초기화
    if (sellerData.status === '정상') {
        statusSpan.style.color = 'green';
    } else if (sellerData.status === '승인 대기') {
        statusSpan.style.color = 'orange';
    } else if (sellerData.status === '이용 정지') {
        statusSpan.style.color = 'red';
    }
    // TODO: 필요한 다른 정보들도 여기에 채워 넣으세요.

    // 모달과 오버레이 보이기
    modal.style.display = 'block';
    overlay.style.display = 'block';

    // 모달 닫기 기능 연결
    // 1. 닫기 버튼 클릭 시 닫기
    closeButton.onclick = function() {
        modal.style.display = 'none'; // 모달 숨기기
        overlay.style.display = 'none'; // 오버레이 숨기기
    }

    // 2. 모달 외부 (오버레이) 클릭 시 닫기
    overlay.onclick = function(event) {
        if (event.target === overlay) { // 클릭된 요소가 오버레이 자체인지 확인
            modal.style.display = 'none';
            overlay.style.display = 'none';
        }
    }

    // 기존 alert는 이제 필요 없으니 주석 처리하거나 지워!
    // alert(sellerId + " 판매자 상세 정보 보기 기능 구현 필요");
}

// 판매자 가입 승인 함수 (기존 코드 유지)
function approveSeller(sellerId) {
    if (confirm(sellerId + " 판매자의 가입을 승인하시겠습니까?")) {
        alert(sellerId + " 판매자 승인 처리 구현 필요 (이것도 실제 기능은 백엔드 필요)");
        // TODO: 실제 승인 처리 로직 (서버 요청 등) 추가
    }
}

// 판매자 가입 거절 함수 (기존 코드 유지)
function rejectSeller(sellerId) {
    if (confirm(sellerId + " 판매자의 가입을 거절하시겠습니까? (사유 입력 필요)")) {
        alert(sellerId + " 판매자 거절 처리 구현 필요 (이것도 실제 기능은 백엔드 필요)");
        // TODO: 실제 거절 처리 로직 (서버 요청 등) 추가
    }
}

// 판매자 계정 정지 함수 (기존 코드 유지)
function suspendSeller(sellerId) {
    if (confirm(sellerId + " 판매자 계정을 정지시키겠습니까?")) {
        alert(sellerId + " 판매자 계정 정지 처리 구현 필요 (이것도 실제 기능은 백엔드 필요)");
        // TODO: 실제 정지 처리 로직 (서버 요청 등) 추가
    }
}

// 판매자 계정 활성화 함수 (기존 코드 유지)
function activateSeller(sellerId) {
    if (confirm(sellerId + " 판매자 계정을 다시 활성화시키겠습니까?")) {
        alert(sellerId + " 판매자 계정 활성화 처리 구현 필요 (이것도 실제 기능은 백엔드 필요)");
        // TODO: 실제 활성화 처리 로직 (서버 요청 등) 추가
    }
}
