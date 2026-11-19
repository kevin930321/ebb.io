package com.ebb.webview;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.pm.ActivityInfo;
import android.graphics.Bitmap;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.FrameLayout;

public class MainActivity extends Activity {

    private static final String TARGET_URL = "https://ebb.io/";

    private WebView webView;
    private FrameLayout fullscreenContainer;
    private View customView;
    private WebChromeClient.CustomViewCallback customViewCallback;
    private int originalOrientation;
    private WebChromeClient webChromeClient;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // 設定視窗屬性（螢幕常亮改由網頁腳本在影片播放時開啟，見 ScreenBridge）
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
        getWindow().setStatusBarColor(0xFF1D2833);
        getWindow().setNavigationBarColor(0xFF253644);

        super.onCreate(savedInstanceState);

        setContentView(R.layout.activity_main);

        // 保持佈局穩定
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_LAYOUT_STABLE
        );

        webView = findViewById(R.id.webView);
        fullscreenContainer = findViewById(R.id.fullscreen_container);

        // 設定 WebView 背景色，避免載入時顯示白色
        webView.setBackgroundColor(0xFF253644);

        setupWebView();

        // 有保存的狀態（例如程序被回收後重建）就還原，否則才載入首頁，避免載入兩次
        if (savedInstanceState == null || webView.restoreState(savedInstanceState) == null) {
            webView.loadUrl(TARGET_URL);
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void setupWebView() {
        WebSettings settings = webView.getSettings();

        // JavaScript 支援
        settings.setJavaScriptEnabled(true);
        settings.setJavaScriptCanOpenWindowsAutomatically(true);

        // DOM Storage 支援
        settings.setDomStorageEnabled(true);

        // 快取設定
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);

        // 縮放支援
        settings.setSupportZoom(true);
        settings.setBuiltInZoomControls(true);
        settings.setDisplayZoomControls(false);

        // 視窗適配
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);

        // 媒體播放設定
        settings.setMediaPlaybackRequiresUserGesture(false);

        // 只載入遠端網站，不需要存取本機檔案
        settings.setAllowFileAccess(false);

        // Mixed content 支援
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);

        // User Agent：以系統 WebView 的 UA 為基礎，移除 WebView 相關標識（"; wv"、"Build/..."、"Version/4.0"），
        // 讓 Google OAuth 視為一般 Chrome；Chrome 版本號會跟著系統 WebView 自動更新
        String chromeUserAgent = WebSettings.getDefaultUserAgent(this)
                .replace("; wv", "")
                .replaceAll(" Build/[^;)]+", "")
                .replaceAll("Version/[\\d.]+ ", "");
        settings.setUserAgentString(chromeUserAgent);

        // Cookie 支援
        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);
        cookieManager.setAcceptThirdPartyCookies(webView, true);

        // 讓網頁腳本在影片播放時控制螢幕常亮
        webView.addJavascriptInterface(new ScreenBridge(), "EbbAndroid");

        // WebViewClient（負責注入自動重載腳本，必須在 loadUrl 之前設定）
        webView.setWebViewClient(new EbbWebViewClient(webView));

        // 設定 WebChromeClient（支援全螢幕影片）
        webChromeClient = new WebChromeClient() {

            @Override
            public void onShowCustomView(View view, CustomViewCallback callback) {
                if (customView != null) {
                    callback.onCustomViewHidden();
                    return;
                }

                customView = view;
                customViewCallback = callback;
                originalOrientation = getRequestedOrientation();

                fullscreenContainer.addView(customView);
                fullscreenContainer.setVisibility(View.VISIBLE);
                // 不要隱藏 WebView，只讓它在後面，避免影片暫停
                // webView.setVisibility(View.GONE);

                setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE);

                // 隱藏系統 UI（狀態列和導航列）
                getWindow().getDecorView().setSystemUiVisibility(
                    View.SYSTEM_UI_FLAG_LAYOUT_STABLE |
                    View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION |
                    View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN |
                    View.SYSTEM_UI_FLAG_HIDE_NAVIGATION |
                    View.SYSTEM_UI_FLAG_FULLSCREEN |
                    View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                );
            }

            @Override
            public void onHideCustomView() {
                if (customView == null) {
                    return;
                }

                fullscreenContainer.removeView(customView);
                fullscreenContainer.setVisibility(View.GONE);
                // webView.setVisibility(View.VISIBLE);

                customView = null;
                if (customViewCallback != null) {
                    customViewCallback.onCustomViewHidden();
                    customViewCallback = null;
                }

                setRequestedOrientation(originalOrientation);

                // 恢復系統 UI（顯示狀態列和導航列）
                getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
            }

            @Override
            public Bitmap getDefaultVideoPoster() {
                return Bitmap.createBitmap(1, 1, Bitmap.Config.ARGB_8888);
            }
        };
        webView.setWebChromeClient(webChromeClient);
    }

    /**
     * 提供給網頁腳本（ebb_auto_reload.js）呼叫：影片播放中才保持螢幕常亮
     */
    public final class ScreenBridge {
        @JavascriptInterface
        public void setKeepScreenOn(final boolean keepOn) {
            // JavascriptInterface 在背景執行緒被呼叫，視窗操作要回到 UI 執行緒
            runOnUiThread(() -> {
                if (keepOn) {
                    getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                } else {
                    getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                }
            });
        }
    }

    @Override
    public void onBackPressed() {
        // 如果在全螢幕模式，先退出全螢幕
        if (customView != null && webChromeClient != null) {
            webChromeClient.onHideCustomView();
            return;
        }

        // 如果 WebView 可以返回，則返回上一頁
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        // 保存 WebView 狀態（包含影片播放位置、網頁滾動位置等），於 onCreate 還原
        webView.saveState(outState);
    }

    @Override
    protected void onResume() {
        super.onResume();
        webView.onResume();
    }

    @Override
    protected void onPause() {
        super.onPause();
        webView.onPause();
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.destroy();
        }
        super.onDestroy();
    }
}
