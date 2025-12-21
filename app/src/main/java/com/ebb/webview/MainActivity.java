package com.ebb.webview;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.pm.ActivityInfo;
import android.graphics.Bitmap;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.webkit.CookieManager;
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

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // 全螢幕沉浸式模式
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_LAYOUT_STABLE |
            View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION |
            View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN |
            View.SYSTEM_UI_FLAG_HIDE_NAVIGATION |
            View.SYSTEM_UI_FLAG_FULLSCREEN |
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
        );
        
        setContentView(R.layout.activity_main);
        
        // 保持螢幕常亮
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        
        webView = findViewById(R.id.webView);
        fullscreenContainer = findViewById(R.id.fullscreen_container);
        
        setupWebView();
        webView.loadUrl(TARGET_URL);
    }
    
    @SuppressLint("SetJavaScriptEnabled")
    private void setupWebView() {
        WebSettings settings = webView.getSettings();
        
        // JavaScript 支援
        settings.setJavaScriptEnabled(true);
        settings.setJavaScriptCanOpenWindowsAutomatically(true);
        
        // DOM Storage 支援
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        
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
        
        // Mixed content 支援
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        
        // User Agent（完全模擬 Chrome 瀏覽器，繞過 Google OAuth WebView 偵測）
        // 必須移除所有 WebView 相關標識，否則 Google 會拒絕登入
        String chromeUserAgent = "Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.230 Mobile Safari/537.36";
        settings.setUserAgentString(chromeUserAgent);
        
        // Cookie 支援
        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);
        cookieManager.setAcceptThirdPartyCookies(webView, true);
        
        // 設定簡單的 WebViewClient
        webView.setWebViewClient(new EbbWebViewClient(this, null));
        
        // 設定 WebChromeClient（支援全螢幕影片）
        webView.setWebChromeClient(new WebChromeClient() {
            
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
                webView.setVisibility(View.GONE);
                
                setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE);
                
                // 隱藏系統 UI
                getWindow().getDecorView().setSystemUiVisibility(
                    View.SYSTEM_UI_FLAG_FULLSCREEN |
                    View.SYSTEM_UI_FLAG_HIDE_NAVIGATION |
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
                webView.setVisibility(View.VISIBLE);
                
                customView = null;
                if (customViewCallback != null) {
                    customViewCallback.onCustomViewHidden();
                    customViewCallback = null;
                }
                
                setRequestedOrientation(originalOrientation);
                
                // 恢復系統 UI
                getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_VISIBLE);
            }
            
            @Override
            public Bitmap getDefaultVideoPoster() {
                return Bitmap.createBitmap(1, 1, Bitmap.Config.ARGB_8888);
            }
        });
    }
    
    @Override
    public void onBackPressed() {
        // 如果在全螢幕模式，先退出全螢幕
        if (customView != null) {
            webView.getWebChromeClient();
            if (customViewCallback != null) {
                customViewCallback.onCustomViewHidden();
            }
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
