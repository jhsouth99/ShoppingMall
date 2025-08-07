<%@ page language="java" contentType="text/html; charset=UTF-8"
         pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core"%>
<!DOCTYPE html>
<html lang="ko">
<head>
    <jsp:include page="/WEB-INF/views/common/meta.jsp" />
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>계정 연동 - 이거어때</title>

    <!-- 로그인 페이지 전용 CSS -->
    <link rel="stylesheet" href="${pageContext.request.contextPath}/resources/css/login.css">

    <!-- 계정 연동 페이지 추가 스타일 -->
    <style>
        /* 계정 연동 안내 섹션 */
        .link-info-section {
            background-color: var(--bg-secondary);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 25px;
            text-align: center;
        }

        .link-info-icon {
            font-size: 48px;
            color: var(--accent-primary);
            margin-bottom: 15px;
        }

        .link-info-title {
            font-size: 18px;
            font-weight: 600;
            color: var(--text-primary);
            margin-bottom: 10px;
        }

        .link-info-desc {
            font-size: 14px;
            color: var(--text-secondary);
            line-height: 1.6;
        }

        .social-account-info {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            padding: 12px 16px;
            background-color: var(--accent-light);
            border-radius: 6px;
            margin-top: 15px;
        }

        body.dark-theme .social-account-info {
            background-color: var(--bg-tertiary);
        }

        .social-provider-icon {
            width: 24px;
            height: 24px;
        }

        .social-account-email {
            font-size: 14px;
            font-weight: 500;
            color: var(--text-primary);
        }

        /* 구분선 스타일 */
        .or-divider {
            display: flex;
            align-items: center;
            margin: 30px 0;
            color: var(--text-muted);
            font-size: 14px;
        }

        .or-divider::before,
        .or-divider::after {
            content: '';
            flex: 1;
            height: 1px;
            background-color: var(--border-color);
        }

        .or-divider span {
            padding: 0 16px;
        }

        /* 대체 옵션 섹션 */
        .alternative-options {
            text-align: center;
            padding: 20px;
            background-color: var(--bg-secondary);
            border-radius: 8px;
            border: 1px solid var(--border-color);
        }

        .alternative-options h3 {
            font-size: 16px;
            color: var(--text-primary);
            margin-bottom: 15px;
        }

        .alternative-btn {
            display: inline-block;
            padding: 10px 20px;
            margin: 5px;
            background-color: var(--bg-primary);
            color: var(--accent-primary);
            border: 1px solid var(--accent-primary);
            border-radius: 6px;
            text-decoration: none;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.3s ease;
        }

        .alternative-btn:hover {
            background-color: var(--accent-primary);
            color: #fff;
            transform: translateY(-2px);
            box-shadow: 0 4px 8px var(--shadow-light);
        }

        /* 보안 안내 */
        .security-notice {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 12px 16px;
            background-color: rgba(23, 162, 184, 0.1);
            border: 1px solid rgba(23, 162, 184, 0.3);
            border-radius: 6px;
            margin-bottom: 20px;
            font-size: 13px;
            color: var(--accent-info);
        }

        .security-notice i {
            font-size: 16px;
        }

        /* 로딩 오버레이 */
        .loading-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.5);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 9999;
        }

        .loading-content {
            background-color: var(--bg-primary);
            padding: 30px;
            border-radius: 8px;
            text-align: center;
            box-shadow: 0 4px 20px var(--shadow-medium);
        }

        .loading-spinner {
            width: 50px;
            height: 50px;
            margin: 0 auto 20px;
            border: 4px solid var(--bg-tertiary);
            border-top: 4px solid var(--accent-primary);
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        .loading-text {
            font-size: 16px;
            color: var(--text-primary);
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
<!-- 헤더 포함 -->
<jsp:include page="/WEB-INF/views/common/header.jsp" />

<!-- 로그인 컨테이너 -->
<div class="login-wrapper">
    <div class="container">
        <div class="login-container">
            <!-- 로그인 폼 영역 -->
            <div class="login-form-wrapper">
                <!-- 계정 연동 안내 -->
                <div class="link-info-section">
                    <div class="link-info-icon">
                        <i class="fas fa-link"></i>
                    </div>
                    <h2 class="link-info-title">소셜 계정 연동</h2>
                    <p class="link-info-desc">
                        이미 이거어때 계정을 가지고 계신가요?<br>
                        기존 계정에 로그인하여 소셜 계정을 연동할 수 있습니다.
                    </p>

                    <!-- 연동하려는 소셜 계정 정보 표시 -->
                    <c:if test="${not empty sessionScope.pendingSocialAttributes}">
                        <div class="social-account-info">
                            <c:choose>
                                <c:when test="${sessionScope.pendingSocialAttributes.provider eq 'google'}">
                                    <img src="${pageContext.request.contextPath}/resources/images/google-logo.svg"
                                         alt="Google" class="social-provider-icon">
                                </c:when>
                                <c:when test="${sessionScope.pendingSocialAttributes.provider eq 'naver'}">
                                    <img src="${pageContext.request.contextPath}/resources/images/naver-logo.svg"
                                         alt="Naver" class="social-provider-icon">
                                </c:when>
                                <c:when test="${sessionScope.pendingSocialAttributes.provider eq 'kakao'}">
                                    <img src="${pageContext.request.contextPath}/resources/images/kakao-logo.svg"
                                         alt="Kakao" class="social-provider-icon">
                                </c:when>
                            </c:choose>
                            <span class="social-account-email">${sessionScope.pendingSocialAttributes.email}</span>
                        </div>
                    </c:if>
                </div>

                <!-- 보안 안내 -->
                <div class="security-notice">
                    <i class="fas fa-shield-alt"></i>
                    <span>안전한 연동을 위해 기존 계정의 비밀번호를 한 번 더 확인합니다.</span>
                </div>

                <!-- 에러 메시지 표시 -->
                <c:if test="${not empty error}">
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-circle"></i>
                        <c:choose>
                            <c:when test="${error eq 'session_expired'}">
                                세션이 만료되었습니다. 다시 시도해주세요.
                            </c:when>
                            <c:otherwise>
                                아이디 또는 비밀번호가 올바르지 않습니다.
                            </c:otherwise>
                        </c:choose>
                    </div>
                </c:if>

                <!-- 로그인 폼 -->
                <form action="<c:url value='/login/perform-link' />" method="post" class="login-form" id="linkLoginForm">
                    <input type="hidden" name="${_csrf.parameterName}" value="${_csrf.token}"/>

                    <div class="form-group">
                        <label for="username" class="form-label">
                            <i class="fas fa-user"></i>
                            기존 아이디
                        </label>
                        <input type="text"
                               id="username"
                               name="username"
                               class="form-control"
                               placeholder="이거어때 아이디를 입력하세요"
                               required
                               autofocus />
                    </div>

                    <div class="form-group">
                        <label for="password" class="form-label">
                            <i class="fas fa-lock"></i>
                            비밀번호
                        </label>
                        <input type="password"
                               id="password"
                               name="password"
                               class="form-control"
                               placeholder="비밀번호를 입력하세요"
                               required />
                    </div>

                    <!-- 연동 버튼 -->
                    <button type="submit" class="btn btn-primary btn-block login-btn">
                        <i class="fas fa-link"></i> 계정 연동하기
                    </button>
                </form>

                <!-- 구분선 -->
                <div class="or-divider">
                    <span>또는</span>
                </div>

                <!-- 대체 옵션 -->
                <div class="alternative-options">
                    <h3>다른 방법을 원하시나요?</h3>
                    <div>
                        <a href="<c:url value='/signup/social' />" class="alternative-btn">
                            <i class="fas fa-user-plus"></i> 새 계정 만들기
                        </a>
                        <a href="<c:url value='/login' />" class="alternative-btn">
                            <i class="fas fa-arrow-left"></i> 일반 로그인
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- 로딩 오버레이 -->
<div class="loading-overlay" id="loadingOverlay">
    <div class="loading-content">
        <div class="loading-spinner"></div>
        <p class="loading-text">계정을 연동하는 중입니다...</p>
    </div>
</div>

<!-- 푸터 포함 -->
<jsp:include page="/WEB-INF/views/common/footer.jsp" />

<!-- 계정 연동 페이지 JavaScript -->
<script>
    $(document).ready(function() {
        // 폼 유효성 검사
        $('#linkLoginForm').on('submit', function(e) {
            const username = $('#username').val().trim();
            const password = $('#password').val().trim();

            if (!username) {
                e.preventDefault();
                showValidationError('#username', '아이디를 입력해주세요.');
                return false;
            }

            if (!password) {
                e.preventDefault();
                showValidationError('#password', '비밀번호를 입력해주세요.');
                return false;
            }

            // 로딩 오버레이 표시
            $('#loadingOverlay').css('display', 'flex');

            // 폼 제출 버튼 비활성화
            const submitBtn = $(this).find('button[type="submit"]');
            submitBtn.prop('disabled', true);
        });

        // 입력 필드 포커스 시 에러 제거
        $('.form-control').on('focus', function() {
            $(this).removeClass('is-invalid');
            $(this).siblings('.invalid-feedback').remove();
        });

        // 유효성 검사 에러 표시
        function showValidationError(selector, message) {
            const input = $(selector);
            input.addClass('is-invalid');
            input.focus();

            // 기존 에러 메시지 제거
            input.siblings('.invalid-feedback').remove();

            // 새 에러 메시지 추가
            $('<div class="invalid-feedback">' + message + '</div>')
                .insertAfter(input);
        }

        // 엔터키 처리
        $('#username, #password').on('keypress', function(e) {
            if (e.which === 13) {
                $('#linkLoginForm').submit();
            }
        });

        // 대체 옵션 버튼 호버 효과
        $('.alternative-btn').on('mouseenter', function() {
            $(this).find('i').addClass('fa-bounce');
        }).on('mouseleave', function() {
            $(this).find('i').removeClass('fa-bounce');
        });

        // 비밀번호 표시/숨기기 토글
        $('<button type="button" class="password-toggle" title="비밀번호 표시">' +
            '<i class="fas fa-eye"></i></button>')
            .insertAfter('#password')
            .on('click', function() {
                const passwordInput = $('#password');
                const icon = $(this).find('i');

                if (passwordInput.attr('type') === 'password') {
                    passwordInput.attr('type', 'text');
                    icon.removeClass('fa-eye').addClass('fa-eye-slash');
                    $(this).attr('title', '비밀번호 숨기기');
                } else {
                    passwordInput.attr('type', 'password');
                    icon.removeClass('fa-eye-slash').addClass('fa-eye');
                    $(this).attr('title', '비밀번호 표시');
                }
            });

        // 세션 만료 체크 (5분마다)
        setInterval(function() {
            $.ajax({
                url: contextPath + '/api/check-session',
                type: 'GET',
                success: function(response) {
                    if (!response.valid) {
                        alert('세션이 만료되었습니다. 다시 시도해주세요.');
                        window.location.href = contextPath + '/login';
                    }
                },
                error: function() {
                    // 에러 무시 (네트워크 문제일 수 있음)
                }
            });
        }, 300000); // 5분
    });

    // Font Awesome 애니메이션 클래스 추가
    $('<style>')
        .text('@keyframes fa-bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }' +
            '.fa-bounce { animation: fa-bounce 0.5s ease-in-out; }')
        .appendTo('head');
</script>
</body>
</html>