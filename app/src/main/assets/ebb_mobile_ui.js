/**
 * Ebb Mobile UI Enhancements
 * Transforms the web UI to look like a native app (Animation Fun style).
 */
(function () {
    'use strict';

    // --- CSS Styles ---
    const styles = `
        /* Global Overrides */
        body {
            background-color: #0b1622 !important;
            color: #ffffff;
            -webkit-tap-highlight-color: transparent;
            user-select: none; /* Prevent text selection for app-feel */
        }
        
        /* Hide Scrollbar */
        ::-webkit-scrollbar {
            display: none;
        }

        /* Hide Original Header/Footer if possible, or adjust padding */
        /* Assuming 'nav' or 'header' is the top bar */
        nav, header {
            display: none !important;
        }

        /* Main Container - Grid View */
        main {
            padding: 10px 10px 70px 10px !important; /* Bottom padding for nav bar */
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 12px !important; 
        }

        /* Adjust potential wrapper divs if 'main' isn't the direct grid container */
        main > div {
            display: contents !important; /* Flatten structure if needed */
        }

        /* Anime Card Styling */
        a[href^='/watch?'] {
            position: relative !important;
            display: flex !important;
            flex-direction: column !important;
            text-decoration: none !important;
            margin: 0 !important;
            width: 100% !important;
            border-radius: 8px !important;
            overflow: hidden !important;
            background: transparent !important;
        }

        /* Thumbnail Container */
        a[href^='/watch?'] > div:first-child {
            width: 100% !important;
            aspect-ratio: 16/9 !important;
            border-radius: 8px !important;
            overflow: hidden !important;
            position: relative !important;
            background-color: #1e2a38;
        }

        /* Thumbnail Image */
        a[href^='/watch?'] > div:first-child > div {
            width: 100% !important;
            height: 100% !important;
            background-size: cover !important;
            background-position: center !important;
            transition: transform 0.2s;
        }

        /* Title Styling */
        a[href^='/watch?'] h1, a[href^='/watch?'] h2 {
            font-size: 14px !important;
            line-height: 1.3 !important;
            margin: 6px 0 2px 0 !important;
            color: #fff !important;
            font-weight: 500 !important;
            display: -webkit-box !important;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            white-space: normal !important;
            text-align: left !important;
        }

        /* Subtitle/Meta Styling */
        a[href^='/watch?'] > div:last-child {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            font-size: 11px !important;
            color: #aaa !important;
            width: 100% !important;
        }

        /* Heart Overlay on Card */
        .card-heart {
            position: absolute;
            top: 6px;
            right: 6px;
            width: 24px;
            height: 24px;
            background: rgba(0,0,0,0.5);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10;
            pointer-events: none; /* Let clicks pass through to card for double tap */
        }
        
        .card-heart svg {
            width: 14px;
            height: 14px;
            fill: white;
            transition: fill 0.3s transform 0.2s;
        }

        .card-heart.active svg {
            fill: #ff4081;
            transform: scale(1.1);
        }

        /* Double Tap Heart Animation */
        .popup-heart {
            position: absolute;
            width: 80px;
            height: 80px;
            background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ff4081'%3E%3Cpath d='M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'/%3E%3C/svg%3E") no-repeat center center;
            pointer-events: none;
            z-index: 1000;
            transform: translate(-50%, -50%) scale(0);
            animation: popup 0.8s ease-out forwards;
        }

        @keyframes popup {
            0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
            15% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
            30% { transform: translate(-50%, -50%) scale(1.0); opacity: 1; }
            100% { transform: translate(-50%, -150%) scale(1.5); opacity: 0; }
        }

        /* Bottom Navigation Bar */
        #mobile-nav-bar {
            position: fixed;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 56px;
            background: #1e1e1e;
            border-top: 1px solid #333;
            display: flex;
            justify-content: space-around;
            align-items: center;
            z-index: 9999;
            box-shadow: 0 -2px 10px rgba(0,0,0,0.3);
        }

        .nav-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: #888;
            font-size: 10px;
            text-decoration: none;
            width: 25%;
            height: 100%;
        }

        .nav-item.active {
            color: #00b0ff; /* App theme blue */
        }

        .nav-item svg {
            width: 24px;
            height: 24px;
            margin-bottom: 2px;
            fill: currentColor;
        }
        
        /* Favorites Page Specifics */
        .favorites-empty {
            text-align: center;
            padding: 40px;
            color: #666;
            grid-column: 1 / -1;
        }

        /* Hide elements not needed in mobile view if necessary */
        .sidebar, .ads, .footer {
            display: none !important;
        }
    `;

    // --- SVGs ---
    const svgs = {
        home: '<svg viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>',
        all: '<svg viewBox="0 0 24 24"><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9h-4v4h-2v-4H9V9h4V5h2v4h4v2z"/></svg>', // "New" icon actually as placeholder
        history: '<svg viewBox="0 0 24 24"><path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/></svg>',
        heart: '<svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>',
        heartOutline: '<svg viewBox="0 0 24 24"><path d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z"/></svg>'
    };

    // --- State Management ---
    const STORAGE_KEY = 'ebb_favorites';
    function getFavorites() {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    }

    function isFavorite(url) {
        return getFavorites().some(f => f.url === url);
    }

    function toggleFavorite(cardData) {
        let favs = getFavorites();
        const index = favs.findIndex(f => f.url === cardData.url);

        if (index >= 0) {
            favs.splice(index, 1);
        } else {
            favs.push(cardData);
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(favs));
        return index === -1; // return true if added
    }

    // --- UI Injection ---
    function injectStyles() {
        const styleEl = document.createElement('style');
        styleEl.textContent = styles;
        document.head.appendChild(styleEl);
    }

    function createBottomNav() {
        if (document.getElementById('mobile-nav-bar')) return;

        const nav = document.createElement('div');
        nav.id = 'mobile-nav-bar';

        const tabs = [
            { id: 'home', label: '首頁', icon: svgs.home, action: () => { window.location.href = '/'; } },
            { id: 'all', label: '所有動畫', icon: svgs.all, action: () => { window.location.href = '/anime'; } }, // Assuming /anime exists or similar
            { id: 'history', label: '觀看紀錄', icon: svgs.history, action: () => { alert('功能開發中'); } },
            { id: 'favorites', label: '我的動畫', icon: svgs.heartOutline, action: showFavorites }
        ];

        tabs.forEach(tab => {
            const link = document.createElement('a');
            link.className = 'nav-item';
            if (window.location.pathname === '/' && tab.id === 'home') link.classList.add('active');
            // Basic active state check logic can be improved

            link.innerHTML = `${tab.icon}<span>${tab.label}</span>`;
            link.href = 'javascript:void(0)';
            link.onclick = (e) => {
                e.preventDefault();
                // Reset active class
                document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
                link.classList.add('active');
                tab.action();
            };
            nav.appendChild(link);
        });

        document.body.appendChild(nav);
    }

    // --- Interaction Logic ---
    function setupCardUsingDoubleTap(card) {
        if (card.dataset.processed) return;
        card.dataset.processed = "true";

        // Add heart icon overlay
        const heartOverlay = document.createElement('div');
        heartOverlay.className = 'card-heart';
        const url = card.getAttribute('href');
        if (isFavorite(url)) heartOverlay.classList.add('active');
        heartOverlay.innerHTML = svgs.heart;

        // Find image container to append heart
        const imgContainer = card.querySelector('div:first-child');
        if (imgContainer) {
            imgContainer.appendChild(heartOverlay);
        }

        // Double Tap Logic
        let lastTap = 0;
        card.addEventListener('click', function (e) {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;

            if (tapLength < 300 && tapLength > 0) {
                // Double Tap Detected
                e.preventDefault();
                e.stopPropagation(); // Stop navigation

                // Animate
                showHeartAnimation(e.clientX, e.clientY);

                // Toggle Favorite
                const title = card.querySelector('h1, h2')?.textContent.trim();
                const bgImage = card.querySelector('div:first-child > div')?.style.backgroundImage;
                // Extract clean URL from background-image: url("...")
                let imgUrl = '';
                if (bgImage) {
                    const match = bgImage.match(/url\("?(.+?)"?\)/);
                    if (match) imgUrl = match[1];
                }

                const newStatus = toggleFavorite({ url, title, imgUrl });
                if (newStatus) {
                    heartOverlay.classList.add('active');
                } else {
                    heartOverlay.classList.remove('active');
                }

            } else {
                // Single Tap - let it bubble to navigation after short delay to check for double? 
                // Alternatively, just let it nav immediately if not double tap. 
                // But standard double-tap impl usually delays single tap action.
                // For simplicity here, we don't delay, which might make accidental navs on double tap.
                // We'll rely on fast user fingers or modify behavior if needed.

                // To prevent nav on double tap, we actually need to intercept default click always 
                // and programmatically nav if no second tap comes.
            }
            lastTap = currentTime;
        });
    }

    function showHeartAnimation(x, y) {
        const heart = document.createElement('div');
        heart.className = 'popup-heart';
        heart.style.left = x + 'px';
        heart.style.top = y + 'px';
        document.body.appendChild(heart);

        setTimeout(() => {
            heart.remove();
        }, 800);
    }

    // --- Page Modification ---
    function modifyPage() {
        const cards = document.querySelectorAll('a[href^="/watch?"]');
        cards.forEach(setupCardUsingDoubleTap);
    }

    function showFavorites() {
        // Clear main content and show favorites
        const main = document.querySelector('main');
        if (!main) return;

        // Save original content if needed? For now just wipe and rebuild.
        // Better: Hide existing children, append favorites container.

        // Hide all direct children
        Array.from(main.children).forEach(c => c.style.display = 'none');

        // Check if fav container exists
        let favContainer = document.getElementById('fav-container');
        if (!favContainer) {
            favContainer = document.createElement('div');
            favContainer.id = 'fav-container';
            favContainer.style.display = 'contents'; // Acts as part of grid
            main.appendChild(favContainer);
        } else {
            favContainer.innerHTML = '';
            favContainer.style.display = 'contents';
        }

        const favs = getFavorites();
        if (favs.length === 0) {
            favContainer.innerHTML = '<div class="favorites-empty">只要雙擊喜歡的動畫，就會出現在這裡喔！<br>(・∀・)</div>';
            return;
        }

        favs.forEach(item => {
            // Recreate card DOM
            const card = document.createElement('a');
            card.href = item.url;

            card.innerHTML = `
                <div><div style="background-image: url('${item.imgUrl}')"></div></div>
                <h1>${item.title}</h1>
                <div><div>收藏</div><div>...</div></div>
            `;

            // Add heart
            const heartOverlay = document.createElement('div');
            heartOverlay.className = 'card-heart active';
            heartOverlay.innerHTML = svgs.heart;
            card.querySelector('div:first-child').appendChild(heartOverlay);

            // Re-bind double tap logic (to allow unfavoriting)
            setupCardUsingDoubleTap(card);

            favContainer.appendChild(card);
        });
    }

    // --- init ---
    function init() {
        console.log("Initializing Ebb Mobile UI...");
        injectStyles();
        createBottomNav();

        // Observer for dynamic content (Vue SPA)
        const observer = new MutationObserver((mutations) => {
            modifyPage();
            // If we are on "Favorites" tab, ensure we hide original content that might be injected by Vue
            if (document.querySelector('.nav-item.active')?.id === 'favorites') {
                const main = document.querySelector('main');
                if (main) {
                    Array.from(main.children).forEach(c => {
                        if (c.id !== 'fav-container') c.style.display = 'none';
                    });
                }
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });

        // Initial run
        modifyPage();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
