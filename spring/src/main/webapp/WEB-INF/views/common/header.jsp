<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="sec" uri="http://www.springframework.org/security/tags" %>

<header>
  <div class="header-top">
    <div class="container">
      <button class="mobile-menu-toggle" aria-label="메뉴 열기">
        <i class="fas fa-bars"></i>
      </button>
      <div class="logo">
        <a href="<c:url value='/'/>">이거어때</a>
      </div>
      <div class="search-container">
        <input type="text" id="search-input" placeholder="상품을 검색해보세요">
        <button id="search-button">
          <img src="${pageContext.request.contextPath}/resources/images/search.png" alt="검색">
        </button>
        <div class="search-history">
          <h4>최근 검색어</h4>
          <ul id="search-history-list">
            <!-- 검색 기록은 JS로 추가됨 -->
          </ul>
        </div>
      </div>
      <div class="user-menu">
        <div class="auth-links">
          <%-- Spring Security 태그로 인증 확인 --%>
          <sec:authorize access="isAuthenticated()">
            <%-- 인증된 사용자 정보 가져오기 --%>
            <sec:authentication property="principal" var="user"/>
            <p>안녕하세요, ${user.name}님!</p>

            <div class="auth-links-box">
                <%-- 로그아웃은 CSRF 공격 방지를 위해 반드시 POST 방식으로 요청 --%>
              <form action="<c:url value='/perform-logout' />" method="post">
                  <%-- CSRF 토큰을 자동으로 생성해주는 태그 --%>
                <sec:csrfInput />
                <button type="submit">로그아웃</button>
              </form>

                <%-- ROLE_USER인 사용자에게 마이페이지 버튼 표시 --%>
              <sec:authorize access="hasRole('ROLE_USER')">
                <a href="<c:url value='/mypage'/>">마이페이지</a>
              </sec:authorize>

                <%-- ROLE_SELLER인 사용자에게 판매자 페이지 버튼 표시 --%>
              <sec:authorize access="hasRole('ROLE_SELLER')">
                <a href="<c:url value='/seller/mypage'/>">판매자 페이지</a>
              </sec:authorize>

                <%-- ROLE_ADMIN인 사용자에게 관리자 페이지 버튼 표시 --%>
              <sec:authorize access="hasRole('ROLE_ADMIN')">
                <a href="<c:url value='/admin/mypage'/>">관리자 페이지</a>
              </sec:authorize>

              <a href="<c:url value='/cart'/>">장바구니</a>
              <a href="<c:url value='/wishlist'/>">찜 목록</a>
            </div>
          </sec:authorize>

          <%-- 인증되지 않은 사용자에게만 보이는 부분 --%>
          <sec:authorize access="!isAuthenticated()">
            <div class="auth-links-box">
              <a href="<c:url value='/login'/>">로그인</a>
              <a href="<c:url value='/signup'/>">회원가입</a>
            </div>
          </sec:authorize>
        </div>
      </div>
    </div>
  </div>
  <div class="header-nav">
    <div class="container">
      <nav class="main-nav">
        <ul>
          <!-- 카테고리 메뉴는 category-menu.js에서 동적으로 생성됨 -->
        </ul>
      </nav>
    </div>
  </div>
  <div class="mobile-menu-overlay"></div>
</header>