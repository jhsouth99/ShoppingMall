<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!DOCTYPE html>
<html lang="ko">
<head>
    <jsp:include page="/WEB-INF/views/common/meta.jsp" />
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>소셜 회원가입 - 이거어때</title>

    <!-- 회원가입 페이지 CSS 재사용 -->
    <link rel="stylesheet" href="${pageContext.request.contextPath}/resources/css/signup.css">
    <!-- 소셜 회원가입 전용 추가 CSS -->
    <link rel="stylesheet" href="${pageContext.request.contextPath}/resources/css/signup-social.css">
</head>
<body>
<!-- 헤더 포함 -->
<jsp:include page="/WEB-INF/views/common/header.jsp" />

<!-- 소셜 회원가입 컨테이너 -->
<div class="signup-wrapper">
    <div class="container">
        <div class="signup-container">
            <!-- 소셜 회원가입 폼 -->
            <div class="social-signup-form-wrapper">
                <div class="signup-header">
                    <div class="social-badge">
                        <c:choose>
                            <c:when test="${provider == 'google'}">
                                <img src="${pageContext.request.contextPath}/resources/images/google-logo.svg" alt="Google">
                            </c:when>
                            <c:when test="${provider == 'naver'}">
                                <img src="${pageContext.request.contextPath}/resources/images/naver-logo.svg" alt="Naver">
                            </c:when>
                            <c:when test="${provider == 'kakao'}">
                                <img src="${pageContext.request.contextPath}/resources/images/kakao-logo.svg" alt="Kakao">
                            </c:when>
                            <c:otherwise>
                                <i class="fas fa-user-circle"></i>
                            </c:otherwise>
                        </c:choose>
                    </div>
                    <h1>소셜 계정으로 가입</h1>
                    <p>몇 가지 정보만 추가하면 가입이 완료됩니다!</p>
                </div>

                <div class="social-info-notice">
                    <i class="fas fa-info-circle"></i>
                    <span>소셜 로그인 정보가 자동으로 입력되었습니다.</span>
                </div>

                <form id="socialSignupForm"
                      action="<c:url value='/api/signup/social-perform'/>"
                      method="post"
                      onsubmit="return validateForm()">
                    <input type="hidden" name="${_csrf.parameterName}" value="${_csrf.token}"/>

                    <!-- 이름 (소셜에서 가져온 정보) -->
                    <div class="form-group">
                        <label for="name" class="form-label">
                            <i class="fas fa-id-card"></i>
                            이름
                            <span class="label-badge">소셜 정보</span>
                        </label>
                        <input type="text"
                               id="name"
                               name="name"
                               value="${name}"
                               class="form-control readonly-social"
                               readonly>
                        <div id="nameFeedback" class="feedback"></div>
                    </div>

                    <!-- 아이디 설정 -->
                    <div class="form-group">
                        <label for="username" class="form-label required">
                            <i class="fas fa-user"></i>
                            사용할 아이디
                        </label>
                        <div class="input-with-button">
                            <input type="text"
                                   id="username"
                                   name="username"
                                   value="${username}"
                                   class="form-control"
                                   placeholder="4-20자의 영문, 숫자"
                                   required>
                            <button type="button"
                                    id="checkUsernameBtn"
                                    class="check-button">중복확인</button>
                        </div>
                        <div id="usernameFeedback" class="feedback"></div>
                    </div>

                    <!-- 비밀번호 설정 -->
                    <div class="form-group">
                        <label for="password" class="form-label required">
                            <i class="fas fa-lock"></i>
                            비밀번호
                        </label>
                        <input type="password"
                               id="password"
                               name="password"
                               class="form-control"
                               placeholder="8자 이상의 영문, 숫자, 특수문자 조합"
                               required>
                        <div class="password-strength" id="passwordStrength"></div>
                    </div>

                    <div class="form-group">
                        <label for="passwordConfirm" class="form-label required">
                            <i class="fas fa-lock"></i>
                            비밀번호 확인
                        </label>
                        <input type="password"
                               id="passwordConfirm"
                               name="passwordConfirm"
                               class="form-control"
                               placeholder="비밀번호를 다시 입력하세요"
                               required>
                        <div id="passwordFeedback" class="feedback"></div>
                    </div>

                    <!-- 휴대전화번호 -->
                    <div class="form-group">
                        <label for="phone" class="form-label required">
                            <i class="fas fa-mobile-alt"></i>
                            휴대전화번호
                        </label>
                        <input type="tel"
                               id="phone"
                               name="phone"
                               class="form-control"
                               placeholder="010-0000-0000"
                               pattern="[0-9]{3}-[0-9]{4}-[0-9]{4}"
                               required>
                        <div id="phoneFeedback" class="feedback"></div>
                    </div>

                    <!-- 이메일 -->
                    <div class="form-group">
                        <label for="email" class="form-label required">
                            <i class="fas fa-envelope"></i>
                            이메일
                            <c:if test="${not empty email}">
                                <span class="label-badge">소셜 정보</span>
                            </c:if>
                        </label>
                        <div class="input-with-button">
                            <input type="email"
                                   id="email"
                                   name="email"
                                   value="${email}"
                                   class="form-control ${not empty email ? 'has-social-value' : ''}"
                                   placeholder="example@email.com"
                                   required>
                            <button type="button"
                                    id="checkEmailBtn"
                                    class="check-button">중복확인</button>
                            <button type="button"
                                    id="sendMailBtn"
                                    class="send-button"
                                    style="display: none;"
                                    disabled>인증번호 받기</button>
                        </div>
                        <div id="emailFeedback" class="feedback"></div>
                    </div>

                    <!-- 이메일 인증 (조건부 표시) -->
                    <div class="form-group email-verify-group" style="display: none;">
                        <label for="emailCode" class="form-label required">
                            <i class="fas fa-key"></i>
                            이메일 인증코드
                        </label>
                        <div class="input-with-button">
                            <input type="text"
                                   id="emailCode"
                                   class="form-control"
                                   placeholder="인증코드 6자리">
                            <button type="button"
                                    id="checkMailBtn"
                                    class="verify-button">인증확인</button>
                        </div>
                        <div id="emailCheckFeedback" class="feedback"></div>
                    </div>

                    <!-- 약관 동의 -->
                    <div class="terms-section">
                        <div class="form-check">
                            <input type="checkbox"
                                   id="agreeAll"
                                   class="form-check-input">
                            <label for="agreeAll" class="form-check-label">
                                <strong>전체 동의</strong>
                            </label>
                        </div>
                        <div class="terms-list">
                            <div class="form-check">
                                <input type="checkbox"
                                       id="agreeTerms"
                                       class="form-check-input agree-item"
                                       required>
                                <label for="agreeTerms" class="form-check-label">
                                    [필수] 이용약관 동의
                                    <a href="#" class="terms-link">보기</a>
                                </label>
                            </div>
                            <div class="form-check">
                                <input type="checkbox"
                                       id="agreePrivacy"
                                       class="form-check-input agree-item"
                                       required>
                                <label for="agreePrivacy" class="form-check-label">
                                    [필수] 개인정보 처리방침 동의
                                    <a href="#" class="terms-link">보기</a>
                                </label>
                            </div>
                            <div class="form-check">
                                <input type="checkbox"
                                       id="agreeMarketing"
                                       class="form-check-input agree-item">
                                <label for="agreeMarketing" class="form-check-label">
                                    [선택] 마케팅 정보 수신 동의
                                    <a href="#" class="terms-link">보기</a>
                                </label>
                            </div>
                        </div>
                    </div>

                    <!-- 가입 완료 버튼 -->
                    <button type="submit"
                            id="submitBtn"
                            class="btn btn-primary btn-block signup-btn"
                            disabled>
                        가입 완료하기
                    </button>
                </form>
            </div>
        </div>
    </div>
</div>

<!-- 푸터 포함 -->
<jsp:include page="/WEB-INF/views/common/footer.jsp" />

<!-- 소셜 회원가입 JavaScript -->
<script src="${pageContext.request.contextPath}/resources/js/signup-social.js"></script>
</body>
</html>