$(document).ready(function() {
    // contextPath 통일
    const contextPath = $('meta[name="context-path"]').attr('content') || 
                       $('script[src*="search.js"]').attr('src').split('/resources')[0] || '';
    
    let currentPage = 1;
    let isLoading = false;
    
    // 검색 기록 관리
    let searchHistory = JSON.parse(localStorage.getItem('searchHistory')) || [];
    const maxHistoryItems = 10;
    
    // 페이지 초기화
    initializePage();
    
    function initializePage() {
        // 현재 페이지가 검색 페이지인지 확인
        const isSearchPage = window.location.pathname.includes('/search');
        
        if (isSearchPage) {
            initializeSearchPage();
        } else {
            initializeSearchFeature();
        }
    }
    
    // 검색 기능 초기화 (모든 페이지에서 공통)
    function initializeSearchFeature() {
        // 기존 이벤트 리스너 제거
        $('#search-button').off('click.search');
        $('#search-input').off('keypress.search');
        
        // 검색 버튼 클릭 이벤트
        $('#search-button').on('click.search', function(e) {
            e.preventDefault();
            performSearch();
        });
        
        // 검색 입력창 엔터 키 이벤트
        $('#search-input').on('keypress.search', function(e) {
            if (e.which === 13) {
                e.preventDefault();
                performSearch();
            }
        });
        
        // 검색 입력창 포커스 이벤트
        $('#search-input').on('focus.search', function() {
            updateSearchHistoryDisplay();
            if (searchHistory.length > 0) {
                $('.search-history').show();
            }
        });
        
        // 검색 입력창 블러 이벤트
        $(document).on('click.search', function(e) {
            if (!$(e.target).closest('.search-container').length) {
                $('.search-history').hide();
            }
        });
        
        // 검색 기록 클릭 이벤트
        $(document).on('click.search', '.search-history-item', function(e) {
            e.preventDefault();
            const keyword = $(this).find('a').text() || $(this).data('keyword');
            $('#search-input').val(keyword);
            performSearch();
        });
        
        // 검색 기록 삭제 이벤트
        $(document).on('click.search', '.remove-history', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const keyword = $(this).siblings('a').text() || $(this).data('keyword');
            removeFromSearchHistory(keyword);
        });
        
        // 초기 검색 기록 표시
        updateSearchHistoryDisplay();
    }
    
    // 검색 페이지 초기화
    function initializeSearchPage() {
        // 공통 검색 기능 초기화
        initializeSearchFeature();
        
        // 검색 페이지 전용 기능
        initializeFilters();
        initializeLoadMore();
        initializeProductCards();
        
        // URL 파라미터 기반 필터 설정
        setFiltersFromUrl();
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
                window.location.href = contextPath + '/product/' + productId;
            }
        });
    }
    
    // 검색 실행 함수
    function performSearch() {
        const keyword = $('#search-input').val().trim();
        
        if (!keyword) {
            showMessage('검색어를 입력해주세요.', 'warning');
            return;
        }
        
        // 검색 기록에 추가
        addToSearchHistory(keyword);
        
        // 검색 페이지로 이동
        const searchUrl = contextPath + '/search?keyword=' + encodeURIComponent(keyword);
        console.log('검색 URL:', searchUrl); // 디버깅용
        window.location.href = searchUrl;
    }
    
    // 필터 적용 함수
    function applyFilters() {
        const urlParams = new URLSearchParams(window.location.search);
        const keyword = urlParams.get('keyword');
        
        if (!keyword) {
            showMessage('검색어가 없습니다.', 'error');
            return;
        }
        
        const category = $('#category-filter').val();
        const priceRange = $('#price-filter').val();
        const discountOnly = $('#discount-filter').is(':checked');
        const groupPurchaseOnly = $('#group-purchase-filter').is(':checked');
        const sortBy = $('#sort-option').val();
        
        // URL 파라미터 생성
        const params = new URLSearchParams({
            keyword: keyword
        });
        
        if (category && category !== 'all') {
            params.set('category', category);
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
        const keyword = urlParams.get('keyword');
        const category = urlParams.get('category') || 'all';
        const priceRange = urlParams.get('priceRange') || 'all';
        const discountOnly = urlParams.get('discountOnly') === 'true';
        const groupPurchaseOnly = urlParams.get('groupPurchaseOnly') === 'true';
        const sortBy = urlParams.get('sortBy') || 'popularity';
        
        currentPage++;
        
        $.ajax({
            url: contextPath + '/search/api',
            method: 'GET',
            data: {
                keyword: keyword,
                category: category,
                priceRange: priceRange,
                discountOnly: discountOnly,
                groupPurchaseOnly: groupPurchaseOnly,
                sortBy: sortBy,
                page: currentPage
            },
            success: function(response) {
                const $response = $(response);
                const products = $response.find('.product-card');
                
                if (products.length > 0) {
                    $('#product-grid').append(products);
                    
                    // 더보기 버튼 표시/숨김 처리
                    const hasMore = $response.find('.has-more').length > 0;
                    if (!hasMore || products.length < 12) {
                        $('#load-more-btn').hide();
                    }
                } else {
                    $('#load-more-btn').hide();
                    showMessage('더 이상 불러올 상품이 없습니다.', 'info');
                }
                
                isLoading = false;
                $('#load-more-btn').text('더 보기').prop('disabled', false);
            },
            error: function(xhr, status, error) {
                console.error('더보기 로딩 실패:', error);
                showMessage('상품을 불러오는 중 오류가 발생했습니다.', 'error');
                isLoading = false;
                $('#load-more-btn').text('더 보기').prop('disabled', false);
                currentPage--; // 실패시 페이지 번호 되돌리기
            }
        });
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
        $('#category-filter').val(urlParams.get('category') || 'all');
        $('#price-filter').val(urlParams.get('priceRange') || 'all');
        $('#discount-filter').prop('checked', urlParams.get('discountOnly') === 'true');
        $('#group-purchase-filter').prop('checked', urlParams.get('groupPurchaseOnly') === 'true');
        $('#sort-option').val(urlParams.get('sortBy') || 'popularity');
    }
    
    // 검색 기록 관리 함수들
    function addToSearchHistory(keyword) {
        // 중복 제거
        searchHistory = searchHistory.filter(item => item !== keyword);
        
        // 최신 검색어를 맨 앞에 추가
        searchHistory.unshift(keyword);
        
        // 최대 개수 제한
        if (searchHistory.length > maxHistoryItems) {
            searchHistory = searchHistory.slice(0, maxHistoryItems);
        }
        
        localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
        updateSearchHistoryDisplay();
    }
    
    function removeFromSearchHistory(keyword) {
        searchHistory = searchHistory.filter(item => item !== keyword);
        localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
        updateSearchHistoryDisplay();
    }
    
    function updateSearchHistoryDisplay() {
        const historyList = $('#search-history-list');
        historyList.empty();
        
        if (searchHistory.length === 0) {
            historyList.append('<li class="no-history">최근 검색어가 없습니다.</li>');
            return;
        }
        
        searchHistory.forEach(function(keyword) {
            const listItem = $('<li>')
                .addClass('search-history-item')
                .data('keyword', keyword)
                .append($('<a>').text(keyword).attr('href', '#'))
                .append($('<button>').text('×').addClass('remove-history').data('keyword', keyword));
            
            historyList.append(listItem);
        });
    }
});
