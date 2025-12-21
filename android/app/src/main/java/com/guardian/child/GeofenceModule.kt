package com.guardian.child

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise

class GeofenceModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val geofenceManager = GeofenceManager(reactContext)

    override fun getName(): String {
        return "GeofenceModule"
    }

    @ReactMethod
    fun addGeofence(geofenceId: String, latitude: Double, longitude: Double, radius: Float, promise: Promise) {
        try {
            geofenceManager.addGeofence(geofenceId, latitude, longitude, radius)
            promise.resolve("Geofence added successfully.")
        } catch (e: Exception) {
            promise.reject("ADD_GEOFENCE_ERROR", "An error occurred while adding the geofence.", e)
        }
    }

    @ReactMethod
    fun removeGeofence(geofenceId: String, promise: Promise) {
        try {
            geofenceManager.removeGeofence(geofenceId)
            promise.resolve("Geofence removed successfully.")
        } catch (e: Exception) {
            promise.reject("REMOVE_GEOFENCE_ERROR", "An error occurred while removing the geofence.", e)
        }
    }
}
