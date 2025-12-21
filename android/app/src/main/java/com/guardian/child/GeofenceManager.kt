package com.guardianchildapp

import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.util.Log
import com.google.android.gms.location.Geofence
import com.google.android.gms.location.GeofencingRequest
import com.google.android.gms.location.LocationServices

class GeofenceManager(private val context: Context) {

    private val geofencingClient = LocationServices.getGeofencingClient(context)

    private val geofencePendingIntent: PendingIntent by lazy {
        val intent = Intent(context, GeofenceBroadcastReceiver::class.java)
        PendingIntent.getBroadcast(context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_MUTABLE)
    }

    fun addGeofence(geofenceId: String, latitude: Double, longitude: Double, radius: Float) {
        val geofence = Geofence.Builder()
            .setRequestId(geofenceId) // पेरेंट ऐप से दी गई ID
            .setCircularRegion(latitude, longitude, radius)
            .setExpirationDuration(Geofence.NEVER_EXPIRE) // जियोफेंस कभी एक्सपायर नहीं होगा
            .setTransitionTypes(Geofence.GEOFENCE_TRANSITION_ENTER or Geofence.GEOFENCE_TRANSITION_EXIT)
            .build()

        val geofencingRequest = GeofencingRequest.Builder()
            .setInitialTrigger(GeofencingRequest.INITIAL_TRIGGER_ENTER) // अगर डिवाइस पहले से अंदर है, तो ट्रिगर करें
            .addGeofence(geofence)
            .build()

        try {
            geofencingClient.addGeofences(geofencingRequest, geofencePendingIntent)
                .addOnSuccessListener { 
                    Log.d("GeofenceManager", "Geofence added successfully: $geofenceId")
                }
                .addOnFailureListener { e ->
                    Log.e("GeofenceManager", "Failed to add geofence: $geofenceId", e)
                }
        } catch (e: SecurityException) {
            Log.e("GeofenceManager", "SecurityException: Check location permissions.", e)
        }
    }

    fun removeGeofence(geofenceId: String) {
        geofencingClient.removeGeofences(listOf(geofenceId))
            .addOnSuccessListener { 
                 Log.d("GeofenceManager", "Geofence removed successfully: $geofenceId")
            }
            .addOnFailureListener { e ->
                Log.e("GeofenceManager", "Failed to remove geofence: $geofenceId", e)
            }
    }
}
