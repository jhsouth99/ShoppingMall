/**
 * 검색 페이지 전용 기능
 * 검색 결과 필터링, 정렬, 페이지네이션 등
 */

$(document).ready(function() {
    let currentPage = 1;
    let isLoading = false;

    // 검색 페이지 초기화
    initializeSearchPage();

    async function initializeSearchPage() {
        await populateCategoryFilter();

        // 검색 페이지 전용 기능
        initializeFilters();
        initializeLoadMore();
        initializeProductCards();

        // URL 파라미터 기반 필터 설정
        setFiltersFromUrl();
    }

    /**
     * 서버에서 카테고리 목록을 받아와 필터 드롭다운을 채우는 함수
     */
    async function populateCategoryFilter() {
        try {
            const response = await $.get(contextPath + '/api/categories');
            const categoryFilterSelect = $('#category-filter');

            // 재귀적으로 옵션을 추가하는 헬퍼 함수
            function addOptions(categories, depth) {
                categories.forEach(cat => {
                    const prefix = '&nbsp;'.repeat(depth * 4) + (depth > 0 ? 'ㄴ ' : '');
                    const option = $('<option></option>')
                        .val(cat.id)
                        .html(prefix + cat.name);
                    categoryFilterSelect.append(option);

                    if (cat.children && cat.children.length > 0) {
                        addOptions(cat.children, depth + 1);
                    }
                });
            }

            if(response && response.length > 0) {
                addOptions(response, 0);
            }

        } catch (error) {
            console.error('카테고리 필터 로딩 실패:', error);
        }
    }

    // 필터 초기화
    function initializeFilters() {
        // 기존 이벤트 리스너 제거
        $('#category-filter, #price-filter, #sort-option').off('change.filter');
        $('#discount-filter, #group-purchase-filter').off('change.filter');

        // 필터 변경 이벤트
        $('#category-filter, #price-filter, #sort-option').on('change.filter', function() {
            applyFilters();
        });

        // 특수 필터 체크박스 변경 이벤트
        $('#discount-filter, #group-purchase-filter').on('change.filter', function() {
            applyFilters();
        });
    }

    // 더보기 버튼 초기화
    function initializeLoadMore() {
        $('#load-more-btn').off('click.loadmore');
        $('#load-more-btn').on('click.loadmore', function() {
            loadMoreProducts();
        });
    }

    // 상품 카드 초기화
    function initializeProductCards() {
        $(document).off('click.productcard', '.product-card');
        $(document).on('click.productcard', '.product-card', function() {
            const productId = $(this).data('product-id');
            if (productId) {
                window.location.href = contextPath + '/products/' + productId;
            }
        });
    }

    // 필터 적용 함수
    function applyFilters() {
        const urlParams = new URLSearchParams(window.location.search);
        const keyword = urlParams.get('keyword');

        if (!keyword) {
            window.SearchCommon.showMessage('검색어가 없습니다.', 'error');
            return;
        }

        const categoryId = $('#category-filter').val();
        const priceRange = $('#price-filter').val();
        const discountOnly = $('#discount-filter').is(':checked');
        const groupPurchaseOnly = $('#group-purchase-filter').is(':checked');
        const sortBy = $('#sort-option').val();

        // URL 파라미터 생성
        const params = new URLSearchParams({
            keyword: keyword
        });

        if (categoryId && categoryId !== 'all') {
            params.set('categoryId', categoryId);
        }
        if (priceRange && priceRange !== 'all') {
            params.set('priceRange', priceRange);
        }
        if (discountOnly) {
            params.set('discountOnly', 'true');
        }
        if (groupPurchaseOnly) {
            params.set('groupPurchaseOnly', 'true');
        }
        if (sortBy && sortBy !== 'popularity') {
            params.set('sortBy', sortBy);
        }

        // 페이지 이동
        window.location.href = contextPath + '/search?' + params.toString();
    }

    // 더 많은 상품 로드
    function loadMoreProducts() {
        if (isLoading) return;

        isLoading = true;
        $('#load-more-btn').text('로딩 중...').prop('disabled', true);

        const urlParams = new URLSearchParams(window.location.search);
        currentPage++; // 다음 페이지 요청

        // 기존 필터 값들을 URL 파라미터에서 그대로 가져와 API 요청에 사용
        urlParams.set('page', currentPage);

        // API 전용 엔드포인트 호출
        $.ajax({
            url: contextPath + '/api/search', // HTML 조각이 아닌 JSON을 반환하는 API
            method: 'GET',
            data: urlParams.toString(),
            dataType: 'json', // 응답을 JSON으로 기대
            success: function(pageResult) {
                if (pageResult && pageResult.content.length > 0) {
                    // 받아온 JSON 데이터로 상품 카드를 동적으로 생성하여 추가
                    pageResult.content.forEach(product => {
                        const productCardHtml = createProductCardHtml(product);
                        $('#product-grid').append(productCardHtml);
                    });

                    // 더보기 버튼 표시/숨김 처리
                    if (pageResult.last) { // PageResult에 last 프로퍼티가 있다고 가정
                        $('#load-more-btn').hide();
                    }
                } else {
                    $('#load-more-btn').hide();
                }
            },
            error: function(xhr, status, error) {
                console.error('더보기 로딩 실패:', error);
                currentPage--; // 실패 시 페이지 번호 되돌리기
            },
            complete: function() {
                isLoading = false;
                $('#load-more-btn').text('더 보기').prop('disabled', false);
            }
        });
    }

    /**
     * JSON 데이터로 상품 카드 HTML 문자열을 생성하는 헬퍼 함수
     */
    function createProductCardHtml(product) {
        const imageUrl = `${contextPath}${product.imageUrl || '/resources/images/no-image.jpg'}`;
        const altText = product.name;

        let priceHtml = `<div class="current-price">${product.basePrice.toLocaleString()}원</div>`;
        if (product.discountAmount > 0) {
            const discountPrice = product.basePrice - product.discountAmount;
            priceHtml = `
            <div class="original-price">${product.basePrice.toLocaleString()}원</div>
            <div class="discount-price">${Math.round(discountPrice).toLocaleString()}원</div>
        `;
        }

        let badgeHtml = '';
        if (product.discountRate > 0) {
            badgeHtml += `<div class="product-badge discount">${product.discountRate}%</div>`;
        }
        if (product.isGroupPurchase) {
            badgeHtml += `<div class="product-badge group">공동구매</div>`;
        }

        return `
        <div class="product-card" data-product-id="${product.id}">
            <div class="product-image">
                <img 
                    src="${imageUrl}" 
                    alt="${altText}" 
                    onerror="this.src='${contextPath}/resources/images/no-image.jpg'" 
                />
                ${badgeHtml}
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <div class="product-price">
                    ${priceHtml}
                </div>
            </div>
        </div>
    `;
    }

    // URL 파라미터 기반 필터 설정
    function setFiltersFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);

        // 검색어 설정
        const keyword = urlParams.get('keyword');
        if (keyword) {
            $('#search-input').val(keyword);
        }

        // 필터 값 설정
        $('#category-filter').val(urlParams.get('categoryId') || 'all');
        $('#price-filter').val(urlParams.get('priceRange') || 'all');
        $('#discount-filter').prop('checked', urlParams.get('discountOnly') === 'true');
        $('#group-purchase-filter').prop('checked', urlParams.get('groupPurchaseOnly') === 'true');
        $('#sort-option').val(urlParams.get('sortBy') || 'popularity');
    }
});