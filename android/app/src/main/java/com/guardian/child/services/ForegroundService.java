package com.guardian.child.services;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;
import com.guardian.child.R;

public class ForegroundService extends Service {

    public static final String CHANNEL_ID = "ForegroundServiceChannel";
    private static ForegroundService instance;
    private NotificationManager notificationManager;

    @Override
    public void onCreate() {
        super.onCreate();
        instance = this;
        notificationManager = getSystemService(NotificationManager.class);
        createNotificationChannel();
    }

    public static ForegroundService getInstance() {
        return instance;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        showDefaultNotification();
        return START_STICKY;
    }

    public void showDefaultNotification() {
        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("Guardian Active")
                .setContentText("Device is protected")
                .setSmallIcon(R.mipmap.ic_launcher)
                .setOngoing(true)
                .build();
        startForeground(1, notification);
    }

    public void showMonitoringNotification() {
        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("Monitoring Active")
                .setContentText("Live activity is being shared.")
                .setSmallIcon(R.drawable.green_dot) // Our green dot
                .setOngoing(true)
                .build();
        notificationManager.notify(1, notification);
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel serviceChannel = new NotificationChannel(
                    CHANNEL_ID,
                    "Guardian Foreground Service",
                    NotificationManager.IMPORTANCE_LOW // Use LOW to avoid sound
            );
            serviceChannel.setSound(null, null);
            notificationManager.createNotificationChannel(serviceChannel);
        }
    }
}
