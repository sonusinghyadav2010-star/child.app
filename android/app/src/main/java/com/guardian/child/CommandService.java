
package com.guardian.child;

import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.hardware.camera2.CameraManager;
import android.media.Ringtone;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.IBinder;
import android.os.Vibrator;
import android.provider.MediaStore;
import android.util.Log;
import com.guardian.child.webrtc.WebRTCModule;
import com.facebook.react.bridge.Promise;
import com.guardian.child.services.ForegroundService;

public class CommandService extends Service {

    private static final String TAG = "CommandService";
    private WebRTCModule webRTCModule;

    // A simple promise for internal calls
    private final Promise internalPromise = new Promise() {
        @Override
        public void resolve(Object value) {
            Log.d(TAG, "Internal promise resolved");
        }

        @Override
        public void reject(String code, String message) {
            Log.e(TAG, "Internal promise rejected: " + code + ", " + message);
        }

        @Override
        public void reject(String code, Throwable throwable) {
            Log.e(TAG, "Internal promise rejected: " + code, throwable);
        }

        @Override
        public void reject(String code, String message, Throwable throwable) {
            Log.e(TAG, "Internal promise rejected: " + code + ", " + message, throwable);
        }
    };

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String command = intent.getStringExtra("command");
        Log.d(TAG, "Received command: " + command);
        if (command != null) {
            executeCommand(command);
        }
        return START_NOT_STICKY;
    }

    private void executeCommand(String command) {
        if (webRTCModule == null) {
             try {
                MainApplication application = (MainApplication) getApplication();
                webRTCModule = application.getReactNativeHost().getReactInstanceManager().getCurrentReactContext().getNativeModule(WebRTCModule.class);
            } catch (Exception e) {
                Log.e(TAG, "Failed to get WebRTCModule", e);
                return;
            }
        }
        
        if (webRTCModule == null) {
            Log.e(TAG, "WebRTCModule is not available");
            return;
        }

        ForegroundService foregroundService = ForegroundService.getInstance();

        switch (command) {
            case "startCamera":
                webRTCModule.startCameraStream(internalPromise);
                if (foregroundService != null) foregroundService.showMonitoringNotification();
                break;
            case "stopCamera":
                webRTCModule.stopCameraStream(internalPromise);
                if (foregroundService != null) foregroundService.showDefaultNotification();
                break;
            case "switchCamera":
                webRTCModule.switchCamera(internalPromise);
                break;
            case "startScreen":
                webRTCModule.startScreenStream(internalPromise);
                if (foregroundService != null) foregroundService.showMonitoringNotification();
                break;
            case "stopScreen":
                webRTCModule.stopScreenStream(internalPromise);
                if (foregroundService != null) foregroundService.showDefaultNotification();
                break;
            case "muteAudio":
                webRTCModule.toggleAudio(false, internalPromise);
                break;
            case "unmuteAudio":
                webRTCModule.toggleAudio(true, internalPromise);
                break;
            case "playAlarm":
                playAlarm();
                break;
            case "vibrateDevice":
                vibrateDevice();
                break;
            default:
                Log.w(TAG, "Unsupported command: " + command);
        }
    }

    private void playAlarm() {
        try {
            Uri notification = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
            Ringtone r = RingtoneManager.getRingtone(getApplicationContext(), notification);
            r.play();
        } catch (Exception e) {
            Log.e(TAG, "Error playing alarm", e);
        }
    }

    private void vibrateDevice() {
        Vibrator v = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
        if (v != null && v.hasVibrator()) {
            v.vibrate(500);
        }
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
