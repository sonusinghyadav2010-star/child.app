package com.guardianchildapp.permissions;

import android.Manifest;
import android.app.admin.DevicePolicyManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;
import com.guardianchildapp.DeviceAdminReceiver;

public class PermissionsModule extends ReactContextBaseJavaModule implements ActivityEventListener {

    public PermissionsModule(ReactApplicationContext reactContext) {
        super(reactContext);
        reactContext.addActivityEventListener(this);
    }

    @Override
    public String getName() {
        return "PermissionsModule";
    }

    @ReactMethod
    public void checkAllPermissions(Promise promise) {
        WritableMap permissions = Arguments.createMap();
        permissions.putBoolean("Camera", isGranted(Manifest.permission.CAMERA));
        permissions.putBoolean("Location", isGranted(Manifest.permission.ACCESS_FINE_LOCATION));
        permissions.putBoolean("Microphone", isGranted(Manifest.permission.RECORD_AUDIO));
        permissions.putBoolean("Accessibility", isAccessibilityGranted());
        permissions.putBoolean("DeviceAdmin", isDeviceAdminGranted());
        permissions.putBoolean("UsageStats", isUsageStatsGranted());
        promise.resolve(permissions);
    }

    @ReactMethod
    public void openSpecificPermission(String permissionName) {
        switch (permissionName) {
            case "Accessibility":
                requestAccessibilityPermission();
                break;
            case "DeviceAdmin":
                requestDeviceAdminPermission();
                break;
            case "UsageStats":
                requestUsageStatsPermission();
                break;
            default:
                openAppSettings();
                break;
        }
    }

    private boolean isGranted(String permission) {
        return ContextCompat.checkSelfPermission(getReactApplicationContext(), permission) == PackageManager.PERMISSION_GRANTED;
    }

    private boolean isAccessibilityGranted() {
        int accessibilityEnabled = 0;
        try {
            accessibilityEnabled = Settings.Secure.getInt(getReactApplicationContext().getContentResolver(), Settings.Secure.ACCESSIBILITY_ENABLED);
        } catch (Settings.SettingNotFoundException e) { /* Ignored */ }
        if (accessibilityEnabled == 1) {
            String settingValue = Settings.Secure.getString(getReactApplicationContext().getContentResolver(), Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES);
            return settingValue != null && settingValue.contains(getReactApplicationContext().getPackageName());
        }
        return false;
    }

    private boolean isDeviceAdminGranted() {
        DevicePolicyManager dpm = (DevicePolicyManager) getReactApplicationContext().getSystemService(Context.DEVICE_POLICY_SERVICE);
        ComponentName deviceAdmin = new ComponentName(getReactApplicationContext(), DeviceAdminReceiver.class);
        return dpm.isAdminActive(deviceAdmin);
    }

    private boolean isUsageStatsGranted() {
        // Implementation for checking Usage Stats permission
        return false; // Placeholder
    }

    @ReactMethod
    public void requestAccessibilityPermission() {
        Intent intent = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getReactApplicationContext().startActivity(intent);
    }

    @ReactMethod
    public void requestDeviceAdminPermission() {
        ComponentName deviceAdmin = new ComponentName(getReactApplicationContext(), DeviceAdminReceiver.class);
        Intent intent = new Intent(DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN);
        intent.putExtra(DevicePolicyManager.EXTRA_DEVICE_ADMIN, deviceAdmin);
        intent.putExtra(DevicePolicyManager.EXTRA_ADD_EXPLANATION, "Admin permission is required for remote lock and wipe.");
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getCurrentActivity().startActivity(intent);
    }

    @ReactMethod
    public void requestUsageStatsPermission() {
        Intent intent = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getReactApplicationContext().startActivity(intent);
    }

    @ReactMethod
    public void openAppSettings() {
        Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
        Uri uri = Uri.fromParts("package", getReactApplicationContext().getPackageName(), null);
        intent.setData(uri);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getReactApplicationContext().startActivity(intent);
    }
    
    // ActivityEventListener methods
    @Override
    public void onActivityResult(android.app.Activity activity, int requestCode, int resultCode, Intent data) {}

    @Override
    public void onNewIntent(Intent intent) {}
}
