<%@ page language="java" contentType="text/html; charset=UTF-8"
    pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core"%>
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Login</title>
<style>
    /* 소셜 로그인 버튼 기본 스타일 */
    .social-login-btn {
        display: block;
        width: 220px;
        height: 45px;
        line-height: 45px;
        margin: 10px 0;
        border-radius: 5px;
        text-align: center;
        color: #fff;
        font-weight: bold;
        text-decoration: none;
        position: relative;
        font-family: Arial, sans-serif;
    }
    /* 각 버튼 아이콘 스타일 (FontAwesome 같은 아이콘 라이브러리 사용 시) */
    .social-login-btn .icon {
        position: absolute;
        left: 15px;
        top: 50%;
        transform: translateY(-50%);
    }

    /* 구글 로그인 버튼 */
    .google-btn {
        background-color: #fff;
        color: #757575;
        border: 1px solid #ddd;
    }
    /* 네이버 로그인 버튼 */
    .naver-btn {
        background-color: #03C75A;
    }
    /* 카카오 로그인 버튼 */
    .kakao-btn {
        background-color: #FEE500;
        color: #191919;
    }
</style>
</head>
<body>

    <h2>Login</h2>

    <c:if test="${not empty error}">
        <div style="color: red; font-weight: bold;">
            ${sessionScope['SPRING_SECURITY_LAST_EXCEPTION'].message}
        </div>
    </c:if>

    <form action="<c:url value='/perform-login' />" method="post">
        <input type="hidden" name="${_csrf.parameterName}" value="${_csrf.token}"/>
        <div>
            <label for="username">Username:</label>
            <input type="text" id="username" name="username" required />
        </div>
        <div>
            <label for="password">Password:</label>
            <input type="password" id="password" name="password" required />
        </div>
        <div>
            <button type="submit">Login</button>
        </div>
    </form>
    
    <hr>
    
    <h3>Social Login</h3>
    <div>
        <a href="<c:url value='/oauth2/authorization/google' />" class="social-login-btn google-btn">
            Google로 로그인
        </a>
        <a href="<c:url value='/oauth2/authorization/naver' />" class="social-login-btn naver-btn">
            Naver로 로그인
        </a>
        <a href="<c:url value='/oauth2/authorization/kakao' />" class="social-login-btn kakao-btn">
            Kakao로 로그인
        </a>
    </div>

</body>
</html>