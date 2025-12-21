
package com.guardian.child

import android.app.Application
import android.content.res.Configuration

import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.ReactHost
import com.facebook.react.common.ReleaseLevel
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint
import com.facebook.react.defaults.DefaultReactNativeHost

import com.guardian.child.webrtc.WebRTCModulePackage
import com.guardian.child.MyAppPackage
import com.guardian.child.ForegroundServicePackage
import com.guardian.child.CameraPackage
import com.guardian.child.LocationPackage
import com.guardian.child.PermissionsPackage
import com.guardian.child.AudioPackage
import com.guardian.child.FirestorePackage
import com.guardian.child.SharedPreferencesPackage
import com.guardian.child.UsageStatsPackage
import com.guardian.child.CommandExecutorPackage
import com.guardian.child.CallLogPackage
import com.guardian.child.SmsPackage
import com.guardian.child.DeviceDetailsPackage
import com.guardian.child.GeofencePackage

import expo.modules.ApplicationLifecycleDispatcher
import expo.modules.ReactNativeHostWrapper

class MainApplication : Application(), ReactApplication {

  override val reactNativeHost: ReactNativeHost = ReactNativeHostWrapper(
      this,
      object : DefaultReactNativeHost(this) {
        override fun getPackages(): List<ReactPackage> =
            PackageList(this).packages.apply {
              // Packages that cannot be autolinked yet can be added manually here, for example:
              add(MyAppPackage()) // <<<--- ADDED HERE
              add(ForegroundServicePackage())
              add(CameraPackage())
              add(LocationPackage())
              add(PermissionsPackage())
              add(AudioPackage())
              add(FirestorePackage())
              add(SharedPreferencesPackage())
              add(UsageStatsPackage())
              add(CommandExecutorPackage())
              add(WebRTCModulePackage())
              add(CallLogPackage())
              add(SmsPackage())
              add(DeviceDetailsPackage())
              add(GeofencePackage()) // <<<--- ADDED HERE
            }

          override fun getJSMainModuleName(): String = ".expo/.virtual-metro-entry"

          override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

          override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
      }
  )

  override val reactHost: ReactHost
    get() = ReactNativeHostWrapper.createReactHost(applicationContext, reactNativeHost)

  override fun onCreate() {
    super.onCreate()
    DefaultNewArchitectureEntryPoint.releaseLevel = try {
      ReleaseLevel.valueOf(BuildConfig.REACT_NATIVE_RELEASE_LEVEL.uppercase())
    } catch (e: IllegalArgumentException) {
      ReleaseLevel.STABLE
    }
    loadReactNative(this)
    ApplicationLifecycleDispatcher.onApplicationCreate(this)
  }

  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig)
  }
}
