package com.rombmaster.game;

import android.graphics.Color;
import android.webkit.WebSettings;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import androidx.core.graphics.Insets;
import androidx.core.splashscreen.SplashScreen;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        SplashScreen.installSplashScreen(this);
        super.onCreate(savedInstanceState);
        // Avoid stale game snapshots being shown as startup previews on API 33+.
        // Ordinary screenshots and screen recordings are still allowed.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            setRecentsScreenshotEnabled(false);
        }
        // This is a fixed-scale mobile game, not a document viewer. Prevent
        // Android WebView's pinch/double-tap page zoom across every screen.
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().setBackgroundColor(Color.rgb(7, 20, 35));
            WebSettings webSettings = getBridge().getWebView().getSettings();
            webSettings.setSupportZoom(false);
            webSettings.setBuiltInZoomControls(false);
            webSettings.setDisplayZoomControls(false);
        }
        Window window = getWindow();
        WindowCompat.setDecorFitsSystemWindows(window, false);
        window.setStatusBarColor(Color.TRANSPARENT);
        window.setNavigationBarColor(Color.TRANSPARENT);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            window.setStatusBarContrastEnforced(false);
            window.setNavigationBarContrastEnforced(false);
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            WindowManager.LayoutParams layout = window.getAttributes();
            layout.layoutInDisplayCutoutMode =
                WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            window.setAttributes(layout);
        }

        // Keep native Back usable on the first swipe. Reserve the visible navigation
        // region and keyboard; the scene still reaches the camera/status edge.
        View content = findViewById(android.R.id.content);
        content.setBackgroundColor(Color.rgb(7, 20, 35));
        int reserved = WindowInsetsCompat.Type.navigationBars() | WindowInsetsCompat.Type.ime();
        ViewCompat.setOnApplyWindowInsetsListener(content, (view, insets) -> {
            Insets padding = insets.getInsets(reserved);
            view.setPadding(padding.left, 0, padding.right, padding.bottom);
            return new WindowInsetsCompat.Builder(insets)
                .setInsets(reserved, Insets.NONE)
                .build();
        });
        ViewCompat.requestApplyInsets(content);
        configureBars();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            configureBars();
        }
    }

    private void configureBars() {
        Window window = getWindow();
        WindowInsetsControllerCompat controller =
            WindowCompat.getInsetsController(window, window.getDecorView());
        controller.setSystemBarsBehavior(
            WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        );
        // Hiding navigationBars() consumes the first gesture to reveal the bars on
        // some Android devices. Keep native gesture navigation active; only
        // hide the status bar. Android owns the bottom gesture indicator.
        controller.show(WindowInsetsCompat.Type.navigationBars());
        controller.hide(WindowInsetsCompat.Type.statusBars());
    }
}
