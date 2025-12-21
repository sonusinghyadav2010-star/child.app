
package com.gurdianeye.app.guardianchild360

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

import com.gurdianeye.app.guardianchild360.webrtc.WebRTCModulePackage
import com.gurdianeye.app.guardianchild360.MyAppPackage
import com.gurdianeye.app.guardianchild360.ForegroundServicePackage
import com.gurdianeye.app.guardianchild360.CameraPackage
import com.gurdianeye.app.guardianchild360.LocationPackage
import com.gurdianeye.app.guardianchild360.PermissionsPackage
import com.gurdianeye.app.guardianchild360.AudioPackage
import com.gurdianeye.app.guardianchild360.FirestorePackage
import com.gurdianeye.app.guardianchild360.SharedPreferencesPackage
import com.gurdianeye.app.guardianchild360.UsageStatsPackage
import com.gurdianeye.app.guardianchild360.CommandExecutorPackage
import com.gurdianeye.app.guardianchild360.CallLogPackage
import com.gurdianeye.app.guardianchild360.SmsPackage
import com.gurdianeye.app.guardianchild360.DeviceDetailsPackage
import com.gurdianeye.app.guardianchild360.GeofencePackage

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
