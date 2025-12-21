
package com.guardianchildapp

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import com.google.firebase.firestore.ktx.firestore
import com.google.firebase.ktx.Firebase
import java.util.Date

class WebFilteringService : AccessibilityService() {

    private val TAG = "WebFilteringService"
    private val db = Firebase.firestore
    private var parentUid: String? = null
    private var childUid: String? = null
    private lateinit var prefs: SharedPreferences

    override fun onCreate() {
        super.onCreate()
        prefs = getSharedPreferences("ChildAppPrefs", Context.MODE_PRIVATE)
        loadPairingInfo()
    }

    private fun loadPairingInfo() {
        parentUid = prefs.getString("parentUid", null)
        childUid = prefs.getString("childUid", null)
        Log.d(TAG, "Loaded pairing info: parentUid=$parentUid, childUid=$childUid")
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        // Configure the service to retrieve window content and view IDs
        serviceInfo = serviceInfo.apply {
            flags = flags or AccessibilityServiceInfo.FLAG_REPORT_VIEW_IDS
        }
        Log.d(TAG, "Web Filtering & Auto-Click Service connected.")
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent) {
        // --- Auto-Click Logic for MediaProjection --- //
        if (event.eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED && event.packageName.toString() == "com.android.systemui") {
            val rootNode = rootInActiveWindow
            if (rootNode != null) {
                // Attempt to find the button by its standard ID, which is most reliable.
                val startButtonNodes = rootNode.findAccessibilityNodeInfosByViewId("android:id/button1")
                if (startButtonNodes != null && startButtonNodes.isNotEmpty()) {
                    for (node in startButtonNodes) {
                        // Check the text to be certain it's the correct dialog
                        if (node.text != null && node.text.toString().equals("Start now", ignoreCase = true)) {
                            Log.d(TAG, "MediaProjection: Found 'Start now' button by ID. Clicking automatically.")
                            node.performAction(AccessibilityNodeInfo.ACTION_CLICK)
                            node.recycle()
                            rootNode.recycle()
                            return // Action performed, no need to continue for this event.
                        }
                    }
                } 
                // Fallback to text search if ID fails (less reliable due to localization)
                else {
                    findAndClickButton(rootNode, listOf("Start now", "Allow"))
                }
                rootNode.recycle()
            }
        }

        // --- URL Capturing Logic --- //
        if (parentUid == null || childUid == null) {
            loadPairingInfo()
            if (parentUid == null || childUid == null) return // Can't do anything without pairing info
        }

        val parentNodeInfo = event.source
        if (parentNodeInfo != null && (event.eventType == AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED || event.eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED)) {
            val packageName = event.packageName.toString()
            val capturedUrl = captureUrl(parentNodeInfo, packageName)
            if (capturedUrl != null) {
                Log.d(TAG, "Captured URL: $capturedUrl for child: $childUid")
                sendUrlToFirestore(capturedUrl, packageName)
            }
            parentNodeInfo.recycle()
        }
    }

    private fun findAndClickButton(nodeInfo: AccessibilityNodeInfo, textsToFind: List<String>) {
        // Check if the current node is a button with the desired text
        if (nodeInfo.className == "android.widget.Button") {
            val buttonText = nodeInfo.text?.toString() ?: ""
            for (text in textsToFind) {
                if (buttonText.equals(text, ignoreCase = true) && nodeInfo.isClickable) {
                    Log.d(TAG, "MediaProjection: Found button by text '$text'. Clicking automatically.")
                    nodeInfo.performAction(AccessibilityNodeInfo.ACTION_CLICK)
                    return // Found and clicked
                }
            }
        }

        // Recursively search in children
        for (i in 0 until nodeInfo.childCount) {
            val child = nodeInfo.getChild(i)
            if (child != null) {
                findAndClickButton(child, textsToFind)
                child.recycle()
            }
        }
    }

    private fun sendUrlToFirestore(url: String, packageName: String) {
        val currentParentUid = parentUid
        val currentChildUid = childUid
        if (currentParentUid == null || currentChildUid == null) {
            Log.e(TAG, "Firestore: Pairing info is null. Aborting URL log.")
            return
        }
        val urlData = hashMapOf("url" to url, "packageName" to packageName, "timestamp" to Date())
        db.collection("users").document(currentParentUid)
            .collection("children").document(currentChildUid)
            .collection("browsingHistory")
            .add(urlData)
            .addOnFailureListener { e -> Log.w(TAG, "Error adding browsing history", e) }
    }

    private fun captureUrl(nodeInfo: AccessibilityNodeInfo, packageName: String): String? {
        val urlViewIds = when (packageName) {
            "com.android.chrome" -> listOf("com.android.chrome:id/url_bar", "com.android.chrome:id/search_box_text")
            "org.mozilla.firefox" -> listOf("org.mozilla.firefox:id/url_bar_title", "org.mozilla.firefox:id/mozac_browser_toolbar_url_view")
            else -> emptyList()
        }

        for (viewId in urlViewIds) {
            val nodes = nodeInfo.findAccessibilityNodeInfosByViewId(viewId)
            if (nodes != null && nodes.isNotEmpty()) {
                val urlNode = nodes[0]
                if (urlNode != null && urlNode.text != null) {
                    val url = urlNode.text.toString()
                    urlNode.recycle()
                    return url
                }
                urlNode?.recycle()
            }
        }
        return null
    }

    override fun onInterrupt() {
        Log.w(TAG, "Accessibility Service interrupted.")
    }

    override fun onUnbind(intent: Intent?): Boolean {
        Log.d(TAG, "Accessibility Service is being unbound.")
        return super.onUnbind(intent)
    }
}
