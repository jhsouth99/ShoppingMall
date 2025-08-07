<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core"%>
<!DOCTYPE html>
<html lang="ko">
<head>
  <jsp:include page="/WEB-INF/views/common/meta.jsp" />
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>아이디 찾기 - 이거어때</title>

  <!-- 아이디/비밀번호 찾기 전용 CSS -->
  <link rel="stylesheet" href="${pageContext.request.contextPath}/resources/css/find-account.css">
</head>
<body>
<!-- 헤더 포함 -->
<jsp:include page="/WEB-INF/views/common/header.jsp" />

<!-- 아이디 찾기 컨테이너 -->
<div class="find-account-wrapper">
  <div class="container">
    <div class="find-account-container">
      <!-- 아이디 찾기 폼 영역 -->
      <div class="find-account-form-wrapper">
        <div class="find-account-header">
          <h1>아이디 찾기</h1>
          <p>회원 정보에 등록한 이메일로 아이디를 찾을 수 있습니다.</p>
        </div>

        <!-- 이메일로 찾기 폼 -->
        <form id="find-by-email" class="find-form active" method="post">
          <input type="hidden" name="${_csrf.parameterName}" value="${_csrf.token}"/>

          <div class="form-group">
            <label for="name-email" class="form-label">
              <i class="fas fa-user"></i>
              이름
            </label>
            <input type="text"
                   id="name-email"
                   name="name"
                   class="form-control"
                   placeholder="이름을 입력하세요"
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
            아이디 찾기
          </button>
        </form>

        <!-- 찾기 결과 표시 영역 -->
        <div id="find-result" class="find-result" style="display: none;">
          <div class="result-header">
            <i class="fas fa-check-circle"></i>
            <h3>아이디 찾기 결과</h3>
          </div>
          <div class="result-content">
            <p>회원님의 아이디는 다음과 같습니다:</p>
            <div class="found-id-box">
              <span id="found-username"></span>
            </div>
            <p class="register-date">가입일: <span id="register-date"></span></p>
          </div>
          <div class="result-actions">
            <a href="<c:url value='/login' />" class="btn btn-primary">
              로그인하기
            </a>
            <a href="<c:url value='/find-password' />" class="btn btn-secondary">
              비밀번호 찾기
            </a>
          </div>
        </div>

        <!-- 링크 영역 -->
        <div class="find-links">
          <a href="<c:url value='/find-password' />">비밀번호 찾기</a>
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

<!-- 아이디 찾기 JavaScript -->
<script src="${pageContext.request.contextPath}/resources/js/find-account.js"></script>
</body>
</ht