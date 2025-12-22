// ebb.io 自動重新加載腳本
// 原作者: CcydtN
// 整合至 Android WebView

(function () {
    'use strict';

    const flag_name = "reload";
    const current_season_key = "current_seasonId";
    const current_episode_key = "current_episode";

    function set_flag(val) {
        sessionStorage.setItem(flag_name, val);
    }

    function get_flag() {
        return sessionStorage.getItem(flag_name) === "true";
    }

    function set_current_video(seasonId, episode) {
        sessionStorage.setItem(current_season_key, seasonId);
        sessionStorage.setItem(current_episode_key, episode);
    }

    function get_current_video() {
        return {
            seasonId: sessionStorage.getItem(current_season_key),
            episode: sessionStorage.getItem(current_episode_key)
        };
    }

    const config = {
        attributes: false,
        childList: true,
        characterData: false,
        subtree: true,
    };

    // 簡易 jQuery 替代函數
    function $(selector) {
        const elements = document.querySelectorAll(selector);
        return {
            length: elements.length,
            first: function () {
                return elements[0];
            },
            each: function (callback) {
                elements.forEach((el, index) => callback(index, el));
            },
            attr: function (name) {
                return elements[0] ? elements[0].getAttribute(name) : null;
            }
        };
    }

    // 頁面修改函數
    function page_modify(list, observer) {
        observer.disconnect();

        add_button_for_each_episode();

        const flag = get_flag();
        if (!flag) {
            observer.observe(document.body, config);
            return;
        }

        const isError = $(".error-message").length !== 0;
        if (isError) {
            console.log("Detect loading error, try reloading");
            fail_handle();
            observer.observe(document.body, config);
            return;
        }

        const videoEl = $("video").first();
        const isLoaded = videoEl && videoEl.getAttribute("src");
        if (isLoaded) {
            console.log("Video ready, Stop reloading");
            set_flag(false);
        }

        observer.observe(document.body, config);
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
                set_current_video(seasonId, episode);
                updateWatchHistory(seasonId, episode);
                // 模擬點擊原本的試看按鈕
                retry_video();
            });

            clone.setAttribute("href", "javascript:void(0)");
            clone.textContent = "(・∀・)";

            element.appendChild(clone);
            console.log("Button added, episode: " + episode + ", seasonId: " + seasonId);
        });
    }

    function fail_handle() {
        // check for a div - if exist, fail_handle had run already
        if (document.querySelectorAll(".error-message div div").length !== 0) {
            return;
        }
        console.log("check");

        const delay = 5;
        const delay_ms = delay * 1000;
        console.log("Set timer " + delay + "s");

        // add reload countdown and cancel button to error message
        const message = document.createElement("div");
        message.innerHTML = '<br><a id="counter">' + delay + '</a><a> 秒後重試... </a><a href="javascript:void(0)" id="cancelBtn">取消</a>';

        const errorDiv = document.querySelector(".error-message div");
        if (errorDiv) {
            errorDiv.appendChild(message);
        }

        const counter = document.getElementById("counter");
        const cancel = document.getElementById("cancelBtn");

        const timeoutIds = [];

        // retry timeout - 使用 retry_video 而不是 location.reload
        timeoutIds.push(setTimeout(function () {
            retry_video();
        }, delay_ms));

        // countdown
        for (let i = 1; i <= delay; i++) {
            const idx = setTimeout(function () {
                if (counter) {
                    counter.textContent = parseInt(counter.textContent) - 1;
                }
            }, 1000 * i);
            timeoutIds.push(idx);
        }

        if (cancel) {
            cancel.addEventListener("click", function (event) {
                console.log("Stop reloading");
                set_flag(false);
                for (const idx of timeoutIds) {
                    clearTimeout(idx);
                }
                message.remove();
            });
        }
    }

    // 模擬點擊試看按鈕來重試影片
    function retry_video() {
        const video = get_current_video();
        if (!video.seasonId || !video.episode) {
            console.log("No video info found, fallback to reload");
            location.reload();
            return;
        }

        console.log("Retrying video:", video.seasonId, video.episode);

        // 先更新觀看記錄（這會強制服務器重新提供影片）
        updateWatchHistory(video.seasonId, video.episode);

        // 找到並點擊對應的試看按鈕
        const episodeLinks = document.querySelectorAll('div.actions a[href*="watch"]');
        let targetButton = null;

        episodeLinks.forEach(function (link) {
            const href = link.getAttribute('href');
            if (href && href.includes('seasonId=' + video.seasonId) && href.includes('episode=' + video.episode)) {
                targetButton = link;
            }
        });

        if (targetButton) {
            console.log("Found and clicking the watch button");
            // 直接觸發原本的點擊，這會導航到播放頁面
            targetButton.click();
        } else {
            // 如果找不到按鈕，嘗試直接導航到播放頁面
            console.log("Button not found, navigating directly");
            const watchUrl = '/watch?seasonId=' + video.seasonId + '&episode=' + video.episode + '&t=' + Date.now();
            window.location.href = watchUrl;
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

        const xhttp = new XMLHttpRequest();
        xhttp.open("POST", api_url, false);
        xhttp.send(data);
    }

    // Entry point
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            const observer = new MutationObserver(page_modify);
            observer.observe(document.body, config);
        });
    } else {
        const observer = new MutationObserver(page_modify);
        observer.observe(document.body, config);
    }

    console.log("ebb.io auto-reload script loaded");
})();
