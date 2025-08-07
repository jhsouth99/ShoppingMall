<%@ page contentType="text/html; charset=UTF-8" %>
<%@ taglib prefix="c"    uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fmt"  uri="http://java.sun.com/jsp/jstl/fmt"  %>

<c:set var="ctx"      value="${pageContext.request.contextPath}" />
<c:set var="csrfToken" value="${_csrf.token}" />
<c:set var="csrfName"  value="${_csrf.headerName}" />

<!DOCTYPE html>
<html lang="ko">
<head>
    <%-- 공통 메타·CSS·JS 로드 (다크모드, 공통스타일, CSRF 메타 등) --%>
    <jsp:include page="/WEB-INF/views/common/meta.jsp" />

    <title>내 찜 목록</title>

    <%-- 기존 전용 CSS --%>
    <link rel="stylesheet" href="${ctx}/resources/css/wishlist.css" />

    <%-- 기존 inline 스타일 --%>
    <style>
      .grid {
        display: flex;
        flex-wrap: wrap;
        gap: 20px;
      }
      .card {
        width: 220px;
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 10px;
      }
      .card img {
        width: 100%;
        height: 160px;
        object-fit: cover;
        border-radius: 4px;
      }
      .card h4 {
        margin: 6px 0 4px;
        font-size: 16px;
      }
      .card .price {
        font-weight: bold;
        color: #e83e8c;
      }
      .card button {
        margin-top: 6px;
        width: 100%;
        padding: 6px 0;
        border: none;
        border-radius: 4px;
        background: #ff6f61;
        color: #fff;
        cursor: pointer;
      }
      .card-link:hover .card {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transform: translateY(-2px);
        transition: all 0.2s ease-in-out;
      }
    </style>

    <%-- 삭제 API 스크립트 --%>
    <script>
      const APP_CTX = '${ctx}';
      const CSRF    = '${csrfToken}';
      const CSRF_HN = '${csrfName}';

      async function deleteWishItem(pid) {
        if (!confirm('삭제하시겠습니까?')) return;

        try {
          const res = await fetch(APP_CTX + '/api/wishlist/' + pid, {
            method: 'DELETE',
            headers: { [CSRF_HN]: CSRF },
            credentials: 'same-origin'
          });
          if (res.ok) {
            alert('삭제 완료');
            document.getElementById('card-' + pid)?.remove();
          } else {
            const text = await res.text();
            alert('삭제 실패 (' + res.status + '): ' + text);
          }
        } catch (e) {
          alert('요청 오류: ' + e);
        }
      }
    </script>
</head>

<body>
  <%-- 공통 헤더 인클루드: “이거어때” 로고(메인 이동 버튼) 포함 --%>
  <%@ include file="/WEB-INF/views/common/header.jsp" %>

  <main class="container">
    <h2>찜 목록</h2>

    <c:choose>
      <c:when test="${empty items}">
        <p>찜한 상품이 없습니다 😢</p>
      </c:when>
      <c:otherwise>
        <div class="grid">
          <c:forEach var="item" items="${items}">
            <a href="${ctx}/products/${item.productId}"
               class="card-link"
               style="text-decoration:none; color:inherit;">
              <div class="card" id="card-${item.productId}">
                <img src="${ctx}${item.imageUrl}" alt="${item.productName}" />
                <h4>${item.productName}</h4>
                <div class="price">
                  <fmt:formatNumber value="${item.price}" type="currency" />
                </div>
                <button type="button"
                        onclick="deleteWishItem('${item.productId}')">
                  삭제
                </button>
              </div>
            </a>
          </c:forEach>
        </div>
      </c:otherwise>
    </c:choose>
  </main>
</body>
</html>
