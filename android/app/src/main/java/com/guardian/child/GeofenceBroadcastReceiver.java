
package com.guardian.child;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;
import com.google.android.gms.location.Geofence;
import com.google.android.gms.location.GeofencingEvent;

public class GeofenceBroadcastReceiver extends BroadcastReceiver {

    private static final String TAG = "GeofenceReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        GeofencingEvent geofencingEvent = GeofencingEvent.fromIntent(intent);
        if (geofencingEvent.hasError()) {
            String errorMessage = "Geofence Error: " + geofencingEvent.getErrorCode();
            Log.e(TAG, errorMessage);
            return;
        }

        int geofenceTransition = geofencingEvent.getGeofenceTransition();

        if (geofenceTransition == Geofence.GEOFENCE_TRANSITION_ENTER ||
            geofenceTransition == Geofence.GEOFENCE_TRANSITION_EXIT) {

            for (Geofence geofence : geofencingEvent.getTriggeringGeofences()) {
                String geofenceId = geofence.getRequestId();
                String transitionType = (geofenceTransition == Geofence.GEOFENCE_TRANSITION_ENTER) ? "ENTER" : "EXIT";
                Log.i(TAG, "Geofence Transition: " + geofenceId + " -> " + transitionType);

                // Here you would typically send an event to your React Native application
                // For example, using a Headless JS task or by emitting an event
            }
        } else {
            Log.e(TAG, "Invalid geofence transition type: " + geofenceTransition);
        }
    }
}
