document.addEventListener('DOMContentLoaded', () => {
    const sliderWrapper = document.querySelector('.slider-wrapper');
    const slides = document.querySelectorAll('.slide');
    const prevButton = document.querySelector('.slider-control.prev');
    const nextButton = document.querySelector('.slider-control.next');
    const sliderDotsContainer = document.querySelector('.slider-dots');
	
    let currentSlideIndex = 0;
    let slideInterval;

    // 슬라이드 개수에 맞춰 slider-dots 생성
    const createDots = () => {
        sliderDotsContainer.innerHTML = ''; // 기존 도트 초기화
        slides.forEach((_, index) => {
            const dot = document.createElement('span');
            dot.classList.add('dot');
            dot.dataset.index = index;
            if (index === 0) {
                dot.classList.add('active');
            }
            dot.addEventListener('click', () => {
                goToSlide(index);
                resetAutoSlide();
            });
            sliderDotsContainer.appendChild(dot);
        });
    };

    // 슬라이드 활성화 및 페이드 효과 적용 함수
    const showSlide = (index) => {
        // 모든 슬라이드와 도트에서 'active' 클래스 제거
        slides.forEach(slide => slide.classList.remove('active'));
        document.querySelectorAll('.slider-dots .dot').forEach(dot => dot.classList.remove('active'));

        // 현재 슬라이드와 도트에 'active' 클래스 추가
        slides[index].classList.add('active');
        document.querySelector(`.slider-dots .dot[data-index="${index}"]`).classList.add('active');
        
        currentSlideIndex = index;
    };

    // 다음 슬라이드로 이동
    const nextSlide = () => {
        const newIndex = (currentSlideIndex + 1) % slides.length;
        showSlide(newIndex);
    };

    // 이전 슬라이드로 이동
    const prevSlide = () => {
        const newIndex = (currentSlideIndex - 1 + slides.length) % slides.length;
        showSlide(newIndex);
    };

    // 특정 슬라이드로 이동
    const goToSlide = (index) => {
        showSlide(index);
    };

    // 자동 슬라이드 시작
    const startAutoSlide = () => {
        slideInterval = setInterval(nextSlide, 3000); // 3초마다 전환
    };

    // 자동 슬라이드 재설정 (수동 제어 후 다시 시작)
    const resetAutoSlide = () => {
        clearInterval(slideInterval);
        startAutoSlide();
    };

    // 초기화
    createDots(); // 도트 생성
    showSlide(currentSlideIndex); // 초기 슬라이드 표시
    startAutoSlide(); // 자동 슬라이드 시작

    // 이벤트 리스너 추가
    nextButton.addEventListener('click', () => {
        nextSlide();
        resetAutoSlide(); // 수동으로 넘기면 타이머 재설정
    });

    prevButton.addEventListener('click', () => {
        prevSlide();
        resetAutoSlide(); // 수동으로 넘기면 타이머 재설정
    });
});

$(document).ready(function() {
	var csrfToken = $("meta[name='_csrf']").attr("content");
	var csrfHeader = $("meta[name='_csrf_header']").attr("content");  
    
    let currentPage = 1;
    let isLoading = false;
    
    // 현재 필터 상태
    let currentFilters = {
        categoryFilter: 'all',
        priceFilter: 'all',
        discountFilter: false,
        groupPurchaseFilter: false,
        sortOption: 'popularity'
    };
    
    // 필터 변경 이벤트 리스너
    $('#category-filter').on('change', function() {
        currentFilters.categoryFilter = $(this).val();
        resetAndLoadProducts();
    });
    
    $('#price-filter').on('change', function() {
        currentFilters.priceFilter = $(this).val();
        resetAndLoadProducts();
    });
    
    $('#discount-filter').on('change', function() {
        currentFilters.discountFilter = $(this).is(':checked');
        resetAndLoadProducts();
    });
    
    $('#group-purchase-filter').on('change', function() {
        currentFilters.groupPurchaseFilter = $(this).is(':checked');
        resetAndLoadProducts();
    });
    
    $('#sort-option').on('change', function() {
        currentFilters.sortOption = $(this).val();
        resetAndLoadProducts();
    });
    
    // 더보기 버튼 클릭 이벤트
    $('#load-more-btn').on('click', function() {
        if (!isLoading) {
            loadMoreProducts();
        }
    });
    
    // 필터 초기화 및 상품 로드
    function resetAndLoadProducts() {
        currentPage = 1;
        $('#product-grid').empty();
        loadProducts(false);
    }
    
    // 더보기 상품 로드
    function loadMoreProducts() {
        currentPage++;
        loadProducts(true);
    }
    
    // 상품 로드 함수
    function loadProducts(isAppend) {
        if (isLoading) return;
        
        isLoading = true;
        
        // 로딩 상태 표시
        if (isAppend) {
            $('#load-more-btn').text('로딩 중...').prop('disabled', true);
        } else {
            $('#product-grid').html('<div class="loading">상품을 불러오는 중...</div>');
        }
        
        // AJAX 요청
        $.ajax({
            url: contextPath + '/products/filter',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                categoryFilter: currentFilters.categoryFilter,
                priceFilter: currentFilters.priceFilter,
                discountFilter: currentFilters.discountFilter,
                groupPurchaseFilter: currentFilters.groupPurchaseFilter,
                sortOption: currentFilters.sortOption,
                page: currentPage,
                size: 12
            }),
            beforeSend: function(xhr) {
	        	// CSRF 토큰을 요청 헤더에 추가
	        	xhr.setRequestHeader(csrfHeader, csrfToken);
		    },
            success: function(response) {
                if (response.success) {
                    if (isAppend) {
                        if (response.products && response.products.length > 0) {
                            appendProducts(response.products);
                        } else {
                            showMessage('더 이상 불러올 상품이 없습니다.', 'info');
                            $('#load-more-btn').hide();
                        }
                    } else {
                        if (response.products && response.products.length > 0) {
                            renderProducts(response.products);
                        } else {
                            $('#product-grid').html('<div class="no-products">조건에 맞는 상품이 없습니다.</div>');
                        }
                    }
                    
                    // 더보기 버튼 표시/숨김 처리
                    if (response.hasMore) {
                        $('#load-more-btn').show();
                    } else {
                        $('#load-more-btn').hide();
                    }
                } else {
                    showMessage(response.message || '상품을 불러오는데 실패했습니다.', 'error');
                }
            },
            error: function(xhr, status, error) {
                console.error('AJAX Error:', error);
                showMessage('서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.', 'error');
                
                // 에러 시 현재 페이지 되돌리기
                if (isAppend) {
                    currentPage--;
                }
            },
            complete: function() {
                isLoading = false;
                $('#load-more-btn').text('더 보기').prop('disabled', false);
            }
        });
    }
    
    // 상품 목록 렌더링
    function renderProducts(products) {
        $('#product-grid').empty();
        appendProducts(products);
    }
    
    // 상품 추가 렌더링
    function appendProducts(products) {
        let productHtml = '';
        
        products.forEach(function(product) {
            productHtml += createProductCard(product);
        });
        
        $('#product-grid').append(productHtml);
    }
     
    // 상품 카드 HTML 생성 (할인 및 공동구매 뱃지 포함)
    function createProductCard(product) {
        let discountRate = product.discount_rate || 0;
        let isGroupPurchase = product.is_group_purchase == 1;
        let basePrice = product.base_price || 0;
        let discountPrice = product.discount_price;
        
        // 할인 가격 계산
        if (discountRate > 0 && !discountPrice) {
            discountPrice = Math.floor(basePrice * (1 - discountRate / 100));
        }
        
        // 공동구매 가격 계산
        let actualGroupPrice = product.group_price;
        
        let html = `
            <div class="product-card" data-product-id="${product.id}">
                <div class="product-image">
                    <img src="${product.image_url || contextPath + '/resources/images/no-image.jpg'}" 
                         alt="${product.alt_text || product.name}" 
                         onerror="this.src='${contextPath}/resources/images/no-image.jpg'">
        `;
        
        // 할인 배지
        if (discountRate > 0) {
            html += `<div class="product-badge discount">${discountRate}%</div>`;
        }
        
        // 공동구매 배지
        if (isGroupPurchase) {
            html += `<div class="product-badge group">공동구매</div>`;
        }
        
        html += `
                </div>
                <div class="product-info">
                    <h3 class="product-name">${escapeHtml(product.name)}</h3>
                    <div class="product-price">
        `;
        
        // 가격 표시
        if (discountRate > 0) {
            html += `
                        <div class="original-price">${numberWithCommas(basePrice)}원</div>
                        <div class="discount-price">${numberWithCommas(discountPrice)}원</div>
            `;
        } else {
            html += `
                        <div class="current-price">${numberWithCommas(basePrice)}원</div>
            `;
        }
        
        html += `</div>`;
        
        // 공동구매 정보
        if (isGroupPurchase) {
            html += `
                    <div class="group-purchase-info">
                        <div class="group-price">공동구매시: ${numberWithCommas(actualGroupPrice)}원</div>
                    </div>
            `;
        }
        
        html += `
                </div>
            </div>
        `;
        
        return html;
    }
    
    // 숫자 콤마 표시
    function numberWithCommas(x) {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    
    // HTML 이스케이프 함수
    function escapeHtml(text) {
        if (!text) return '';
        let map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, function(m) { return map[m]; });
    }
    
    // 메시지 표시 함수
    function showMessage(message, type) {
        // 기존 메시지 제거
        $('.message-popup').remove();
        
        let messageClass = type === 'error' ? 'message-error' : 
                          type === 'success' ? 'message-success' : 'message-info';
        
        let messageHtml = `
            <div class="message-popup ${messageClass}">
                <span class="message-text">${message}</span>
                <button class="message-close">&times;</button>
            </div>
        `;
        
        $('body').append(messageHtml);
        
        // 메시지 표시 애니메이션
        $('.message-popup').fadeIn();
        
        // 3초 후 자동 제거
        setTimeout(function() {
            $('.message-popup').fadeOut(function() {
                $(this).remove();
            });
        }, 3000);
        
        // 닫기 버튼 클릭 이벤트
        $('.message-close').on('click', function() {
            $(this).parent().fadeOut(function() {
                $(this).remove();
            });
        });
    }
    
    // 페이지 로드 시 더보기 버튼 상태 확인
    checkLoadMoreButton();
    
    // 더보기 버튼 상태 확인
    function checkLoadMoreButton() {
        let currentProductCount = $('.product-card').length;
        if (currentProductCount >= 12) {
            $('#load-more-btn').show();
        } else {
            $('#load-more-btn').hide();
        }
    }
    
    // 상품 카드 클릭 이벤트 (상품 상세 페이지로 이동)
    $(document).on('click', '.product-card', function() {
        let productId = $(this).data('product-id');
        if (productId) {
            location.href = contextPath + '/pro_detail_view.do?id=' + productId;
        }
    });
});
