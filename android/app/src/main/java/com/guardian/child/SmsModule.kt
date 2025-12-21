package com.guardian.child

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import android.provider.Telephony
import android.database.Cursor
import com.facebook.react.bridge.WritableNativeArray
import com.facebook.react.bridge.WritableNativeMap
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class SmsModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "SmsModule"
    }

    @ReactMethod
    fun getSmsHistory(promise: Promise) {
        try {
            // Projection now only includes metadata fields.
            val projection = arrayOf(
                Telephony.Sms.ADDRESS,
                Telephony.Sms.DATE,
                Telephony.Sms.TYPE
            )

            val cursor: Cursor? = reactApplicationContext.contentResolver.query(
                Telephony.Sms.CONTENT_URI, 
                projection, 
                null, 
                null, 
                Telephony.Sms.DEFAULT_SORT_ORDER + " LIMIT 10" // Strictly limit to 10
            )

            if (cursor == null) {
                promise.reject("CURSOR_ERROR", "Failed to retrieve SMS history.")
                return
            }

            val smsList = WritableNativeArray()
            val sdf = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault())

            if (cursor.moveToFirst()) {
                val addressIndex = cursor.getColumnIndex(Telephony.Sms.ADDRESS)
                val dateIndex = cursor.getColumnIndex(Telephony.Sms.DATE)
                val typeIndex = cursor.getColumnIndex(Telephony.Sms.TYPE)

                do {
                    val smsData = WritableNativeMap()
                    smsData.putString("address", if (addressIndex != -1) cursor.getString(addressIndex) else "N/A")
                    
                    val date = if (dateIndex != -1) cursor.getLong(dateIndex) else 0
                    smsData.putString("date", sdf.format(Date(date)))

                    val type = if (typeIndex != -1) cursor.getInt(typeIndex) else -1
                    smsData.putString("type", when (type) {
                        Telephony.Sms.MESSAGE_TYPE_INBOX -> "inbox"
                        Telephony.Sms.MESSAGE_TYPE_SENT -> "sent"
                        else -> "unknown"
                    })

                    // SMS body is no longer accessed or added to the map.
                    smsList.pushMap(smsData)
                } while (cursor.moveToNext())
            }

            cursor.close()
            promise.resolve(smsList)
        } catch (e: Exception) {
            promise.reject("GET_SMS_ERROR", "An error occurred while fetching SMS history.", e)
        }
    }
}
