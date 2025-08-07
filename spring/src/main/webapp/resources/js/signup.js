/**
 * Signup Page JavaScript
 * 통합 회원가입 페이지 기능
 */

// 전역 변수
let usernameValid = false;
let passwordMatch = false;
let nameValid = false;
let phoneValid = false;
let emailAvailable = false;
let emailVerified = false;
let termsAgreed = false;

$(document).ready(function() {
    // URL 파라미터 체크 (에러 처리)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('error') === 'true') {
        switch (urlParams.get('reason')) {
            case 'unique':
                showAlert("이미 가입된 아이디입니다.", "error");
                break;
            case 'unknown':
                showAlert("알 수 없는 오류입니다.", "error");
                break;
        }
    }

    // CSRF 토큰 설정
    const csrfParameterName = $('meta[name="_csrf"]').attr('content') || "${_csrf.parameterName}";
    const csrfToken = $('meta[name="_csrf_header"]').attr('content') || "${_csrf.token}";

    // 초기 UI 상태 설정
    initializeUI();

    // 이벤트 리스너 설정
    setupEventListeners();

    // 약관 동의 체크박스 처리
    setupTermsCheckboxes();
});

/**
 * UI 표시/숨기기 함수들
 */
function showSignupChoice() {
    $('#signupChoice').show();
    $('#generalSignup').hide();
    $('#socialSignup').hide();
}

function showGeneralSignup() {
    $('#signupChoice').hide();
    $('#generalSignup').show();
    $('#socialSignup').hide();
}

function showSocialSignup() {
    $('#signupChoice').hide();
    $('#generalSignup').hide();
    $('#socialSignup').show();
}

/**
 * 초기 UI 상태 설정
 */
function initializeUI() {
    $('#sendMailBtn').prop('disabled', true);
    $('#email-verifying-code').prop('disabled', true);
    $('#checkMailBtn').prop('disabled', true);
}

/**
 * 이벤트 리스너 설정
 */
function setupEventListeners() {
    // 아이디 중복 확인
    $('#checkUsernameBtn').on('click', checkUsername);

    // 이메일 중복 확인
    $('#checkEmailBtn').on('click', checkEmail);

    // 이메일 인증번호 발송
    $('#sendMailBtn').on('click', sendVerificationEmail);

    // 이메일 인증번호 확인
    $('#checkMailBtn').on('click', verifyEmailCode);

    // 실시간 유효성 검사
    $('#username').on('input', function() {
        usernameValid = false;
        $('#usernameFeedback').removeClass('valid invalid').text('');
        toggleSubmit();
    });

    $('#password').on('input', function() {
        checkPasswordStrength();
        checkPasswordMatch();
    });

    $('#passwordConfirm').on('input', checkPasswordMatch);

    $('#name').on('input', function() {
        const name = $(this).val().trim();
        if (name.length >= 2) {
            nameValid = true;
            $('#nameFeedback').text('').removeClass('invalid');
        } else {
            nameValid = false;
            $('#nameFeedback').text('이름을 2자 이상 입력하세요.').addClass('invalid');
        }
        toggleSubmit();
    });

    $('#phone').on('input', function() {
        const phone = $(this).val().trim();
        const phoneRegex = /^[0-9]{3}-[0-9]{4}-[0-9]{4}$/;

        // 자동 하이픈 추가
        let cleaned = phone.replace(/[^0-9]/g, '');
        if (cleaned.length >= 7) {
            cleaned = cleaned.slice(0, 3) + '-' + cleaned.slice(3, 7) + '-' + cleaned.slice(7, 11);
        } else if (cleaned.length >= 4) {
            cleaned = cleaned.slice(0, 3) + '-' + cleaned.slice(3);
        }
        $(this).val(cleaned);

        if (phoneRegex.test(cleaned)) {
            phoneValid = true;
            $('#phoneFeedback').text('').removeClass('invalid');
        } else {
            phoneValid = false;
            if (cleaned.length > 0) {
                $('#phoneFeedback').text('올바른 형식으로 입력하세요.').addClass('invalid');
            }
        }
        toggleSubmit();
    });

    $('#email').on('input', function() {
        emailAvailable = false;
        emailVerified = false;
        $('#emailFeedback').removeClass('valid invalid').text('');
        $('#emailCheckFeedback').removeClass('valid invalid').text('');
        $('#sendMailBtn').prop('disabled', true);
        $('#email-verifying-code').prop('disabled', true).val('');
        $('#checkMailBtn').prop('disabled', true);
        toggleSubmit();
    });

    // 폼 제출
    $('#signupForm').on('submit', handleFormSubmit);
}

/**
 * 아이디 중복 확인
 */
function checkUsername() {
    const username = $('#username').val().trim();

    if (!username) {
        usernameValid = false;
        $('#usernameFeedback').text('아이디를 입력해주세요.').addClass('invalid');
        toggleSubmit();
        return;
    }

    if (username.length < 4 || username.length > 20) {
        usernameValid = false;
        $('#usernameFeedback').text('아이디는 4-20자 사이로 입력하세요.').addClass('invalid');
        toggleSubmit();
        return;
    }

    $.ajax({
        url: contextPath + '/api/username-exists',
        type: 'GET',
        data: { username: username },
        success: function(response) {
            if (response.exists) {
                usernameValid = false;
                $('#usernameFeedback')
                    .text('이미 사용중인 아이디입니다.')
                    .removeClass('valid')
                    .addClass('invalid');
            } else {
                usernameValid = true;
                $('#usernameFeedback')
                    .text('사용 가능한 아이디입니다.')
                    .removeClass('invalid')
                    .addClass('valid');
            }
            toggleSubmit();
        },
        error: function() {
            showAlert('아이디 중복 확인 중 오류가 발생했습니다.', 'error');
        }
    });
}

/**
 * 이메일 중복 확인
 */
function checkEmail() {
    const email = $('#email').val().trim();

    if (!email) {
        emailAvailable = false;
        $('#emailFeedback').text('이메일을 입력해주세요.').addClass('invalid');
        toggleSubmit();
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        emailAvailable = false;
        $('#emailFeedback').text('올바른 이메일 형식이 아닙니다.').addClass('invalid');
        toggleSubmit();
        return;
    }

    $.ajax({
        url: contextPath + '/api/email-exists',
        type: 'GET',
        data: { email: email },
        success: function(response) {
            if (response.exists) {
                emailAvailable = false;
                $('#emailFeedback')
                    .text('이미 사용중인 이메일입니다.')
                    .removeClass('valid')
                    .addClass('invalid');
                $('#sendMailBtn').prop('disabled', true);
            } else {
                emailAvailable = true;
                $('#emailFeedback')
                    .text('사용 가능한 이메일입니다.')
                    .removeClass('invalid')
                    .addClass('valid');
                $('#sendMailBtn').prop('disabled', false);
            }
            toggleSubmit();
        },
        error: function() {
            showAlert('이메일 중복 확인 중 오류가 발생했습니다.', 'error');
        }
    });
}

/**
 * 비밀번호 강도 체크
 */
function checkPasswordStrength() {
    const password = $('#password').val();
    const strengthDiv = $('.password-strength');

    if (!password) {
        strengthDiv.removeClass('show');
        return;
    }

    let strength = 0;

    // 길이 체크
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;

    // 문자 종류 체크
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    strengthDiv.addClass('show');
    const strengthBar = strengthDiv.find('.password-strength-bar') ||
        $('<div class="password-strength-bar"></div>').appendTo(strengthDiv);

    strengthBar.removeClass('weak medium strong');

    if (strength <= 2) {
        strengthBar.addClass('weak');
    } else if (strength <= 4) {
        strengthBar.addClass('medium');
    } else {
        strengthBar.addClass('strong');
    }
}

/**
 * 비밀번호 일치 확인
 */
function checkPasswordMatch() {
    const password = $('#password').val();
    const passwordConfirm = $('#passwordConfirm').val();

    if (password && passwordConfirm) {
        if (password === passwordConfirm) {
            passwordMatch = true;
            $('#passwordFeedback')
                .text('비밀번호가 일치합니다.')
                .removeClass('invalid')
                .addClass('valid');
        } else {
            passwordMatch = false;
            $('#passwordFeedback')
                .text('비밀번호가 일치하지 않습니다.')
                .removeClass('valid')
                .addClass('invalid');
        }
    } else {
        passwordMatch = false;
        $('#passwordFeedback').text('').removeClass('valid invalid');
    }

    toggleSubmit();
}

/**
 * 이메일 인증번호 발송
 */
function sendVerificationEmail() {
    const email = $('#email').val().trim();

    if (!email || !emailAvailable) {
        showAlert('이메일 중복 확인을 먼저 해주세요.', 'warning');
        return;
    }

    $('#emailFeedback').text('인증 메일을 발송중입니다...').removeClass('valid invalid');
    $('#sendMailBtn').prop('disabled', true);

    const csrfHeader = $('meta[name="_csrf_header"]').attr('content');
    const csrfToken = $('meta[name="_csrf"]').attr('content');

    $.ajax({
        url: contextPath + '/api/mail-send',
        type: 'POST',
        data: { email: email },
        beforeSend: function(xhr) {
            if (csrfHeader && csrfToken) {
                xhr.setRequestHeader(csrfHeader, csrfToken);
            }
        },
        success: function(response) {
            if (response.success) {
                showAlert('인증 메일이 발송되었습니다. 5분 이내에 인증코드를 입력해주세요.', 'success');
                $('#emailFeedback')
                    .text('인증 메일이 발송되었습니다.')
                    .addClass('valid');
                $('#email-verifying-code').prop('disabled', false);
                $('#checkMailBtn').prop('disabled', false);

                // 타이머 시작 (선택사항)
                startEmailTimer();
            } else {
                showAlert(response.message || '메일 발송에 실패했습니다.', 'error');
                $('#sendMailBtn').prop('disabled', false);
            }
        },
        error: function() {
            showAlert('메일 발송 중 오류가 발생했습니다.', 'error');
            $('#sendMailBtn').prop('disabled', false);
        }
    });
}

/**
 * 이메일 인증코드 확인
 */
function verifyEmailCode() {
    const code = $('#email-verifying-code').val().trim();

    if (!code) {
        showAlert('인증코드를 입력해주세요.', 'warning');
        return;
    }

    const csrfHeader = $('meta[name="_csrf_header"]').attr('content');
    const csrfToken = $('meta[name="_csrf"]').attr('content');

    $.ajax({
        url: contextPath + '/api/mail-check',
        type: 'POST',
        data: { code: code },
        beforeSend: function(xhr) {
            if (csrfHeader && csrfToken) {
                xhr.setRequestHeader(csrfHeader, csrfToken);
            }
        },
        success: function(response) {
            if (response.success) {
                emailVerified = true;
                showAlert('이메일 인증이 완료되었습니다.', 'success');
                $('#emailCheckFeedback')
                    .text('이메일 인증이 완료되었습니다.')
                    .removeClass('invalid')
                    .addClass('valid');
                $('#sendMailBtn').prop('disabled', true);
                $('#email-verifying-code').prop('disabled', true);
                $('#checkMailBtn').prop('disabled', true);
                toggleSubmit();
            } else {
                emailVerified = false;
                showAlert(response.message || '인증코드가 일치하지 않습니다.', 'error');
                $('#emailCheckFeedback')
                    .text('인증코드가 일치하지 않습니다.')
                    .removeClass('valid')
                    .addClass('invalid');
            }
        },
        error: function() {
            showAlert('인증 확인 중 오류가 발생했습니다.', 'error');
        }
    });
}

/**
 * 약관 동의 체크박스 처리
 */
function setupTermsCheckboxes() {
    // 전체 동의 체크박스
    $('#agreeAll').on('change', function() {
        const isChecked = $(this).is(':checked');
        $('.agree-item').prop('checked', isChecked);
        checkTermsAgreed();
    });

    // 개별 체크박스
    $('.agree-item').on('change', function() {
        const allChecked = $('.agree-item:checked').length === $('.agree-item').length;
        $('#agreeAll').prop('checked', allChecked);
        checkTermsAgreed();
    });
}

/**
 * 필수 약관 동의 확인
 */
function checkTermsAgreed() {
    const requiredTerms = $('.agree-item[required]');
    termsAgreed = requiredTerms.length === requiredTerms.filter(':checked').length;
    toggleSubmit();
}

/**
 * 제출 버튼 활성화/비활성화
 */
function toggleSubmit() {
    const allValid = usernameValid && passwordMatch && nameValid && phoneValid &&
        emailAvailable && emailVerified && termsAgreed;

    $('#submitBtn').prop('disabled', !allValid);
}

/**
 * 폼 제출 처리
 */
function handleFormSubmit(e) {
    e.preventDefault();

    if (!validateForm()) {
        return false;
    }

    const $form = $(this);
    const $submitBtn = $('#submitBtn');

    $submitBtn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> 가입 처리중...');

    const csrfHeader = $('meta[name="_csrf_header"]').attr('content');
    const csrfToken = $('meta[name="_csrf"]').attr('content');

    $.ajax({
        url: contextPath + '/api/signup-perform',
        type: 'POST',
        data: $form.serialize(),
        beforeSend: function(xhr) {
            if (csrfHeader && csrfToken) {
                xhr.setRequestHeader(csrfHeader, csrfToken);
            }
        },
        success: function(response) {
            if (response.success) {
                showAlert(response.message, 'success');
                setTimeout(() => {
                    window.location.href = contextPath + '/';
                }, 1500);
            } else {
                showAlert(response.message || '회원가입에 실패했습니다.', 'error');
                $submitBtn.prop('disabled', false).text('가입하기');
            }
        },
        error: function(xhr) {
            const errorMsg = xhr.responseJSON?.message || '회원가입 중 오류가 발생했습니다.';
            showAlert(errorMsg, 'error');
            $submitBtn.prop('disabled', false).text('가입하기');
        }
    });
}

/**
 * 최종 유효성 검사
 */
function validateForm() {
    if (!usernameValid) {
        showAlert('아이디 중복 확인을 해주세요.', 'warning');
        $('#username').focus();
        return false;
    }

    if (!passwordMatch) {
        showAlert('비밀번호를 확인해주세요.', 'warning');
        $('#passwordConfirm').focus();
        return false;
    }

    if (!nameValid) {
        showAlert('이름을 확인해주세요.', 'warning');
        $('#name').focus();
        return false;
    }

    if (!phoneValid) {
        showAlert('휴대전화번호를 확인해주세요.', 'warning');
        $('#phone').focus();
        return false;
    }

    if (!emailVerified) {
        showAlert('이메일 인증을 완료해주세요.', 'warning');
        return false;
    }

    if (!termsAgreed) {
        showAlert('필수 약관에 동의해주세요.', 'warning');
        return false;
    }

    return true;
}

/**
 * 이메일 인증 타이머 (선택사항)
 */
function startEmailTimer() {
    let timeLeft = 300; // 5분
    const timerDisplay = $('<span class="timer"></span>').appendTo('#emailFeedback');

    const timer = setInterval(() => {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerDisplay.text(` (${minutes}:${seconds.toString().padStart(2, '0')})`);

        if (timeLeft <= 0) {
            clearInterval(timer);
            timerDisplay.remove();
            showAlert('인증 시간이 만료되었습니다. 다시 시도해주세요.', 'warning');
            $('#sendMailBtn').prop('disabled', false);
            $('#email-verifying-code').prop('disabled', true).val('');
            $('#checkMailBtn').prop('disabled', true);
        }

        timeLeft--;
    }, 1000);
}

/**
 * 알림 메시지 표시
 */
function showAlert(message, type = 'info') {
    // 기존 알림 제거
    $('.custom-alert').remove();

    const alertClass = {
        'success': 'alert-success',
        'error': 'alert-error',
        'warning': 'alert-warning',
        'info': 'alert-info'
    };

    const alertIcon = {
        'success': 'fa-check-circle',
        'error': 'fa-exclamation-circle',
        'warning': 'fa-exclamation-triangle',
        'info': 'fa-info-circle'
    };

    const alertHtml = `
        <div class="custom-alert ${alertClass[type] || 'alert-info'}">
            <div class="alert-content">
                <i class="alert-icon fas ${alertIcon[type] || 'fa-info-circle'}"></i>
                <span class="alert-message">${message}</span>
                <button class="alert-close" onclick="$(this).closest('.custom-alert').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `;

    $('body').append(alertHtml);

    const alertElement = $('.custom-alert').last();
    setTimeout(() => alertElement.addClass('show'), 10);

    // 자동 제거
    setTimeout(() => {
        alertElement.removeClass('show');
        setTimeout(() => alertElement.remove(), 300);
    }, 5000);
}