package com.guardian.child

import android.content.Context
import android.content.Intent
import android.util.Log
import androidx.core.app.JobIntentService
import com.google.android.gms.location.Geofence
import com.google.android.gms.location.GeofencingEvent
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.GeoPoint
import java.util.Date

class GeofenceTransitionsJobIntentService : JobIntentService() {

    companion object {
        private const val JOB_ID = 573

        fun enqueueWork(context: Context, work: Intent) {
            enqueueWork(context, GeofenceTransitionsJobIntentService::class.java, JOB_ID, work)
        }
    }

    override fun onHandleWork(intent: Intent) {
        val geofencingEvent = GeofencingEvent.fromIntent(intent)
        if (geofencingEvent.hasError()) {
            Log.e("GeofenceJobService", "Geofencing error: " + geofencingEvent.errorCode)
            return
        }

        val geofenceTransition = geofencingEvent.geofenceTransition
        val triggeringGeofences = geofencingEvent.triggeringGeofences
        val triggeringLocation = geofencingEvent.triggeringLocation

        triggeringGeofences.forEach { geofence ->
            val geofenceId = geofence.requestId // यह पेरेंट ऐप से सेट की गई ID होगी
            val eventType = when (geofenceTransition) {
                Geofence.GEOFENCE_TRANSITION_ENTER -> "ENTER"
                Geofence.GEOFENCE_TRANSITION_EXIT -> "EXIT"
                else -> "UNKNOWN"
            }
            
            // बच्चे का UID SharedPreferences से प्राप्त करें
            val sharedPreferences = getSharedPreferences("ChildPrefs", Context.MODE_PRIVATE)
            val childUid = sharedPreferences.getString("childUid", null)

            if (childUid != null) {
                sendGeofenceEventToFirestore(childUid, geofenceId, eventType, triggeringLocation)
            }
        }
    }

    private fun sendGeofenceEventToFirestore(childUid: String, geofenceId: String, eventType: String, location: android.location.Location) {
        val db = FirebaseFirestore.getInstance()
        val event = hashMapOf(
            "geofenceId" to geofenceId,
            "eventType" to eventType,
            "timestamp" to Date(),
            "location" to GeoPoint(location.latitude, location.longitude)
        )

        db.collection("devices").document(childUid).collection("geofenceEvents").add(event)
            .addOnSuccessListener {
                Log.d("GeofenceJobService", "Geofence event successfully written to Firestore!")
            }
            .addOnFailureListener { e ->
                Log.e("GeofenceJobService", "Error writing geofence event to Firestore", e)
            }
    }
}
