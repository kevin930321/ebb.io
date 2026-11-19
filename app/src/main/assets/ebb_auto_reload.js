// ebb.io 自動重新加載腳本
// 原作者: CcydtN
// 整合至 Android WebView

(function () {
    'use strict';

    // 同一份文件只初始化一次，避免重複注入時疊加多個 observer
    if (window.__ebbAutoReload) {
        return;
    }
    window.__ebbAutoReload = true;

    const flag_name = "reload";

    // 偵測到錯誤後多久重試（毫秒）
    const RETRY_DELAY_MS = 0;

    // DOM 變動時最多每隔多久處理一次（毫秒），避免播放器 UI 一直變動時頻繁執行
    const THROTTLE_MS = 100;

    function set_flag(val) {
        sessionStorage.setItem(flag_name, val);
    }

    function get_flag() {
        return sessionStorage.getItem(flag_name) === "true";
    }

    const config = {
        attributes: false,
        childList: true,
        characterData: false,
        subtree: true,
    };

    // 頁面修改函數
    function page_modify() {
        add_button_for_each_episode();

        // 檢查是否為人流管制錯誤
        const errorEl = document.querySelector(".error-message");
        const isRateLimit = errorEl !== null && errorEl.innerText.includes("人流管制");

        // 如果沒有開啟重試標記且不是人流管制，則不執行後續
        if (!get_flag() && !isRateLimit) {
            return;
        }

        if (errorEl) {
            console.log("Detect loading error, try reloading");
            if (isRateLimit) {
                console.log("Detect rate limit, auto-starting retry sequence");
                // 設為 true 以便後續持續追蹤（雖然後續檢查也會看 isRateLimit，但設個 flag 較保險）
                set_flag(true);
            }
            fail_handle();
            return;
        }

        const videoEl = document.querySelector("video");
        if (videoEl && videoEl.getAttribute("src")) {
            console.log("Video ready, Stop reloading");
            set_flag(false);
        }
    }

    function add_button_for_each_episode() {
        document.querySelectorAll("div.actions").forEach(function (element) {
            // skip if already append
            if (element.children.length !== 1) {
                return;
            }

            const firstChild = element.children[0];
            const clone = firstChild.cloneNode(true);
            const href = clone.getAttribute("href");

            if (!href) return;

            const episode_start = href.indexOf("=") + 1;
            const episode = href.substring(episode_start);

            const seasonId_start = href.indexOf("x") + 1;
            const seasonId_end = href.indexOf("&");
            const seasonId = href.substring(seasonId_start, seasonId_end);

            clone.addEventListener("click", function (event) {
                console.log("Start reloading");
                event.preventDefault();
                set_flag(true);
                // 先更新觀看紀錄再重試（非同步，不會卡住畫面）
                updateWatchHistory(seasonId, episode).then(trigger_player_retry);
            });

            clone.setAttribute("href", "javascript:void(0)");
            clone.textContent = "(・∀・)";

            element.appendChild(clone);
            console.log("Button added, episode: " + episode + ", seasonId: " + seasonId);
        });
    }

    function fail_handle() {
        // check for a div - if exist, fail_handle had run already
        if (document.querySelector(".error-message div div")) {
            return;
        }

        // add retry message and cancel button to error message
        const message = document.createElement("div");
        message.innerHTML = '<br><a>重試中... </a><a href="javascript:void(0)">取消</a>';

        const errorDiv = document.querySelector(".error-message div");
        if (errorDiv) {
            errorDiv.appendChild(message);
        }

        const timeoutId = setTimeout(trigger_player_retry, RETRY_DELAY_MS);

        message.lastElementChild.addEventListener("click", function () {
            console.log("Stop reloading");
            set_flag(false);
            clearTimeout(timeoutId);
            message.remove();
        });
    }

    function trigger_player_retry() {
        console.log("Attempting to retry video via Vue component...");
        const playerEl = Array.from(document.querySelectorAll('*')).find(e => e.__vue__ && e.__vue__.$options.name === 'player-x');

        if (playerEl && playerEl.__vue__) {
            console.log("Player component found, triggering reload.");
            const vm = playerEl.__vue__;
            // The method found to reload the video data
            vm.onVdataChanged(vm.vdata);
        } else {
            console.warn("Player component not found, falling back to location.reload()");
            location.reload();
        }
    }

    function updateWatchHistory(seasonId, episode) {
        const api_url = "https://ebb.io/_/update_watch_history";

        const title = '"' + episode + '"';
        const data = new FormData();

        data.set("seasonId", seasonId);
        data.set("title", title);
        data.set("time", 0);
        console.log("Updating watch history:", seasonId, episode);

        // 失敗也照樣繼續重試
        return fetch(api_url, { method: "POST", body: data }).catch(function (err) {
            console.warn("Failed to update watch history:", err);
        });
    }

    // 影片播放中才保持螢幕常亮（由 MainActivity 提供的 EbbAndroid 介面處理）
    function set_keep_screen_on(keepOn) {
        if (window.EbbAndroid) {
            window.EbbAndroid.setKeepScreenOn(keepOn);
        }
    }

    function update_keep_screen_on() {
        const playing = Array.prototype.some.call(document.querySelectorAll("video"), function (v) {
            return !v.paused && !v.ended;
        });
        set_keep_screen_on(playing);
    }

    // 媒體事件不會冒泡，要在捕獲階段監聽
    ["play", "playing", "pause", "ended", "emptied"].forEach(function (type) {
        document.addEventListener(type, update_keep_screen_on, true);
    });
    window.addEventListener("pagehide", function () {
        set_keep_screen_on(false);
    });

    // Entry point
    let observer = null;
    let pendingTimer = null;

    function run_page_modify() {
        pendingTimer = null;
        // 處理期間暫停觀察，避免自己修改 DOM 又觸發 observer
        observer.disconnect();
        try {
            page_modify();
        } finally {
            observer.observe(document.body, config);
        }
    }

    // 節流：短時間內的多次 DOM 變動合併成一次處理
    function schedule_page_modify() {
        if (pendingTimer === null) {
            pendingTimer = setTimeout(run_page_modify, THROTTLE_MS);
        }
    }

    function start() {
        observer = new MutationObserver(schedule_page_modify);
        observer.observe(document.body, config);
        schedule_page_modify();
        update_keep_screen_on();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }

    console.log("ebb.io auto-reload script loaded");
})();
