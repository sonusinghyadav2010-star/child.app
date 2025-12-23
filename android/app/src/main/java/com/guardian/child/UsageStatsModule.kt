
package com.guardian.child

import android.app.usage.UsageStatsManager
import android.content.Context
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.bridge.WritableNativeArray
import java.util.Calendar

class UsageStatsModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "UsageStatsModule"
    }

    @ReactMethod
    fun getUsageStats(promise: Promise) {
        val usageStatsManager = reactApplicationContext.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        val calendar = Calendar.getInstance()
        val endTime = calendar.timeInMillis
        calendar.add(Calendar.DAY_OF_YEAR, -1) // Collect stats for the last 24 hours
        val startTime = calendar.timeInMillis

        val stats = usageStatsManager.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, startTime, endTime)

        if (stats == null || stats.isEmpty()) {
            promise.resolve(WritableNativeArray())
            return
        }

        val appUsageMap = mutableMapOf<String, Long>()

        for (usageStats in stats) {
            val appName = usageStats.packageName
            val timeInForeground = usageStats.totalTimeInForeground
            appUsageMap[appName] = (appUsageMap[appName] ?: 0) + timeInForeground
        }
        
        val result = WritableNativeArray()
        for ((appName, timeInForeground) in appUsageMap) {
             if (timeInForeground > 0) {
                val appData = WritableNativeMap()
                appData.putString("appName", appName)
                appData.putDouble("timeInForeground", timeInForeground.toDouble())
                result.pushMap(appData)
             }
        }

        promise.resolve(result)
    }
}
