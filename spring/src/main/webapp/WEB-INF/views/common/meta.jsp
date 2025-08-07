<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>

<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="_csrf" content="${_csrf.token}"/>
<meta name="_csrf_header" content="${_csrf.headerName}"/>
<meta name="context-path" content="${pageContext.request.contextPath}"/>

<!-- 다크모드를 위한 메타 태그 (JavaScript에서 동적으로 업데이트됨) -->
<meta name="theme-color" content="#ffffff">
<meta name="color-scheme" content="light dark">

<!-- 공통 CSS -->
<link rel="stylesheet" href="${pageContext.request.contextPath}/resources/css/common.css"/>
<link rel="stylesheet" href="${pageContext.request.contextPath}/resources/css/home.css"/>

<!-- Font Awesome (다크모드 버튼 아이콘용) -->
<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">

<!-- 공통 JavaScript -->
<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.7.1/jquery.min.js"></script>

<!-- 다크모드 테마 관리 스크립트 (가장 먼저 로드) -->
<script src="${pageContext.request.contextPath}/resources/js/theme.js"></script>

<!-- 기타 공통 JavaScript -->
<script>const contextPath = "${pageContext.request.contextPath}";</script>
<script src="${pageContext.request.contextPath}/resources/js/search.js"></script>
<script src="${pageContext.request.contextPath}/resources/js/category-menu.js"></script>