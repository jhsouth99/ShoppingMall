<%@ page language="java" contentType="text/html; charset=UTF-8"
         pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!DOCTYPE html>
<html lang="ko">
<head>
    <jsp:include page="/WEB-INF/views/common/meta.jsp" />
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>계정 연동 - 이거어때</title>

    <!-- 계정 연동 페이지 전용 CSS -->
    <link rel="stylesheet" href="${pageContext.request.contextPath}/resources/css/link-or-register.css">
</head>
<body>
<!-- 헤더 포함 -->
<jsp:include page="/WEB-INF/views/common/header.jsp" />

<!-- 계정 연동 선택 컨테이너 -->
<div class="link-register-wrapper">
    <div class="container">
        <div class="link-register-container">
            <div class="link-register-header">
                <div class="social-info">
                    <i class="fas fa-user-circle"></i>
                </div>
                <h1>소셜 계정 연동</h1>
                <p>이미 이거어때 계정이 있으신가요?</p>
            </div>

            <div class="link-register-content">
                <div class="info-message">
                    <i class="fas fa-info-circle"></i>
                    <p>소셜 로그인 정보와 일치하는 계정이 없습니다.<br>
                        아래 옵션 중 하나를 선택해주세요.</p>
                </div>

                <div class="option-cards">
                    <!-- 기존 계정 연동 카드 -->
                    <div class="option-card" onclick="location.href='${pageContext.request.contextPath}/login/link';">
                        <div class="option-icon link">
                            <i class="fas fa-link"></i>
                        </div>
                        <h3>기존 계정과 연동</h3>
                        <p>이미 이거어때 계정이 있다면<br>소셜 계정과 연동할 수 있습니다.</p>
                        <ul class="option-features">
                            <li><i class="fas fa-check"></i> 기존 구매 내역 유지</li>
                            <li><i class="fas fa-check"></i> 적립된 포인트 그대로 사용</li>
                            <li><i class="fas fa-check"></i> 다음부터 소셜 로그인 가능</li>
                        </ul>
                        <button class="option-button primary">
                            기존 계정으로 로그인
                            <i class="fas fa-arrow-right"></i>
                        </button>
                    </div>

                    <!-- 새 계정 생성 카드 -->
                    <div class="option-card" onclick="location.href='${pageContext.request.contextPath}/signup/social';">
                        <div class="option-icon create">
                            <i class="fas fa-user-plus"></i>
                        </div>
                        <h3>새 계정 만들기</h3>
                        <p>처음 방문하셨다면<br>간단히 회원가입을 완료하세요.</p>
                        <ul class="option-features">
                            <li><i class="fas fa-check"></i> 소셜 정보로 간편 가입</li>
                            <li><i class="fas fa-check"></i> 추가 정보만 입력하면 완료</li>
                            <li><i class="fas fa-check"></i> 안전한 회원 관리</li>
                        </ul>
                        <button class="option-button secondary">
                            새로 가입하기
                            <i class="fas fa-arrow-right"></i>
                        </button>
                    </div>
                </div>

                <div class="help-text">
                    <p>도움이 필요하신가요?
                        <a href="${pageContext.request.contextPath}/contact">고객센터</a>로 문의해주세요.
                    </p>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- 푸터 포함 -->
<jsp:include page="/WEB-INF/views/common/footer.jsp" />
</body>
</html>