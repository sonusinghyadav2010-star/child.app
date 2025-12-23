
package com.guardianchildapp

import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.provider.Settings
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise

// Singleton object to hold pairing info
object ChildData {
    var parentUid: String? = null
    var childUid: String? = null
}

class WebFilteringModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val prefs: SharedPreferences by lazy {
        reactContext.getSharedPreferences("ChildAppPrefs", Context.MODE_PRIVATE)
    }

    override fun getName(): String {
        return "WebFilteringModule"
    }

    @ReactMethod
    fun setPairingInfo(parentUid: String, childUid: String, promise: Promise) {
        try {
            // Save to the singleton for immediate use by services
            ChildData.parentUid = parentUid
            ChildData.childUid = childUid

            // Save to SharedPreferences for persistence
            prefs.edit()
                .putString("parentUid", parentUid)
                .putString("childUid", childUid)
                .apply()
            
            promise.resolve("Pairing info set successfully")
        } catch (e: Exception) {
            promise.reject("PAIRING_INFO_ERROR", e)
        }
    }

    @ReactMethod
    fun isAccessibilityServiceEnabled(promise: Promise) {
        val accessibilityServices = Settings.Secure.getString(reactContext.contentResolver, Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES)
        val serviceEnabled = accessibilityServices?.contains(reactContext.packageName + "/" + WebFilteringService::class.java.name) ?: false
        promise.resolve(serviceEnabled)
    }

    @ReactMethod
    fun requestAccessibilityPermission() {
        val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        reactContext.startActivity(intent)
    }
}
