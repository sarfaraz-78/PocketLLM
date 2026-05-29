package com.pocketllm

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.provider.OpenableColumns
import com.facebook.react.bridge.*
import com.facebook.react.bridge.ActivityEventListener
import java.io.File
import java.io.FileOutputStream

class NativeFilePickerModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext), ActivityEventListener {

    private var pendingPromise: Promise? = null

    init {
        reactContext.addActivityEventListener(this)
    }

    override fun getName(): String = "NativeFilePicker"

    @ReactMethod
    fun pickFiles(promise: Promise) {
        val activity = currentActivity
        if (activity == null) {
            promise.reject("ACTIVITY_NULL", "Activity is null")
            return
        }

        pendingPromise = promise

        val intent = Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
            addCategory(Intent.CATEGORY_OPENABLE)
            type = "*/*"
            putExtra(Intent.EXTRA_MIME_TYPES, arrayOf("application/octet-stream", "application/x-gguf", "*/*"))
            putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            addFlags(Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION)
        }

        try {
            activity.startActivityForResult(intent, 1001)
        } catch (e: Exception) {
            pendingPromise = null
            promise.reject("ERROR", e.message)
        }
    }

    override fun onActivityResult(activity: Activity?, requestCode: Int, resultCode: Int, data: Intent?) {
        if (requestCode != 1001) return
        val promise = pendingPromise
        pendingPromise = null
        if (promise == null) return

        if (resultCode == Activity.RESULT_OK && data != null) {
            handleResult(data, promise)
        } else {
            promise.reject("CANCELLED", "User cancelled file picker")
        }
    }

    override fun onNewIntent(intent: Intent?) {}

    private fun handleResult(data: Intent, promise: Promise) {
        try {
            val clipData = data.clipData
            val resultList = WritableNativeArray()

            if (clipData != null) {
                for (i in 0 until clipData.itemCount) {
                    val uri = clipData.getItemAt(i).uri
                    val fileInfo = processUri(uri)
                    if (fileInfo != null) {
                        resultList.pushMap(fileInfo)
                    }
                }
            } else {
                data.data?.let { uri ->
                    val fileInfo = processUri(uri)
                    if (fileInfo != null) {
                        resultList.pushMap(fileInfo)
                    }
                }
            }

            promise.resolve(resultList)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    private fun processUri(uri: Uri): WritableMap? {
        val context = reactApplicationContext

        var fileName = ""
        var fileSize: Long = 0

        context.contentResolver.query(uri, null, null, null, null)?.use { cursor ->
            if (cursor.moveToFirst()) {
                val nameIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
                val sizeIndex = cursor.getColumnIndex(OpenableColumns.SIZE)
                if (nameIndex >= 0) fileName = cursor.getString(nameIndex) ?: ""
                if (sizeIndex >= 0) fileSize = cursor.getLong(sizeIndex)
            }
        }

        if (fileName.isEmpty()) {
            fileName = uri.lastPathSegment ?: "unknown"
        }

        if (!fileName.lowercase().endsWith(".gguf")) {
            return null
        }

        val cacheDir = File(context.cacheDir, "picked_files")
        if (!cacheDir.exists()) cacheDir.mkdirs()

        val destFile = File(cacheDir, fileName)
        try {
            context.contentResolver.openInputStream(uri)?.use { input ->
                FileOutputStream(destFile).use { output ->
                    input.copyTo(output)
                }
            }
        } catch (e: Exception) {
            return null
        }

        val result = WritableNativeMap()
        result.putString("name", fileName)
        result.putString("path", destFile.absolutePath)
        result.putDouble("size", fileSize.toDouble())
        result.putString("uri", uri.toString())
        return result
    }
}
