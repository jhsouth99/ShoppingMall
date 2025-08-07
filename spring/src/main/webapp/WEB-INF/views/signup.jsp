<%@ page language="java" contentType="text/html; charset=UTF-8"
         pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!DOCTYPE html>
<html lang="ko">
<head>
    <jsp:include page="/WEB-INF/views/common/meta.jsp" />
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>회원가입 - 이거어때</title>

    <!-- 회원가입 페이지 전용 CSS -->
    <link rel="stylesheet" href="${pageContext.request.contextPath}/resources/css/signup.css">

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

<!-- 회원가입 컨테이너 -->
<div class="signup-wrapper">
    <div class="container">
        <div class="signup-container">
            <!-- 회원가입 선택 영역 -->
            <div class="signup-choice-wrapper" id="signupChoice">
                <div class="signup-header">
                    <h1>회원가입</h1>
                    <p>이거어때와 함께 더 나은 쇼핑을 시작하세요!</p>
                </div>

                <!-- 회원가입 방식 선택 -->
                <div class="signup-method-section">
                    <h3>회원가입 방식을 선택해주세요</h3>

                    <!-- 일반 회원가입 카드 -->
                    <div class="signup-method-card" onclick="showGeneralSignup()">
                        <div class="method-icon">
                            <i class="fas fa-envelope"></i>
                        </div>
                        <div class="method-content">
                            <h4>일반 회원가입</h4>
                            <p>이메일로 간편하게 가입하세요</p>
                            <ul class="method-features">
                                <li><i class="fas fa-check"></i> 이메일 인증으로 안전한 가입</li>
                                <li><i class="fas fa-check"></i> 원하는 아이디 직접 설정</li>
                                <li><i class="fas fa-check"></i> 나중에 소셜 계정 연동 가능</li>
                            </ul>
                        </div>
                        <div class="method-arrow">
                            <i class="fas fa-chevron-right"></i>
                        </div>
                    </div>

                    <!-- 소셜 회원가입 카드 -->
                    <div class="signup-method-card" onclick="showSocialSignup()">
                        <div class="method-icon social">
                            <i class="fas fa-share-alt"></i>
                        </div>
                        <div class="method-content">
                            <h4>소셜 계정으로 가입</h4>
                            <p>SNS 계정으로 빠르게 가입하세요</p>
                            <ul class="method-features">
                                <li><i class="fas fa-check"></i> 더 간단한 가입 절차 </li>
                                <li><i class="fas fa-check"></i> 비밀번호 기억할 필요 없음</li>
                            </ul>
                        </div>
                        <div class="method-arrow">
                            <i class="fas fa-chevron-right"></i>
                        </div>
                    </div>
                </div>

                <!-- 로그인 링크 -->
                <div class="login-link">
                    <p>이미 회원이신가요?
                        <a href="<c:url value='/login' />">로그인</a>
                    </p>
                </div>
            </div>

            <!-- 일반 회원가입 폼 -->
            <div class="general-signup-wrapper" id="generalSignup" style="display: none;">
                <div class="signup-header">
                    <button class="back-button" onclick="showSignupChoice()">
                        <i class="fas fa-arrow-left"></i>
                    </button>
                    <h1>일반 회원가입</h1>
                    <p>필수 정보를 입력해주세요</p>
                </div>

                <form id="signupForm"
                      action="<c:url value='/signup-perform'/>"
                      method="post"
                      onsubmit="return validateForm()">
                    <input type="hidden"
                           name="${_csrf.parameterName}"
                           value="${_csrf.token}"/>

                    <!-- 아이디 입력 -->
                    <div class="form-group">
                        <label for="username" class="form-label required">
                            <i class="fas fa-user"></i>
                            아이디
                        </label>
                        <div class="input-with-button">
                            <input type="text"
                                   id="username"
                                   name="username"
                                   class="form-control"
                                   placeholder="4-20자의 영문, 숫자"
                                   required>
                            <button type="button"
                                    id="checkUsernameBtn"
                                    class="check-button">중복확인</button>
                        </div>
                        <div id="usernameFeedback" class="feedback"></div>
                    </div>

                    <!-- 비밀번호 입력 -->
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

                    <!-- 비밀번호 확인 -->
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

                    <!-- 이름 입력 -->
                    <div class="form-group">
                        <label for="name" class="form-label required">
                            <i class="fas fa-id-card"></i>
                            이름
                        </label>
                        <input type="text"
                               id="name"
                               name="name"
                               class="form-control"
                               placeholder="실명을 입력하세요"
                               required>
                        <div id="nameFeedback" class="feedback"></div>
                    </div>

                    <!-- 휴대전화번호 입력 -->
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

                    <!-- 이메일 입력 -->
                    <div class="form-group">
                        <label for="email" class="form-label required">
                            <i class="fas fa-envelope"></i>
                            이메일
                        </label>
                        <div class="input-with-button">
                            <input type="email"
                                   id="email"
                                   name="email"
                                   class="form-control"
                                   placeholder="example@email.com"
                                   required>
                            <button type="button"
                                    id="checkEmailBtn"
                                    class="check-button">중복확인</button>
                            <button type="button"
                                    id="sendMailBtn"
                                    class="send-button"
                                    disabled>인증번호 받기</button>
                        </div>
                        <div id="emailFeedback" class="feedback"></div>
                    </div>

                    <!-- 이메일 인증코드 -->
                    <div class="form-group">
                        <label for="emailCode" class="form-label required">
                            <i class="fas fa-key"></i>
                            이메일 인증코드
                        </label>
                        <div class="input-with-button">
                            <input type="text"
                                   id="email-verifying-code"
                                   class="form-control"
                                   placeholder="인증코드 6자리"
                                   disabled
                                   required>
                            <button type="button"
                                    id="checkMailBtn"
                                    class="verify-button"
                                    disabled>인증확인</button>
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

                    <!-- 가입하기 버튼 -->
                    <button type="submit"
                            id="submitBtn"
                            class="btn btn-primary btn-block signup-btn"
                            disabled>
                        가입하기
                    </button>
                </form>
            </div>

            <!-- 소셜 회원가입 영역 -->
            <div class="social-signup-wrapper" id="socialSignup" style="display: none;">
                <div class="signup-header">
                    <button class="back-button" onclick="showSignupChoice()">
                        <i class="fas fa-arrow-left"></i>
                    </button>
                    <h1>소셜 계정으로 가입</h1>
                    <p>원하는 소셜 계정을 선택하세요</p>
                </div>

                <div class="social-signup-section">
                    <div class="social-login-buttons">
                        <a href="<c:url value='/oauth2/authorization/google' />"
                           class="social-login-btn google-btn">
                            <img src="${pageContext.request.contextPath}/resources/images/google-logo.svg"
                                 alt="Google"
                                 class="social-icon">
                            <span>Google 계정으로 가입</span>
                        </a>

                        <a href="<c:url value='/oauth2/authorization/naver' />"
                           class="social-login-btn naver-btn">
                            <img src="${pageContext.request.contextPath}/resources/images/naver-logo.svg"
                                 alt="Naver"
                                 class="social-icon">
                            <span>네이버 계정으로 가입</span>
                        </a>

                        <a href="<c:url value='/oauth2/authorization/kakao' />"
                           class="social-login-btn kakao-btn">
                            <img src="${pageContext.request.contextPath}/resources/images/kakao-logo.svg"
                                 alt="Kakao"
                                 class="social-icon">
                            <span>카카오 계정으로 가입</span>
                        </a>
                    </div>

                    <div class="social-signup-info">
                        <h4>소셜 계정으로 가입하면</h4>
                        <ul>
                            <li><i class="fas fa-check"></i> 비밀번호를 기억할 필요 없음</li>
                            <li><i class="fas fa-check"></i> 안전한 OAuth2.0 인증 방식</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- 푸터 포함 -->
<jsp:include page="/WEB-INF/views/common/footer.jsp" />

<!-- 회원가입 페이지 JavaScript -->
<script src="${pageContext.request.contextPath}/resources/js/signup.js"></script>
</body>
</html>