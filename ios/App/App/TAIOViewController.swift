import UIKit
import WebKit
import Capacitor

@objc(TAIOViewController)
class TAIOViewController: CAPBridgeViewController {

    private let statusBarShieldView: UIView = {
        let v = UIView()
        v.backgroundColor = UIColor.white
        v.isUserInteractionEnabled = false
        v.translatesAutoresizingMaskIntoConstraints = false
        return v
    }()

    override open var prefersStatusBarHidden: Bool {
        return false
    }

    override open var preferredStatusBarStyle: UIStatusBarStyle {
        return .darkContent
    }

    override open func setStatusBarDefaults() {
        super.setStatusBarDefaults()
        self.isStatusBarVisible = true
        self.statusBarStyle = .darkContent
    }

    override open func webViewConfiguration(for instanceConfiguration: InstanceConfiguration) -> WKWebViewConfiguration {
        let config = super.webViewConfiguration(for: instanceConfiguration)
        let bootstrapJS = """
        (function() {
          var isPortrait = window.innerHeight >= window.innerWidth;
          var defaultTop = isPortrait ? 59 : 0;
          var defaultBottom = isPortrait ? 34 : 21;
          var saved = window.__TAIO_SAFE_AREA__ || { top: defaultTop, bottom: defaultBottom, left: 0, right: 0 };
          window.__TAIO_SAFE_AREA__ = saved;
          var root = document.documentElement;
          if (root) {
            root.classList.add('is-native-ios');
            root.style.setProperty('--native-sat', saved.top + 'px');
            root.style.setProperty('--native-sab', saved.bottom + 'px');
            root.style.setProperty('--sat', 'max(env(safe-area-inset-top, 0px), ' + saved.top + 'px)');
            root.style.setProperty('--sab', 'max(env(safe-area-inset-bottom, 0px), ' + saved.bottom + 'px)');
          }
        })();
        """
        let userScript = WKUserScript(
            source: bootstrapJS,
            injectionTime: .atDocumentStart,
            forMainFrameOnly: true
        )
        config.userContentController.addUserScript(userScript)
        return config
    }

    override open func capacitorDidLoad() {
        super.capacitorDidLoad()
        self.isStatusBarVisible = true
        self.statusBarStyle = .darkContent
        webView?.scrollView.contentInsetAdjustmentBehavior = .never
    }

    override open func viewDidLoad() {
        super.viewDidLoad()
        webView?.scrollView.contentInsetAdjustmentBehavior = .never
        setupNativeStatusBarShield()
        setNeedsStatusBarAppearanceUpdate()
    }

    override open func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        setNeedsStatusBarAppearanceUpdate()
        syncSafeAreaToWebView()
    }

    override open func viewSafeAreaInsetsDidChange() {
        super.viewSafeAreaInsetsDidChange()
        syncSafeAreaToWebView()
    }

    override open func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        syncSafeAreaToWebView()
    }

    private func setupNativeStatusBarShield() {
        guard statusBarShieldView.superview == nil else { return }
        view.addSubview(statusBarShieldView)
        NSLayoutConstraint.activate([
            statusBarShieldView.topAnchor.constraint(equalTo: view.topAnchor),
            statusBarShieldView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            statusBarShieldView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            statusBarShieldView.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor)
        ])
    }

    private func syncSafeAreaToWebView() {
        let windowInsets = view.window?.safeAreaInsets ?? view.safeAreaInsets
        let isPhone = UIDevice.current.userInterfaceIdiom == .phone
        let isPortrait = UIScreen.main.bounds.height >= UIScreen.main.bounds.width

        let rawTop = Int(ceil(windowInsets.top))
        let rawBottom = Int(ceil(windowInsets.bottom))
        let rawLeft = Int(ceil(windowInsets.left))
        let rawRight = Int(ceil(windowInsets.right))

        let safeTop = (isPhone && isPortrait) ? max(rawTop, 59) : max(rawTop, 0)
        let safeBottom = isPhone ? max(rawBottom, 20) : max(rawBottom, 0)

        let js = """
        (function() {
          window.__TAIO_SAFE_AREA__ = { top: \(safeTop), bottom: \(safeBottom), left: \(rawLeft), right: \(rawRight) };
          var root = document.documentElement;
          if (root) {
            root.classList.add('is-native-ios');
            root.style.setProperty('--native-sat', '\(safeTop)px');
            root.style.setProperty('--native-sab', '\(safeBottom)px');
            root.style.setProperty('--sat', 'max(env(safe-area-inset-top, 0px), \(safeTop)px)');
            root.style.setProperty('--sab', 'max(env(safe-area-inset-bottom, 0px), \(safeBottom)px)');
            root.style.setProperty('--sal', 'max(env(safe-area-inset-left, 0px), \(rawLeft)px)');
            root.style.setProperty('--sar', 'max(env(safe-area-inset-right, 0px), \(rawRight)px)');
          }
          window.dispatchEvent(new CustomEvent('taio:safe-area-change', { detail: window.__TAIO_SAFE_AREA__ }));
        })();
        """
        webView?.evaluateJavaScript(js, completionHandler: nil)
    }
}
