<%@ page language="java" contentType="text/html; charset=UTF-8"
         pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core"%>
<!DOCTYPE html>
<html lang="ko">
<head>
    <jsp:include page="/WEB-INF/views/common/meta.jsp" />
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>로그인 - 이거어때</title>

    <!-- 로그인 페이지 전용 CSS -->
    <link rel="stylesheet" href="${pageContext.request.contextPath}/resources/css/login.css">

    <!-- 카카오 SDK -->
    <script src="https://developers.kakao.com/sdk/js/kakao.min.js"></script>
    <script>
        // 카카오 SDK 초기화 (실제 앱 키로 교체 필요)
        Kakao.init('YOUR_KAKAO_APP_KEY');
    </script>
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
                <div class="login-header">
                    <h1>로그인</h1>
                    <p>이거어때에 오신 것을 환영합니다!</p>
                </div>

                <!-- 에러 메시지 표시 -->
                <c:if test="${not empty error}">
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-circle"></i>
                            ${sessionScope['SPRING_SECURITY_LAST_EXCEPTION'].message}
                    </div>
                </c:if>

                <!-- 로그인 폼 -->
                <form action="<c:url value='/perform-login' />" method="post" class="login-form">
                    <input type="hidden" name="${_csrf.parameterName}" value="${_csrf.token}"/>

                    <div class="form-group">
                        <label for="username" class="form-label">
                            <i class="fas fa-user"></i>
                            아이디
                        </label>
                        <input type="text"
                               id="username"
                               name="username"
                               class="form-control"
                               placeholder="아이디를 입력하세요"
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

                    <!-- 로그인 상태 유지 및 기타 옵션 -->
                    <div class="login-options">
                        <div class="form-check">
                            <input type="checkbox"
                                   id="remember-me"
                                   name="remember-me"
                                   class="form-check-input" />
                            <label for="remember-me" class="form-check-label">
                                로그인 상태 유지
                            </label>
                        </div>
                        <div class="login-links">
                            <a href="<c:url value='/find-id' />">아이디 찾기</a>
                            <span class="separator">|</span>
                            <a href="<c:url value='/find-password' />">비밀번호 찾기</a>
                        </div>
                    </div>

                    <!-- 로그인 버튼 -->
                    <button type="submit" class="btn btn-primary btn-block login-btn">
                        로그인
                    </button>
                </form>

                <!-- 소셜 로그인 섹션 -->
                <div class="social-login-section">
                    <div class="divider">
                        <span>또는</span>
                    </div>

                    <div class="social-login-buttons">
                        <a href="<c:url value='/oauth2/authorization/google' />"
                           class="social-login-btn google-btn">
                            <img src="${pageContext.request.contextPath}/resources/images/google-logo.svg"
                                 alt="Google"
                                 class="social-icon">
                            <span>Google로 로그인</span>
                        </a>

                        <a href="<c:url value='/oauth2/authorization/naver' />"
                           class="social-login-btn naver-btn">
                            <img src="${pageContext.request.contextPath}/resources/images/naver-logo.svg"
                                 alt="Naver"
                                 class="social-icon">
                            <span>네이버로 로그인</span>
                        </a>

                        <a href="<c:url value='/oauth2/authorization/kakao' />"
                           class="social-login-btn kakao-btn">
                            <img src="${pageContext.request.contextPath}/resources/images/kakao-logo.svg"
                                 alt="Kakao"
                                 class="social-icon">
                            <span>카카오로 로그인</span>
                        </a>
                    </div>
                </div>

                <!-- 회원가입 링크 -->
                <div class="signup-link">
                    <p>아직 회원이 아니신가요?
                        <a href="<c:url value='/signup' />">회원가입</a>
                    </p>
                </div>
            </div>


        </div>
    </div>
</div>

<!-- 푸터 포함 -->
<jsp:include page="/WEB-INF/views/common/footer.jsp" />

<!-- 로그인 페이지 JavaScript -->
<script>
    $(document).ready(function() {
        // 폼 유효성 검사
        $('.login-form').on('submit', function(e) {
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

            // 로그인 버튼 비활성화 및 로딩 표시
            const submitBtn = $(this).find('button[type="submit"]');
            submitBtn.prop('disabled', true)
                .html('<i class="fas fa-spinner fa-spin"></i> 로그인 중...');
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
                $('.login-form').submit();
            }
        });

        // 소셜 로그인 버튼 호버 효과
        $('.social-login-btn').on('mouseenter', function() {
            $(this).find('.social-icon').addClass('bounce');
        }).on('mouseleave', function() {
            $(this).find('.social-icon').removeClass('bounce');
        });

        // URL 파라미터에서 리턴 URL 확인
        const urlParams = new URLSearchParams(window.location.search);
        const returnUrl = urlParams.get('returnUrl');
        if (returnUrl) {
            // 리턴 URL이 있으면 폼 액션에 추가
            const form = $('.login-form');
            const action = form.attr('action');
            form.attr('action', action + '?returnUrl=' + encodeURIComponent(returnUrl));
        }

        // 비밀번호 표시/숨기기 토글 (선택사항)
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
    });
</script>
</body>
</html>