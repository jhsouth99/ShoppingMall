<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="sec" uri="http://www.springframework.org/security/tags" %>

<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>E-Commerce Home</title>
<style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    .auth-links a, .auth-links button {
        display: inline-block;
        margin-right: 10px;
        text-decoration: none;
        padding: 5px 15px; /* a 태그의 원래 padding 값 */
        border-radius: 4px;
        border: 1px solid #ddd;
        color: #333;
        background-color: #f8f8f8;
        cursor: pointer;
        font-size: inherit; /* 주변 텍스트의 폰트 크기를 상속받도록 설정 */
        vertical-align: middle; /* 수직 정렬을 위해 추가 */
    }
    .auth-links button {
        font-family: inherit; /* body의 폰트를 상속받음 */
        line-height: inherit; /* 줄 간격 상속 */
    }
    .auth-links form {
        display: inline; /* 로그아웃 버튼을 링크처럼 보이게 하기 위함 */
    }
</style>
</head>
<body>

<h1>Welcome to our E-Commerce Site!</h1>
<hr>

<div class="auth-links">
    <%-- sec:authorize 태그를 사용하여 로그인 상태에 따라 다른 내용을 표시 --%>

    <%-- 인증된 사용자 (로그인한 사용자)에게만 보이는 부분 --%>
    <c:if test="${not empty sessionScope.loginUser}">
        <h3>안녕하세요, ${sessionScope.loginUser.name}님!</h3>
        
        <%-- 로그아웃은 CSRF 공격 방지를 위해 반드시 POST 방식으로 요청 --%>
        <form action="<c:url value='/perform-logout' />" method="post">
            <%-- CSRF 토큰을 자동으로 생성해주는 태그 --%>
            <sec:csrfInput />
            <button type="submit">로그아웃</button>
        </form>
        
        <a href="<c:url value='/my-page'/>">마이페이지</a>
        
    </c:if>

    <%-- 인증되지 않은 사용자 (로그인하지 않은 사용자)에게만 보이는 부분 --%>
    <c:if test="${empty sessionScope.loginUser}">
        <h3>로그인하여 더 많은 서비스를 이용해보세요.</h3>
        <a href="<c:url value='/login'/>">로그인</a>
        <a href="<c:url value='/signup'/>">회원가입</a>
    </c:if>
</div>

<hr>

<p> The time on the server is ${serverTime}. </p>

</body>
</html>