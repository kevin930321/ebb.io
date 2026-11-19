package com.ebb.webview;

import android.content.Context;
import android.net.Uri;
import android.util.Log;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.webkit.WebViewCompat;
import androidx.webkit.WebViewFeature;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

/**
 * EbbWebViewClient - 負責注入自動重載腳本
 *
 * 系統 WebView 支援時，用 addDocumentStartJavaScript 在每份 ebb.io 文件開始載入時注入一次；
 * 不支援時退回 onPageFinished 注入（腳本本身有防重複初始化的保護）。
 */
public class EbbWebViewClient extends WebViewClient {

    private static final String TAG = "EbbWebViewClient";
    private static final String SCRIPT_ASSET = "ebb_auto_reload.js";
    private static final String EBB_HOST = "ebb.io";
    private static final Set<String> ALLOWED_ORIGINS = new HashSet<>(Arrays.asList(
            "https://" + EBB_HOST,
            "https://*." + EBB_HOST
    ));

    private final String script;
    private final boolean injectOnPageFinished;

    /**
     * 必須在 webView.loadUrl() 之前建立，document-start 腳本才會套用到第一個頁面。
     */
    public EbbWebViewClient(WebView webView) {
        script = loadScriptFromAssets(webView.getContext(), SCRIPT_ASSET);

        boolean documentStart = false;
        if (script != null && WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT)) {
            WebViewCompat.addDocumentStartJavaScript(webView, script, ALLOWED_ORIGINS);
            documentStart = true;
        }
        injectOnPageFinished = script != null && !documentStart;
    }

    @Override
    public void onPageFinished(WebView view, String url) {
        super.onPageFinished(view, url);

        // 退回方案：只在 ebb.io 網頁注入腳本
        if (injectOnPageFinished && isEbbUrl(url)) {
            view.evaluateJavascript(script, null);
        }
    }

    @Override
    public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
        // 讓 WebView 處理所有 URL
        return false;
    }

    /**
     * 比對網址的 host，避免像 Google 登入頁這種網址參數裡含有 "ebb.io" 的頁面被誤判
     */
    private static boolean isEbbUrl(String url) {
        if (url == null) {
            return false;
        }
        String host = Uri.parse(url).getHost();
        return host != null && (host.equals(EBB_HOST) || host.endsWith("." + EBB_HOST));
    }

    /**
     * 從 assets 目錄讀取 JavaScript 檔案
     */
    private static String loadScriptFromAssets(Context context, String filename) {
        StringBuilder sb = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(
                context.getAssets().open(filename), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line).append('\n');
            }
        } catch (IOException e) {
            Log.e(TAG, "Failed to load " + filename, e);
            return null;
        }
        return sb.toString();
    }
}
