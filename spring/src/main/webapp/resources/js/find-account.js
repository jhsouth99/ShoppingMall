/**
 * Find Account JavaScript
 * 아이디/비밀번호 찾기 페이지 기능
 */

$(document).ready(function() {
    // 전역 변수
    let verificationTimers = {
        email: null
    };
    let verificationData = {
        email: null
    };

    // CSRF 토큰
    const csrfToken = $('meta[name="_csrf"]').attr('content');
    const csrfHeader = $('meta[name="_csrf_header"]').attr('content');

    // Ajax 기본 설정
    $.ajaxSetup({
        beforeSend: function(xhr) {
            xhr.setRequestHeader(csrfHeader, csrfToken);
        }
    });

    // 현재 페이지 확인
    const isIdFindPage = $('body').find('#find-by-email').length > 0;
    const isPasswordFindPage = $('body').find('#find-password-by-email').length > 0;

    // ===================================
    // 이메일 인증번호 발송
    // ===================================
    $('#send-email-code').on('click', function() {
        const $button = $(this);
        const email = $('#email').val().trim();
        const name = isIdFindPage ? $('#name-email').val().trim() : null;
        const username = !isIdFindPage ? $('#username-email').val().trim() : null;

        // 유효성 검사
        if (!validateEmailForm()) {
            return;
        }

        // 버튼 비활성화
        $button.prop('disabled', true).addClass('loading');

        // 인증번호 발송 API 호출
        $.ajax({
            url: `${contextPath}/api/email-verification/send`,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                email: email,
                name: name,
                username: username,
                type: isIdFindPage ? 'FIND_ID' : 'FIND_PASSWORD'
            }),
            success: function(response) {
                if (response.success) {
                    // 인증번호 입력 필드 표시
                    $('#find-by-email .verification-group, #find-password-by-email .verification-group').slideDown();

                    // 타이머 시작
                    startTimer('email', 180); // 3분

                    // 인증 데이터 저장
                    verificationData.email = {
                        email: email,
                        name: name,
                        username: username
                    };

                    showMessage('success', '인증번호가 발송되었습니다.');
                    $('#email-code').focus();
                } else {
                    showMessage('error', response.message || '인증번호 발송에 실패했습니다.');
                }
            },
            error: function() {
                showMessage('error', '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
            },
            complete: function() {
                $button.prop('disabled', false).removeClass('loading');
            }
        });
    });

    // ===================================
    // 인증번호 재발송
    // ===================================
    $('#resend-email-code').on('click', function() {
        clearTimer('email');
        $('#send-email-code').click();
    });

    // ===================================
    // 아이디 찾기 폼 제출
    // ===================================
    $('#find-by-email').on('submit', function(e) {
        e.preventDefault();

        const verificationCode = $('#email-code').val();
        const data = verificationData.email;

        if (!data) {
            showMessage('error', '인증번호를 먼저 발송해주세요.');
            return;
        }

        if (!verificationCode) {
            showMessage('error', '인증번호를 입력해주세요.');
            return;
        }

        // 버튼 비활성화
        const $submitBtn = $(this).find('button[type="submit"]');
        $submitBtn.prop('disabled', true).addClass('loading');

        // 아이디 찾기 API 호출
        $.ajax({
            url: `${contextPath}/api/find-id`,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                ...data,
                verificationCode: verificationCode,
                method: 'email'
            }),
            success: function(response) {
                if (response.success) {
                    // 찾기 결과 표시
                    $('.find-form').hide();
                    $('#found-username').text(response.username);
                    $('#register-date').text(formatDate(response.registerDate));
                    $('#find-result').fadeIn();

                    // 타이머 정리
                    clearAllTimers();
                } else {
                    showMessage('error', response.message || '아이디를 찾을 수 없습니다.');
                }
            },
            error: function() {
                showMessage('error', '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
            },
            complete: function() {
                $submitBtn.prop('disabled', false).removeClass('loading');
            }
        });
    });

    // ===================================
    // 비밀번호 찾기 폼 제출
    // ===================================
    $('#find-password-by-email').on('submit', function(e) {
        e.preventDefault();

        const verificationCode = $('#email-code').val();
        const data = verificationData.email;

        if (!data) {
            showMessage('error', '인증번호를 먼저 발송해주세요.');
            return;
        }

        if (!verificationCode) {
            showMessage('error', '인증번호를 입력해주세요.');
            return;
        }

        // 버튼 비활성화
        const $submitBtn = $(this).find('button[type="submit"]');
        $submitBtn.prop('disabled', true).addClass('loading');

        // 비밀번호 찾기 API 호출
        $.ajax({
            url: `${contextPath}/api/find-password`,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                ...data,
                verificationCode: verificationCode,
                method: 'email'
            }),
            success: function(response) {
                if (response.success) {
                    if (response.resetMethod === 'form') {
                        // 비밀번호 재설정 폼 표시
                        $('.find-form').hide();
                        $('#reset-token').val(response.resetToken);
                        $('#reset-password-form').fadeIn();
                    } else {
                        // 임시 비밀번호 발송 완료
                        $('.find-form').hide();
                        $('#result-email').text(data.email);
                        $('#find-result').fadeIn();
                    }

                    // 타이머 정리
                    clearAllTimers();
                } else {
                    showMessage('error', response.message || '비밀번호를 찾을 수 없습니다.');
                }
            },
            error: function() {
                showMessage('error', '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
            },
            complete: function() {
                $submitBtn.prop('disabled', false).removeClass('loading');
            }
        });
    });

    // ===================================
    // 비밀번호 재설정 폼 제출
    // ===================================
    $('#password-reset-form').on('submit', function(e) {
        e.preventDefault();

        const newPassword = $('#new-password').val();
        const confirmPassword = $('#confirm-password').val();
        const resetToken = $('#reset-token').val();

        // 비밀번호 확인
        if (newPassword !== confirmPassword) {
            showValidationError('#confirm-password', '비밀번호가 일치하지 않습니다.');
            return;
        }

        // 비밀번호 강도 확인
        if (!validatePasswordStrength(newPassword)) {
            showValidationError('#new-password', '비밀번호가 보안 요구사항을 충족하지 않습니다.');
            return;
        }

        // 버튼 비활성화
        const $submitBtn = $(this).find('button[type="submit"]');
        $submitBtn.prop('disabled', true).addClass('loading');

        // 비밀번호 재설정 API 호출
        $.ajax({
            url: `${contextPath}/api/reset-password-by-token`,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                resetToken: resetToken,
                newPassword: newPassword
            }),
            success: function(response) {
                if (response.success) {
                    showMessage('success', '비밀번호가 성공적으로 변경되었습니다.');
                    setTimeout(function() {
                        window.location.href = `${contextPath}/login`;
                    }, 2000);
                } else {
                    showMessage('error', response.message || '비밀번호 변경에 실패했습니다.');
                }
            },
            error: function() {
                showMessage('error', '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
            },
            complete: function() {
                $submitBtn.prop('disabled', false).removeClass('loading');
            }
        });
    });

    // ===================================
    // 비밀번호 강도 체크
    // ===================================
    $('#new-password').on('input', function() {
        const password = $(this).val();
        const strength = checkPasswordStrength(password);

        const $progress = $('.strength-progress');
        const $level = $('#strength-level');

        $progress.removeClass('weak medium strong');

        if (password.length === 0) {
            $level.text('-');
            return;
        }

        switch(strength) {
            case 'weak':
                $progress.addClass('weak');
                $level.text('약함').css('color', 'var(--accent-danger)');
                break;
            case 'medium':
                $progress.addClass('medium');
                $level.text('보통').css('color', 'var(--accent-warning)');
                break;
            case 'strong':
                $progress.addClass('strong');
                $level.text('강함').css('color', 'var(--accent-success)');
                break;
        }
    });

    // ===================================
    // 유틸리티 함수들
    // ===================================

    // 이메일 폼 유효성 검사
    function validateEmailForm() {
        let isValid = true;
        $('.invalid-feedback').remove();
        $('.form-control').removeClass('is-invalid');

        const name = isIdFindPage ? $('#name-email').val().trim() : null;
        const email = $('#email').val().trim();
        const username = !isIdFindPage ? $('#username-email').val().trim() : null;

        if (!isIdFindPage && !username) {
            showValidationError('#username-email', '아이디를 입력해주세요.');
            isValid = false;
        }

        if (isIdFindPage && !name) {
            showValidationError('#name-email', '이름을 입력해주세요.');
            isValid = false;
        }

        if (!email) {
            showValidationError('#email', '이메일을 입력해주세요.');
            isValid = false;
        } else if (!isValidEmail(email)) {
            showValidationError('#email', '올바른 이메일 형식이 아닙니다.');
            isValid = false;
        }

        return isValid;
    }

    // 이메일 유효성 검사
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // 비밀번호 강도 체크
    function checkPasswordStrength(password) {
        let strength = 0;

        // 길이 체크
        if (password.length >= 8) strength++;
        if (password.length >= 12) strength++;

        // 대소문자 체크
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;

        // 숫자 체크
        if (/\d/.test(password)) strength++;

        // 특수문자 체크
        if (/[@$!%*#?&]/.test(password)) strength++;

        if (strength <= 2) return 'weak';
        if (strength <= 4) return 'medium';
        return 'strong';
    }

    // 비밀번호 강도 유효성 검사
    function validatePasswordStrength(password) {
        const hasLetter = /[A-Za-z]/.test(password);
        const hasNumber = /\d/.test(password);
        const hasSpecial = /[@$!%*#?&]/.test(password);
        const isLongEnough = password.length >= 8;

        return hasLetter && hasNumber && hasSpecial && isLongEnough;
    }

    // 타이머 시작
    function startTimer(type, seconds) {
        clearTimer(type);

        const timerId = `${type}-timer`;
        let remaining = seconds;

        function updateTimer() {
            const minutes = Math.floor(remaining / 60);
            const secs = remaining % 60;
            $(`#${timerId}`).text(`${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);

            if (remaining <= 0) {
                clearTimer(type);
                showMessage('warning', '인증 시간이 만료되었습니다. 다시 시도해주세요.');
                $(`.verification-group`).slideUp();
            }

            remaining--;
        }

        updateTimer();
        verificationTimers[type] = setInterval(updateTimer, 1000);
    }

    // 타이머 정리
    function clearTimer(type) {
        if (verificationTimers[type]) {
            clearInterval(verificationTimers[type]);
            verificationTimers[type] = null;
        }
    }

    // 모든 타이머 정리
    function clearAllTimers() {
        clearTimer('email');
    }

    // 유효성 검사 에러 표시
    function showValidationError(selector, message) {
        const $input = $(selector);
        $input.addClass('is-invalid');
        $input.focus();

        // 기존 에러 메시지 제거
        $input.siblings('.invalid-feedback').remove();

        // 새 에러 메시지 추가
        $('<div class="invalid-feedback">' + message + '</div>')
            .insertAfter($input);
    }

    // 메시지 표시
    function showMessage(type, message) {
        const alertClass = type === 'success' ? 'alert-success' :
            type === 'error' ? 'alert-danger' :
                type === 'warning' ? 'alert-warning' : 'alert-info';

        const $alert = $('<div class="alert ' + alertClass + ' alert-dismissible fade show" role="alert">' +
            '<i class="fas fa-' + (type === 'success' ? 'check-circle' :
                type === 'error' ? 'exclamation-circle' :
                    type === 'warning' ? 'exclamation-triangle' : 'info-circle') + '"></i> ' +
            message +
            '<button type="button" class="close" data-dismiss="alert" aria-label="Close">' +
            '<span aria-hidden="true">&times;</span></button></div>');

        // 기존 알림 제거
        $('.alert').remove();

        // 새 알림 추가
        $('.find-account-form-wrapper').prepend($alert);

        // 자동으로 사라지게 설정 (5초 후)
        setTimeout(function() {
            $alert.fadeOut('slow', function() {
                $(this).remove();
            });
        }, 5000);
    }

    // 날짜 포맷
    function formatDate(dateString) {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        return `${year}년 ${month}월 ${day}일`;
    }

    // 알림 닫기 버튼
    $(document).on('click', '.alert .close', function() {
        $(this).closest('.alert').fadeOut('fast', function() {
            $(this).remove();
        });
    });

    // 입력 필드 포커스 시 에러 제거
    $('.form-control').on('focus', function() {
        $(this).removeClass('is-invalid');
        $(this).siblings('.invalid-feedback').remove();
    });

    // 페이지 언로드 시 타이머 정리
    $(window).on('beforeunload', function() {
        clearAllTimers();
    });
});