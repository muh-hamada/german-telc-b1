import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import FirebaseCore
import FBSDKCoreKit
import GoogleSignIn
import AppTrackingTransparency
import AdSupport

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "GermanTelcB1App",
      in: window,
      launchOptions: launchOptions
    )

    FirebaseApp.configure()
    
    // Request tracking authorization for iOS 14+ (no delay; request early but contextually)
    if #available(iOS 14, *) {
      ATTrackingManager.requestTrackingAuthorization { status in
        let trackingEnabled = (status == .authorized)
        
        // Set Facebook settings based on ATT status
        Settings.shared.isAdvertiserIDCollectionEnabled = trackingEnabled
        Settings.shared.isAutoLogAppEventsEnabled = trackingEnabled
        Settings.shared.isAdvertiserTrackingEnabled = trackingEnabled  // Deprecated in SDK 17+ on iOS 17+, but safe to set
        
        // Log for debugging
        print("ATT status: \(status), Tracking enabled: \(trackingEnabled)")
        
        // Initialize Facebook SDK after settings are updated
        ApplicationDelegate.shared.application(
          application,
          didFinishLaunchingWithOptions: launchOptions
        )
      }
    } else {
      // For pre-iOS 14, enable by default (or handle Limit Ad Tracking if needed)
      Settings.shared.isAdvertiserIDCollectionEnabled = true
      Settings.shared.isAutoLogAppEventsEnabled = true
      Settings.shared.isAdvertiserTrackingEnabled = true
      
      // Initialize Facebook SDK
      ApplicationDelegate.shared.application(
        application,
        didFinishLaunchingWithOptions: launchOptions
      )
    }

    return true
  }
  
  // Handle URL schemes for Google Sign-In and Facebook
  func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey : Any] = [:]
  ) -> Bool {
    // Handle Facebook URL scheme
    if ApplicationDelegate.shared.application(
      app,
      open: url,
      sourceApplication: options[UIApplication.OpenURLOptionsKey.sourceApplication] as? String,
      annotation: options[UIApplication.OpenURLOptionsKey.annotation]
    ) {
      return true
    }
    
    // Handle Google Sign-In URL scheme
    if GIDSignIn.sharedInstance.handle(url) {
      return true
    }
    
    return false
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}