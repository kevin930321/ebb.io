# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /sdk/tools/proguard/proguard-android.txt

# WebView
-keepclassmembers class * extends android.webkit.WebViewClient {
    public void *(android.webkit.WebView, java.lang.String, android.graphics.Bitmap);
    public boolean *(android.webkit.WebView, java.lang.String);
    public void *(android.webkit.WebView, java.lang.String);
}

# 網頁腳本透過 addJavascriptInterface 呼叫的方法（MainActivity.ScreenBridge）
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
