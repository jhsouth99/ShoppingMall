document.getElementById('find-email-form').addEventListener('submit', function(event) {
    event.preventDefault();

    // 모든 오류 메시지 초기화
    document.querySelectorAll('.error-message').forEach(function(div) {
        div.textContent = '';
    });

    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('phone').value.trim(); // 휴대전화 번호

    let isValid = true;

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
        // TODO: 서버에 이름과 전화번호를 보내서 이메일을 찾는 로직 구현
        // 예: fetch('/api/find-email', { method: 'POST', body: JSON.stringify({ name, phone }) })
        //     .then(response => response.json())
        //     .then(data => {
        //         if (data.success) {
        //             alert('찾으시는 이메일 주소는: ' + data.email);
        //             // 찾은 이메일을 화면에 보여주는 로직 추가
        //         } else {
        //             alert('일치하는 회원 정보가 없습니다.');
        //             // 오류 메시지 표시 로직 추가
        //         }
        //     })
        //     .catch(error => {
        //         console.error('Error:', error);
        //         alert('이메일 찾기 중 오류가 발생했습니다.');
        //     });

        alert('이메일 찾기 정보가 유효합니다! 서버로 전송할 준비가 되었습니다. (실제 서버 연동 필요)');
    }
});

// 실시간 검증을 위한 이벤트 리스너 (blur 이벤트)
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
