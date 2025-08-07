<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core"%>
<!DOCTYPE html>
<html lang="ko">
<head>
  <jsp:include page="/WEB-INF/views/common/meta.jsp" />
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>비밀번호 찾기 - 이거어때</title>

  <!-- 아이디/비밀번호 찾기 전용 CSS -->
  <link rel="stylesheet" href="${pageContext.request.contextPath}/resources/css/find-account.css">
</head>
<body>
<!-- 헤더 포함 -->
<jsp:include page="/WEB-INF/views/common/header.jsp" />

<!-- 비밀번호 찾기 컨테이너 -->
<div class="find-account-wrapper">
  <div class="container">
    <div class="find-account-container">
      <!-- 비밀번호 찾기 폼 영역 -->
      <div class="find-account-form-wrapper">
        <div class="find-account-header">
          <h1>비밀번호 찾기</h1>
          <p>회원 정보에 등록한 이메일로 임시 비밀번호를 발송해 드립니다.</p>
        </div>

        <!-- 이메일로 찾기 폼 -->
        <form id="find-password-by-email" class="find-form active" method="post">
          <input type="hidden" name="${_csrf.parameterName}" value="${_csrf.token}"/>

          <div class="form-group">
            <label for="username-email" class="form-label">
              <i class="fas fa-user"></i>
              아이디
            </label>
            <input type="text"
                   id="username-email"
                   name="username"
                   class="form-control"
                   placeholder="아이디를 입력하세요"
                   required />
          </div>

          <div class="form-group">
            <label for="email" class="form-label">
              <i class="fas fa-envelope"></i>
              이메일
            </label>
            <div class="input-with-button">
              <input type="email"
                     id="email"
                     name="email"
                     class="form-control"
                     placeholder="가입 시 사용한 이메일을 입력하세요"
                     required />
              <button type="button" class="btn btn-secondary send-code-btn" id="send-email-code">
                인증번호 발송
              </button>
            </div>
          </div>

          <div class="form-group verification-group" style="display: none;">
            <label for="email-code" class="form-label">
              <i class="fas fa-key"></i>
              인증번호
            </label>
            <div class="input-with-timer">
              <input type="text"
                     id="email-code"
                     name="verificationCode"
                     class="form-control"
                     placeholder="인증번호 6자리를 입력하세요"
                     maxlength="6" />
              <span class="timer" id="email-timer">03:00</span>
            </div>
            <button type="button" class="btn btn-sm btn-light resend-btn" id="resend-email-code">
              재발송
            </button>
          </div>

          <button type="submit" class="btn btn-primary btn-block find-btn">
            비밀번호 찾기
          </button>
        </form>

        <!-- 비밀번호 재설정 폼 (인증 성공 후 표시) -->
        <div id="reset-password-form" class="reset-password-form" style="display: none;">
          <div class="reset-header">
            <i class="fas fa-lock"></i>
            <h3>새 비밀번호 설정</h3>
            <p>새로운 비밀번호를 입력해주세요.</p>
          </div>

          <form id="password-reset-form" method="post">
            <input type="hidden" name="${_csrf.parameterName}" value="${_csrf.token}"/>
            <input type="hidden" id="reset-token" name="resetToken" />

            <div class="form-group">
              <label for="new-password" class="form-label">
                <i class="fas fa-lock"></i>
                새 비밀번호
              </label>
              <input type="password"
                     id="new-password"
                     name="newPassword"
                     class="form-control"
                     placeholder="새 비밀번호를 입력하세요"
                     pattern="^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$"
                     required />
              <small class="form-text">
                영문, 숫자, 특수문자를 포함하여 8자 이상
              </small>
            </div>

            <div class="form-group">
              <label for="confirm-password" class="form-label">
                <i class="fas fa-lock"></i>
                새 비밀번호 확인
              </label>
              <input type="password"
                     id="confirm-password"
                     name="confirmPassword"
                     class="form-control"
                     placeholder="새 비밀번호를 다시 입력하세요"
                     required />
            </div>

            <div class="password-strength">
              <div class="strength-bar">
                <div class="strength-progress"></div>
              </div>
              <span class="strength-text">비밀번호 강도: <span id="strength-level">-</span></span>
            </div>

            <button type="submit" class="btn btn-primary btn-block">
              비밀번호 변경
            </button>
          </form>
        </div>

        <!-- 찾기 결과 표시 영역 -->
        <div id="find-result" class="find-result" style="display: none;">
          <div class="result-header success">
            <i class="fas fa-check-circle"></i>
            <h3>비밀번호 찾기 완료</h3>
          </div>
          <div class="result-content">
            <p class="success-message">
              <strong id="result-email"></strong>로<br>
              임시 비밀번호가 발송되었습니다.
            </p>
            <div class="info-box">
              <i class="fas fa-info-circle"></i>
              <p>
                이메일이 도착하지 않았다면 스팸 메일함을 확인해주세요.<br>
                보안을 위해 로그인 후 비밀번호를 변경해주세요.
              </p>
            </div>
          </div>
          <div class="result-actions">
            <a href="<c:url value='/login' />" class="btn btn-primary">
              로그인하기
            </a>
          </div>
        </div>

        <!-- 링크 영역 -->
        <div class="find-links">
          <a href="<c:url value='/find-id' />">아이디 찾기</a>
          <span class="separator">|</span>
          <a href="<c:url value='/login' />">로그인</a>
          <span class="separator">|</span>
          <a href="<c:url value='/signup' />">회원가입</a>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- 푸터 포함 -->
<jsp:include page="/WEB-INF/views/common/footer.jsp" />

<!-- 비밀번호 찾기 JavaScript -->
<script src="${pageContext.request.contextPath}/resources/js/find-account.js"></script>
</body>
</html>