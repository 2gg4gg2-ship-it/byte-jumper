package com.bytejumper.app

import android.annotation.SuppressLint
import android.app.Activity
import android.graphics.Color
import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient

/**
 * Оболочка игры: показывает assets/index.html в WebView. Никакого моста и сети нет.
 * Кнопка «Назад» сначала закрывает экран игры (window.__back в shim.js), и только потом приложение.
 */
class MainActivity : Activity() {

    private lateinit var web: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        web = WebView(this)
        web.setBackgroundColor(Color.parseColor("#0B0B0C"))
        with(web.settings) {
            javaScriptEnabled = true
            domStorageEnabled = true // тут хранится прогресс игры
            allowFileAccess = false // страницы из assets (file:///android_asset) это не затрагивает
            allowContentAccess = false
            mediaPlaybackRequiresUserGesture = false
        }
        web.webViewClient = object : WebViewClient() {
            // Внешние ссылки не открываем: игре они не нужны
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean = true
        }
        // Единственный мост: закрыть приложение, когда игрок вышел из главного экрана игры
        web.addJavascriptInterface(object {
            @JavascriptInterface
            fun exit() {
                runOnUiThread { finish() }
            }
        }, "Android")
        setContentView(web)
        web.loadUrl("file:///android_asset/index.html")
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        web.evaluateJavascript("window.__back ? window.__back() : false") { r ->
            if (r != "true") finish()
        }
    }

    override fun onPause() {
        super.onPause()
        web.onPause()
    }

    override fun onResume() {
        super.onResume()
        web.onResume()
    }
}
