
package com.guardian.child

import android.annotation.SuppressLint
import android.content.Context
import android.os.Build
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import android.net.wifi.WifiManager
import android.telephony.TelephonyManager // Import TelephonyManager
import android.text.format.Formatter
import android.os.BatteryManager
import android.content.Intent
import android.content.IntentFilter
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.google.android.gms.tasks.CancellationTokenSource

class DeviceDetailsModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val fusedLocationClient = LocationServices.getFusedLocationProviderClient(reactContext)

    override fun getName(): String {
        return "DeviceDetailsModule"
    }

    @ReactMethod
    fun getDeviceName(promise: Promise) {
        val manufacturer = Build.MANUFACTURER
        val model = Build.MODEL
        promise.resolve("$manufacturer $model")
    }

    @ReactMethod
    fun getDeviceType(promise: Promise) {
        val isTablet = reactApplicationContext.resources.configuration.smallestScreenWidthDp >= 600
        promise.resolve(if (isTablet) "Tablet" else "Phone")
    }

    @ReactMethod
    fun getOsVersion(promise: Promise) {
        promise.resolve("Android " + Build.VERSION.RELEASE)
    }

    @ReactMethod
    fun getIpAddress(promise: Promise) {
        try {
            val wifiManager = reactApplicationContext.applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager
            val ipAddress = Formatter.formatIpAddress(wifiManager.connectionInfo.ipAddress)
            promise.resolve(ipAddress)
        } catch (e: Exception) {
            promise.reject("E_IP_ERROR", "Could not get IP address", e)
        }
    }

    @ReactMethod
    fun getSimOperator(promise: Promise) {
        try {
            val telephonyManager = reactApplicationContext.getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager
            val operatorName = telephonyManager.simOperatorName
            if (operatorName.isNullOrEmpty()) {
                promise.resolve("N/A") // No SIM or no name
            } else {
                promise.resolve(operatorName)
            }
        } catch (e: SecurityException) {
             promise.reject("E_PERMISSION_ERROR", "READ_PHONE_STATE permission missing", e)
        } catch (e: Exception) {
            promise.reject("E_SIM_ERROR", "Could not get SIM operator", e)
        }
    }

    @ReactMethod
    fun getBatteryDetails(promise: Promise) {
        try {
            val batteryManager = reactApplicationContext.getSystemService(Context.BATTERY_SERVICE) as BatteryManager
            val batteryLevel = batteryManager.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)

            val intentFilter = IntentFilter(Intent.ACTION_BATTERY_CHANGED)
            val batteryStatus = reactApplicationContext.registerReceiver(null, intentFilter)
            val status = batteryStatus?.getIntExtra(BatteryManager.EXTRA_STATUS, -1) ?: -1
            val isCharging = status == BatteryManager.BATTERY_STATUS_CHARGING || status == BatteryManager.BATTERY_STATUS_FULL

            val details = com.facebook.react.bridge.WritableNativeMap()
            details.putInt("batteryLevel", batteryLevel)
            details.putBoolean("isCharging", isCharging)
            promise.resolve(details)
        } catch (e: Exception) {
            promise.reject("E_BATTERY_ERROR", "Could not get battery details", e)
        }
    }

    @SuppressLint("MissingPermission") // Permissions are checked on the JS side
    @ReactMethod
    fun getCurrentLocation(promise: Promise) {
        fusedLocationClient.getCurrentLocation(Priority.PRIORITY_HIGH_ACCURACY, CancellationTokenSource().token)
            .addOnSuccessListener { location ->
                if (location != null) {
                    val locationMap = com.facebook.react.bridge.WritableNativeMap()
                    locationMap.putDouble("latitude", location.latitude)
                    locationMap.putDouble("longitude", location.longitude)
                    promise.resolve(locationMap)
                } else {
                    promise.reject("E_LOCATION_ERROR", "Failed to get location: location is null")
                }
            }
            .addOnFailureListener { e ->
                promise.reject("E_LOCATION_ERROR", "Failed to get location", e)
            }
    }
}
