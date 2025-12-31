
package com.guardian.child;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.net.wifi.WifiManager;
import android.os.BatteryManager;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.telephony.TelephonyManager;
import android.text.format.Formatter;
import android.util.Log;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

import com.google.firebase.firestore.FirebaseFirestore;
import com.google.firebase.firestore.ListenerRegistration;
import com.google.firebase.firestore.SetOptions;
import com.guardian.child.webrtc.WebRTCService;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

public class GuardianService extends Service {

    private static final String TAG = "GuardianService";
    private static final int NOTIFICATION_ID = 1;
    private static final String CHANNEL_ID = "GuardianServiceChannel";
    private static final long HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
    private static final long DEVICE_DETAILS_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

    private FirebaseFirestore db;
    private String parentUid;
    private String childUid;
    private ListenerRegistration webrtcListener;
    private final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();

    @Override
    public void onCreate() {
        super.onCreate();
        db = FirebaseFirestore.getInstance();
        SharedPreferences prefs = getSharedPreferences("ChildAppPrefs", Context.MODE_PRIVATE);
        parentUid = prefs.getString("parentUid", null);
        childUid = prefs.getString("childUid", null);

        createNotificationChannel();
        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("Guardian Child")
                .setContentText("Device is protected.")
                .setSmallIcon(R.mipmap.ic_launcher)
                .build();
        startForeground(NOTIFICATION_ID, notification);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "GuardianService is starting.");

        if (parentUid == null || childUid == null) {
            Log.e(TAG, "Pairing info not found, stopping service.");
            stopSelf();
            return START_NOT_STICKY;
        }

        // Stop any existing tasks before starting new ones
        scheduler.shutdownNow();
        // Re-initialize scheduler after shutdown
        ScheduledExecutorService newScheduler = Executors.newSingleThreadScheduledExecutor();

        // Schedule periodic tasks
        newScheduler.scheduleAtFixedRate(this::sendHeartbeat, 0, HEARTBEAT_INTERVAL_MS, TimeUnit.MILLISECONDS);
        newScheduler.scheduleAtFixedRate(this::uploadDeviceDetails, 5, DEVICE_DETAILS_INTERVAL_MS, TimeUnit.MILLISECONDS); // Start after 5 seconds

        // Start the WebRTC listener
        setupWebRTCListener();

        return START_STICKY;
    }

    private void setupWebRTCListener() {
        if (webrtcListener != null) webrtcListener.remove();
        Log.d(TAG, "Setting up WebRTC listener for parent: " + parentUid + ", child: " + childUid);

        webrtcListener = db.collection("users").document(parentUid)
                .collection("children").document(childUid)
                .addSnapshotListener((snapshot, e) -> {
                    if (e != null) {
                        Log.w(TAG, "WebRTC listener failed.", e);
                        return;
                    }
                    if (snapshot != null && snapshot.exists() && snapshot.getData().containsKey("webrtc_offer")) {
                         Map<String, String> offerMap = (Map<String, String>) snapshot.getData().get("webrtc_offer");
                        if (offerMap == null) return;

                        Log.d(TAG, "Received WebRTC offer.");
                        Intent serviceIntent = new Intent(this, WebRTCService.class);
                        serviceIntent.setAction("START_CONNECTION");
                        serviceIntent.putExtra("sdp", offerMap.get("sdp"));
                        serviceIntent.putExtra("type", offerMap.get("type").toLowerCase());
                        serviceIntent.putExtra("parentId", parentUid);
                        serviceIntent.putExtra("childId", childUid);
                        startService(serviceIntent);
                    }
                });
    }

    private void sendHeartbeat() {
        Map<String, Object> data = new HashMap<>();
        data.put("lastSeen", System.currentTimeMillis());
        data.put("isOnline", true);

        db.collection("users").document(parentUid)
            .collection("children").document(childUid)
            .set(data, SetOptions.merge()) // Use merge to avoid overwriting other fields
            .addOnSuccessListener(aVoid -> Log.d(TAG, "Heartbeat sent successfully."))
            .addOnFailureListener(e -> Log.e(TAG, "Failed to send heartbeat.", e));
    }

    private void uploadDeviceDetails() {
        Map<String, Object> details = new HashMap<>();
        details.put("osVersion", "Android " + Build.VERSION.RELEASE);
        details.put("ipAddress", getIpAddress());
        details.put("battery", getBatteryLevel());
        details.put("simOperator", getSimOperator());
        details.put("lastFullSync", System.currentTimeMillis());

         db.collection("users").document(parentUid)
            .collection("children").document(childUid)
            .set(details, SetOptions.merge())
            .addOnSuccessListener(aVoid -> Log.d(TAG, "Device details uploaded successfully."))
            .addOnFailureListener(e -> Log.e(TAG, "Failed to upload device details.", e));
    }

    private int getBatteryLevel() {
        BatteryManager bm = (BatteryManager) getSystemService(BATTERY_SERVICE);
        return bm.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY);
    }

    private String getIpAddress() {
        try {
            WifiManager wifiManager = (WifiManager) getApplicationContext().getSystemService(Context.WIFI_SERVICE);
            return Formatter.formatIpAddress(wifiManager.getConnectionInfo().ipAddress);
        } catch (Exception e) {
            return "N/A";
        }
    }

    private String getSimOperator() {
        try {
            TelephonyManager telephonyManager = (TelephonyManager) getSystemService(Context.TELEPHONY_SERVICE);
            String operatorName = telephonyManager.getSimOperatorName();
            return operatorName.isEmpty() ? "N/A" : operatorName;
        } catch (SecurityException e) {
            return "Permission Denied";
        } catch (Exception e) {
            return "N/A";
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (webrtcListener != null) webrtcListener.remove();
        scheduler.shutdownNow();
        Log.d(TAG, "GuardianService destroyed, scheduling restart.");

        Intent broadcastIntent = new Intent();
        broadcastIntent.setAction("restartservice");
        broadcastIntent.setClass(this, BootReceiver.class);
        this.sendBroadcast(broadcastIntent);
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel serviceChannel = new NotificationChannel(
                    CHANNEL_ID, "Guardian Service Channel", NotificationManager.IMPORTANCE_LOW
            );
            getSystemService(NotificationManager.class).createNotificationChannel(serviceChannel);
        }
    }
}
