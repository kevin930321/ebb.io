package com.ebb.webview;

import android.content.Context;
import android.graphics.Bitmap;
import android.view.View;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.ProgressBar;

/**
 * 簡單的 WebViewClient
 */
public class EbbWebViewClient extends WebViewClient {
    
    private final ProgressBar progressBar;
    
    public EbbWebViewClient(Context context, ProgressBar progressBar) {
        this.progressBar = progressBar;
    }
    
    @Override
    public void onPageStarted(WebView view, String url, Bitmap favicon) {
        super.onPageStarted(view, url, favicon);
        if (progressBar != null) {
            progressBar.setVisibility(View.VISIBLE);
        }
    }
    
    @Override
    public void onPageFinished(WebView view, String url) {
        super.onPageFinished(view, url);
        if (progressBar != null) {
            progressBar.setVisibility(View.GONE);
        }
    }
    
    @Override
    public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
        // 讓 WebView 處理所有 URL
        return false;
    }
}
