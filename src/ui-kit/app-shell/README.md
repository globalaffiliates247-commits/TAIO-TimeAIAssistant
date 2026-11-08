# AppShell (`src/ui-kit/app-shell`)

Implements **Spec v0.3.21, Section D5**: Root-cause fix for iPhone Status Bar / Dynamic Island header overlap and bottom Home Indicator alignment.

---

## 1. Architecture & Safe-Area Variables (`--sat` / `--sab`)

`AppShell` is the single layout wrapper for the entire application. It centralizes top and bottom safe-area management through two CSS custom properties on `:root` (`document.documentElement`):

- `--sat`: Safe-area top inset (`max(env(safe-area-inset-top, 0px), var(--native-sat, 0px))`), guaranteed `>= 56px` on iPhone portrait (covering both Notch `47pt` and Dynamic Island `54pt–59pt`).
- `--sab`: Safe-area bottom inset (`max(env(safe-area-inset-bottom, 0px), var(--native-sab, 0px))`), guaranteed `>= 34px` on iPhone portrait (covering the Home Indicator bar).
- `--sal` / `--sar`: Left and right safe-area insets for landscape orientation.

### Why `env(safe-area-inset-top)` Alone Failed Previously
1. In Capacitor iOS (`CAPBridgeViewController`), when `WKWebView.scrollView.contentInsetAdjustmentBehavior = .never` (`ios.contentInset: 'never'`), WebKit can evaluate `env(safe-area-inset-top)` as `0px` before layout or during `body { position: fixed }` scroll lock.
2. Previously, `<header>` used `max(env(safe-area-inset-top, 0px), 12px)` and `backdrop-blur-xl` (`backdrop-filter`), which evaluated to `12px` inside the `54px–59px` iPhone Status Bar / Dynamic Island zone and created a containing block that trapped `position: fixed` children.

---

## 2. Rules for All `fixed` and `sticky` Elements

**Hard Rule:** No UI component (header, tab bar, toast, nudge banner, ambient progress edge, modal, or bottom sheet) may place interactive or visible content at raw `top: 0` (`top-0`) without offsetting by `var(--sat)`.

| Surface | Component | Safe-Area Rule |
| --- | --- | --- |
| **Status-Bar Shield** | `AppShell` | Fixed curtain `top: 0; height: var(--sat)` + in-flow spacer `height: var(--sat)` so content never enters `0..var(--sat)` |
| **Ambient Progress Edge** | `AmbientProgressEdge.tsx` | `position: fixed; top: var(--sat, 0px)` |
| **Sticky Header** | `Navbar.tsx` (`<header>`) | `position: sticky; top: var(--sat, 0px)` (no `top-0`, no `backdrop-filter`) |
| **Bottom Tab Bar** | `Navbar.tsx` (`<nav>`) | Rendered outside `<header>` when in phone mode; `bottom: 0; paddingBottom: var(--sab, 0px)` |
| **Toast & Nudge** | `ActionNudgeBanner.tsx`, `page.tsx` | Rendered in `AppShell` banner slots directly below the sticky header (`>= var(--sat)`) |
| **Floating Coach Card** | `CoachCardOverlay.tsx` | `bottom: calc(var(--sab, 0px) + 68px)` on phone / `calc(var(--sab, 0px) + 16px)` on desktop |
| **Modals & Bottom Sheets** | All `*Modal.tsx`, `DrilldownSheet.tsx` | Use `MODAL_SAFE_STYLE` / `BOTTOM_SHEET_SAFE_STYLE` (`.app-overlay-safe` / `.app-bottom-sheet-safe`) with `paddingTop: calc(var(--sat, 0px) + 12px)` and `paddingBottom: calc(var(--sab, 0px) + 12px)` |

---

## 3. Locked-In iOS IPA `StatusBar` & `WKWebView` Configuration

The native iOS IPA configuration is locked across 4 files and must not be altered:

1. **`ios/App/App/Info.plist`**:
   - `UIViewControllerBasedStatusBarAppearance` = `true`
   - `UIStatusBarStyle` = `UIStatusBarStyleDarkContent` (dark clock/wifi/battery icons on white header background)
   - `UIStatusBarHidden` = `false`
2. **`ios/App/App/TAIOViewController.swift`**:
   - Subclasses `CAPBridgeViewController` (wired in `SceneDelegate.swift` and `Main.storyboard`).
   - Locks `prefersStatusBarHidden = false` and `preferredStatusBarStyle = .darkContent`.
   - Sets `webView?.scrollView.contentInsetAdjustmentBehavior = .never`.
   - Adds a native `statusBarShieldView` (`UIColor.white`) constrained from `view.topAnchor` to `view.safeAreaLayoutGuide.topAnchor`.
   - Injects a `WKUserScript` at `.atDocumentStart` and runs `syncSafeAreaToWebView()` on `viewDidAppear`, `viewSafeAreaInsetsDidChange`, and `viewDidLayoutSubviews` to write hardware `UIWindow.safeAreaInsets` directly into `--native-sat`, `--native-sab`, `--sat`, and `--sab` on `document.documentElement`.
3. **`ios/App/App/TAIONativePlugin.swift`**:
   - `getCapabilities()` returns `safeAreaTop` and `safeAreaBottom` from `UIWindow.safeAreaInsets` over the Capacitor bridge.
4. **`capacitor.config.ts` & `ios/App/App/capacitor.config.json`**:
   - `ios.contentInset = "never"`
   - `ios.backgroundColor = "#ffffff"`
   - `packageClassList = ["TAIONativePlugin"]`

---

## CHANGELOG

- **v0.3.21 (2026-11-08)**: Created `AppShell` with centralized `--sat` / `--sab` safe-area CSS variables, updated all fixed/sticky headers, tabs, banners, toasts, and bottom sheets/modals to use `--sat` / `--sab`, and locked iOS IPA `StatusBar` & `TAIOViewController` safe-area injection (Section D5).
