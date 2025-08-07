/**
 * 다크모드 테마 관리 JavaScript
 * 모든 페이지에서 공통으로 사용
 */

(function() {
    'use strict';

    // 테마 관련 상수
    const THEME_KEY = 'user-theme-preference';
    const LIGHT_THEME = 'light';
    const DARK_THEME = 'dark';
    const THEME_CLASS = 'dark-theme';

    let themeToggleButton = null;

    /**
     * 페이지 로드 시 초기화
     */
    function initializeTheme() {
        // 저장된 테마 불러오기 또는 시스템 설정 감지
        const savedTheme = getSavedTheme();
        const systemTheme = getSystemTheme();
        const initialTheme = savedTheme || systemTheme;

        // 테마 적용
        applyTheme(initialTheme);

        // 다크모드 토글 버튼 생성
        createThemeToggleButton();

        // 시스템 다크모드 변경 감지
        watchSystemThemeChanges();
    }

    /**
     * 저장된 테마 가져오기
     */
    function getSavedTheme() {
        try {
            return localStorage.getItem(THEME_KEY);
        } catch (e) {
            console.warn('localStorage not available:', e);
            return null;
        }
    }

    /**
     * 시스템 테마 감지
     */
    function getSystemTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return DARK_THEME;
        }
        return LIGHT_THEME;
    }

    /**
     * 테마 저장
     */
    function saveTheme(theme) {
        try {
            localStorage.setItem(THEME_KEY, theme);
        } catch (e) {
            console.warn('Failed to save theme preference:', e);
        }
    }

    /**
     * 테마 적용
     */
    function applyTheme(theme) {
        const body = document.body;
        const html = document.documentElement;

        if (theme === DARK_THEME) {
            body.classList.add(THEME_CLASS);
            html.classList.add(THEME_CLASS);
        } else {
            body.classList.remove(THEME_CLASS);
            html.classList.remove(THEME_CLASS);
        }

        // 테마 버튼 아이콘 업데이트
        updateThemeButtonIcon(theme);

        // 메타 태그 업데이트 (브라우저 UI 색상)
        updateMetaThemeColor(theme);
    }

    /**
     * 테마 토글
     */
    function toggleTheme() {
        const currentTheme = getCurrentTheme();
        const newTheme = currentTheme === LIGHT_THEME ? DARK_THEME : LIGHT_THEME;

        applyTheme(newTheme);
        saveTheme(newTheme);

        // 애니메이션 효과
        addToggleAnimation();
    }

    /**
     * 현재 테마 확인
     */
    function getCurrentTheme() {
        return document.body.classList.contains(THEME_CLASS) ? DARK_THEME : LIGHT_THEME;
    }

    /**
     * 다크모드 토글 버튼 생성
     */
    function createThemeToggleButton() {
        // 기존 버튼이 있으면 제거
        if (themeToggleButton) {
            themeToggleButton.remove();
        }

        themeToggleButton = document.createElement('button');
        themeToggleButton.className = 'theme-toggle';
        themeToggleButton.setAttribute('aria-label', '다크모드 전환');
        themeToggleButton.setAttribute('title', '다크모드 전환');

        // 아이콘 설정
        const currentTheme = getCurrentTheme();
        updateThemeButtonIcon(currentTheme);

        // 클릭 이벤트
        themeToggleButton.addEventListener('click', toggleTheme);

        // 키보드 접근성
        themeToggleButton.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleTheme();
            }
        });

        // 페이지에 추가
        document.body.appendChild(themeToggleButton);
    }

    /**
     * 테마 버튼 아이콘 업데이트
     */
    function updateThemeButtonIcon(theme) {
        if (!themeToggleButton) return;

        const isDark = theme === DARK_THEME;

        // Font Awesome 아이콘 사용
        themeToggleButton.innerHTML = isDark
            ? '<i class="fas fa-sun" aria-hidden="true"></i>'
            : '<i class="fas fa-moon" aria-hidden="true"></i>';

        // 툴팁 텍스트 업데이트
        const tooltipText = isDark ? '라이트모드로 전환' : '다크모드로 전환';
        themeToggleButton.setAttribute('title', tooltipText);
        themeToggleButton.setAttribute('aria-label', tooltipText);
    }

    /**
     * 메타 태그 테마 색상 업데이트
     */
    function updateMetaThemeColor(theme) {
        let metaThemeColor = document.querySelector('meta[name="theme-color"]');

        if (!metaThemeColor) {
            metaThemeColor = document.createElement('meta');
            metaThemeColor.name = 'theme-color';
            document.head.appendChild(metaThemeColor);
        }

        // 테마에 따른 브라우저 색상 설정
        metaThemeColor.content = theme === DARK_THEME ? '#1a1d23' : '#ffffff';
    }

    /**
     * 토글 애니메이션 효과
     */
    function addToggleAnimation() {
        if (!themeToggleButton) return;

        themeToggleButton.style.transform = 'scale(0.8) rotate(180deg)';

        setTimeout(() => {
            themeToggleButton.style.transform = 'scale(1) rotate(0deg)';
        }, 150);
    }

    /**
     * 시스템 다크모드 변경 감지
     */
    function watchSystemThemeChanges() {
        if (!window.matchMedia) return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        // 저장된 설정이 없을 때만 시스템 설정을 따름
        mediaQuery.addEventListener('change', function(e) {
            const savedTheme = getSavedTheme();
            if (!savedTheme) {
                const systemTheme = e.matches ? DARK_THEME : LIGHT_THEME;
                applyTheme(systemTheme);
            }
        });
    }

    /**
     * 키보드 단축키 지원
     */
    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', function(e) {
            // Ctrl+Shift+D (Windows/Linux) 또는 Cmd+Shift+D (Mac)으로 다크모드 토글
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
                e.preventDefault();
                toggleTheme();
            }
        });
    }

    /**
     * 페이지 이동 시 테마 상태 유지
     */
    function maintainThemeOnNavigation() {
        // 페이지 언로드 전 현재 테마 저장
        window.addEventListener('beforeunload', function() {
            const currentTheme = getCurrentTheme();
            saveTheme(currentTheme);
        });
    }

    /**
     * 접근성 향상을 위한 추가 기능
     */
    function enhanceAccessibility() {
        // prefers-reduced-motion 감지
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

        if (prefersReducedMotion.matches) {
            // 애니메이션 비활성화
            document.documentElement.style.setProperty('--animation-duration', '0s');
            document.documentElement.style.setProperty('--transition-duration', '0s');
        }

        // 고대비 모드 감지
        const prefersHighContrast = window.matchMedia('(prefers-contrast: high)');

        if (prefersHighContrast.matches) {
            document.body.classList.add('high-contrast');
        }
    }

    /**
     * 테마 상태를 다른 창/탭과 동기화
     */
    function syncThemeAcrossTabs() {
        window.addEventListener('storage', function(e) {
            if (e.key === THEME_KEY && e.newValue !== null) {
                applyTheme(e.newValue);
            }
        });
    }

    /**
     * 디버깅을 위한 콘솔 함수들 (개발 환경에서만 활성화)
     */
    function setupDebugFunctions() {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            window.themeDebug = {
                getCurrentTheme: getCurrentTheme,
                setTheme: function(theme) {
                    if (theme === LIGHT_THEME || theme === DARK_THEME) {
                        applyTheme(theme);
                        saveTheme(theme);
                        console.log('Theme set to:', theme);
                    } else {
                        console.error('Invalid theme. Use "light" or "dark"');
                    }
                },
                clearSavedTheme: function() {
                    try {
                        localStorage.removeItem(THEME_KEY);
                        console.log('Saved theme cleared');
                        // 시스템 테마로 되돌리기
                        const systemTheme = getSystemTheme();
                        applyTheme(systemTheme);
                    } catch (e) {
                        console.error('Failed to clear theme:', e);
                    }
                },
                getSystemTheme: getSystemTheme
            };
        }
    }

    /**
     * 초기화 함수
     */
    function init() {
        initializeTheme();
        setupKeyboardShortcuts();
        maintainThemeOnNavigation();
        enhanceAccessibility();
        syncThemeAcrossTabs();
        setupDebugFunctions();
    }

    // DOM이 로드되면 초기화
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // 전역으로 접근 가능한 함수들 export
    window.ThemeManager = {
        toggle: toggleTheme,
        set: function(theme) {
            if (theme === LIGHT_THEME || theme === DARK_THEME) {
                applyTheme(theme);
                saveTheme(theme);
            }
        },
        get: getCurrentTheme,
        getSystem: getSystemTheme
    };

})();