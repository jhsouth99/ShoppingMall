/**
 * Product Detail Page JavaScript
 * Variant 기반 동적 가격 표시 통합 버전
 */

// 전역 변수
let selectedVariant = null;
let selectedQuantity = 1;
let basePrice = 0;
let currentImageIndex = 0;
let csrfToken = '';
let csrfHeader = '';

// 페이지네이션 상태 관리
let currentReviewPage = 1;
let currentQnAPage = 1;
let reviewFilters = { rating: null };
let qnaFilters = { keyword: null, status: null };
let isReviewLoading = false;
let isQnALoading = false;

// 프로모션 및 할인 관련 전역 변수
let appliedPromotion = null;
let appliedCoupon = null;
let originalPrice = 0;

// 스크롤 관리
function topScroll(){
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

function bottomScroll(){
    window.scrollTo({
        top: document.body.scrollHeight,
        behavior: 'smooth'
    });
}

// 페이지 로드 시 초기화
$(document).ready(function() {
    initializeCSRF();
    initializeProductDetail();
    initializePromotions();
    updateRemainingTime();

    // 1분마다 남은 시간 업데이트
    setInterval(updateRemainingTime, 60000);

    // 초기 옵션 가용성 체크
    setTimeout(() => {
        checkOptionAvailability();
    }, 100);
});

/**
 * CSRF 토큰 초기화
 */
function initializeCSRF() {
    csrfToken = $('meta[name="_csrf"]').attr('content');
    csrfHeader = $('meta[name="_csrf_header"]').attr('content');

    if (typeof window.csrfToken !== 'undefined') {
        csrfToken = window.csrfToken;
    }

    $.ajaxSetup({
        beforeSend: function(xhr, settings) {
            if (!/^(GET|HEAD|OPTIONS|TRACE)$/i.test(settings.type) && !this.crossDomain) {
                if (csrfHeader && csrfToken) {
                    xhr.setRequestHeader(csrfHeader, csrfToken);
                }
            }
        }
    });
}

/**
 * 상품 상세 페이지 초기화
 */
function initializeProductDetail() {
    if (typeof window.productData !== 'undefined') {
        // 최저가 variant가 있고 기본 옵션이 설정된 경우
        if (window.productData.minPriceVariant && window.productData.defaultOptions) {
            // 최저가 variant를 기본으로 선택
            selectedVariant = window.productData.minPriceVariant;
            basePrice = selectedVariant.price;
            originalPrice = selectedVariant.price;

            // 옵션 선택 상태를 업데이트 (이미 JSP에서 selected 처리됨)
            // JavaScript에서도 변수 상태를 동기화
            updateVariantOptions();

            // 재고 정보 업데이트
            updateStockInfo();

            // 가격 정보 즉시 업데이트
            recalculateDiscountForVariant();

            console.log('최저가 옵션 자동 선택:', window.productData.defaultOptions);
        } else if (window.productData.variants && window.productData.variants.length > 0) {
            // 기존 로직: 옵션이 없거나 하나인 경우
            if (window.productData.variants.length === 1) {
                selectedVariant = window.productData.variants[0];
                basePrice = selectedVariant.price;
                originalPrice = selectedVariant.price;
            } else {
                // 옵션이 여러 개인 경우 최저가 표시
                const minPriceVariant = window.productData.variants.reduce((min, v) =>
                    v.price < min.price ? v : min, window.productData.variants[0]);
                basePrice = minPriceVariant.price;
                originalPrice = minPriceVariant.price;
            }
        } else {
            basePrice = window.productData.basePrice;
            originalPrice = window.productData.basePrice;
        }

        // setTimeout을 사용하여 DOM이 완전히 준비된 후 실행
        setTimeout(() => {
            checkOptionAvailability();
        }, 100);

        // 이미지 모달 이벤트 바인딩
        bindImageEvents();

        // 찜 상태 확인 및 UI 업데이트
        checkWishlistStatus();

        // 초기 가격 표시 업데이트
        updateTotalPrice();
    }
}

/**
 * 프로모션 정보 초기화
 */
function initializePromotions() {
    if (typeof window.productData !== 'undefined' && window.productData.activePromotions) {
        // 초기 로드 시 프로모션 적용
        if (selectedVariant) {
            recalculateDiscountForVariant();
        } else if (window.productData.currentDiscount && window.productData.currentDiscount.type) {
            // 옵션이 있는 경우, 가장 저렴한 variant 기준으로 할인 계산
            if (window.productData.variants && window.productData.variants.length > 1) {
                // 가장 저렴한 variant 찾기
                const minPriceVariant = window.productData.variants.reduce((min, v) =>
                    v.price < min.price ? v : min, window.productData.variants[0]);

                // 해당 variant에 맞는 할인 금액 계산
                let discountAmount = 0;
                if (window.productData.currentDiscount.type === 'PERCENTAGE') {
                    discountAmount = Math.floor(minPriceVariant.price * window.productData.currentDiscount.value / 100);
                } else if (window.productData.currentDiscount.type === 'FIXED_AMOUNT') {
                    discountAmount = Math.min(window.productData.currentDiscount.value, minPriceVariant.price);
                }

                updateDiscountDisplay(minPriceVariant.price,
                    minPriceVariant.price - discountAmount,
                    {
                        type: window.productData.currentDiscount.type,
                        value: window.productData.currentDiscount.value,
                        amount: discountAmount
                    });
            } else {
                // 옵션이 없는 경우 기존 로직 사용
                updateDiscountDisplay(originalPrice,
                    originalPrice - (window.productData.currentDiscount.amount || 0),
                    window.productData.currentDiscount);
            }
        }
    }
}

/**
 * variant에 따른 할인 재계산
 */
function recalculateDiscountForVariant() {
    if (!selectedVariant) return;

    let discountInfo = null;
    let discountAmount = 0;

    // 프로모션 중에서 현재 variant에 적용 가능한 것 찾기
    if (window.productData.activePromotions && window.productData.activePromotions.length > 0) {
        const applicablePromotion = getBestPromotion(window.productData.activePromotions);

        if (applicablePromotion) {
            discountAmount = calculatePromotionDiscount(selectedVariant.price, applicablePromotion);
            discountInfo = {
                type: applicablePromotion.discountType,
                value: applicablePromotion.discountValue,
                amount: discountAmount
            };
        }
    }

    const finalPrice = selectedVariant.price - discountAmount;

    // 현재 수량 가져오기
    const quantity = parseInt($('#quantityInput').val()) || 1;

    if (quantity > 1) {
        // 수량이 1보다 크면 수량을 반영한 가격 표시
        updateDiscountDisplay(selectedVariant.price * quantity, finalPrice * quantity, discountInfo);
    } else {
        // 수량이 1이면 단가로 표시
        updateDiscountDisplay(selectedVariant.price, finalPrice, discountInfo);
    }
}

/**
 * 최종 가격 섹션 업데이트 함수
 */
function updateFinalPriceSection(originalPrice, promotionDiscount, couponDiscount, shippingFee, finalPrice) {
    // 원가 표시
    $('#originalPriceDisplay').text(originalPrice.toLocaleString() + '원');

    // 프로모션 할인
    if (promotionDiscount > 0) {
        $('.promotion-discount-line').show();
        $('#promotionDiscountDisplay').text('-' + promotionDiscount.toLocaleString() + '원');
    } else {
        $('.promotion-discount-line').hide();
    }

    // 쿠폰 할인
    if (couponDiscount > 0) {
        $('.coupon-discount-line').show();
        $('#couponDiscountDisplay').text('-' + couponDiscount.toLocaleString() + '원');
    } else {
        $('.coupon-discount-line').hide();
    }

    // 배송비 표시
    if (shippingFee > 0) {
        $('.shipping-fee-line').show();
        $('#shippingFeeDisplay').text('+' + shippingFee.toLocaleString() + '원');
    } else {
        $('.shipping-fee-line').show();
        $('#shippingFeeDisplay').text('무료배송');
    }

    // 최종 가격 (배송비 포함)
    $('#finalPriceDisplay').text((finalPrice + shippingFee).toLocaleString() + '원');
}

/**
 * 할인 정보 표시 업데이트
 */
function updateDiscountDisplay(originalPrice, discountedPrice, discountInfo) {
    const priceInfo = $('.price-info');

    let priceHtml = '<span class="price-label">총 금액:</span><div class="price-display">';

    if (discountInfo && discountInfo.type && discountInfo.amount > 0) {
        // 할인이 있는 경우
        priceHtml += `
            <div class="original-price">
                ${originalPrice.toLocaleString()}원
            </div>
            <div class="discount-info">
                <span class="discount-rate">`;

        if (discountInfo.type === 'PERCENTAGE') {
            priceHtml += `${discountInfo.value}%`;
        } else if (discountInfo.type === 'FIXED_AMOUNT') {
            const discountRate = Math.round((discountInfo.amount / originalPrice) * 100);
            priceHtml += `${discountRate}%`;
        }

        priceHtml += `</span>
            </div>
            <div class="current-price" id="totalPrice">
                ${discountedPrice.toLocaleString()}원
            </div>`;
    } else {
        // 할인이 없는 경우
        priceHtml += `
            <div class="current-price" id="totalPrice">
                ${originalPrice.toLocaleString()}원
            </div>`;
    }

    priceHtml += '</div>';
    priceInfo.html(priceHtml);

    // 구매 버튼 가격도 업데이트
    $('#buyNowPrice').text(discountedPrice.toLocaleString() + '원');

    // basePrice 업데이트 (수량 계산용)
    basePrice = discountedPrice;

    // 배송비 계산
    const shippingFee = calculateShippingFee(discountedPrice);

    // 최종 가격 섹션 업데이트
    const promotionDiscount = discountInfo && discountInfo.amount ? discountInfo.amount : 0;
    updateFinalPriceSection(originalPrice, promotionDiscount, 0, shippingFee, discountedPrice);
}

/**
 * 배송비 계산 함수
 */
function calculateShippingFee(totalPrice) {
    // 배송비 정책: 3만원 이상 무료배송
    const FREE_SHIPPING_THRESHOLD = 30000;
    const SHIPPING_FEE = 3000;

    if (totalPrice >= FREE_SHIPPING_THRESHOLD) {
        return 0;
    }
    return SHIPPING_FEE;
}

/**
 * 이미지 관련 이벤트 바인딩
 */
function bindImageEvents() {
    $('#mainImage').on('click', function() {
        const imageSrc = $(this).attr('src');
        $('#modalImage').attr('src', imageSrc);
        $('#imageModal').addClass('show');
    });

    $('#imageModal').on('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });

    $(document).on('keydown', function(e) {
        if (e.key === 'Escape' && $('#imageModal').hasClass('show')) {
            closeModal();
        }
    });
}

/**
 * 이미지 변경 함수
 */
function changeImage(thumbnail, imageSrc) {
    $('.thumbnail').removeClass('active');
    $(thumbnail).addClass('active');
    $('#mainImage').attr('src', imageSrc);

    const visibleThumbnails = $('.thumbnail').filter(':visible');
    currentImageIndex = visibleThumbnails.index(thumbnail);
}

/**
 * 이미지 모달 닫기
 */
function closeModal() {
    $('#imageModal').removeClass('show');
}


/**
 * 공유 버튼 바 표시
 */
function showShareBar() {
    const snsButtons = document.getElementById('sns-buttons');
    if (snsButtons) {
        snsButtons.classList.add('show');
    }
}

/**
 * 공유 버튼 바 숨기기
 */
function hideShareBar() {
    const snsButtons = document.getElementById('sns-buttons');
    if (snsButtons) {
        snsButtons.classList.remove('show');
    }
}

/**
 * 카카오톡 공유
 */
function shareToKakao() {
    // Kakao SDK가 로드되어 있는지 확인
    if (typeof Kakao !== 'undefined') {
        Kakao.Link.sendDefault({
            objectType: 'commerce',
            content: {
                title: window.productData.name,
                imageUrl: window.location.origin + $('#mainImage').attr('src'),
                link: {
                    mobileWebUrl: window.location.href,
                    webUrl: window.location.href
                }
            },
            commerce: {
                productName: window.productData.name,
                regularPrice: window.productData.basePrice
            },
            buttons: [{
                title: '상품 보러가기',
                link: {
                    mobileWebUrl: window.location.href,
                    webUrl: window.location.href
                }
            }]
        });
    } else {
        showAlert('카카오톡 공유 기능을 사용할 수 없습니다.', 'error');
    }
    hideShareBar();
}

/**
 * 페이스북 공유
 */
function shareToFacebook() {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(window.productData.name);
    window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${url}&t=${title}`,
        'facebook-share-dialog',
        'width=626,height=436'
    );
    hideShareBar();
}

/**
 * 링크 복사 (기존 copyLink 함수 개선)
 */
function copyLink() {
    const url = window.location.href;

    // 최신 브라우저에서 지원하는 방법
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(() => {
            showAlert('링크가 복사되었습니다!', 'success');
        }).catch(() => {
            fallbackCopyTextToClipboard(url);
        });
    } else {
        // 구형 브라우저를 위한 폴백
        fallbackCopyTextToClipboard(url);
    }
    hideShareBar();
}

/**
 * 구형 브라우저를 위한 링크 복사 폴백 함수
 */
function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showAlert('링크가 복사되었습니다!', 'success');
        } else {
            showAlert('링크 복사에 실패했습니다.', 'error');
        }
    } catch (err) {
        showAlert('링크 복사에 실패했습니다.', 'error');
    }

    document.body.removeChild(textArea);
}

// 문서 클릭 시 공유 버튼 숨기기
$(document).ready(function() {
    // 문서 전체 클릭 이벤트
    $(document).on('click', function(e) {
        // 공유 버튼이나 SNS 버튼 영역을 클릭한 게 아니면 숨기기
        if (!$(e.target).closest('.share-button, #sns-buttons').length) {
            hideShareBar();
        }
    });

    // 공유 버튼 클릭 시 토글
    $('.share-button').on('click', function(e) {
        e.stopPropagation();
        const snsButtons = $('#sns-buttons');
        if (snsButtons.hasClass('show')) {
            hideShareBar();
        } else {
            showShareBar();
        }
    });
});

/**
 * 탭 메뉴 전환
 */
function openTab(evt, tabName) {
    $('.tab-content').removeClass('active');
    $('.tab-button').removeClass('active');
    $('#' + tabName).addClass('active');
    $(evt.currentTarget).addClass('active');

    if (tabName === 'reviewTab') {
        loadReviews(1);
    } else if (tabName === 'qnaTab') {
        loadQnAs(1);
    }
}

/**
 * 옵션 변경 시 변형 업데이트
 */
function updateVariantOptions() {
    if (!window.productData || !window.productData.variants) {
        return;
    }

    // 선택된 옵션들을 수집
    const selectedOptions = {};
    let allOptionsSelected = true;

    $('.option-select').each(function() {
        const optionName = $(this).data('option-name');
        const optionValue = $(this).val();
        if (optionValue) {
            selectedOptions[optionName] = optionValue;
        } else {
            allOptionsSelected = false;
        }
    });

    console.log('Selected options:', selectedOptions);
    console.log('All options selected:', allOptionsSelected);

    // ★ 여기서 옵션 가용성 체크 - 옵션이 변경될 때마다 다른 옵션들의 가용성을 확인
    checkOptionAvailability();

    // 모든 옵션이 선택되지 않았으면 리턴
    if (!allOptionsSelected) {
        // 기본 선택된 variant가 있으면 유지
        if (!selectedVariant && window.productData.minPriceVariant) {
            selectedVariant = window.productData.minPriceVariant;
        } else if (!selectedVariant) {
            selectedVariant = null;
        }
        return;
    }

    // 선택된 옵션에 맞는 변형 찾기
    const foundVariant = window.productData.variants.find(variant => {
        if (!variant.optionCombination) {
            return false;
        }

        return Object.entries(selectedOptions).every(([optionName, optionValue]) => {
            const searchPattern = `${optionName}:${optionValue}`;
            return variant.optionCombination.includes(searchPattern);
        });
    });

    if (foundVariant) {
        console.log('Selected variant found:', foundVariant);
        selectedVariant = foundVariant;
        basePrice = selectedVariant.price;
        originalPrice = selectedVariant.price;

        // 할인 재계산
        recalculateDiscountForVariant();

        // 수량에 따른 총 금액 업데이트
        const quantity = parseInt($('#quantityInput').val()) || 1;
        if (quantity > 1) {
            updateQuantityPrice(quantity);
        }

        updateStockInfo();

        // 가격 변경 애니메이션
        $('.price-display, #buyNowPrice').addClass('price-update');
        setTimeout(() => {
            $('.price-display, #buyNowPrice').removeClass('price-update');
        }, 300);
    } else {
        console.log('No matching variant found for options:', selectedOptions);

        // ★ variant를 찾지 못한 경우에도 UI 업데이트
        selectedVariant = null;

        // 구매 버튼 비활성화
        $('.buy-now-button, .add-to-cart-button').prop('disabled', true);

        // 재고 없음 메시지 표시 (선택사항)
        showAlert('선택하신 옵션 조합은 현재 구매할 수 없습니다.', 'warning');
    }
}

// 옵션 선택 시 다른 옵션의 가용성 체크
function checkOptionAvailability() {
    if (!window.productData || !window.productData.variants) {
        return;
    }

    // 현재 선택된 옵션들
    const selectedOptions = {};
    $('.option-select').each(function() {
        const optionName = $(this).data('option-name');
        const optionValue = $(this).val();
        if (optionValue) {
            selectedOptions[optionName] = optionValue;
        }
    });

    // 각 옵션 select 박스에 대해
    $('.option-select').each(function() {
        const currentSelect = $(this);
        const currentOptionName = currentSelect.data('option-name');

        // 각 옵션 값에 대해
        currentSelect.find('option').each(function() {
            const option = $(this);
            const optionValue = option.val();

            if (!optionValue) return; // 빈 옵션은 건너뛰기

            // 현재 옵션 값을 포함한 테스트 조합 생성
            const testOptions = { ...selectedOptions };
            testOptions[currentOptionName] = optionValue;

            // 이 조합에 해당하는 variant가 있는지 확인
            const hasAvailableVariant = window.productData.variants.some(variant => {
                if (!variant.isActive || variant.stockQuantity <= 0) {
                    return false;
                }

                // 부분 매칭 확인 (모든 선택된 옵션이 variant에 포함되는지)
                return Object.entries(testOptions).every(([name, value]) => {
                    const searchPattern = `${name}:${value}`;
                    return variant.optionCombination.includes(searchPattern);
                });
            });

            // 옵션 활성화/비활성화
            if (hasAvailableVariant) {
                option.prop('disabled', false);
                option.text(option.text().replace(' (품절)', ''));
            } else {
                option.prop('disabled', true);
                if (!option.text().includes('(품절)')) {
                    option.text(option.text() + ' (품절)');
                }
            }
        });
    });
}

/**
 * 수량 증가
 */
function increaseQuantity() {
    const quantityInput = $('#quantityInput');
    const currentValue = parseInt(quantityInput.val()) || 1;
    const maxStock = getMaxStock();

    if (currentValue < maxStock) {
        const newQuantity = currentValue + 1;
        quantityInput.val(newQuantity);
        selectedQuantity = newQuantity;
        updateQuantityPrice(newQuantity);

        quantityInput.addClass('pulse');
        setTimeout(() => quantityInput.removeClass('pulse'), 300);
    } else {
        showAlert('재고가 부족합니다.', 'warning');
    }
}

/**
 * 수량 감소
 */
function decreaseQuantity() {
    const quantityInput = $('#quantityInput');
    const currentValue = parseInt(quantityInput.val()) || 1;

    if (currentValue > 1) {
        const newQuantity = currentValue - 1;
        quantityInput.val(newQuantity);
        selectedQuantity = newQuantity;
        updateQuantityPrice(newQuantity);

        quantityInput.addClass('pulse');
        setTimeout(() => quantityInput.removeClass('pulse'), 300);
    }
}

/**
 * 수량에 따른 가격 업데이트
 */
function updateQuantityPrice(quantity) {
    const totalPrice = basePrice * quantity;
    const originalTotalPrice = originalPrice * quantity;

    // 할인이 있는 경우
    if (window.productData.currentDiscount && window.productData.currentDiscount.type) {
        // 원가 업데이트
        const originalPriceElement = $('.original-price');
        if (originalPriceElement.length) {
            originalPriceElement.text(originalTotalPrice.toLocaleString() + '원');
        }
    }

    // 현재 표시된 가격 엘리먼트 찾기
    const currentPriceElement = $('#totalPrice');
    if (currentPriceElement.length) {
        currentPriceElement.text(totalPrice.toLocaleString() + '원');
    }

    // 구매 버튼 가격 업데이트
    $('#buyNowPrice').text(totalPrice.toLocaleString() + '원');

    // 최종 가격 섹션 업데이트
    const shippingFee = calculateShippingFee(totalPrice);
    const promotionDiscount = originalTotalPrice - totalPrice;
    updateFinalPriceSection(originalTotalPrice, promotionDiscount, 0, shippingFee, totalPrice);
}

/**
 * 총 금액 업데이트 (수량 변경 시 호출)
 */
function updateTotalPrice() {
    const quantity = parseInt($('#quantityInput').val()) || 1;
    selectedQuantity = quantity;

    if (quantity > 1) {
        updateQuantityPrice(quantity);
    } else if (selectedVariant) {
        // 수량이 1일 때는 할인 정보 다시 표시
        recalculateDiscountForVariant();
    }
}

/**
 * 재고 정보 업데이트
 */
function updateStockInfo() {
    if (selectedVariant) {
        const stockQuantity = selectedVariant.stockQuantity;

        if (stockQuantity <= 0) {
            $('.buy-now-button, .buy-team-button, .add-to-cart-button').prop('disabled', true);
            showAlert('선택하신 옵션은 품절되었습니다.', 'warning');
        } else {
            $('.buy-now-button, .buy-team-button, .add-to-cart-button').prop('disabled', false);

            if (stockQuantity <= 5) {
                showAlert(`재고가 ${stockQuantity}개 남았습니다.`, 'info');
            }
        }

        $('#quantityInput').attr('max', stockQuantity);
    }
}

/**
 * 최대 재고 수량 조회
 */
function getMaxStock() {
    if (selectedVariant) {
        return selectedVariant.stockQuantity;
    }

    if (window.productData && window.productData.variants) {
        return Math.max(...window.productData.variants.map(v => v.stockQuantity));
    }

    return 999;
}

/**
 * 가장 할인율이 높은 프로모션 선택
 */
function getBestPromotion(promotions) {
    let bestPromotion = null;
    let maxDiscount = 0;
    const price = selectedVariant ? selectedVariant.price : originalPrice;

    promotions.forEach(promotion => {
        const discount = calculatePromotionDiscount(price, promotion);
        if (discount > maxDiscount) {
            maxDiscount = discount;
            bestPromotion = promotion;
        }
    });

    return bestPromotion;
}

/**
 * 프로모션 할인 금액 계산
 */
function calculatePromotionDiscount(price, promotion) {
    if (promotion.discountType === 'PERCENTAGE') {
        let discount = Math.floor(price * promotion.discountValue / 100);

        if (promotion.maxDiscountAmount && discount > promotion.maxDiscountAmount) {
            discount = promotion.maxDiscountAmount;
        }

        return discount;
    } else if (promotion.discountType === 'FIXED_AMOUNT') {
        return Math.min(promotion.discountValue, price);
    }

    return 0;
}

/**
 * 즉시 구매
 */
function buyNow() {
    if (!validatePurchase()) {
        return;
    }

    if (!isLoggedIn()) {
        showLoginRequired();
        return;
    }

    const purchaseData = {
        productId: window.productData.id,
        variantId: selectedVariant ? selectedVariant.id : (window.productData.variants[0] ? window.productData.variants[0].id : null),
        quantity: selectedQuantity,
        originalPrice: originalPrice,
        finalPrice: basePrice * selectedQuantity
    };

    $('.buy-now-button').prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> 처리 중...');

    const form = createPurchaseForm(purchaseData, '/order/create');
    document.body.appendChild(form);
    form.submit();
}

/**
 * 공동구매 참여
 */
function joinGroupBuy(groupBuyId) {
    if (!isLoggedIn()) {
        showLoginRequired();
        return;
    }

    if (!validateGroupBuyPurchase()) {
        return;
    }

    const groupBuy = window.productData.groupBuys ?
        window.productData.groupBuys.find(gb => gb.id === groupBuyId) : null;

    if (!groupBuy) {
        showAlert('공동구매 정보를 찾을 수 없습니다.', 'error');
        return;
    }

    if (groupBuy.status !== 'ACTIVE') {
        showAlert('현재 참여할 수 없는 공동구매입니다.', 'warning');
        return;
    }

    const groupBuyData = {
        groupBuyId: groupBuyId,
        productId: window.productData.id,
        variantId: groupBuy.productVariantId,
        quantity: selectedQuantity
    };

    $(`.buy-team-button[onclick="joinGroupBuy(${groupBuyId});"]`)
        .prop('disabled', true)
        .html('<i class="fas fa-spinner fa-spin"></i> 처리 중...');

    const form = createGroupBuyForm(groupBuyData, '/order/groupbuy/join');
    document.body.appendChild(form);
    form.submit();
}

/**
 * 장바구니 추가
 */
function addToCart() {
    if (!isLoggedIn()) {
        showLoginRequired();
        return;
    }

    if (!validatePurchase()) {
        return;
    }

    const cartData = {
        productVariantId: selectedVariant ? selectedVariant.id : window.productData.variants[0].id,
        quantity: selectedQuantity
    };

    $.ajax({
        url: `${window.productData.contextPath}/api/productId/${window.productData.productId}/cart/add`,
        method: 'POST',
        data: cartData,
        success: function(response) {
            if (response.success) {
                showAlert('장바구니에 추가되었습니다!', 'success');
                updateCartCount();
            } else {
                showAlert(response.message || '장바구니 추가에 실패했습니다.', 'error');
            }
        },
        error: function(xhr) {
            console.error('장바구니 추가 오류:', xhr);
            showAlert('장바구니 추가 중 오류가 발생했습니다.', 'error');
        }
    });
}

/**
 * 찜 목록 토글
 */
function toggleWishlist(productId) {
    if (!isLoggedIn()) {
        showLoginRequired();
        return;
    }

    const wishButton = $('#wish-button');
    const isWished = wishButton.hasClass('active');

    $.ajax({
        url: `${window.productData.contextPath}/api/wishlist/toggle`,
        method: 'POST',
        data: { productId: productId },
        success: function(response) {
            if (response.success) {
                if (isWished) {
                    wishButton.removeClass('active');
                    showAlert('찜 목록에서 제거되었습니다.', 'info');
                } else {
                    wishButton.addClass('active');
                    showAlert('찜 목록에 추가되었습니다!', 'success');
                }
            } else {
                showAlert(response.message || '찜 목록 처리에 실패했습니다.', 'error');
            }
        },
        error: function(xhr) {
            console.error('찜 목록 오류:', xhr);
            showAlert('찜 목록 처리 중 오류가 발생했습니다.', 'error');
        }
    });
}

/**
 * 링크 복사
 */
function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
        showAlert('링크가 복사되었습니다!', 'success');
    }).catch(() => {
        const textArea = document.createElement('textarea');
        textArea.value = window.location.href;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showAlert('링크가 복사되었습니다!', 'success');
    });
}

/**
 * 구매 유효성 검증
 */
function validatePurchase() {
    if (window.productData.variants && window.productData.variants.length > 1) {
        const selectedOptionsCount = $('.option-select').filter(function() {
            return $(this).val() !== '';
        }).length;

        const totalOptionsCount = $('.option-select').length;

        if (selectedOptionsCount < totalOptionsCount) {
            showAlert('모든 옵션을 선택해주세요.', 'warning');
            $('.option-select').filter(function() {
                return $(this).val() === '';
            }).first().focus();
            return false;
        }

        if (!selectedVariant) {
            showAlert('유효한 옵션 조합을 선택해주세요.', 'warning');
            return false;
        }

        if (!selectedVariant.isActive) {
            showAlert('선택하신 옵션은 현재 판매중지 상태입니다.', 'warning');
            return false;
        }
    }

    if (selectedQuantity <= 0) {
        showAlert('수량을 확인해주세요.', 'warning');
        $('#quantityInput').focus();
        return false;
    }

    if (isNaN(selectedQuantity) || !Number.isInteger(selectedQuantity)) {
        showAlert('올바른 수량을 입력해주세요.', 'warning');
        $('#quantityInput').focus();
        return false;
    }

    const maxStock = getMaxStock();
    if (selectedQuantity > maxStock) {
        showAlert(`재고가 부족합니다. (최대 ${maxStock}개)`, 'warning');
        $('#quantityInput').val(maxStock);
        selectedQuantity = maxStock;
        updateQuantityPrice(maxStock);
        return false;
    }

    return true;
}

/**
 * 공동구매 참여 유효성 검증
 */
function validateGroupBuyPurchase() {
    if (selectedQuantity <= 0) {
        showAlert('수량을 확인해주세요.', 'warning');
        $('#quantityInput').focus();
        return false;
    }

    if (isNaN(selectedQuantity) || !Number.isInteger(selectedQuantity)) {
        showAlert('올바른 수량을 입력해주세요.', 'warning');
        $('#quantityInput').focus();
        return false;
    }

    return true;
}

/**
 * 로그인 상태 확인
 */
function isLoggedIn() {
    if (typeof window.currentUser !== 'undefined' && window.currentUser !== null) {
        return true;
    }

    let isAuthenticated = false;
    $.ajax({
        url: `${window.productData.contextPath}/api/auth/check`,
        method: 'GET',
        async: false,
        success: function(response) {
            isAuthenticated = response.authenticated || false;
        },
        error: function() {
            isAuthenticated = false;
        }
    });

    return isAuthenticated;
}

/**
 * 로그인 필요 알림
 */
function showLoginRequired() {
    const currentUrl = encodeURIComponent(window.location.href);
    const loginUrl = `${window.productData.contextPath}/login?returnUrl=${currentUrl}`;

    showAlert('로그인이 필요한 서비스입니다.', 'info', 5000);

    setTimeout(() => {
        if (confirm('로그인 페이지로 이동하시겠습니까?')) {
            window.location.href = loginUrl;
        }
    }, 2000);
}

/**
 * 구매 폼 생성
 */
function createPurchaseForm(purchaseData, actionUrl) {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = `${window.productData.contextPath}${actionUrl}`;

    if (csrfToken && csrfHeader) {
        const csrfInput = document.createElement('input');
        csrfInput.type = 'hidden';
        csrfInput.name = '_csrf';
        csrfInput.value = csrfToken;
        form.appendChild(csrfInput);
    }

    Object.entries(purchaseData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = value;
            form.appendChild(input);
        }
    });

    return form;
}

/**
 * 공동구매용 폼 생성
 */
function createGroupBuyForm(groupBuyData, actionUrl) {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = `${window.productData.contextPath}${actionUrl}`;

    if (csrfToken && csrfHeader) {
        const csrfInput = document.createElement('input');
        csrfInput.type = 'hidden';
        csrfInput.name = '_csrf';
        csrfInput.value = csrfToken;
        form.appendChild(csrfInput);
    }

    Object.entries(groupBuyData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = value;
            form.appendChild(input);
        }
    });

    return form;
}

/**
 * 찜 상태 확인
 */
function checkWishlistStatus() {
    if (!isLoggedIn()) {
        return;
    }

    $.ajax({
        url: `${window.productData.contextPath}/api/wishlist/check`,
        method: 'GET',
        data: { productId: window.productData.id },
        success: function(response) {
            if (response.success && response.isWished) {
                $('#wish-button').addClass('active');
            }
        },
        error: function(xhr) {
            console.error('찜 상태 확인 오류:', xhr);
        }
    });
}

/**
 * 장바구니 개수 업데이트
 */
function updateCartCount() {
    $.ajax({
        url: `${window.productData.contextPath}/cart/count`,
        method: 'GET',
        success: function(response) {
            if (response.success) {
                $('.cart-count').text(response.count);
            }
        },
        error: function(xhr) {
            console.error('장바구니 개수 업데이트 오류:', xhr);
        }
    });
}

/**
 * 남은 시간 업데이트 (공동구매)
 */
function updateRemainingTime() {
    $('.rest-time').each(function() {
        const endDate = $(this).data('end-date');
        if (endDate) {
            const remaining = calculateRemainingTime(endDate);
            $(this).text(remaining);
        }
    });
}

/**
 * 남은 시간 계산
 */
function calculateRemainingTime(endDate) {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end - now;

    if (diff <= 0) {
        return '마감';
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${days}일 ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
}

/**
 * 리뷰 로드
 */
function loadReviews(page = 1, rating = null) {
    if (isReviewLoading) return;

    const reviewList = $('#reviewList');

    if (page === 1) {
        reviewList.html('<div class="loading">리뷰를 불러오는 중...</div>');
    }

    isReviewLoading = true;
    currentReviewPage = page;
    if (rating !== null) reviewFilters.rating = rating;

    const params = {
        page: page,
        size: 10,
        ...(reviewFilters.rating && { rating: reviewFilters.rating })
    };

    $.ajax({
        url: `${window.productData.contextPath}/api/products/${window.productData.id}/reviews`,
        method: 'GET',
        data: params,
        success: function(response) {
            if (response.content && response.content.length > 0) {
                let reviewHtml = '';

                if (page === 1) {
                    reviewHtml += createReviewFilterHTML();
                }

                response.content.forEach(review => {
                    reviewHtml += createReviewHTML(review);
                });

                reviewHtml += createPaginationHTML(response, 'review');

                reviewList.html(reviewHtml);
            } else {
                reviewList.html(
                    (page === 1 ? createReviewFilterHTML() : '') +
                    '<div class="no-data">아직 작성된 리뷰가 없습니다.</div>'
                );
            }
        },
        error: function(xhr) {
            console.error('리뷰 로드 오류:', xhr);
            reviewList.html('<div class="error">리뷰를 불러오는 중 오류가 발생했습니다.</div>');
        },
        complete: function() {
            isReviewLoading = false;
        }
    });
}

/**
 * Q&A 로드
 */
function loadQnAs(page = 1, keyword = null, status = null) {
    if (isQnALoading) return;

    const qnaList = $('#qnaList');

    if (page === 1) {
        qnaList.html('<div class="loading">문의를 불러오는 중...</div>');
    }

    isQnALoading = true;
    currentQnAPage = page;
    if (keyword !== null) qnaFilters.keyword = keyword;
    if (status !== null) qnaFilters.status = status;

    const params = {
        page: page,
        size: 10,
        ...(qnaFilters.keyword && { keyword: qnaFilters.keyword }),
        ...(qnaFilters.status && { status: qnaFilters.status })
    };

    $.ajax({
        url: `${window.productData.contextPath}/api/products/${window.productData.id}/qnas`,
        method: 'GET',
        data: params,
        success: function(response) {
            if (response.content && response.content.length > 0) {
                let qnaHtml = '';

                if (page === 1) {
                    qnaHtml += createQnAFilterHTML();
                }

                response.content.forEach(qna => {
                    qnaHtml += createQnAHTML(qna);
                });

                qnaHtml += createPaginationHTML(response, 'qna');

                qnaList.html(qnaHtml);
            } else {
                qnaList.html(
                    (page === 1 ? createQnAFilterHTML() : '') +
                    '<div class="no-data">아직 작성된 문의가 없습니다.</div>'
                );
            }
        },
        error: function(xhr) {
            console.error('QnA 로드 오류:', xhr);
            qnaList.html('<div class="error">문의를 불러오는 중 오류가 발생했습니다.</div>');
        },
        complete: function() {
            isQnALoading = false;
        }
    });
}

/**
 * 문의등록 모달 표시
 */
function registQna(){
    try{
        console.log('registQna 함수 호출됨');

        if (!isLoggedIn()) {
            showLoginRequired();
            return;
        }

        showQnaRegistModal();

    }catch (error) {
        console.error('상품문의 등록 모달 열기 실패:', error);
        alert('상품문의 등록 모달을 불러오는 중 오류가 발생했습니다.');
    }
}

/**
 * 상품문의 등록 모달 생성 및 보여주기
 */
function showQnaRegistModal(){
    console.log('showQnaRegistModal 함수 호출됨');

    const existingModal = document.getElementById('qna-regist-modal');
    if (existingModal) {
        existingModal.remove();
        console.log('기존 모달 제거됨');
    }

    const productName = window.productData ? window.productData.name : '상품명';
    const currentDate = new Date().toLocaleDateString('ko-KR');

    const modalHtml = `
        <div id="qna-regist-modal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>상품 문의 등록</h3>
                <span class="close" onclick="closeQnARegistModal()">&times;</span>
            </div>
            <div class="modal-body">
                <form id="qna-regist-form">                
                    <div class="qna-product-info">
                        <div class="qna-product-name" id="qna-product-name">${productName}</div>
                        <div class="qna-product-details" id="qna-product-details">문의 작성일: ${currentDate}</div>
                    </div>

                    <div class="form-group">
                        <label for="qna-title">문의 제목 *</label>
                        <input type="text" id="qna-title" class="form-control" placeholder="문의 제목을 입력하세요"
                            maxlength="100" required>
                        <div class="error-message" id="title-validation" style="display: none;">
                            제목은 1자 이상 100자 이하로 입력해주세요.
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="qna-content">문의 내용 *</label>
                        <textarea id="qna-content" class="form-control" placeholder="문의하고 싶은 내용을 자세히 작성해주세요."
                            maxlength="1000" rows="6" required></textarea>
                        <div class="qna-char-count" id="qna-char-count">0 / 1000자</div>
                        <div class="error-message" id="content-validation" style="display: none;">
                            문의 내용은 10자 이상 1000자 이하로 입력해주세요.
                        </div>
                    </div>

                    <div class="checkbox-group">
                        <input type="checkbox" id="qna-is-secret" name="is_secret">
                        <label for="qna-is-secret">비밀글로 작성 (판매자만 확인 가능)</label>
                    </div>
                </form>
            </div>
            <div class="form-actions">
                <button type="button" class="button-style" onclick="closeQnARegistModal()">취소</button>
                <button type="button" class="button-style primary disabled" onclick="submitQna()" id="qna-save-btn" disabled>
                    등록
                </button>
            </div>
        </div>
    </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.getElementById('qna-regist-modal').style.display = 'block';
    console.log('모달이 DOM에 추가되고 표시됨');

    setupQnARegistEventListeners();
}

/**
 * QnA 등록 이벤트 리스너 설정
 */
function setupQnARegistEventListeners() {
    console.log('이벤트 리스너 설정 시작');

    const titleInput = document.getElementById('qna-title');
    const contentTextarea = document.getElementById('qna-content');

    if (titleInput) {
        console.log('제목 입력 필드 이벤트 리스너 설정');
        titleInput.addEventListener('input', function() {
            validateQnARegistForm();
        });
    }

    if (contentTextarea) {
        console.log('내용 입력 필드 이벤트 리스너 설정');
        contentTextarea.addEventListener('input', function() {
            updateQnARegistCharCount();
            validateQnARegistForm();
        });
    }

    const secretCheckbox = document.getElementById('qna-is-secret');
    if (secretCheckbox) {
        console.log('비밀글 체크박스 이벤트 리스너 설정');
        secretCheckbox.addEventListener('change', function() {
            validateQnARegistForm();
        });
    }
}

/**
 * QnA 등록 글자 수 업데이트
 */
function updateQnARegistCharCount() {
    const content = document.getElementById('qna-content');
    const charCountElement = document.getElementById('qna-char-count');

    if (content && charCountElement) {
        const charCount = content.value.length;
        charCountElement.textContent = `${charCount} / 1000자`;

        if (charCount >= 900) {
            charCountElement.style.color = '#dc3545';
        } else if (charCount >= 800) {
            charCountElement.style.color = '#ffc107';
        } else {
            charCountElement.style.color = '#666';
        }
    }
}

/**
 * 상품문의 등록 저장
 */
function submitQna() {
    console.log('submitQna 함수 호출됨');

    if (!validateQnARegistForm()) {
        console.log('폼 유효성 검사 실패');
        return;
    }

    const titleElement = document.getElementById('qna-title');
    const contentElement = document.getElementById('qna-content');
    const secretElement = document.getElementById('qna-is-secret');

    if (!titleElement || !contentElement || !secretElement) {
        console.error('필요한 폼 요소를 찾을 수 없습니다');
        alert('폼 요소를 찾을 수 없습니다.');
        return;
    }

    const title = titleElement.value.trim();
    const content = contentElement.value.trim();
    const isSecret = secretElement.checked;
    const productId = window.productData ? window.productData.id : null;

    console.log('수집된 데이터:', { productId, title, content, isSecret });

    if (!productId) {
        console.error('상품 ID가 없습니다');
        if (typeof showAlert === 'function') {
            showAlert("상품 정보를 찾을 수 없습니다", 'warning');
        } else {
            alert("상품 정보를 찾을 수 없습니다");
        }
        return;
    }

    if (!isLoggedIn()) {
        console.log('로그인되지 않은 사용자');
        showLoginRequired();
        return;
    }

    const qnaData = {
        title: title,
        question: content,
        isSecret: isSecret
    };

    console.log('서버로 전송할 데이터:', qnaData);

    const csrfToken = document.querySelector('meta[name="_csrf"]');
    const csrfHeader = document.querySelector('meta[name="_csrf_header"]');

    if (!csrfToken) {
        console.error('CSRF 토큰을 찾을 수 없습니다');
        alert('보안 토큰을 찾을 수 없습니다. 페이지를 새로고침해주세요.');
        return;
    }

    const saveBtn = document.getElementById('qna-save-btn');
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = '등록 중...';
    }

    const headers = {
        'Content-Type': 'application/json'
    };

    if (csrfHeader) {
        headers[csrfHeader.getAttribute('content')] = csrfToken.getAttribute('content');
    } else {
        headers['X-CSRF-TOKEN'] = csrfToken.getAttribute('content');
    }

    const contextPath = window.productData ? window.productData.contextPath : '';

    fetch(`${contextPath}/api/productId/${productId}/qnas`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(qnaData)
    })
        .then(response => {
            console.log('서버 응답 상태:', response.status);
            if (!response.ok) {
                return response.text().then(text => {
                    throw new Error(`등록 실패: ${response.status} ${response.statusText} - ${text}`);
                });
            }
            return response.text();
        })
        .then(data => {
            console.log('등록 성공:', data);
            if (typeof showAlert === 'function') {
                showAlert('문의가 등록되었습니다!', 'success');
            } else {
                alert('문의가 등록되었습니다!');
            }
            closeQnARegistModal();

            if ($('#qnaTab').hasClass('active')) {
                loadQnAs(1);
            }
        })
        .catch(error => {
            console.error('등록 오류:', error);
            if (typeof showAlert === 'function') {
                showAlert(`오류가 발생했습니다: ${error.message}`, 'error');
            } else {
                alert(`오류가 발생했습니다: ${error.message}`);
            }
        })
        .finally(() => {
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.textContent = '등록';
            }
        });
}

/**
 * 상품문의 등록 폼 유효성 검사
 */
function validateQnARegistForm() {
    const titleElement = document.getElementById('qna-title');
    const contentElement = document.getElementById('qna-content');
    const saveBtn = document.getElementById('qna-save-btn');

    if (!titleElement || !contentElement) {
        console.error('필수 폼 요소를 찾을 수 없습니다');
        return false;
    }

    const title = titleElement.value.trim();
    const content = contentElement.value.trim();

    let isValid = true;

    const titleValidation = document.getElementById('title-validation');
    if (title.length === 0 || title.length > 100) {
        if (titleValidation) titleValidation.style.display = 'block';
        isValid = false;
    } else {
        if (titleValidation) titleValidation.style.display = 'none';
    }

    const contentValidation = document.getElementById('content-validation');
    if (content.length < 10 || content.length > 1000) {
        if (contentValidation) contentValidation.style.display = 'block';
        isValid = false;
    } else {
        if (contentValidation) contentValidation.style.display = 'none';
    }

    if (saveBtn) {
        saveBtn.disabled = !isValid;
        if (isValid) {
            saveBtn.classList.remove('disabled');
        } else {
            saveBtn.classList.add('disabled');
        }
    }

    console.log('유효성 검사 결과:', { title: title.length, content: content.length, isValid });
    return isValid;
}

/**
 * 상품문의 등록 모달 닫기
 */
function closeQnARegistModal(){
    console.log('closeQnARegistModal 함수 호출됨');
    const qnaRegistModal = document.getElementById('qna-regist-modal');
    if (qnaRegistModal) {
        qnaRegistModal.remove();
        console.log('모달이 제거됨');
    }
}

/**
 * 알림 메시지 표시
 */
function showAlert(message, type = 'info', duration = 3000) {
    $('.custom-alert').remove();

    const alertClass = {
        'success': 'alert-success',
        'error': 'alert-error',
        'warning': 'alert-warning',
        'info': 'alert-info'
    };

    const alertHtml = `
        <div class="custom-alert ${alertClass[type] || 'alert-info'}">
            <div class="alert-content">
                <i class="alert-icon fas ${getAlertIcon(type)}"></i>
                <span class="alert-message">${message}</span>
                <button class="alert-close" onclick="$(this).closest('.custom-alert').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `;

    $('body').append(alertHtml);

    const alertElement = $('.custom-alert').last();
    alertElement.addClass('show');

    if (duration > 0) {
        setTimeout(() => {
            alertElement.removeClass('show');
            setTimeout(() => alertElement.remove(), 300);
        }, duration);
    }
}

/**
 * 알림 타입별 아이콘 반환
 */
function getAlertIcon(type) {
    const icons = {
        'success': 'fa-check-circle',
        'error': 'fa-exclamation-circle',
        'warning': 'fa-exclamation-triangle',
        'info': 'fa-info-circle'
    };
    return icons[type] || 'fa-info-circle';
}

/**
 * 리뷰 필터 HTML 생성
 */
function createReviewFilterHTML() {
    return `
        <div class="review-filters">
            <div class="filter-group">
                <label>평점 필터:</label>
                <select id="reviewRatingFilter" onchange="applyReviewFilter()">
                    <option value="">전체</option>
                    <option value="5">⭐⭐⭐⭐⭐ (5점)</option>
                    <option value="4">⭐⭐⭐⭐☆ (4점)</option>
                    <option value="3">⭐⭐⭐☆☆ (3점)</option>
                    <option value="2">⭐⭐☆☆☆ (2점)</option>
                    <option value="1">⭐☆☆☆☆ (1점)</option>
                </select>
            </div>
        </div>
    `;
}

/**
 * Q&A 필터 HTML 생성
 */
function createQnAFilterHTML() {
    return `
        <div class="qna-filters">
            <div class="filter-group">
                <label>검색:</label>
                <input type="text" id="qnaKeywordFilter" placeholder="제목으로 검색..." onkeypress="handleQnASearch(event)">
                <button onclick="applyQnAFilter()">검색</button>
            </div>
            <div class="filter-group">
                <label>답변 상태:</label>
                <select id="qnaStatusFilter" onchange="applyQnAFilter()">
                    <option value="">전체</option>
                    <option value="answered">답변완료</option>
                    <option value="pending">답변대기</option>
                </select>
            </div>
            
            <div class="regist-qna">
	            <button class="regist-qna-button" onclick="registQna()">문의등록</button>
	        </div>
        </div>
    `;
}

/**
 * 리뷰 HTML 생성
 */
function createReviewHTML(review) {
    const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
    const reviewDate = new Date(review.createdAt).toLocaleDateString('ko-KR');

    return `
        <div class="review-item">
            <div class="review-header">
                <div class="review-info">
                    <strong>${review.customerName}</strong> | ${reviewDate}
                    ${review.isPhotoReview ? '<span class="photo-review-badge">포토</span>' : ''}
                </div>
                <div class="review-rating">${stars}</div>
            </div>
            <div class="review-content">
                <p>${review.comment}</p>
                ${review.imageUrls && review.imageUrls.length > 0 ? createReviewImagesHTML(review.imageUrls) : ''}
            </div>
            ${review.reply ? `
                <div class="review-reply">
                    <strong>판매자 답변:</strong>
                    <p>${review.reply}</p>
                    <small>답변일: ${new Date(review.repliedAt).toLocaleDateString('ko-KR')}</small>
                </div>
            ` : ''}
            <div class="review-actions">
                <button class="helpful-btn" onclick="toggleReviewHelpful(${review.id})">
                    도움됨 ${review.helpfulCount}
                </button>
            </div>
        </div>
    `;
}

/**
 * 리뷰 이미지 HTML 생성
 */
function createReviewImagesHTML(images) {
    let html = '<div class="review-images">';
    images.forEach(image => {
        html += `<img src="${contextPath}${image}" alt="리뷰 이미지" onclick="showImageModal('${image}')">`;
    });
    html += '</div>';
    return html;
}

/**
 * Q&A HTML 생성
 */
function createQnAHTML(qna) {
    const questionDate = new Date(qna.questionedAt).toLocaleDateString('ko-KR');

    return `
        <div class="qna-item">
            <div class="qna-question">
                <div class="qna-header">
                    <span class="qna-type">Q</span>
                    <div class="qna-info">
                        <strong>${qna.title}</strong>
                        <small>작성자: ${qna.isSecret ? '비밀글' : qna.customerName} | ${questionDate}</small>
                    </div>
                </div>
                <div class="qna-content">
                    ${qna.isSecret && !qna.canView ? '<p class="secret-message">비밀글입니다.</p>' : `<p>${qna.question}</p>`}
                </div>
            </div>
            ${qna.answer ? `
                <div class="qna-answer">
                    <div class="qna-header">
                        <span class="qna-type answer">A</span>
                        <div class="qna-info">
                            <strong>판매자 답변</strong>
                            <small>${new Date(qna.answeredAt).toLocaleDateString('ko-KR')}</small>
                        </div>
                    </div>
                    <div class="qna-content">
                        ${qna.isSecret && !qna.canView ? '<p class="secret-message">비밀글입니다.</p>' : `<p>${qna.answer}</p>`}
                    </div>
                </div>
            ` : ''}
        </div>
    `;
}

/**
 * 페이지네이션 HTML 생성
 */
function createPaginationHTML(pageResult, type) {
    if (pageResult.totalPages <= 1) return '';

    let paginationHtml = '<div class="pagination-container"><ul class="pagination">';

    if (!pageResult.first) {
        paginationHtml += `<li><a href="#" onclick="changePage${type.charAt(0).toUpperCase() + type.slice(1)}(${pageResult.page - 1})">&laquo;</a></li>`;
    }

    const startPage = Math.max(1, pageResult.page - 2);
    const endPage = Math.min(pageResult.totalPages, startPage + 4);

    for (let i = startPage; i <= endPage; i++) {
        const activeClass = i === pageResult.page ? 'active' : '';
        paginationHtml += `<li class="${activeClass}"><a href="#" onclick="changePage${type.charAt(0).toUpperCase() + type.slice(1)}(${i})">${i}</a></li>`;
    }

    if (!pageResult.last) {
        paginationHtml += `<li><a href="#" onclick="changePage${type.charAt(0).toUpperCase() + type.slice(1)}(${pageResult.page + 1})">&raquo;</a></li>`;
    }

    paginationHtml += '</ul></div>';
    return paginationHtml;
}

/**
 * 리뷰 페이지 변경
 */
function changePageReview(page) {
    loadReviews(page);
}

/**
 * Q&A 페이지 변경
 */
function changePageQna(page) {
    loadQnAs(page);
}

/**
 * 리뷰 필터 적용
 */
function applyReviewFilter() {
    const rating = $('#reviewRatingFilter').val();
    reviewFilters.rating = rating || null;
    loadReviews(1, reviewFilters.rating);
}

/**
 * Q&A 필터 적용
 */
function applyQnAFilter() {
    const keyword = $('#qnaKeywordFilter').val().trim();
    const status = $('#qnaStatusFilter').val();
    qnaFilters.keyword = keyword || null;
    qnaFilters.status = status || null;
    loadQnAs(1, qnaFilters.keyword, qnaFilters.status);
}

/**
 * Q&A 검색 엔터키 처리
 */
function handleQnASearch(event) {
    if (event.key === 'Enter') {
        applyQnAFilter();
    }
}

/**
 * 리뷰 도움됨 토글
 */
function toggleReviewHelpful(reviewId) {
    if (!isLoggedIn()) {
        showLoginRequired();
        return;
    }

    $.ajax({
        url: `${window.productData.contextPath}/reviews/${reviewId}/helpful`,
        method: 'POST',
        success: function(response) {
            if (response.success) {
                const helpfulBtn = $(`.helpful-btn[onclick="toggleReviewHelpful(${reviewId})"]`);
                helpfulBtn.text(`도움됨 ${response.helpfulCount}`);

                if (response.isHelpful) {
                    helpfulBtn.addClass('active');
                } else {
                    helpfulBtn.removeClass('active');
                }
            }
        },
        error: function(xhr) {
            console.error('리뷰 도움됨 토글 오류:', xhr);
            showAlert('처리 중 오류가 발생했습니다.', 'error');
        }
    });
}

/**
 * 이미지 모달 표시
 */
function showImageModal(imageUrl) {
    $('#modalImage').attr('src', imageUrl);
    $('#imageModal').addClass('show');
}

// ESC 키로 모달 닫기
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const qnaModal = document.getElementById('qna-regist-modal');
        if (qnaModal && qnaModal.style.display === 'block') {
            closeQnARegistModal();
        }

        const imageModal = document.getElementById('imageModal');
        if (imageModal && imageModal.classList.contains('show')) {
            closeModal();
        }
    }
});

// 페이지 로드 완료 후 확인
document.addEventListener('DOMContentLoaded', function() {
    console.log('페이지 로드 완료, JavaScript 함수들이 준비됨');
});