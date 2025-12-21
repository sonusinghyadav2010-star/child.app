
package com.guardianchildapp

import android.content.Context
import android.content.SharedPreferences
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log
import com.google.firebase.firestore.ktx.firestore
import com.google.firebase.ktx.Firebase
import java.util.Date

class NotificationListener : NotificationListenerService() {

    private val TAG = "NotificationListener"
    private val db = Firebase.firestore
    private lateinit var prefs: SharedPreferences
    private var parentUid: String? = null
    private var childUid: String? = null

    override fun onCreate() {
        super.onCreate()
        prefs = getSharedPreferences("ChildAppPrefs", Context.MODE_PRIVATE)
        loadPairingInfo()
    }

    private fun loadPairingInfo() {
        parentUid = prefs.getString("parentUid", null)
        childUid = prefs.getString("childUid", null)
         if (parentUid == null) parentUid = ChildData.parentUid
        if (childUid == null) childUid = ChildData.childUid
        Log.d(TAG, "Loaded pairing info: parentUid=$parentUid, childUid=$childUid")
    }

    override fun onListenerConnected() {
        super.onListenerConnected()
        Log.d(TAG, "Notification Listener connected.")
    }

    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        super.onNotificationPosted(sbn)

        if (sbn == null) return

        if (parentUid == null || childUid == null) {
            loadPairingInfo() // Attempt to reload info
            if (parentUid == null || childUid == null) {
                Log.w(TAG, "Pairing info missing. Cannot log notification.")
                return
            }
        }

        val packageName = sbn.packageName
        val notification = sbn.notification
        val extras = notification.extras
        val title = extras.getString("android.title") ?: ""
        val text = extras.getCharSequence("android.text")?.toString() ?: ""

        // Ignore empty notifications or self-notifications
        if (title.isEmpty() && text.isEmpty() || packageName == "com.guardianchildapp") {
            return
        }

        Log.d(TAG, "Notification Posted: $packageName - Title: $title, Text: $text")

        val notificationData = hashMapOf(
            "packageName" to packageName,
            "title" to title,
            "text" to text,
            "postTime" to Date(sbn.postTime),
            "syncedAt" to Date()
        )

        db.collection("users").document(parentUid!!)
            .collection("children").document(childUid!!)
            .collection("notifications")
            .add(notificationData)
            .addOnSuccessListener { Log.d(TAG, "Notification data saved to Firestore.") }
            .addOnFailureListener { e -> Log.e(TAG, "Error saving notification data", e) }
    }

    override fun onListenerDisconnected() {
        super.onListenerDisconnected()
        Log.w(TAG, "Notification Listener disconnected.")
    }
}
