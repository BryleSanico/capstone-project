import UIKit
import React

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate, RCTBridgeDelegate {

  var window: UIWindow?
  
  func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
    // Manually create the bridge to the JS code
    let bridge = RCTBridge(delegate: self, launchOptions: launchOptions)
    
    // Create the main React Native view
    // Make sure the moduleName matches your project name in app.json
    let rootView = RCTRootView(bridge: bridge!, moduleName: "EventDiscoveryTicketing", initialProperties: nil)
    
    if #available(iOS 13.0, *) {
      rootView.backgroundColor = UIColor.systemBackground
    } else {
      rootView.backgroundColor = UIColor.white
    }

    // Set up the main window
    self.window = UIWindow(frame: UIScreen.main.bounds)
    let rootViewController = UIViewController()
    rootViewController.view = rootView
    self.window?.rootViewController = rootViewController
    self.window?.makeKeyAndVisible()
    return true
  }

  // This function tells the app where to find the JS code
  func sourceURL(for bridge: RCTBridge!) -> URL! {
    #if DEBUG
      // In development, load from the Metro server
      return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
    #else
      // In production, load from the pre-packaged file
      return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
    #endif
  }
}
