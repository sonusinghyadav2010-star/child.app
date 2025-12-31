package com.guardian.child

import android.os.Environment
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.WritableNativeArray
import com.facebook.react.bridge.WritableNativeMap
import java.io.File

class FileManagerModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "FileManagerModule"

    @ReactMethod
    fun getDownloads(promise: Promise) {
        try {
            val downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
            val files = downloadsDir.listFiles()

            val fileList = WritableNativeArray()

            files?.forEach { file ->
                val fileMap = WritableNativeMap()
                fileMap.putString("name", file.name)
                fileMap.putString("path", file.absolutePath)
                fileMap.putDouble("size", file.length().toDouble())
                fileMap.putString("type", if (file.isDirectory) "directory" else "file")
                fileList.pushMap(fileMap)
            }

            promise.resolve(fileList)
        } catch (e: Exception) {
            promise.reject("E_DOWNLOADS_ERROR", "Could not list downloads", e)
        }
    }
}
