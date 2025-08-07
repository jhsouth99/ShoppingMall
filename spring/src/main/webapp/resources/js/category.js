$(document).ready(function() {
    const csrfToken = $("meta[name='_csrf']").attr("content");
    const csrfHeader = $("meta[name='_csrf_header']").attr("content");

    let currentPage = 1;
    let isLoading = false;

    // 현재 필터 상태
    let currentFilters = {
        categoryId: window.currentCategoryId,
        priceFilter: 'all',
        discountFilter: false,
        groupPurchaseFilter: false,
        sortOption: 'popularity',
        attributeFilters: {} // 속성 필터: {attributeId: [value1, value2, ...]}
    };

    // 페이지 초기화
    initializePage();

    function initializePage() {
        // 카테고리별 속성 필터 로드
        loadCategoryAttributes();

        // 기본 필터 이벤트 바인딩
        initializeBasicFilters();

        // 더보기 버튼 이벤트 바인딩
        initializeLoadMore();

        // 상품 카드 클릭 이벤트 바인딩
        initializeProductCards();

        // 활성 필터 관리 이벤트 바인딩
        initializeActiveFilters();

        // URL 파라미터에서 초기 필터 상태 설정
        setInitialFiltersFromUrl();
    }

    /**
     * URL 파라미터와 초기 데이터에서 필터 상태를 설정합니다.
     */
    function setInitialFiltersFromUrl() {
        if (window.initialFilters) {
            // 기본 필터 설정
            if (window.initialFilters.priceRange && window.initialFilters.priceRange !== 'all') {
                currentFilters.priceFilter = window.initialFilters.priceRange;
                $('#price-filter').val(window.initialFilters.priceRange);
            }

            if (window.initialFilters.discountOnly) {
                currentFilters.discountFilter = true;
                $('#discount-filter').prop('checked', true);
            }

            if (window.initialFilters.groupPurchaseOnly) {
                currentFilters.groupPurchaseFilter = true;
                $('#group-purchase-filter').prop('checked', true);
            }

            if (window.initialFilters.sortBy && window.initialFilters.sortBy !== 'popularity') {
                currentFilters.sortOption = window.initialFilters.sortBy;
                $('#sort-option').val(window.initialFilters.sortBy);
            }
        }

        // 속성 필터 설정 (속성 필터 로딩 완료 후 적용)
        if (window.initialAttributeFilters && Object.keys(window.initialAttributeFilters).length > 0) {
            // 속성 필터가 로딩될 때까지 잠시 대기
            setTimeout(() => {
                applyInitialAttributeFilters();
            }, 1000);
        }

        // 초기 활성 필터 표시 업데이트
        updateActiveFiltersDisplay();
    }

    /**
     * URL에서 가져온 속성 필터를 적용합니다.
     */
    function applyInitialAttributeFilters() {
        if (!window.initialAttributeFilters) return;

        Object.keys(window.initialAttributeFilters).forEach(attrKey => {
            const attributeId = attrKey.replace('attr_', '');
            const values = window.initialAttributeFilters[attrKey];

            values.forEach(value => {
                const $checkbox = $(`input[data-attribute-id="${attributeId}"][value="${value}"]`);
                if ($checkbox.length > 0) {
                    $checkbox.prop('checked', true);
                    // selected 클래스 추가
                    $checkbox.closest('.attribute-option').addClass('selected');
                }
            });
        });

        // 속성 필터 상태 업데이트
        updateAttributeFilters();
    }

    /**
     * 현재 카테고리에 연결된 속성들을 로드하여 필터 UI를 생성합니다.
     */
    function loadCategoryAttributes() {
        if (!window.currentCategoryId) {
            $('#attribute-filters').hide();
            return;
        }

        // 로딩 상태 표시
        const container = $('#attribute-filters');
        container.show();
        container.html('<div class="filter-loading"><p>카테고리별 속성 필터를 불러오는 중...</p></div>');

        $.ajax({
            url: `${contextPath}/api/categories/${window.currentCategoryId}/attributes`,
            type: 'GET',
            success: function(attributes) {
                if (attributes && attributes.length > 0) {
                    renderAttributeFilters(attributes);
                } else {
                    // 속성이 없으면 속성 필터 영역을 숨김
                    container.hide();
                }
            },
            error: function(xhr, status, error) {
                console.error('속성 필터 로딩 실패:', error);
                container.html('<div class="filter-loading"><p style="color: #dc3545;">속성 필터를 불러오지 못했습니다.</p></div>');
                // 3초 후 숨김
                setTimeout(() => {
                    container.hide();
                }, 3000);
            }
        });
    }

    /**
     * 속성 필터 UI를 렌더링합니다.
     */
    function renderAttributeFilters(attributes) {
        const container = $('#attribute-filters');
        container.empty();

        if (!attributes || attributes.length === 0) {
            container.hide();
            return;
        }

        // 속성들을 그룹별로 분류
        const groupedAttributes = {};
        attributes.forEach(function(attr) {
            const group = attr.attributeGroup || '기본정보';
            if (!groupedAttributes[group]) {
                groupedAttributes[group] = [];
            }
            groupedAttributes[group].push(attr);
        });

        // 그룹별로 렌더링
        Object.keys(groupedAttributes).forEach(function(groupName) {
            const groupAttributes = groupedAttributes[groupName];

            // 그룹 헤더 추가
            if (Object.keys(groupedAttributes).length > 1) {
                container.append(`<div class="attribute-group-header">${groupName}</div>`);
            }

            groupAttributes.forEach(function(attr) {
                if (attr.isSearchable && attr.options && attr.options.length > 0) {
                    const filterGroupHtml = createAttributeFilterGroup(attr);
                    container.append(filterGroupHtml);
                }
            });
        });

        // 속성 필터 클릭 이벤트 바인딩
        container.on('change', '.attribute-option input[type="checkbox"]', function() {
            // 체크박스 상태에 따라 부모 요소의 selected 클래스 관리
            const $option = $(this).closest('.attribute-option');
            if ($(this).is(':checked')) {
                $option.addClass('selected');
            } else {
                $option.removeClass('selected');
            }

            updateAttributeFilters();
            applyFilters();
        });

        // 속성 옵션 클릭 이벤트 (체크박스 토글)
        container.on('click', '.attribute-option', function(e) {
            // 체크박스나 라벨을 직접 클릭한 경우는 제외
            if (e.target.type === 'checkbox' || e.target.tagName.toLowerCase() === 'label') {
                return;
            }

            const $checkbox = $(this).find('input[type="checkbox"]');
            const isCurrentlyChecked = $checkbox.is(':checked');

            // 체크박스 상태 토글
            $checkbox.prop('checked', !isCurrentlyChecked);

            // selected 클래스 관리
            if (!isCurrentlyChecked) {
                $(this).addClass('selected');
            } else {
                $(this).removeClass('selected');
            }

            // change 이벤트 수동 트리거 (updateAttributeFilters, applyFilters 호출)
            $checkbox.trigger('change');
        });


        // 더보기/접기 버튼 이벤트 바인딩
        container.on('click', '.toggle-options-btn', function(e) {
            e.preventDefault();
            const attributeId = $(this).data('attribute-id');
            const hiddenOptions = $(this).siblings('.hidden-options');
            const showMoreSpan = $(this).find('.show-more');
            const showLessSpan = $(this).find('.show-less');

            if (hiddenOptions.is(':visible')) {
                hiddenOptions.slideUp();
                showMoreSpan.show();
                showLessSpan.hide();
            } else {
                hiddenOptions.slideDown();
                showMoreSpan.hide();
                showLessSpan.show();
            }
        });

        container.show();
    }

    /**
     * 속성 필터 그룹 HTML을 생성합니다.
     */
    function createAttributeFilterGroup(attribute) {
        let html = `
            <div class="attribute-filter-group" data-attribute-id="${attribute.id}">
                <label class="attribute-filter-label">
                    ${attribute.name}
                    <span class="attribute-count">(${attribute.options.length}개 옵션)</span>
                </label>
                <div class="attribute-filter-options">
        `;

        // 옵션이 많은 경우 처음 5개만 표시하고 "더보기" 버튼 추가
        const showLimit = 8;
        const hasMore = attribute.options.length > showLimit;
        const visibleOptions = hasMore ? attribute.options.slice(0, showLimit) : attribute.options;

        visibleOptions.forEach(function(option, index) {
            html += createAttributeOptionHtml(attribute.id, option, index);
        });

        if (hasMore) {
            // 숨겨진 옵션들
            html += '<div class="hidden-options" style="display: none;">';
            attribute.options.slice(showLimit).forEach(function(option, index) {
                html += createAttributeOptionHtml(attribute.id, option, showLimit + index);
            });
            html += '</div>';

            // 더보기/접기 버튼
            html += `
                <button type="button" class="toggle-options-btn" data-attribute-id="${attribute.id}">
                    <span class="show-more">더보기 (+${attribute.options.length - showLimit})</span>
                    <span class="show-less" style="display: none;">접기</span>
                </button>
            `;
        }

        html += `
                </div>
            </div>
        `;

        return html;
    }

    /**
     * 개별 속성 옵션 HTML을 생성합니다.
     */
    function createAttributeOptionHtml(attributeId, option, index) {
        const optionId = `attr_${attributeId}_${index}`;
        const productCountText = option.productCount ? ` (${option.productCount})` : '';

        return `
            <div class="attribute-option" data-value="${option.value}">
                <input type="checkbox" 
                       id="${optionId}" 
                       value="${option.value}"
                       data-attribute-id="${attributeId}">
                <label for="${optionId}">${option.value}${productCountText}</label>
            </div>
        `;
    }

    /**
     * 기본 필터들 이벤트 바인딩
     */
    function initializeBasicFilters() {
        $('#price-filter, #sort-option').on('change', function() {
            currentFilters.priceFilter = $('#price-filter').val();
            currentFilters.sortOption = $('#sort-option').val();
            applyFilters();
        });

        $('#discount-filter, #group-purchase-filter').on('change', function() {
            currentFilters.discountFilter = $('#discount-filter').is(':checked');
            currentFilters.groupPurchaseFilter = $('#group-purchase-filter').is(':checked');
            applyFilters();
        });
    }

    /**
     * 속성 필터 상태를 업데이트합니다.
     */
    function updateAttributeFilters() {
        currentFilters.attributeFilters = {};

        $('.attribute-filter-group').each(function() {
            const attributeId = $(this).data('attribute-id');
            const selectedValues = [];

            $(this).find('input[type="checkbox"]:checked').each(function() {
                selectedValues.push($(this).val());
                // 선택된 옵션에 selected 클래스 추가
                $(this).closest('.attribute-option').addClass('selected');
            });

            // 선택되지 않은 옵션에서 selected 클래스 제거
            $(this).find('input[type="checkbox"]:not(:checked)').each(function() {
                $(this).closest('.attribute-option').removeClass('selected');
            });

            if (selectedValues.length > 0) {
                currentFilters.attributeFilters[attributeId] = selectedValues;
            }
        });

        updateActiveFiltersDisplay();
    }

    /**
     * 더보기 버튼 초기화
     */
    function initializeLoadMore() {
        $('#load-more-btn').on('click', function() {
            if (!isLoading) {
                loadMoreProducts();
            }
        });
    }

    /**
     * 상품 카드 클릭 이벤트 초기화
     */
    function initializeProductCards() {
        $(document).on('click', '.product-card', function() {
            const productId = $(this).data('product-id');
            if (productId) {
                window.location.href = contextPath + '/products/' + productId;
            }
        });
    }

    /**
     * 활성 필터 관리 이벤트 초기화
     */
    function initializeActiveFilters() {
        // 개별 필터 제거
        $(document).on('click', '.remove-filter', function(e) {
            e.stopPropagation();
            const filterType = $(this).data('filter-type');
            const filterValue = $(this).data('filter-value');
            const attributeId = $(this).data('attribute-id');

            removeFilter(filterType, filterValue, attributeId);
        });

        // 모든 필터 초기화
        $('#clear-all-filters').on('click', function() {
            clearAllFilters();
        });
    }

    /**
     * 필터를 적용하여 상품 목록을 새로 로드합니다.
     */
    function applyFilters() {
        currentPage = 1;
        $('#product-grid').empty();
        loadProducts(false);
        updateActiveFiltersDisplay();
    }

    /**
     * 더 많은 상품을 로드합니다.
     */
    function loadMoreProducts() {
        currentPage++;
        loadProducts(true);
    }

    /**
     * 상품 목록을 로드합니다.
     */
    function loadProducts(isAppend) {
        if (isLoading) return;

        isLoading = true;

        // 로딩 상태 표시
        if (isAppend) {
            $('#load-more-btn').text('로딩 중...').prop('disabled', true);
        } else {
            $('#product-grid').html('<div class="loading">상품을 불러오는 중...</div>');
        }

        // 요청 데이터 구성
        const requestData = {
            categoryId: currentFilters.categoryId,
            priceFilter: currentFilters.priceFilter,
            discountFilter: currentFilters.discountFilter,
            groupPurchaseFilter: currentFilters.groupPurchaseFilter,
            sortOption: currentFilters.sortOption,
            page: currentPage,
            size: 12
        };

        // 속성 필터 추가
        Object.keys(currentFilters.attributeFilters).forEach(attributeId => {
            requestData[`attr_${attributeId}`] = currentFilters.attributeFilters[attributeId].join(',');
        });

        // AJAX 요청
        $.ajax({
            url: contextPath + '/api/category/products',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(requestData),
            beforeSend: function(xhr) {
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
                            // 총 상품 수 업데이트
                            $('#total-count').text(response.totalCount || response.products.length);
                        } else {
                            $('#product-grid').html(`
                                <div class="no-products">
                                    <div class="no-results">
                                        <h3>상품이 없습니다.</h3>
                                        <p>선택한 조건에 맞는 상품이 없습니다.</p>
                                        <p>필터를 조정해보세요.</p>
                                    </div>
                                </div>
                            `);
                            $('#total-count').text('0');
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

    /**
     * 상품 목록을 렌더링합니다.
     */
    function renderProducts(products) {
        $('#product-grid').empty();
        appendProducts(products);
    }

    /**
     * 상품을 추가로 렌더링합니다.
     */
    function appendProducts(products) {
        let productHtml = '';

        products.forEach(function(product) {
            productHtml += createProductCard(product);
        });

        $('#product-grid').append(productHtml);
    }

    /**
     * 상품 카드 HTML을 생성합니다.
     */
    function createProductCard(product) {
        let discountRate = product.discountRate || 0;
        let isGroupPurchase = product.isGroupPurchase == 1;
        let basePrice = product.basePrice || 0;
        let discountPrice = product.discountPrice;

        // 할인 가격 계산
        if (product.discountAmount > 0 && !discountPrice) {
            discountPrice = basePrice - product.discountAmount;
        }

        let actualGroupPrice = product.groupPrice;

        let html = `
            <div class="product-card" data-product-id="${product.id}">
                <div class="product-image">
                    <img src="${contextPath}${product.imageUrl ||'/resources/images/no-image.jpg'}" 
                         alt="${product.altText || product.name}" 
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

    /**
     * 활성 필터 표시를 업데이트합니다.
     */
    function updateActiveFiltersDisplay() {
        const filterTags = $('#filter-tags');
        filterTags.empty();

        let hasActiveFilters = false;

        // 가격 필터
        if (currentFilters.priceFilter !== 'all') {
            const priceLabel = getPriceFilterLabel(currentFilters.priceFilter);
            filterTags.append(createFilterTag('price', priceLabel, currentFilters.priceFilter));
            hasActiveFilters = true;
        }

        // 특수 필터
        if (currentFilters.discountFilter) {
            filterTags.append(createFilterTag('special', '할인상품', 'discount'));
            hasActiveFilters = true;
        }

        if (currentFilters.groupPurchaseFilter) {
            filterTags.append(createFilterTag('special', '공동구매', 'group'));
            hasActiveFilters = true;
        }

        // 속성 필터
        Object.keys(currentFilters.attributeFilters).forEach(attributeId => {
            const values = currentFilters.attributeFilters[attributeId];
            const attributeName = getAttributeName(attributeId);

            values.forEach(value => {
                filterTags.append(createFilterTag('attribute', `${attributeName}: ${value}`, value, attributeId));
                hasActiveFilters = true;
            });
        });

        // 활성 필터 섹션 표시/숨김
        if (hasActiveFilters) {
            $('#active-filters').show();
        } else {
            $('#active-filters').hide();
        }
    }

    /**
     * 필터 태그 HTML을 생성합니다.
     */
    function createFilterTag(type, label, value, attributeId) {
        return `
            <div class="filter-tag">
                ${label}
                <button class="remove-filter" 
                        data-filter-type="${type}" 
                        data-filter-value="${value}"
                        ${attributeId ? `data-attribute-id="${attributeId}"` : ''}>×</button>
            </div>
        `;
    }

    /**
     * 개별 필터를 제거합니다.
     */
    function removeFilter(filterType, filterValue, attributeId) {
        if (filterType === 'price') {
            currentFilters.priceFilter = 'all';
            $('#price-filter').val('all');
        } else if (filterType === 'special') {
            if (filterValue === 'discount') {
                currentFilters.discountFilter = false;
                $('#discount-filter').prop('checked', false);
            } else if (filterValue === 'group') {
                currentFilters.groupPurchaseFilter = false;
                $('#group-purchase-filter').prop('checked', false);
            }
        } else if (filterType === 'attribute' && attributeId) {
            // 속성 필터에서 특정 값 제거
            if (currentFilters.attributeFilters[attributeId]) {
                const valueIndex = currentFilters.attributeFilters[attributeId].indexOf(filterValue);
                if (valueIndex > -1) {
                    currentFilters.attributeFilters[attributeId].splice(valueIndex, 1);

                    // 배열이 비어있으면 속성 자체를 제거
                    if (currentFilters.attributeFilters[attributeId].length === 0) {
                        delete currentFilters.attributeFilters[attributeId];
                    }
                }
            }

            // UI에서 체크박스 해제 및 selected 클래스 제거
            const $checkbox = $(`input[data-attribute-id="${attributeId}"][value="${filterValue}"]`);
            $checkbox.prop('checked', false);
            $checkbox.closest('.attribute-option').removeClass('selected');
        }

        applyFilters();
    }

    /**
     * 모든 필터를 초기화합니다.
     */
    function clearAllFilters() {
        // 기본 필터 초기화
        currentFilters.priceFilter = 'all';
        currentFilters.discountFilter = false;
        currentFilters.groupPurchaseFilter = false;
        currentFilters.attributeFilters = {};

        // UI 초기화
        $('#price-filter').val('all');
        $('#discount-filter').prop('checked', false);
        $('#group-purchase-filter').prop('checked', false);
        $('.attribute-option input[type="checkbox"]').prop('checked', false);

        // 모든 속성 옵션에서 selected 클래스 제거
        $('.attribute-option').removeClass('selected');

        applyFilters();
    }

    /**
     * 가격 필터 라벨을 반환합니다.
     */
    function getPriceFilterLabel(value) {
        switch (value) {
            case 'under-100000': return '10만원 이하';
            case '100000-300000': return '10-30만원';
            case 'over-300000': return '30만원 이상';
            default: return '전체';
        }
    }

    /**
     * 속성 이름을 반환합니다.
     */
    function getAttributeName(attributeId) {
        const group = $(`.attribute-filter-group[data-attribute-id="${attributeId}"]`);
        return group.find('.attribute-filter-label').text() || '속성';
    }

    /**
     * 유틸리티 함수들
     */
    function numberWithCommas(x) {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

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
});