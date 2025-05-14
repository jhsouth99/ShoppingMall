// user.js - 사용자 관리 관련 기능

// 예시 사용자 데이터 (원래는 서버에서 가져와야 함)
const usersData = {
    user_gildong: {
        id: "user_gildong",
        name: "홍길동",
        email: "gildong@email.com",
        joinDate: "2025-01-10",
        status: "활성",
        purchasedItems: ["멋진 상품 A", "탐나는 상품 B (2개)", "사고 싶은 상품 C"],
        shippingAddresses: ["서울시 강남구 테헤란로", "경기도 성남시 분당구 정자동"],
        phoneNumber: "010-1234-5678",
        userType: "일반",
        // 비밀번호는 보안상 직접 보여주지 않는 게 맞아.
        // 필요하다면 '비밀번호 재설정' 기능만 제공하는 게 일반적이지.
        // 여기서는 예시로 마스킹해서 넣었지만, 실제론 조심해야 해.
        password: "********" // 절대 실제 비밀번호를 클라이언트에 보내면 안 돼!
    },
    user_chulsu: {
        id: "user_chulsu",
        name: "김철수",
        email: "chulsu@email.com",
        joinDate: "2025-02-15",
        status: "활성",
        purchasedItems: ["신상 상품 D", "멋진 상품 A"],
        shippingAddresses: ["부산시 해운대구 우동"],
        phoneNumber: "010-9876-5432",
        userType: "일반",
        password: "********"
    },
    user_test: {
        id: "user_test",
        name: "테스트",
        email: "test@email.com",
        joinDate: "2025-03-01",
        status: "정지",
        purchasedItems: [], // 구매 내역이 없을 수도 있지
        shippingAddresses: ["경기도 수원시 팔달구 인계동"],
        phoneNumber: "010-5555-7777",
        userType: "사업자",
        password: "********"
    }
    // 실제로는 여기에 더 많은 사용자 데이터가 있겠지?
};

// 사용자 상세 보기 함수
function viewUser(userId) {
    // 해당 userId의 사용자 데이터를 찾음
    const user = usersData[userId];

    if (user) {
        // 사용자 데이터가 있으면 상세 정보 표시 함수 호출
        displayUserDetails(user);
    } else {
        // 사용자 데이터가 없으면 에러 메시지
        alert("사용자 정보를 찾을 수 없습니다: " + userId);
    }
}

// 사용자 상세 정보를 화면에 표시하는 함수 (모달 등을 활용)
function displayUserDetails(user) {
    // TODO: 여기에 사용자 상세 정보를 보여줄 HTML 요소를 만들거나 찾아서 내용을 채워넣어.
    // 예시로 간단하게 콘솔에 찍거나 alert 대신 별도의 div에 표시하는 코드를 작성할 수 있어.

    // 여기서는 간단하게 콘솔에 정보를 찍어볼게.
    // 실제 웹 페이지에서는 모달 팝업 같은 걸 띄워서 예쁘게 보여줘야겠지?
    console.log("--- 사용자 상세 정보 ---");
    console.log("ID:", user.id);
    console.log("이름:", user.name);
    console.log("이메일:", user.email);
    console.log("가입일:", user.joinDate);
    console.log("상태:", user.status);
    console.log("휴대폰 번호:", user.phoneNumber);
    console.log("사용자 유형:", user.userType);
    console.log("구매했던 상품:", user.purchasedItems.join(", ") || "없음");
    console.log("배송지:", user.shippingAddresses.join(" / ") || "없음");
    console.log("비밀번호:", user.password); // 다시 말하지만, 실제론 절대 이렇게 하면 안 됨! 보안! 🚨
    console.log("--------------------");

    // 예시: 간단한 HTML 요소에 정보 표시하기 (HTML에 id="user-detail-area"인 div가 있다고 가정)
    const detailArea = document.getElementById('user-detail-area');
    if (detailArea) {
        detailArea.innerHTML = `
            <h3>${user.name} (${user.id}) 상세 정보</h3>
            <p><strong>이메일:</strong> ${user.email}</p>
            <p><strong>가입일:</strong> ${user.joinDate}</p>
            <p><strong>상태:</strong> ${user.status}</p>
            <p><strong>휴대폰 번호:</strong> ${user.phoneNumber}</p>
            <p><strong>사용자 유형:</strong> ${user.userType}</p>
            <p><strong>비밀번호 (마스킹):</strong> ${user.password}</p>
            <p><strong>구매했던 상품:</strong> ${user.purchasedItems.join(", ") || "없음"}</p>
            <p><strong>배송지:</strong> ${user.shippingAddresses.join(" <br> ") || "없음"}</p>
            <button onclick="hideUserDetails()">닫기</button>
        `;
        detailArea.style.display = 'block'; // 숨겨뒀던 상세 정보 영역 보이게 하기
    } else {
        // 상세 정보 표시할 영역이 없으면 콘솔 로그만...
        console.warn("ID 'user-detail-area'인 HTML 요소를 찾을 수 없습니다. 사용자 상세 정보를 표시할 영역을 추가해주세요.");
         alert(`${user.name} (${user.id}) 상세 정보\n\n이메일: ${user.email}\n가입일: ${user.joinDate}\n상태: ${user.status}\n휴대폰 번호: ${user.phoneNumber}\n사용자 유형: ${user.userType}\n구매했던 상품: ${user.purchasedItems.join(", ") || "없음"}\n배송지:\n - ${user.shippingAddresses.join("\n - ") || "없음"}\n비밀번호 (마스킹): ${user.password}`);
    }
}

// 상세 정보 표시 영역 숨기기 함수 (예시용)
function hideUserDetails() {
    const detailArea = document.getElementById('user-detail-area');
    if (detailArea) {
        detailArea.style.display = 'none';
    }
}


// 사용자 정지 함수
function suspendUser(userId) {
    if (confirm(userId + " 사용자를 정지시키겠습니까?")) {
        // TODO: 여기에 실제 사용자 정지 처리 로직 구현 (서버 통신 등)
        alert(userId + " 사용자 정지 처리 구현 필요 (이건 예시야!)");
        // 처리 후 테이블 상태 업데이트 등의 후속 작업 필요
    }
}

// 사용자 활성화 함수
function activateUser(userId) {
    if (confirm(userId + " 사용자를 활성화시키겠습니까?")) {
         // TODO: 여기에 실제 사용자 활성화 처리 로직 구현 (서버 통신 등)
        alert(userId + " 사용자 활성화 처리 구현 필요 (이것도 예시!)");
        // 처리 후 테이블 상태 업데이트 등의 후속 작업 필요
    }
}

// 페이지 로드 시 사용자 목록 불러오기 등의 초기화 함수가 필요할 수 있음
// function loadUsers() { ... }

