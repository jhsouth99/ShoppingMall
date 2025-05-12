document.getElementById('signup-form').addEventListener('submit', function(event) {
    event.preventDefault();

    // 모든 오류 메시지 초기화
    document.querySelectorAll('.error-message').forEach(function(div) {
        div.textContent = '';
    });

    // 이름, 휴대폰 번호 가져오기
    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('phone').value.trim();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const referralCode = document.getElementById('referral-code').value.trim();
    const ageCheck = document.getElementById('age-check').checked;
    const infoConsent = document.getElementById('info-consent').checked;
    // const advertisingConsent = document.getElementById('advertising-consent').checked;


    let isValid = true;

    // 이름 검증
    if (name === '') {
        document.getElementById('name-error').textContent = '이름을 입력해주세요.';
        isValid = false;
    }

    // 휴대폰 번호 검증 (간단한 형식 체크 추가 - find_auth.js와 동일)
    const phonePattern = /^\d{2,3}-?\d{3,4}-?\d{4}$/; // 기본적인 전화번호 형식 (하이픈 포함/미포함)
     if (phone === '') {
        document.getElementById('phone-error').textContent = '휴대전화 번호를 입력해주세요.';
        isValid = false;
    } else if (!phonePattern.test(phone)) {
         document.getElementById('phone-error').textContent = '올바른 휴대전화 번호 형식이 아닙니다. (예: 010-1234-5678)';
         isValid = false;
    }


    // 이메일 검증
    if (email === '') {
        document.getElementById('email-error').textContent = '이메일은 필수 입력 항목입니다.';
        isValid = false;
    } else if (!validateEmail(email)) {
        document.getElementById('email-error').textContent = '올바른 이메일 형식이 아닙니다.';
        isValid = false;
    }

    // 비밀번호 검증 (정규식 추가)
    const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,16}$/;
    if (password === '') {
        document.getElementById('password-error').textContent = '비밀번호는 필수 입력 항목입니다.';
        isValid = false;
    } else if (!passwordPattern.test(password)) {
         document.getElementById('password-error').textContent = '영문, 숫자, 특수문자 조합 8-16자로 입력해주세요.';
         isValid = false;
    }

    // 추천인 코드 검증 (선택 사항)
    if (referralCode !== '' && !validateReferralCode(referralCode)) {
        document.getElementById('referral-code-error').textContent = '추천인 코드는 6자 이상이어야 합니다.';
        isValid = false;
    }

    // 필수 약관 동의 검증 (alert 대신 메시지 표시)
    if (!ageCheck || !infoConsent) {
        document.getElementById('terms-error').textContent = '모든 필수 약관에 동의해야 가입할 수 있습니다.';
        isValid = false;
    }


    if (isValid) {
        // 유효성 검사를 통과하면 이 블록이 실행됨

        console.log('회원가입 정보가 유효합니다. 서버 전송 또는 페이지 이동을 진행합니다.');

        // TODO: 실제 서버 연동 (Fetch API 예시) - name, phone 추가
        /*
        fetch('/api/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: name, // 이름 추가
                phone: phone, // 휴대폰 번호 추가
                email: email,
                password: password,
                referralCode: referralCode,
                ageCheck: ageCheck,
                infoConsent: infoConsent,
                // advertisingConsent: advertisingConsent
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('회원가입 성공!');
                window.location.href = 'signup_success.html';
            } else {
                alert('회원가입 실패: ' + (data.message || '알 수 없는 오류 발생'));
                // 특정 필드의 오류 메시지 업데이트 로직 추가 가능 (예: 이름, 휴대폰 번호 관련 메시지)
            }
        })
        .catch(error => {
            console.error('회원가입 처리 중 오류 발생:', error);
            alert('회원가입 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
        });
        */

        // TODO: 서버 연동 대신 단순히 페이지 이동만 할 경우
        // alert('회원가입 정보 유효, 페이지 이동');
        window.location.href = 'signup_success.html'; // 회원가입 성공 페이지 URL로 변경

    }
});

// 이메일 형식 검증 함수
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
}

// 추천인 코드 검증 함수 (6자 이상인지 체크)
function validateReferralCode(code) {
    return code.length >= 6;
}

// '모두 동의합니다 (필수 항목)' 클릭 시 필수 약관만 체크/해제하는 함수
function toggleMandatoryTerms(source) {
    const mandatoryCheckboxes = document.querySelectorAll('.terms-details input[type="checkbox"].mandatory-term');
    mandatoryCheckboxes.forEach((checkbox) => {
        checkbox.checked = source.checked;
    });

     const ageCheck = document.getElementById('age-check').checked;
     const infoConsent = document.getElementById('info-consent').checked;
     const termsError = document.getElementById('terms-error');
     if (source.checked && ageCheck && infoConsent) {
         termsError.textContent = '';
     } else if (!source.checked) {
          termsError.textContent = '모든 필수 약관에 동의해야 가입할 수 있습니다.';
     }
}

// 실시간 검증을 위한 이벤트 리스너 추가 (blur 이벤트)
// 이름 필드 blur 이벤트 리스너 추가
document.getElementById('name').addEventListener('blur', function() {
    const name = this.value.trim();
    const nameError = document.getElementById('name-error');
    nameError.textContent = '';
    if (name === '') {
        nameError.textContent = '이름을 입력해주세요.';
    }
});

// 휴대폰 번호 필드 blur 이벤트 리스너 추가
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

document.getElementById('password').addEventListener('blur', function() {
    const password = this.value.trim();
    const passwordError = document.getElementById('password-error');
    passwordError.textContent = '';
    const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,16}$/;
    if (password === '') {
        passwordError.textContent = '비밀번호는 필수 입력 항목입니다.';
    } else if (!passwordPattern.test(password)) {
        passwordError.textContent = '영문, 숫자, 특수문자 조합 8-16자로 입력해주세요.';
    }
});

document.getElementById('referral-code').addEventListener('blur', function() {
    const referralCode = this.value.trim();
    const referralCodeError = document.getElementById('referral-code-error');
    referralCodeError.textContent = '';
    if (referralCode !== '' && !validateReferralCode(referralCode)) {
        referralCodeError.textContent = '추천인 코드는 6자 이상이어야 합니다.';
    }
});

// 필수 약관 체크 상태 변경 시 오류 메시지 업데이트 (각 필수 약관 클릭 시)
document.querySelectorAll('.mandatory-term').forEach(function(checkbox) {
    checkbox.addEventListener('change', function() {
        const ageCheck = document.getElementById('age-check').checked;
        const infoConsent = document.getElementById('info-consent').checked;
        const termsError = document.getElementById('terms-error');
        const agreeAllMandatory = document.getElementById('agree-terms-mandatory');

        if (ageCheck && infoConsent) {
            termsError.textContent = '';
            agreeAllMandatory.checked = true;
        } else {
            termsError.textContent = '모든 필수 약관에 동의해야 가입할 수 있습니다.';
            agreeAllMandatory.checked = false;
        }
    });
});

// 선택 약관 체크 상태 변경 시 '모두 동의합니다 (필수)' 체크 상태에 영향 없도록 (선택 사항)
document.getElementById('advertising-consent').addEventListener('change', function() {
    // 선택 약관 상태 변경은 '모두 동의합니다 (필수)'에 영향을 주지 않음
});
