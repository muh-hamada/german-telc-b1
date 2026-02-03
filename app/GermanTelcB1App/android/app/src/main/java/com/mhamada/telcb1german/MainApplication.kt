package com.mhamada.telcb1german

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.soloader.SoLoader
import com.facebook.react.soloader.OpenSourceMergedSoMapping
import android.util.Log

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Packages that cannot be autolinked yet can be added manually here, for example:
          // add(MyReactNativePackage())
        },
    )
  }

  override fun onCreate() {
    super.onCreate()
    
    // Explicitly initialize SoLoader with merged SO mapping for New Architecture
    // This ensures native libraries are properly loaded on all devices
    try {
      Log.d("MainApplication", "Initializing SoLoader with merged SO mapping...")
      SoLoader.init(this, OpenSourceMergedSoMapping)
      Log.d("MainApplication", "SoLoader initialized successfully with merged SO mapping")
    } catch (e: Exception) {
      Log.e("MainApplication", "Failed to initialize SoLoader", e)
      throw e
    }
    
    loadReactNative(this)
  }
}
