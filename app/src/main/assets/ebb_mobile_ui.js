// ebb.io Mobile App UI Enhancement
// 將網頁版介面轉換為更接近原生 App 的體驗

(function () {
    'use strict';

    // 防止重複注入
    if (window.__ebbMobileUILoaded) return;
    window.__ebbMobileUILoaded = true;

    // ==================== 配置 ====================
    const CONFIG = {
        primaryColor: '#1D2833',
        secondaryColor: '#253644',
        accentColor: '#00D4AA',
        heartColor: '#FF6B9D',
        textColor: '#FFFFFF',
        textMuted: '#8899A6',
        navHeight: 56,
        cardRadius: 8
    };

    // ==================== CSS 注入 ====================
    function injectStyles() {
        const style = document.createElement('style');
        style.id = 'ebb-mobile-ui-styles';
        style.textContent = `
            /* 隱藏滾動條 */
            ::-webkit-scrollbar {
                display: none !important;
            }
            
            body {
                -webkit-overflow-scrolling: touch;
                overscroll-behavior: contain;
            }

            /* 為底部導航留空間 */
            body {
                padding-bottom: ${CONFIG.navHeight + 8}px !important;
            }

            /* ==================== 底部導航列 ==================== */
            .ebb-bottom-nav {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                height: ${CONFIG.navHeight}px;
                background: linear-gradient(180deg, ${CONFIG.secondaryColor} 0%, ${CONFIG.primaryColor} 100%);
                display: flex;
                justify-content: space-around;
                align-items: center;
                z-index: 9999;
                box-shadow: 0 -2px 20px rgba(0, 0, 0, 0.5);
                border-top: 1px solid rgba(255, 255, 255, 0.1);
            }

            .ebb-nav-item {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 8px 16px;
                color: ${CONFIG.textMuted};
                text-decoration: none;
                transition: all 0.2s ease;
                -webkit-tap-highlight-color: transparent;
            }

            .ebb-nav-item:active {
                transform: scale(0.9);
            }

            .ebb-nav-item.active,
            .ebb-nav-item:hover {
                color: ${CONFIG.accentColor};
            }

            .ebb-nav-item svg {
                width: 24px;
                height: 24px;
                margin-bottom: 4px;
                fill: currentColor;
            }

            .ebb-nav-item span {
                font-size: 10px;
                font-weight: 500;
            }

            /* ==================== 愛心按鈕 ==================== */
            .ebb-heart-btn {
                position: absolute;
                top: 8px;
                right: 8px;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                background: rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(4px);
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                z-index: 10;
                transition: all 0.2s ease;
                border: none;
                -webkit-tap-highlight-color: transparent;
            }

            .ebb-heart-btn:hover {
                background: rgba(0, 0, 0, 0.7);
                transform: scale(1.1);
            }

            .ebb-heart-btn:active {
                transform: scale(0.95);
            }

            .ebb-heart-btn svg {
                width: 18px;
                height: 18px;
                fill: transparent;
                stroke: ${CONFIG.textColor};
                stroke-width: 2;
                transition: all 0.3s ease;
            }

            .ebb-heart-btn.active svg {
                fill: ${CONFIG.heartColor};
                stroke: ${CONFIG.heartColor};
            }

            .ebb-heart-btn.animating svg {
                animation: heartPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }

            @keyframes heartPop {
                0% { transform: scale(1); }
                25% { transform: scale(1.3); }
                50% { transform: scale(0.95); }
                100% { transform: scale(1); }
            }

            /* ==================== 卡片容器相對定位 ==================== */
            article,
            .plark,
            .episode-select > a,
            .episode-select > div {
                position: relative !important;
            }

            /* ==================== 雙擊愛心動畫 ==================== */
            .ebb-double-tap-heart {
                position: fixed;
                pointer-events: none;
                z-index: 10000;
                animation: doubleTapHeart 0.8s ease-out forwards;
            }

            .ebb-double-tap-heart svg {
                width: 80px;
                height: 80px;
                fill: ${CONFIG.heartColor};
                filter: drop-shadow(0 0 10px rgba(255, 107, 157, 0.5));
            }

            @keyframes doubleTapHeart {
                0% {
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(0.3);
                }
                15% {
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(1.2);
                }
                30% {
                    transform: translate(-50%, -50%) scale(0.95);
                }
                45% {
                    transform: translate(-50%, -50%) scale(1);
                }
                100% {
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(1) translateY(-30px);
                }
            }

            /* ==================== 觀看次數標籤 ==================== */
            .ebb-view-count {
                position: absolute;
                bottom: 8px;
                left: 8px;
                background: rgba(0, 0, 0, 0.6);
                backdrop-filter: blur(4px);
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 11px;
                color: ${CONFIG.textColor};
                display: flex;
                align-items: center;
                gap: 4px;
                z-index: 5;
            }

            .ebb-view-count svg {
                width: 12px;
                height: 12px;
                fill: ${CONFIG.textColor};
            }
        `;
        document.head.appendChild(style);
    }

    // ==================== SVG 圖示 ====================
    const ICONS = {
        home: '<svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
        list: '<svg viewBox="0 0 24 24"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>',
        history: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
        heart: '<svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
        play: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><polygon points="10 8 16 12 10 16 10 8" fill="currentColor"/></svg>'
    };

    // ==================== 收藏管理 ====================
    const FavoritesManager = {
        KEY: 'ebb_favorites',

        getAll() {
            try {
                return JSON.parse(localStorage.getItem(this.KEY)) || [];
            } catch {
                return [];
            }
        },

        isFavorite(id) {
            return this.getAll().includes(id);
        },

        toggle(id) {
            const favorites = this.getAll();
            const index = favorites.indexOf(id);
            if (index > -1) {
                favorites.splice(index, 1);
            } else {
                favorites.push(id);
            }
            localStorage.setItem(this.KEY, JSON.stringify(favorites));
            return index === -1; // 返回是否已收藏
        }
    };

    // ==================== 底部導航列 ====================
    function createBottomNav() {
        if (document.querySelector('.ebb-bottom-nav')) return;

        const nav = document.createElement('div');
        nav.className = 'ebb-bottom-nav';

        const items = [
            { icon: 'home', label: '首頁', href: '/' },
            { icon: 'list', label: '所有動畫', href: '/list' },
            { icon: 'history', label: '觀看紀錄', href: '/watch-history' },
            { icon: 'heart', label: '我的收藏', href: '/favorites' }
        ];

        const currentPath = window.location.pathname;

        items.forEach(item => {
            const a = document.createElement('a');
            a.className = 'ebb-nav-item' + (currentPath === item.href ? ' active' : '');
            a.href = item.href;
            a.innerHTML = `${ICONS[item.icon]}<span>${item.label}</span>`;

            // 收藏頁面特殊處理
            if (item.href === '/favorites') {
                a.href = 'javascript:void(0)';
                a.addEventListener('click', showFavorites);
            }

            nav.appendChild(a);
        });

        document.body.appendChild(nav);
    }

    // ==================== 愛心按鈕 ====================
    function addHeartButtons() {
        // 選取所有可能的卡片元素
        const selectors = [
            'article',
            '.plark',
            '.episode-select > a',
            '.episode-select > div',
            'a[href*="/watch"]'
        ];

        document.querySelectorAll(selectors.join(', ')).forEach(card => {
            // 跳過已處理的卡片
            if (card.querySelector('.ebb-heart-btn')) return;

            // 跳過太小的元素
            if (card.offsetWidth < 50 || card.offsetHeight < 50) return;

            // 取得唯一識別碼
            const href = card.getAttribute('href') || card.querySelector('a')?.getAttribute('href');
            if (!href) return;

            const match = href.match(/(\d+x\d+)/);
            if (!match) return;
            const id = match[1];

            // 建立愛心按鈕
            const btn = document.createElement('button');
            btn.className = 'ebb-heart-btn' + (FavoritesManager.isFavorite(id) ? ' active' : '');
            btn.innerHTML = ICONS.heart;
            btn.dataset.id = id;

            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                const isNowFavorite = FavoritesManager.toggle(id);
                btn.classList.toggle('active', isNowFavorite);

                // 觸發動畫
                btn.classList.add('animating');
                setTimeout(() => btn.classList.remove('animating'), 400);
            });

            card.style.position = 'relative';
            card.appendChild(btn);
        });
    }

    // ==================== 雙擊愛心動畫 ====================
    let lastTap = 0;
    function setupDoubleTap() {
        document.addEventListener('touchend', (e) => {
            const now = Date.now();
            const timeDiff = now - lastTap;

            if (timeDiff < 300 && timeDiff > 0) {
                // 雙擊觸發
                const touch = e.changedTouches[0];
                showDoubleTapHeart(touch.clientX, touch.clientY);

                // 如果在卡片上雙擊，也觸發收藏
                const card = e.target.closest('article, .plark, a[href*="/watch"]');
                if (card) {
                    const heartBtn = card.querySelector('.ebb-heart-btn');
                    if (heartBtn && !heartBtn.classList.contains('active')) {
                        heartBtn.click();
                    }
                }
            }
            lastTap = now;
        });
    }

    function showDoubleTapHeart(x, y) {
        const heart = document.createElement('div');
        heart.className = 'ebb-double-tap-heart';
        heart.innerHTML = ICONS.heart;
        heart.style.left = x + 'px';
        heart.style.top = y + 'px';
        document.body.appendChild(heart);

        setTimeout(() => heart.remove(), 800);
    }

    // ==================== 收藏頁面 ====================
    function showFavorites() {
        const favorites = FavoritesManager.getAll();
        if (favorites.length === 0) {
            alert('還沒有收藏任何動畫喔！\n點擊愛心按鈕來收藏。');
            return;
        }

        // 導向第一個收藏的動畫（簡易實作）
        window.location.href = '/watch?' + favorites[0];
    }

    // ==================== MutationObserver ====================
    function setupObserver() {
        const observer = new MutationObserver(() => {
            addHeartButtons();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // ==================== 初始化 ====================
    function init() {
        injectStyles();
        createBottomNav();
        addHeartButtons();
        setupDoubleTap();
        setupObserver();

        console.log('ebb.io Mobile UI Enhancement loaded');
    }

    // 確保 DOM 已載入
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
