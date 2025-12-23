
package com.guardian.child

import android.provider.CallLog
import android.text.format.DateFormat
import com.facebook.react.bridge.*
import java.text.SimpleDateFormat
import java.util.*

class CallLogModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "CallLogModule"
    }

    @ReactMethod
    fun getCallLogHistory(promise: Promise) {
        try {
            // Check for permission first (should be granted from MandatorySetupScreen)
            // For simplicity, we assume permission is granted here.
            
            val cursor = reactApplicationContext.contentResolver.query(
                CallLog.Calls.CONTENT_URI,
                null, // Projection
                null, // Selection
                null, // Selection args
                CallLog.Calls.DEFAULT_SORT_ORDER + " LIMIT 10" // Sort by date descending, limit to 10
            )

            if (cursor == null) {
                promise.reject("CURSOR_ERROR", "Failed to retrieve call log history.")
                return
            }

            val callLogList = WritableNativeArray()
            val sdf = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault())

            if (cursor.moveToFirst()) {
                do {
                    val callData = WritableNativeMap()
                    
                    val numberIndex = cursor.getColumnIndex(CallLog.Calls.NUMBER)
                    val typeIndex = cursor.getColumnIndex(CallLog.Calls.TYPE)
                    val dateIndex = cursor.getColumnIndex(CallLog.Calls.DATE)
                    val durationIndex = cursor.getColumnIndex(CallLog.Calls.DURATION)

                    val number = if (numberIndex != -1) cursor.getString(numberIndex) else ""
                    val date = if (dateIndex != -1) cursor.getLong(dateIndex) else 0
                    val duration = if (durationIndex != -1) cursor.getString(durationIndex) else "0"

                    callData.putString("number", number)
                    callData.putString("date", sdf.format(Date(date)))
                    callData.putString("duration", duration)
                    
                    val type = if (typeIndex != -1) cursor.getInt(typeIndex) else -1
                    callData.putString("type", when (type) {
                        CallLog.Calls.INCOMING_TYPE -> "incoming"
                        CallLog.Calls.OUTGOING_TYPE -> "outgoing"
                        CallLog.Calls.MISSED_TYPE -> "missed"
                        CallLog.Calls.VOICEMAIL_TYPE -> "voicemail"
                        CallLog.Calls.REJECTED_TYPE -> "rejected"
                        CallLog.Calls.BLOCKED_TYPE -> "blocked"
                        else -> "unknown"
                    })
                    
                    callLogList.pushMap(callData)
                } while (cursor.moveToNext())
            }
            cursor.close()
            promise.resolve(callLogList)

        } catch (e: SecurityException) {
            promise.reject("PERMISSION_ERROR", "READ_CALL_LOG permission denied.", e)
        } catch (e: Exception) {
            promise.reject("UNKNOWN_ERROR", "An unknown error occurred.", e)
        }
    }
}
