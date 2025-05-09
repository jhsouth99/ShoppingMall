// 쿠폰 테이블 데이터를 가져오고 페이지네이션을 초기화하는 함수
function initializePagination(totalItems) {
    totalCoupons = totalItems;
    const totalPages = Math.ceil(totalCoupons / couponsPerPage);

    renderPagination(totalPages, currentPage);
    loadCouponsForPage(currentPage);
}

// 페이지네이션 UI를 렌더링하는 함수
function renderPagination(totalPages, currentPage) {
    const paginationContainer = document.querySelector("#coupon-management .pagination");
    if (!paginationContainer) return;

    paginationContainer.innerHTML = '';

    // 이전 페이지 버튼
    const prevBtn = document.createElement('a');
    prevBtn.href = '#';
    prevBtn.classList.add('prev-page');
    prevBtn.textContent = '◀';
    if (currentPage === 1) {
        prevBtn.classList.add('disabled');
    } else {
        prevBtn.addEventListener('click', function (e) {
            e.preventDefault();
            goToPage(currentPage - 1);
        });
    }
    paginationContainer.appendChild(prevBtn);

    // 페이지 번호 버튼들
    if (totalPages <= 5) {
        for (let i = 1; i <= totalPages; i++) {
            addPageNumberButton(i, currentPage, paginationContainer);
        }
    } else {
        if (currentPage <= 3) {
            for (let i = 1; i <= 3; i++) {
                addPageNumberButton(i, currentPage, paginationContainer);
            }
            addEllipsis(paginationContainer);
            addPageNumberButton(totalPages, currentPage, paginationContainer);
        } else if (currentPage >= totalPages - 2) {
            addPageNumberButton(1, currentPage, paginationContainer);
            addEllipsis(paginationContainer);
            for (let i = totalPages - 2; i <= totalPages; i++) {
                addPageNumberButton(i, currentPage, paginationContainer);
            }
        } else {
            addPageNumberButton(1, currentPage, paginationContainer);
            addEllipsis(paginationContainer);
            for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                addPageNumberButton(i, currentPage, paginationContainer);
            }
            addEllipsis(paginationContainer);
            addPageNumberButton(totalPages, currentPage, paginationContainer);
        }
    }

    // 다음 페이지 버튼
    const nextBtn = document.createElement('a');
    nextBtn.href = '#';
    nextBtn.classList.add('next-page');
    nextBtn.textContent = '▶';
    if (currentPage === totalPages || totalPages === 0) {
        nextBtn.classList.add('disabled');
    } else {
        nextBtn.addEventListener('click', function (e) {
            e.preventDefault();
            goToPage(currentPage + 1);
        });
    }
    paginationContainer.appendChild(nextBtn);
}

// 페이지 번호 버튼 추가 함수
function addPageNumberButton(pageNum, currentPage, container) {
    const pageBtn = document.createElement('a');
    pageBtn.href = '#';
    pageBtn.classList.add('page-number');
    pageBtn.textContent = pageNum;
    if (pageNum === currentPage) {
        pageBtn.classList.add('active');
    } else {
        pageBtn.addEventListener('click', function (e) {
            e.preventDefault();
            goToPage(pageNum);
        });
    }
    container.appendChild(pageBtn);
}

// 생략 기호(...) 추가 함수
function addEllipsis(container) {
    const ellipsis = document.createElement('span');
    ellipsis.classList.add('ellipsis');
    ellipsis.textContent = '...';
    container.appendChild(ellipsis);
}

// 지정한 페이지로 이동하는 함수
function goToPage(pageNum) {
    currentPage = pageNum;
    const totalPages = Math.ceil(totalCoupons / couponsPerPage);
    renderPagination(totalPages, currentPage);
    loadCouponsForPage(currentPage);
}

// 현재 페이지에 해당하는 쿠폰 데이터를 로드하는 함수
function loadCouponsForPage(pageNum) {
    const startIndex = (pageNum - 1) * couponsPerPage;
    const endIndex = Math.min(startIndex + couponsPerPage, couponsData.length);
    const currentPageCoupons = couponsData.slice(startIndex, endIndex);
    updateCouponTable(currentPageCoupons);
    console.log(`${pageNum} 페이지 쿠폰 데이터:`, currentPageCoupons);
    // 실제 구현에서는 서버에서 해당 페이지의 쿠폰 데이터를 가져오는 API 호출이 필요합니다.
}
