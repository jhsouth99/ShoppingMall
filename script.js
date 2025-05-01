document.getElementById('signup-form').addEventListener('submit', function(event) {
    event.preventDefault();

    // 모든 오류 메시지 초기화
    document.querySelectorAll('.error-message').forEach(function(span) {
        span.textContent = '';
    });

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const referralCode = document.getElementById('referral-code').value.trim();
    const agreeTerms = document.getElementById('agree-terms').checked;
    const ageCheck = document.getElementById('age-check').checked;
    const infoConsent = document.getElementById('info-consent').checked;

    let isValid = true;

    // 이메일 검증
    if (email === '') {
        document.getElementById('email-error').textContent = '이메일은 필수 입력 항목입니다.';
        isValid = false;
    } else if (!validateEmail(email)) {
        document.getElementById('email-error').textContent = '올바른 이메일 형식이 아닙니다.';
        isValid = false;
    }

    // 비밀번호 검증
    if (password === '') {
        document.getElementById('password-error').textContent = '비밀번호는 필수 입력 항목입니다.';
        isValid = false;
    }

    // 추천인 코드 검증 (선택 사항)
    if (referralCode !== '' && !validateReferralCode(referralCode)) {
        document.getElementById('referral-code-error').textContent = '추천인 코드는 6자 이상이어야 합니다.';
        isValid = false;
    }

    // 약관 동의 검증
    if (!agreeTerms || !ageCheck || !infoConsent) {
        alert('모든 필수 약관에 동의해야 가입할 수 있습니다.');
        isValid = false;
    }

    if (isValid) {
        alert('회원가입 정보가 유효합니다! 서버로 전송할 준비가 되었습니다.');
        // 서버로 데이터 전송하는 코드 추가
    }
});

// 이메일 형식 검증 함수
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
}

// 추천인 코드 검증 함수
function validateReferralCode(code) {
    return code.length >= 6; // 6자 이상인지 체크
}

function toggleAll(source) {
    const checkboxes = document.querySelectorAll('.terms-details input[type="checkbox"]');
    checkboxes.forEach((checkbox) => {
        checkbox.checked = source.checked; // '모두 동의합니다' 체크박스 상태에 따라 체크
    });
}
