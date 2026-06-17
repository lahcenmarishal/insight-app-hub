// Native (Capacitor) bootstrap. Safe no-op on the web.
import { Capacitor } from "@capacitor/core";

export async function initNative() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    // White background with dark icons, on every screen.
    await StatusBar.setOverlaysWebView({ overlay: false });
    await StatusBar.setBackgroundColor({ color: "#FFFFFF" });
    await StatusBar.setStyle({ style: Style.Light }); // Light style = dark icons on light bg
  } catch (e) {
    console.warn("StatusBar init failed", e);
  }

  try {
    const { SplashScreen } = await import("@capacitor/splash-screen");
    // Splash is configured via capacitor.config.json; hide once JS is ready.
    await SplashScreen.hide({ fadeOutDuration: 300 });
  } catch (e) {
    console.warn("SplashScreen hide failed", e);
  }
}
