
package com.guardian.child;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.media.projection.MediaProjectionManager;
import android.util.Log;

import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.BaseActivityEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.guardian.child.webrtc.WebRTCModule;

public class ScreenShareModule extends ReactContextBaseJavaModule {

    private static final String TAG = "ScreenShareModule";
    private static final int SCREEN_CAPTURE_REQUEST_CODE = 1001;

    private final ReactApplicationContext reactContext;
    private Promise screenCapturePromise;

    public ScreenShareModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        reactContext.addActivityEventListener(mActivityEventListener);
    }

    @Override
    public String getName() {
        return "ScreenShareModule";
    }

    @ReactMethod
    public void requestScreenSharePermission(final Promise promise) {
        Activity currentActivity = getCurrentActivity();
        if (currentActivity == null) {
            promise.reject("E_ACTIVITY_DOES_NOT_EXIST", "Activity doesn't exist");
            return;
        }

        this.screenCapturePromise = promise;

        try {
            MediaProjectionManager mediaProjectionManager = (MediaProjectionManager) reactContext.getSystemService(Context.MEDIA_PROJECTION_SERVICE);
            Intent intent = mediaProjectionManager.createScreenCaptureIntent();
            currentActivity.startActivityForResult(intent, SCREEN_CAPTURE_REQUEST_CODE);
        } catch (Exception e) {
            screenCapturePromise.reject("E_FAILED_TO_START_SCREENCAPTURE", e.getMessage());
            screenCapturePromise = null;
        }
    }

    private final ActivityEventListener mActivityEventListener = new BaseActivityEventListener() {
        @Override
        public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent intent) {
            if (requestCode == SCREEN_CAPTURE_REQUEST_CODE) {
                if (screenCapturePromise != null) {
                    if (resultCode != Activity.RESULT_OK) {
                        screenCapturePromise.reject("E_PERMISSION_DENIED", "Screen capture permission denied");
                        screenCapturePromise = null;
                        return;
                    }
                    
                    // We need to pass this intent data to the WebRTCEngine.
                    // Since the engine is managed by WebRTCModule, we'll create a static field
                    // or a setter in WebRTCModule to hold this data temporarily.
                    WebRTCModule.setScreenCaptureIntent(intent);

                    screenCapturePromise.resolve(true);
                    screenCapturePromise = null;
                }
            }
        }
    };
}
