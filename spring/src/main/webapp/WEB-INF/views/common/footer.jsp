<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>

<footer>
  <div class="container">
    <div class="footer-top">
      <div class="footer-logo">
        <a href="<c:url value='/'/>">이거어때</a>
      </div>
      <div class="footer-nav">
        <ul>
          <li><a href="<c:url value='/about'/>">회사소개</a></li>
          <li><a href="<c:url value='/terms'/>">이용약관</a></li>
          <li><a href="<c:url value='/privacy'/>">개인정보처리방침</a></li>
          <li><a href="<c:url value='/contact'/>">고객센터</a></li>
          <li><a href="<c:url value='/partnership'/>">제휴문의</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-sns">
      <ul>
        <li><a href="#"><img src="${pageContext.request.contextPath}/resources/images/instagram.png" alt="인스타그램"></a></li>
        <li><a href="#"><img src="${pageContext.request.contextPath}/resources/images/facebook.png" alt="페이스북"></a></li>
        <li><a href="#"><img src="${pageContext.request.contextPath}/resources/images/kakao-talk.png" alt="카카오톡"></a></li>
      </ul>
    </div>
    <div class="footer-info">
      <p>상호명: (주)이거어때 | 대표: 홍길동 | 사업자등록번호: 123-45-67890</p>
      <p>주소: 서울특별시 강남구 테헤란로 123 이거어때빌딩 8층</p>
      <p>고객센터: 1234-5678 (평일 09:00-18:00, 주말/공휴일 휴무)</p>
      <p>이메일: help@howaboutthis.co.kr</p>
    </div>
    <div class="footer-copyright">
      <p>&copy; 2025 이거어때. All rights reserved.</p>
    </div>
  </div>
</footer>