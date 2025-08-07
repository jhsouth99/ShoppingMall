<%@ page language="java" contentType="text/html; charset=UTF-8"
         pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core"%>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt"%>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions"%>
<!DOCTYPE html>
<html lang="ko">
<head>
    <jsp:include page="/WEB-INF/views/common/meta.jsp" />
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${product.name}-상품 상세 페이지</title>

    <!-- 외부 라이브러리 -->
    <link
            href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap"
            rel="stylesheet">
    <link
            href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
            rel="stylesheet">

    <!-- 카카오 SDK -->
    <script src="https://developers.kakao.com/sdk/js/kakao.min.js"></script>
    <script>
        // 카카오 SDK 초기화 (실제 앱 키로 교체 필요)
        Kakao.init('YOUR_KAKAO_APP_KEY');
    </script>

    <!-- 프로젝트 CSS -->
    <link rel="stylesheet"
          href="${pageContext.request.contextPath}/resources/css/common.css">
    <link rel="stylesheet"
          href="${pageContext.request.contextPath}/resources/css/product-detail.css">
</head>

<body>
<!-- 헤더 포함 -->
<%@ include file="/WEB-INF/views/common/header.jsp"%>

<!-- 스크롤 버튼 -->
<i class="fa-solid fa-angle-up" id="top_scroll_btn" onclick="topScroll()"></i>
<i class="fa-regular fa-angle-down" id="bottom_scroll_btn" onclick="bottomScroll()"></i>

<!-- 메인 컨테이너 -->
<div class="container">

    <!-- 상품 정보 컨테이너 -->
    <div class="product-container">
        <!-- 제품 이미지 영역 -->
        <div class="product-images">
            <img id="mainImage" class="main-image"
                 src="${pageContext.request.contextPath}${product.thumbnailUrl}"
                 alt="${product.name} 메인 이미지"
                 data-product-id="${product.id}">

            <c:if test="${not empty product.images}">
                <div class="thumbnail-container">
                    <c:forEach var="image" items="${product.images}"
                               varStatus="status">
                        <c:if test="${image.imageType ne 'DETAIL'}">
                            <img class="thumbnail ${status.index == 0 ? 'active' : ''}"
                                 src="${pageContext.request.contextPath}${image.imageUrl}"
                                 alt="${product.name} 이미지 ${status.index + 1}"
                                 onclick="changeImage(this, '${pageContext.request.contextPath}${image.imageUrl}')">
                        </c:if>
                    </c:forEach>
                </div>
            </c:if>
        </div>

        <!-- 제품 정보 영역 -->
        <div class="product-info">
            <h1 class="product-title">${product.name}</h1>

            <!-- 공유 버튼 -->
            <div class="share-sns-buttons">
                <button class="share-button">
                    <i class="fas fa-share-alt"></i>
                </button>
                <ul id="sns-buttons">
                    <li><a href="#" onclick="shareToKakao(); return false;"><i class="fas fa-comment"></i></a></li>
                    <li><a href="#" onclick="shareToFacebook(); return false;"><i class="fab fa-facebook"></i></a></li>
                    <li><i class="fas fa-link" onclick="copyLink();"></i></li>
                    <li id="cancel" onclick="hideShareBar();">✕</li>
                </ul>
            </div>

            <!-- 상품 설명 -->
            <p class="product-description">${product.description}</p>

            <!-- 상품 옵션 -->
            <form action="">
                <div class="product-options">
                    <c:if test="${not empty product.options}">
                    <c:forEach var="option" items="${product.options}">
                    <label class="option-label">${option.name}</label>
                    <select class="option-select" data-option-name="${option.name}"
                            onchange="updateVariantOptions();">
                        <option value="">${option.name}을(를)선택하세요</option>
                        <c:forEach var="value" items="${option.values}">
                            <option value="${value.value}"
                                    <c:if test="${not empty defaultOptions && defaultOptions[option.name] == value.value}">
                                        selected="selected"
                                    </c:if>>
                                    ${value.value}
                            </option>
                        </c:forEach>
                    </select>
                    </c:forEach>
                    </c:if>

                    <!-- 수량 선택 -->
                    <label class="option-label">수량</label>
                    <div class="quantity-container">
                        <div class="quantity-button" onclick="decreaseQuantity()">-</div>
                        <input id="quantityInput" type="number" min="1" value="1"
                               class="quantity-input" onchange="updateTotalPrice()">
                        <div class="quantity-button" onclick="increaseQuantity()">+</div>
                    </div>
            </form>
        </div>

        <!-- 총 금액 (가격 정보 통합) -->
        <div class="total-price">
            <div class="price-info">
                <span class="price-label">총 금액:</span>
                <div class="price-display">
                    <c:choose>
                        <c:when test="${not empty proPrice}">
                            <div class="original-price">
                                <fmt:formatNumber value="${product.basePrice}" type="number" groupingUsed="true" />원
                            </div>
                            <div class="discount-info">
                                <c:if test="${proPrice.proDiscountType eq 'PERCENTAGE'}">
                                    <span class="discount-rate">${proPrice.proDiscountValue}%</span>
                                </c:if>
                                <c:if test="${proPrice.proDiscountType eq 'FIXED_AMOUNT'}">
                                    <span class="discount-rate">
                                        <fmt:formatNumber value="${proPrice.proDiscountValue}"
                                                          type="number" maxFractionDigits="0"/>%
                                    </span>
                                </c:if>
                            </div>
                        </c:when>
                    </c:choose>
                    <div class="current-price" id="totalPrice">
                        <c:choose>
                            <c:when test="${not empty proPrice}">
                                <c:if test="${proPrice.proDiscountType eq 'PERCENTAGE'}">
                                    <fmt:formatNumber value="${product.basePrice - (product.basePrice * (proPrice.proDiscountValue/100))}"
                                                      type="number" groupingUsed="true" />원
                                </c:if>
                                <c:if test="${proPrice.proDiscountType eq 'FIXED_AMOUNT'}">
                                    <fmt:formatNumber value="${product.basePrice - proPrice.proDiscountValue}"
                                                      type="number" groupingUsed="true" />원
                                </c:if>
                            </c:when>
                            <c:otherwise>
                                <fmt:formatNumber value="${product.basePrice}" type="number" groupingUsed="true" />원
                            </c:otherwise>
                        </c:choose>
                    </div>
                </div>
            </div>
        </div>

        <!-- 구매 버튼 그룹 -->
        <div class="button-group">
            <button class="buy-now-button" onclick="buyNow();">
                <span id="buyNowPrice">
                    <c:choose>
                        <c:when test="${not empty proPrice}">
                            <c:if test="${proPrice.proDiscountType eq 'PERCENTAGE'}">
                                <fmt:formatNumber value="${product.basePrice - proPrice.proDiscountFixed}"
                                                  type="number" groupingUsed="true" />원
                            </c:if>
                            <c:if test="${proPrice.proDiscountType eq 'FIXED_AMOUNT'}">
                                <fmt:formatNumber value="${product.basePrice - proPrice.proDiscountFixed}"
                                                  type="number" groupingUsed="true" />원
                            </c:if>
                        </c:when>
                        <c:otherwise>
                            <fmt:formatNumber value="${product.basePrice}" type="number" groupingUsed="true" />원
                        </c:otherwise>
                    </c:choose>
                </span><br>
                바로 구매
            </button>

            <button class="add-to-cart-button" onclick="addToCart();">장바구니</button>
            <button id="wish-button" onclick="toggleWishlist(${product.id});">
                <i class="fas fa-heart"></i>
            </button>
        </div>
    </div>
</div>


<!-- 프로모션 및 할인 정보 -->
<c:if test="${not empty activePromotions}">
    <div class="promotion-section">
        <h3 class="promotion-title">🎉 진행중인 할인 혜택 (가장 혜택이 큰 것 하나만 자동 반영됨)</h3>
        <c:forEach var="promotion" items="${activePromotions}">
            <div class="promotion-item" data-promotion-id="${promotion.id}">
                <div class="promotion-badge ${promotion.promotionType}">
                    <c:choose>
                        <c:when test="${promotion.promotionType == 'PRODUCT_DISCOUNT'}">상품할인</c:when>
                        <c:when test="${promotion.promotionType == 'CART_DISCOUNT'}">장바구니할인</c:when>
                        <c:when test="${promotion.promotionType == 'BUNDLE_DISCOUNT'}">묶음할인</c:when>
                        <c:otherwise>특별할인</c:otherwise>
                    </c:choose>
                </div>
                <div class="promotion-content">
                    <div class="promotion-name">${promotion.name}</div>
                    <div class="promotion-discount">
                        <c:choose>
                            <c:when test="${promotion.discountType == 'PERCENTAGE'}">
                                <span class="discount-rate">${promotion.discountValue}%</span> 할인
                                <c:if
                                        test="${promotion.maxDiscountAmount != null}">
                                    (최대 <fmt:formatNumber
                                        value="${promotion.maxDiscountAmount}" type="number"
                                        groupingUsed="true" />원)
                                </c:if>
                            </c:when>
                            <c:when test="${promotion.discountType == 'FIXED_AMOUNT'}">
                                <fmt:formatNumber value="${promotion.discountValue}"
                                                  type="number" groupingUsed="true" />원 할인
                            </c:when>
                        </c:choose>
                    </div>
                    <c:if test="${not empty promotion.description}">
                        <div class="promotion-description">${promotion.description}</div>
                    </c:if>
                    <div class="promotion-period">
                        <c:out value="${promotion.startDate}" />
                        ~
                        <c:choose>
                            <c:when test="${promotion.endDate != null}">
                                <c:out value="${promotion.endDate}" />
                            </c:when>
                            <c:otherwise>상시</c:otherwise>
                        </c:choose>
                    </div>
                </div>
            </div>
        </c:forEach>
    </div>
</c:if>

<!-- 사용 가능한 쿠폰 정보 -->
<c:if test="${not empty availableCoupons}">
    <div class="coupon-section">
        <h3 class="coupon-title">🎫 사용 가능한 쿠폰</h3>
        <div class="coupon-list">
            <c:forEach var="coupon" items="${availableCoupons}"
                       varStatus="status">
                <c:if test="${status.index < 3}">
                    <!-- 최대 3개까지만 표시 -->
                    <div
                            class="coupon-item ${coupon.applicable == 'Y' ? 'applicable' : 'not-applicable'}"
                            data-coupon-code="${coupon.couponCode}">
                        <div class="coupon-discount">
                            <c:choose>
                                <c:when test="${coupon.discountType == 'PERCENTAGE'}">
                                    ${coupon.discountValue}%
                                </c:when>
                                <c:when test="${coupon.discountType == 'FIXED_AMOUNT'}">
                                    <fmt:formatNumber value="${coupon.discountValue}"
                                                      type="number" groupingUsed="true" />원
                                </c:when>
                            </c:choose>
                        </div>
                        <div class="coupon-info">
                            <div class="coupon-name">${coupon.name}</div>
                            <c:if test="${coupon.minPurchaseAmount != null}">
                                <div class="coupon-condition">
                                    <fmt:formatNumber value="${coupon.minPurchaseAmount}"
                                                      type="number" groupingUsed="true" />
                                    원 이상 구매시
                                </div>
                            </c:if>
                            <div class="coupon-expiry">
                                <c:out
                                        value="${fn:replace(coupon.validTo.toString(), '-', '.')}" />
                                까지
                            </div>
                        </div>
                    </div>
                </c:if>
            </c:forEach>
            <c:if test="${availableCoupons.size() > 3}">
                <div class="more-coupons">
                    <button onclick="showAllCoupons()" class="show-more-btn">
                        +${availableCoupons.size() - 3}개 쿠폰 더보기</button>
                </div>
            </c:if>
        </div>
    </div>
</c:if>

<!-- 최종 할인 적용 가격 표시 -->
<div class="final-price-section">
    <div class="price-breakdown">
        <div class="original-price-line">
            <span>정가</span>
            <span id="originalPriceDisplay">
                <c:choose>
                    <c:when test="${not empty product.variants and product.variants.size() > 0}">
                        <fmt:formatNumber value="${product.variants[0].price}" type="number" groupingUsed="true" />원
                    </c:when>
                    <c:otherwise>
                        <fmt:formatNumber value="${product.basePrice}" type="number" groupingUsed="true" />원
                    </c:otherwise>
                </c:choose>
            </span>
        </div>
        <div class="promotion-discount-line" style="display: none;">
            <span>프로모션 할인</span>
            <span id="promotionDiscountDisplay" class="discount-amount">-0원</span>
        </div>
        <div class="coupon-discount-line" style="display: none;">
            <span>쿠폰 할인</span>
            <span id="couponDiscountDisplay" class="discount-amount">-0원</span>
        </div>
        <div class="shipping-fee-line">
            <span>배송비</span>
            <span id="shippingFeeDisplay">
                <c:choose>
                    <c:when test="${product.shippingFee != null && product.shippingFee > 0}">
                        +<fmt:formatNumber value="${product.shippingFee}" type="number" groupingUsed="true" />원
                    </c:when>
                    <c:otherwise>
                        무료배송
                    </c:otherwise>
                </c:choose>
            </span>
        </div>
        <div class="final-price-line">
            <span>최종 가격</span>
            <span id="finalPriceDisplay" class="final-price">
                <c:choose>
                    <c:when test="${not empty proPrice}">
                        <c:if test="${proPrice.proDiscountType eq 'PERCENTAGE'}">
                            <fmt:formatNumber value="${product.basePrice - proPrice.proDiscountFixed + (product.shippingFee != null ? product.shippingFee : 0)}"
                                              type="number" groupingUsed="true" />원
                        </c:if>
                        <c:if test="${proPrice.proDiscountType eq 'FIXED_AMOUNT'}">
                            <fmt:formatNumber value="${product.basePrice - proPrice.proDiscountFixed + (product.shippingFee != null ? product.shippingFee : 0)}"
                                              type="number" groupingUsed="true" />원
                        </c:if>
                    </c:when>
                    <c:otherwise>
                        <fmt:formatNumber value="${product.basePrice + (product.shippingFee != null ? product.shippingFee : 0)}" type="number" groupingUsed="true" />원
                    </c:otherwise>
                </c:choose>
            </span>
        </div>
    </div>
</div>

<!-- 진행 중인 공동구매 목록 -->
<c:if test="${not empty activeGroupBuys}">
    <div class="buy-team-state">
        <h4>진행 중인 공동구매 목록</h4>
        <hr>
        <div class="table-responsive">
            <table>
                <thead>
                <tr>
                    <th>공동구매명</th>
                    <th>공동구매가</th>
                    <th>참여/목표 수량</th>
                    <th>남은 수량</th>
                    <th>남은 시간</th>
                    <th>마감기한</th>

                    <th>액션</th>
                </tr>
                </thead>
                <tbody>
                <c:forEach var="groupBuy" items="${activeGroupBuys}"
                           varStatus="status">
                    <tr class="team-list-${groupBuy.id}">
                        <td>${groupBuy.name}</td>
                        <td><fmt:formatNumber value="${groupBuy.groupPrice}"
                                              type="number" groupingUsed="true" />원</td>
                        <td class="personnel-state">${groupBuy.currentQuantity}/${groupBuy.targetQuantity}</td>
                        <td class="rest-personnel"><span>${groupBuy.targetQuantity - groupBuy.currentQuantity}명</span>
                            남음</td>
                        <td class="rest-time" data-end-date="${groupBuy.endDate.time}">계산
                            중...</td>
                        <td class="deadline"><fmt:formatDate
                                value="${groupBuy.endDate}" pattern="yyyy-MM-dd HH:mm" /></td>
                        <td class="team-buttons"><c:choose>
                            <c:when
                                    test="${groupBuy.currentQuantity >= groupBuy.targetQuantity}">
                                <button class="join-team-button completed" disabled>모집완료</button>
                            </c:when>
                            <c:otherwise>
                                <button class="join-team-button"
                                        onclick="joinGroupBuy(${groupBuy.id});">참여하기</button>
                            </c:otherwise>
                        </c:choose></td>
                    </tr>
                </c:forEach>
                </tbody>
            </table>
        </div>
    </div>
</c:if>

<!-- 탭 메뉴 영역 -->
<div class="product-tabs">
    <div class="tab-buttons">
        <button class="tab-button active"
                onclick="openTab(event, 'detailTab')">상세 정보</button>
        <button class="tab-button" onclick="openTab(event, 'specTab')">제품
            사양</button>
        <button class="tab-button" onclick="openTab(event, 'shippingTab')">배송/환불</button>
        <button class="tab-button" onclick="openTab(event, 'reviewTab')">
            리뷰
            <c:if test="${product.reviewCount > 0}">(${product.reviewCount})</c:if>
        </button>
        <button class="tab-button" onclick="openTab(event, 'qnaTab')">
            문의
            <c:if test="${product.qnaCount > 0}">(${product.qnaCount})</c:if>
        </button>
    </div>

    <!-- 상세 정보 탭 -->
    <div id="detailTab" class="tab-content active">
        ${product.detailedContent}

        <!-- DETAIL 타입 이미지들을 상세 설명 아래에 추가 -->
        <c:if test="${not empty product.images}">
            <c:forEach var="image" items="${product.images}">
                <c:if test="${image.imageType eq 'DETAIL'}">
                    <div class="detail-image-wrapper">
                        <img class="detail-image"
                             src="${pageContext.request.contextPath}${image.imageUrl}"
                             alt="${image.altText != null ? image.altText : product.name}"
                             loading="lazy">
                    </div>
                </c:if>
            </c:forEach>
        </c:if>
    </div>

    <!-- 제품 사양 탭 -->
    <div id="specTab" class="tab-content">
        <table class="spec-table">
            <tr>
                <th>제품명</th>
                <td>${product.name}</td>
            </tr>
            <c:if test="${not empty product.attributes}">
                <c:forEach var="attr" items="${product.attributes}">
                    <tr>
                        <th>${attr.attributeName}</th>
                        <td>${attr.value}</td>
                    </tr>
                </c:forEach>
            </c:if>
        </table>
    </div>

    <!-- 배송/환불 탭 -->
    <div id="shippingTab" class="tab-content">
        <h3>배송 정보</h3>
        <ul>
            <li>배송 방법: 택배</li>
            <li>배송 지역: 전국</li>
            <li>배송 비용: 3,000원</li>
            <li>배송 기간: 결제 확인 후 1~3일 이내 발송 (주말, 공휴일 제외)</li>
        </ul>

        <h3>교환 및 반품 안내</h3>
        <ul>
            <li>교환/반품 신청 기간: 상품 수령 후 7일 이내</li>
            <li>교환/반품 배송비: 구매자 부담</li>
            <li>교환/반품 불가 사유: 착용 흔적, 오염, 훼손된 상품, 라벨 제거, 상품 포장 훼손</li>
            <li>소비자 피해 보상 환불 지연에 따른 배상: 전자상거래 등에서의 소비자 보호에 관한 법률에 따라 처리</li>
        </ul>
    </div>

    <!-- 리뷰 탭 -->
    <div id="reviewTab" class="tab-content">
        <div id="reviewList">
            <!-- 리뷰 목록은 AJAX로 로드 -->
            <div class="loading">리뷰를 불러오는 중...</div>
        </div>
    </div>

    <!-- 문의 탭 -->
    <div id="qnaTab" class="tab-content">
        <div id="qnaList">
            <!-- Q&A 목록은 AJAX로 로드 -->
            <div class="loading">문의를 불러오는 중...</div>
        </div>
    </div>
</div>

<!-- 관련 상품 -->
<div class="related_pro_container">
    <h2>관련 상품</h2>
    <div class="rel_pro_card_container">
        <c:choose>
            <c:when test="${ empty relPro }">
                <span>관련 상품이 없습니다</span>
            </c:when>
            <c:otherwise>
                <c:forEach var="relPro" items="${ relPro }">
                    <div class="rel_pro_card" onclick="location.href='${pageContext.request.contextPath}/products/${relPro.id}'">
                        <!-- 이미지 -->
                        <div class="rel_pro_image">
                            <c:choose>
                                <c:when test="${ empty relPro.relProImageUrl }">
                                    <img src="" alt="이미지 오류"/>
                                </c:when>
                                <c:otherwise>
                                    <img src="${pageContext.request.contextPath}${ relPro.relProImageUrl }" alt="${ relPro.relProAltText }"/>
                                </c:otherwise>
                            </c:choose>
                        </div>

                        <!-- 뱃지 -->
                        <c:if test="${ relPro.relProDiscountRate ne null and relPro.relProDiscountRate ne 0 }">
                            <div class="discount_badge">
                                <fmt:formatNumber value="${ relPro.relProDiscountRate }" maxFractionDigits="0"/>%
                            </div>
                        </c:if>
                        <c:if test="${ relPro.relProGroupBuyIsActive == 'ACTIVE' }">
                            <div class="group_badge">공동구매</div>
                        </c:if>

                        <!-- 관련 상품 정보 -->
                        <div class="rel_pro_info">
                            <h3 class="rel_pro_title">${ relPro.relProName }</h3>
                            <span class="rel_pro_price">
									<c:choose>
                                        <c:when test="${ relPro.relProDiscountRate ne null && relPro.relProDiscountRate ne 0 }">
                                            <del><fmt:formatNumber value="${ relPro.relProBasePrice }" maxFractionDigits="0"/>원</del>&nbsp;
                                            <b style="color: #dc3545;"><fmt:formatNumber value="${ relPro.relProFinalPrice }" maxFractionDigits="0"/>원</b>
                                        </c:when>
                                        <c:otherwise>
                                            <b><fmt:formatNumber value="${ relPro.relProFinalPrice }" maxFractionDigits="0"/>원</b>
                                        </c:otherwise>
                                    </c:choose>
								</span>

                            <!-- 공동구매 정보 -->
                            <c:choose>
                                <c:when test="${ not empty relPro.relProGroupBuyIsActive and relPro.relProGroupBuyIsActive eq 'ACTIVE' }">
                                    <div class="group-purchase-info">
                                        <div class="group-price">
                                            공동구매시:
                                            <fmt:formatNumber value="${ relPro.relProMinGroupBuyPrice }" pattern="#,###"/>원
                                        </div>
                                    </div>
                                </c:when>
                                <c:otherwise>
                                    <div class="non-group-purchase-info">
                                        <div class="non-group-price">
                                            공동구매시:
                                            <fmt:formatNumber value="${ relPro.relProMinGroupBuyPrice }" pattern="#,###"/>원
                                        </div>
                                    </div>
                                </c:otherwise>
                            </c:choose>
                        </div>
                    </div>
                </c:forEach>
            </c:otherwise>
        </c:choose>
    </div>
</div>

</div>


<!-- 이미지 확대 모달 -->
<div id="imageModal" class="modal">
    <div class="modal-content">
        <span class="close-modal" onclick="closeModal()">&times;</span> <img
            id="modalImage" class="modal-image" src="" alt="확대 이미지">
    </div>
</div>


<!-- 문의등록 모달 -->
<div id="qnaList"></div>


<!-- 푸터 포함 -->
<%@ include file="/WEB-INF/views/common/footer.jsp"%>

<!-- JavaScript -->
<script
        src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js"></script>
<script
        src="${pageContext.request.contextPath}/resources/js/product-detail.js"></script>

<!-- 페이지 데이터 전달 -->
<script>
    // 서버에서 전달받은 데이터를 JavaScript 변수로 설정
    window.productData = {
        id: ${product.id},
        productId: ${product.id},
        name: '${product.name}',
        basePrice: ${product.basePrice},
        variants: [
            <c:forEach var="variant" items="${product.variants}" varStatus="status">
            {
                id: ${variant.id},
                price: ${variant.price},
                stockQuantity: ${variant.stockQuantity},
                optionCombination: '${variant.optionCombination}',
                isActive: ${variant.isActive}
            }${!status.last ? ',' : ''}
            </c:forEach>
        ],

        // 최저가 variant 정보 추가
        minPriceVariant: <c:if test="${not empty minPriceVariant}">
            {
                id: ${minPriceVariant.id},
                price: ${minPriceVariant.price},
                stockQuantity: ${minPriceVariant.stockQuantity},
                optionCombination: '${minPriceVariant.optionCombination}',
                isActive: ${minPriceVariant.isActive}
            }
        </c:if><c:if test="${empty minPriceVariant}">null</c:if>,

        // 기본 선택 옵션 정보
        defaultOptions: <c:if test="${not empty defaultOptions}">
            {
                <c:forEach var="entry" items="${defaultOptions}" varStatus="status">
                '${entry.key}': '${entry.value}'${!status.last ? ',' : ''}
                </c:forEach>
            }
        </c:if><c:if test="${empty defaultOptions}">null</c:if>,

        groupBuys: [
            <c:forEach var="groupBuy" items="${groupBuys}" varStatus="status">
            {
                id: ${groupBuy.id},
                name: '${groupBuy.name}',
                productVariantId: ${groupBuy.productVariantId},
                groupPrice: ${groupBuy.groupPrice},
                targetQuantity: ${groupBuy.targetQuantity},
                currentQuantity: ${groupBuy.currentQuantity},
                status: '${groupBuy.status}',
                endDate: '<fmt:formatDate value="${groupBuy.endDate}" pattern="yyyy-MM-dd HH:mm:ss"/>'
            }${!status.last ? ',' : ''}
            </c:forEach>
        ],

        shippingFee: ${product.shippingFee != null ? product.shippingFee : 0},
        shippingMethodName: '${product.shippingMethodName}',

        // 프로모션 정보 추가
        activePromotions: [
            <c:forEach var="promotion" items="${activePromotions}" varStatus="status">
            {
                id: ${promotion.id},
                name: '${promotion.name}',
                description: '${promotion.description}',
                promotionType: '${promotion.promotionType}',
                discountType: '${promotion.discountType}',
                discountValue: ${promotion.discountValue},
                maxDiscountAmount: ${promotion.maxDiscountAmount != null ? promotion.maxDiscountAmount : 'null'},
                startDate: '<c:out value="${promotion.startDate}"/>',
                endDate: '<c:out value="${promotion.endDate}"/>',
                priority: ${promotion.priority}
            }${!status.last ? ',' : ''}
            </c:forEach>
        ],

        // 쿠폰 정보 추가
        availableCoupons: [
            <c:forEach var="coupon" items="${availableCoupons}" varStatus="status">
            {
                couponId: ${coupon.couponId},
                couponCode: '${coupon.couponCode}',
                name: '${coupon.name}',
                discountType: '${coupon.discountType}',
                discountValue: ${coupon.discountValue},
                minPurchaseAmount: ${coupon.minPurchaseAmount != null ? coupon.minPurchaseAmount : 'null'},
                validFrom: '<c:out value="${coupon.validFrom}" />',
                validTo: '<c:out value="${coupon.validTo}" />',
                applicable: '${coupon.applicable}'
            }${!status.last ? ',' : ''}
            </c:forEach>
        ],

        // 현재 프로모션 할인 정보
        currentDiscount: {
            <c:if test="${not empty proPrice}">
                type: '${proPrice.proDiscountType}',
                value: ${proPrice.proDiscountValue},
                amount:
                <c:choose>
                    <c:when test="${not empty product.variants}">null</c:when>
                    <c:otherwise>
                        <c:choose>
                            <c:when test="${proPrice.proDiscountType eq 'PERCENTAGE'}">
                                Math.floor(${product.basePrice * proPrice.proDiscountValue / 100})
                            </c:when>
                            <c:when test="${proPrice.proDiscountType eq 'FIXED_AMOUNT'}">
                                ${proPrice.proDiscountValue}
                            </c:when>
                            <c:otherwise>0</c:otherwise>
                        </c:choose>
                    </c:otherwise>
                </c:choose>
            </c:if>
        },

        contextPath: '${pageContext.request.contextPath}'
    };

    // 현재 사용자 정보 (로그인 상태 확인용)
    <c:choose>
    <c:when test="${not empty sessionScope.loginUser}">
    window.currentUser = {
        id: ${sessionScope.loginUser.id},
        name: '${sessionScope.loginUser.name}'
    };
    </c:when>
    <c:otherwise>
    window.currentUser = null;
    </c:otherwise>
    </c:choose>
</script>
</body>
</html>