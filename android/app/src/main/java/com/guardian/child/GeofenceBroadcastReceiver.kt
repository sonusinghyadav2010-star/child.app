package com.guardian.child

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import com.google.android.gms.location.Geofence
import com.google.android.gms.location.GeofencingEvent

class GeofenceBroadcastReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val geofencingEvent = GeofencingEvent.fromIntent(intent)
        if (geofencingEvent.hasError()) {
            val errorMessage = "Geofencing error: " + geofencingEvent.errorCode
            Log.e("GeofenceReceiver", errorMessage)
            return
        }

        val geofenceTransition = geofencingEvent.geofenceTransition
        if (geofenceTransition == Geofence.GEOFENCE_TRANSITION_ENTER ||
            geofenceTransition == Geofence.GEOFENCE_TRANSITION_EXIT) {
            // Event को बैकग्राउंड में संभालने के लिए JobIntentService शुरू करें
            GeofenceTransitionsJobIntentService.enqueueWork(context, intent)
        } else {
            Log.e("GeofenceReceiver", "Unknown geofence transition: $geofenceTransition")
        }
    }
}
