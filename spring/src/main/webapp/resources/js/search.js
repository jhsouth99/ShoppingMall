/**
 * 공통 검색 기능 모듈
 * 모든 페이지의 헤더 검색창에서 사용
 */

$(document).ready(function() {
    // 검색 기록 관리
    let searchHistory = JSON.parse(localStorage.getItem('searchHistory')) || [];
    const maxHistoryItems = 10;

    // 검색 기능 초기화
    initializeSearchFeature();

    /**
     * 검색 기능 초기화 (모든 페이지에서 공통)
     */
    function initializeSearchFeature() {
        // 기존 이벤트 리스너 제거
        $('#search-button').off('click.search');
        $('#search-input').off('keypress.search focus.search blur.search');

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

        // 검색 입력창 포커스 이벤트 - 검색 기록이 있을 때만 표시
        $('#search-input').on('focus.search', function() {
            updateSearchHistoryDisplay();
            if (searchHistory.length > 0) {
                $('.search-history').show();
            }
        });

        // 검색 입력창 블러 이벤트는 제거 - 클릭 이벤트로만 처리

        // 문서 전체 클릭 이벤트로 검색 기록 숨기기
        $(document).on('click.search', function(e) {
            // 검색 컨테이너나 검색 기록 영역을 클릭한 게 아니면 숨기기
            if (!$(e.target).closest('.search-container, .search-history').length) {
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

        // 초기 검색 기록 표시는 하지 않음 (포커스할 때만)
    }

    /**
     * 검색 실행 함수
     */
    function performSearch() {
        const keyword = $('#search-input').val().trim();

        if (!keyword) {
            showMessage('검색어를 입력해주세요.', 'warning');
            return;
        }

        // 검색 기록에 추가
        addToSearchHistory(keyword);

        // 검색 기록 숨기기
        $('.search-history').hide();

        // 검색 페이지로 이동
        const searchUrl = contextPath + '/search?keyword=' + encodeURIComponent(keyword);
        window.location.href = searchUrl;
    }

    /**
     * 검색 기록 관리 함수들
     */
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

        // 검색 기록이 없으면 숨기기
        if (searchHistory.length === 0) {
            $('.search-history').hide();
        }
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

    /**
     * 메시지 표시 함수 (공통)
     */
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

    // 전역으로 사용할 수 있도록 window 객체에 추가
    window.SearchCommon = {
        performSearch: performSearch,
        addToSearchHistory: addToSearchHistory,
        showMessage: showMessage
    };
});