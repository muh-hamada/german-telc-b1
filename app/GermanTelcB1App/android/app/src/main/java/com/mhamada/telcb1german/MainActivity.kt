package com.mhamada.telcb1german

import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.swmansion.rnscreens.fragment.restoration.RNScreensFragmentFactory
import android.util.Log

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "GermanTelcA2App"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  override fun onCreate(savedInstanceState: Bundle?) {
    try {
      // Set the fragment factory before calling super.onCreate to prevent crashes
      // during activity restoration with react-native-screens
      supportFragmentManager.fragmentFactory = RNScreensFragmentFactory()
      super.onCreate(null)
    } catch (e: Exception) {
      Log.e("MainActivity", "Error in onCreate", e)
      // Continue with default initialization as fallback
      try {
        super.onCreate(savedInstanceState)
      } catch (fallbackError: Exception) {
        Log.e("MainActivity", "Fallback onCreate also failed", fallbackError)
      }
    }
  }

  override fun onResume() {
    try {
      super.onResume()
    } catch (e: Exception) {
      Log.e("MainActivity", "Error in onResume - screens cleanup issue", e)
      // Don't crash, just log the error
      // This catches the cleanupExpiredMountingCoordinators crash
    }
  }

  override fun onPause() {
    try {
      super.onPause()
    } catch (e: Exception) {
      Log.e("MainActivity", "Error in onPause", e)
      // Don't crash, just log the error
    }
  }
}
