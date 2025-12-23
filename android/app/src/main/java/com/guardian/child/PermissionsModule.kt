
package com.guardianchildapp

import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.provider.Settings
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class PermissionsModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "PermissionsModule"
    }

    @ReactMethod
    fun isNotificationListenerEnabled(promise: Promise) {
        val enabledListeners = Settings.Secure.getString(reactContext.contentResolver, "enabled_notification_listeners")
        val serviceEnabled = enabledListeners?.contains(reactContext.packageName + "/" + NotificationListener::class.java.name) ?: false
        promise.resolve(serviceEnabled)
    }

    @ReactMethod
    fun requestNotificationListenerPermission() {
        val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        reactContext.startActivity(intent)
    }

    @ReactMethod
    fun isDeviceAdminActive(promise: Promise) {
        val dpm = reactContext.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
        val componentName = ComponentName(reactContext, MyDeviceAdminReceiver::class.java)
        promise.resolve(dpm.isAdminActive(componentName))
    }

    @ReactMethod
    fun requestDeviceAdmin() {
        val componentName = ComponentName(reactContext, MyDeviceAdminReceiver::class.java)
        val intent = Intent(DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN)
        intent.putExtra(DevicePolicyManager.EXTRA_DEVICE_ADMIN, componentName)
        intent.putExtra(DevicePolicyManager.EXTRA_ADD_EXPLANATION, "This permission is required to prevent app uninstallation and for remote wipe.")
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        reactContext.startActivity(intent)
    }
}
