
/**
 * 서버에서 카테고리 데이터를 받아와 3차 메뉴까지 동적으로 생성합니다.
 */
async function buildCategoryMenu() {
    const mainNavUl = document.querySelector(".main-nav > ul");
    if (!mainNavUl) return;

    try {
        const response = await fetch('/ecommerce/api/categories');
        if (!response.ok) throw new Error("카테고리 정보를 불러오지 못했습니다.");

        const categoryTree = await response.json();

        mainNavUl.innerHTML = '';

        categoryTree.forEach(mainCategory => {
            const mainLi = document.createElement('li');
            mainLi.classList.add('has-submenu');

            const mainLink = document.createElement('a');
            mainLink.href = '/ecommerce/products/category/' + mainCategory.id;
            mainLink.textContent = mainCategory.name;
            mainLi.appendChild(mainLink);

            if (mainCategory.children && mainCategory.children.length > 0) {
                const subMenuUl = document.createElement('ul');
                subMenuUl.classList.add('submenu');

                mainCategory.children.forEach(subCategory => {
                    const subLi = document.createElement('li');
                    const subLink = document.createElement('a');
                    subLink.href = '/ecommerce/products/category/' + subCategory.id;
                    subLink.textContent = subCategory.name;

                    subLi.appendChild(subLink);

                    // 3차 카테고리 생성 로직 ---
                    if (subCategory.children && subCategory.children.length > 0) {
                        const subMenuUl3 = document.createElement('ul');
                        subMenuUl3.classList.add('submenu-level3');

                        subCategory.children.forEach(grandChildCategory => {
                            const subLi3 = document.createElement('li');
                            const subLink3 = document.createElement('a');
                            subLink3.href = '/ecommerce/products/category/' + grandChildCategory.id;
                            subLink3.textContent = grandChildCategory.name;

                            subLi3.appendChild(subLink3);
                            subMenuUl3.appendChild(subLi3);
                        });
                        // 2차 li에 3차 ul을 추가
                        subLi.appendChild(subMenuUl3);
                    }
                    // --- 3차 카테고리 로직 끝 ---

                    subMenuUl.appendChild(subLi);
                });

                mainLi.appendChild(subMenuUl);
            }

            mainNavUl.appendChild(mainLi);
        });

    } catch (error) {
        console.error("카테고리 메뉴 생성 실패:", error);
        mainNavUl.innerHTML = '<li><a href="#">카테고리를 불러올 수 없습니다.</a></li>';
    }
}

function setupMobileMenu() {
    // 요소들을 먼저 찾기
    let menuToggle = document.querySelector('.mobile-menu-toggle');
    const headerNav = document.querySelector('.header-nav');
    let menuOverlay = document.querySelector('.mobile-menu-overlay');

    // 햄버거 메뉴 버튼이 없으면 생성
    if (!menuToggle) {
        menuToggle = document.createElement('button');
        menuToggle.className = 'mobile-menu-toggle';
        menuToggle.setAttribute('aria-label', '메뉴 열기');
        menuToggle.innerHTML = '<i class="fas fa-bars"></i>';

        // header-top 컨테이너에 추가
        const headerTopContainer = document.querySelector('.header-top .container');
        if (headerTopContainer) {
            headerTopContainer.prepend(menuToggle);
        }
    }

    // 모바일 메뉴 오버레이가 없으면 생성
    if (!menuOverlay) {
        menuOverlay = document.createElement('div');
        menuOverlay.className = 'mobile-menu-overlay';
        document.body.appendChild(menuOverlay);
    }

    if (!menuToggle || !headerNav || !menuOverlay) {
        console.error('모바일 메뉴 요소를 찾을 수 없습니다.');
        return;
    }

    // 햄버거 메뉴 클릭 이벤트
    menuToggle.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();

        headerNav.classList.toggle('active');
        menuOverlay.classList.toggle('active');

        // 메뉴가 열릴 때 스크롤 방지
        if (headerNav.classList.contains('active')) {
            document.body.style.overflow = 'hidden';
            menuToggle.setAttribute('aria-label', '메뉴 닫기');
            menuToggle.innerHTML = '<i class="fas fa-times"></i>';
        } else {
            document.body.style.overflow = '';
            menuToggle.setAttribute('aria-label', '메뉴 열기');
            menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
        }
    });

    // 오버레이 클릭 시 메뉴 닫기
    menuOverlay.addEventListener('click', function() {
        headerNav.classList.remove('active');
        menuOverlay.classList.remove('active');
        document.body.style.overflow = '';
        menuToggle.setAttribute('aria-label', '메뉴 열기');
        menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
    });

    // 모바일에서 메인 카테고리 클릭 시 서브메뉴 토글
    const mainNavItems = document.querySelectorAll('.main-nav > ul > li');
    mainNavItems.forEach(item => {
        const mainLink = item.querySelector('> a');
        const submenu = item.querySelector('.submenu');

        if (mainLink && submenu) {
            mainLink.addEventListener('click', function(e) {
                // 모바일에서만 작동
                if (window.innerWidth <= 575) {
                    e.preventDefault();

                    // 다른 메뉴 닫기
                    mainNavItems.forEach(otherItem => {
                        if (otherItem !== item) {
                            otherItem.classList.remove('active');
                        }
                    });

                    // 현재 메뉴 토글
                    item.classList.toggle('active');
                }
            });
        }

        // 3차 메뉴 토글
        const subItems = item.querySelectorAll('.submenu > li');
        subItems.forEach(subItem => {
            const subLink = subItem.querySelector('> a');
            const subSubmenu = subItem.querySelector('.submenu-level3');

            if (subLink && subSubmenu) {
                subLink.addEventListener('click', function(e) {
                    if (window.innerWidth <= 575) {
                        e.preventDefault();

                        // 다른 3차 메뉴 닫기
                        subItems.forEach(otherSubItem => {
                            if (otherSubItem !== subItem) {
                                otherSubItem.classList.remove('active');
                            }
                        });

                        // 현재 3차 메뉴 토글
                        subItem.classList.toggle('active');
                    }
                });
            }
        });
    });

    // 윈도우 리사이즈 시 메뉴 초기화
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            if (window.innerWidth > 575) {
                // 데스크톱으로 변경 시 모바일 메뉴 초기화
                headerNav.classList.remove('active');
                menuOverlay.classList.remove('active');
                document.body.style.overflow = '';
                menuToggle.setAttribute('aria-label', '메뉴 열기');
                menuToggle.innerHTML = '<i class="fas fa-bars"></i>';

                // 모든 active 클래스 제거
                mainNavItems.forEach(item => {
                    item.classList.remove('active');
                });
            }
        }, 250);
    });
}

document.addEventListener("DOMContentLoaded", function() {

    buildCategoryMenu().then(() => {
        setupMobileMenu();
    });
});