// 사이드바 네비게이션 초기화
function initSidebarNavigation() {
    const navLinks = document.querySelectorAll(".admin-sidebar .nav-link");
    const contentSections = document.querySelectorAll(".admin-main .content-section");

    function setActiveSection(link, section) {
        navLinks.forEach((l) => l.classList.remove("active"));
        contentSections.forEach((s) => s.classList.remove("active"));
        // 링크나 섹션이 null일 수 있는 경우 방지
        if (link) link.classList.add("active");
        if (section) section.classList.add("active");
    }

    const currentHash = window.location.hash || "#dashboard"; // 기본값 #dashboard
    let initialLink = document.querySelector(`.admin-sidebar a[href="${currentHash}"]`);
    let initialSection = document.querySelector(currentHash);

    // 만약 해시에 해당하는 요소가 없으면 대시보드로 강제 이동
    if (!initialLink || !initialSection) {
        initialLink = document.querySelector('.admin-sidebar a[href="#dashboard"]');
        initialSection = document.getElementById("dashboard");
    }

    setActiveSection(initialLink, initialSection);

    navLinks.forEach((link) => {
        link.addEventListener("click", function (event) {
            event.preventDefault();
            const targetId = this.getAttribute("href");
            const targetSection = document.querySelector(targetId);
            if (targetSection) {
                setActiveSection(this, targetSection);
                history.pushState(null, null, targetId);
            }
        });
    });

    window.addEventListener("popstate", function () {
        const hash = window.location.hash || "#dashboard";
        let targetLink = document.querySelector(`.admin-sidebar a[href="${hash}"]`);
        let targetSection = document.querySelector(hash);

        if (!targetLink || !targetSection) {
            targetLink = document.querySelector('.admin-sidebar a[href="#dashboard"]');
            targetSection = document.getElementById("dashboard");
        }
        setActiveSection(targetLink, targetSection);
    });

    // 사용자 관리 내부 탭 제어 초기화
    initUserTabs();
}

// 사용자 관리 내부 탭 제어
function initUserTabs() {
    const userManagementSection = document.getElementById("user-management");
    if (userManagementSection) {
        const userTabButtons = userManagementSection.querySelectorAll(".user-tabs .user-tab-button");
        const userTabContents = userManagementSection.querySelectorAll(".user-tab-content");

        function setActiveUserTab(button, content) {
            userTabButtons.forEach((btn) => btn.classList.remove("active"));
            userTabContents.forEach((c) => c.classList.remove("active"));
            if (button) button.classList.add("active");
            if (content) content.classList.add("active");
        }

        if (userTabButtons.length > 0 && userTabContents.length > 0) {
            // 초기 탭 활성화 (첫 번째 탭)
            const initialActiveTabButton = userManagementSection.querySelector(".user-tabs .user-tab-button"); // 첫번째 버튼 선택
            const initialActiveTabContentId = initialActiveTabButton?.getAttribute("data-tab");
            const initialActiveTabContent = initialActiveTabContentId
                ? userManagementSection.querySelector(`#${initialActiveTabContentId}`)
                : null;
            setActiveUserTab(initialActiveTabButton, initialActiveTabContent);

            userTabButtons.forEach((button) => {
                button.addEventListener("click", function () {
                    const targetTabId = this.getAttribute("data-tab");
                    const targetTabContent = userManagementSection.querySelector(`#${targetTabId}`);
                    if (targetTabContent) {
                        setActiveUserTab(this, targetTabContent);
                    }
                });
            });
        }
    }
}
