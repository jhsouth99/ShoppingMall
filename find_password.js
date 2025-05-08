document.getElementById('find-password-form').addEventListener('submit', function(event) {
    event.preventDefault();

    // 모든 오류 메시지 초기화
    document.querySelectorAll('.error-message').forEach(function(div) {
        div.textContent = '';
    });

    const email = document.getElementById('email').value.trim();
    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('phone').value.trim(); // 휴대전화 번호

    let isValid = true;

    // 이메일 검증 (기존 validateEmail 함수 활용)
     if (email === '') {
        document.getElementById('email-error').textContent = '이메일은 필수 입력 항목입니다.';
        isValid = false;
    } else if (!validateEmail(email)) {
        document.getElementById('email-error').textContent = '올바른 이메일 형식이 아닙니다.';
        isValid = false;
    }

    // 이름 검증
    if (name === '') {
        document.getElementById('name-error').textContent = '이름을 입력해주세요.';
        isValid = false;
    }

    // 휴대전화 번호 검증 (간단한 형식 체크 추가)
    const phonePattern = /^\d{2,3}-?\d{3,4}-?\d{4}$/; // 기본적인 전화번호 형식 (하이픈 포함/미포함)
    if (phone === '') {
        document.getElementById('phone-error').textContent = '휴대전화 번호를 입력해주세요.';
        isValid = false;
    } else if (!phonePattern.test(phone)) {
         document.getElementById('phone-error').textContent = '올바른 휴대전화 번호 형식이 아닙니다. (예: 010-1234-5678)';
         isValid = false;
    }


    if (isValid) {
        // TODO: 서버에 이메일, 이름, 전화번호를 보내서 비밀번호 재설정 링크 요청 또는 인증 코드 발송 로직 구현
        // 예: fetch('/api/find-password', { method: 'POST', body: JSON.stringify({ email, name, phone }) })
        //     .then(response => response.json())
        //     .then(data => {
        //         if (data.success) {
        //             alert('입력하신 이메일로 비밀번호 재설정 링크가 발송되었습니다.');
        //             // 성공 메시지 표시 및 다음 단계 안내 (예: 이메일 확인 유도)
        //         } else {
        //             alert('일치하는 회원 정보가 없거나 오류가 발생했습니다.');
        //             // 오류 메시지 표시 로직 추가
        //         }
        //     })
        //     .catch(error => {
        //         console.error('Error:', error);
        //         alert('비밀번호 찾기 중 오류가 발생했습니다.');
        //     });

        alert('비밀번호 찾기 정보가 유효합니다! 서버로 전송할 준비가 되었습니다. (실제 서버 연동 필요)');
    }
});

// 이메일 형식 검증 함수 (회원가입 페이지에서 가져오거나 공통 JS 파일 만들어서 사용)
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
}


// 실시간 검증을 위한 이벤트 리스너 (blur 이벤트)
document.getElementById('email').addEventListener('blur', function() {
    const email = this.value.trim();
    const emailError = document.getElementById('email-error');
    emailError.textContent = '';
     if (email === '') {
        emailError.textContent = '이메일은 필수 입력 항목입니다.';
    } else if (!validateEmail(email)) {
        emailError.textContent = '올바른 이메일 형식이 아닙니다.';
    }
});

document.getElementById('name').addEventListener('blur', function() {
    const name = this.value.trim();
    const nameError = document.getElementById('name-error');
    nameError.textContent = '';
    if (name === '') {
        nameError.textContent = '이름을 입력해주세요.';
    }
});

document.getElementById('phone').addEventListener('blur', function() {
    const phone = this.value.trim();
    const phoneError = document.getElementById('phone-error');
    phoneError.textContent = '';
    const phonePattern = /^\d{2,3}-?\d{3,4}-?\d{4}$/;
    if (phone === '') {
        phoneError.textContent = '휴대전화 번호를 입력해주세요.';
    } else if (!phonePattern.test(phone)) {
        phoneError.textContent = '올바른 휴대전화 번호 형식이 아닙니다. (예: 010-1234-5678)';
    }
});
