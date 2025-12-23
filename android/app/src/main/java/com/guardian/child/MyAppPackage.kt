
package com.guardian.child

import android.view.View
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ReactShadowNode
import com.facebook.react.uimanager.ViewManager
import com.guardian.child.webrtc.WebRTCModule

class MyAppPackage : ReactPackage {
    override fun createViewManagers(
        reactContext: ReactApplicationContext
    ): MutableList<ViewManager<View, ReactShadowNode<*>>> = mutableListOf()

    override fun createNativeModules(
        reactContext: ReactApplicationContext
    ): MutableList<NativeModule> {
        val modules = mutableListOf<NativeModule>(
            WebFilteringModule(reactContext),
            PermissionsModule(reactContext),
            CallLogModule(reactContext),
            WebRTCModule(reactContext),
            ScreenShareModule(reactContext) // Add this line
        )
        return modules
    }
}
