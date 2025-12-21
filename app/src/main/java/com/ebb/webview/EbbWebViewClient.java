package com.ebb.webview;

import android.content.Context;
import android.graphics.Bitmap;
import android.view.View;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.ProgressBar;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;

/**
 * EbbWebViewClient - 支援自動重載腳本注入
 */
public class EbbWebViewClient extends WebViewClient {
    
    private final Context context;
    private final ProgressBar progressBar;
    private String cachedScript = null;
    
    public EbbWebViewClient(Context context, ProgressBar progressBar) {
        this.context = context;
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
        
        // 只在 ebb.io 網頁注入腳本
        if (url != null && url.contains("ebb.io")) {
            injectScript(view);
        }
    }
    
    @Override
    public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
        // 讓 WebView 處理所有 URL
        return false;
    }
    
    /**
     * 從 assets 載入並注入自動重載腳本
     */
    private void injectScript(WebView view) {
        if (cachedScript == null) {
            // Load both scripts
            StringBuilder combinedScript = new StringBuilder();
            
            String autoReload = loadScriptFromAssets("ebb_auto_reload.js");
            if (autoReload != null) combinedScript.append(autoReload).append("\n");
            
            String mobileUi = loadScriptFromAssets("ebb_mobile_ui.js");
            if (mobileUi != null) combinedScript.append(mobileUi).append("\n");
            
            cachedScript = combinedScript.toString();
        }
        
        if (cachedScript != null && !cachedScript.isEmpty()) {
            view.evaluateJavascript(cachedScript, null);
        }
    }
    
    /**
     * 從 assets 目錄讀取 JavaScript 檔案
     */
    private String loadScriptFromAssets(String filename) {
        StringBuilder script = new StringBuilder();
        try {
            InputStream inputStream = context.getAssets().open(filename);
            BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream));
            String line;
            while ((line = reader.readLine()) != null) {
                script.append(line).append("\n");
            }
            reader.close();
            inputStream.close();
        } catch (IOException e) {
            e.printStackTrace();
            return null;
        }
        return script.toString();
    }
}
