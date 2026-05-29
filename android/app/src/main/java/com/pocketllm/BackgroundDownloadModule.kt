package com.pocketllm

import android.app.DownloadManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.database.Cursor
import android.net.Uri
import android.os.Environment
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.io.File

class BackgroundDownloadModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val downloadManager: DownloadManager by lazy {
        reactContext.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
    }

    // Map of downloadId -> modelId for tracking
    private val activeDownloads = mutableMapOf<Long, String>()
    private var progressTimer: java.util.Timer? = null

    private val downloadReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (intent?.action == DownloadManager.ACTION_DOWNLOAD_COMPLETE) {
                val downloadId = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1)
                if (downloadId != -1L) {
                    handleDownloadComplete(downloadId)
                }
            }
        }
    }

    init {
        // Register broadcast receiver for download completion
        val filter = IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE)
        ContextCompat.registerReceiver(reactContext, downloadReceiver, filter, ContextCompat.RECEIVER_EXPORTED)

        // Start progress polling
        startProgressPolling()
    }

    override fun getName(): String = "BackgroundDownload"

    @ReactMethod
    fun startDownload(modelId: String, url: String, fileName: String, promise: Promise) {
        try {
            val modelDir = File(reactApplicationContext.getExternalFilesDir(null), "models")
            if (!modelDir.exists()) {
                modelDir.mkdirs()
            }

            val destinationUri = Uri.fromFile(File(modelDir, fileName))

            // Check if already downloaded
            if (File(modelDir, fileName).exists()) {
                val result = Arguments.createMap()
                result.putBoolean("success", true)
                result.putString("status", "completed")
                result.putString("localPath", destinationUri.path)
                promise.resolve(result)
                return
            }

            val request = DownloadManager.Request(Uri.parse(url))
                .setTitle(fileName)
                .setDescription("Downloading model...")
                .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                .setDestinationUri(destinationUri)
                .setAllowedOverMetered(true)
                .setAllowedOverRoaming(true)

            val downloadId = downloadManager.enqueue(request)
            activeDownloads[downloadId] = modelId

            val result = Arguments.createMap()
            result.putBoolean("success", true)
            result.putDouble("downloadId", downloadId.toDouble())
            result.putString("status", "downloading")
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("DOWNLOAD_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun getDownloadProgress(downloadId: Double, promise: Promise) {
        try {
            val id = downloadId.toLong()
            val query = DownloadManager.Query().setFilterById(id)
            val cursor = downloadManager.query(query)

            if (cursor.moveToFirst()) {
                val statusIdx = cursor.getColumnIndex(DownloadManager.COLUMN_STATUS)
                val totalIdx = cursor.getColumnIndex(DownloadManager.COLUMN_TOTAL_SIZE_BYTES)
                val downloadedIdx = cursor.getColumnIndex(DownloadManager.COLUMN_BYTES_DOWNLOADED_SO_FAR)
                val reasonIdx = cursor.getColumnIndex(DownloadManager.COLUMN_REASON)
                val localUriIdx = cursor.getColumnIndex(DownloadManager.COLUMN_LOCAL_URI)

                val status = cursor.getInt(statusIdx)
                val totalBytes = cursor.getLong(totalIdx)
                val downloadedBytes = cursor.getLong(downloadedIdx)
                val reason = if (cursor.isNull(reasonIdx)) 0 else cursor.getInt(reasonIdx)
                val localUri = cursor.getString(localUriIdx) ?: ""

                val progress = if (totalBytes > 0) {
                    (downloadedBytes.toDouble() / totalBytes.toDouble()) * 100.0
                } else 0.0

                val statusStr = when (status) {
                    DownloadManager.STATUS_PENDING -> "pending"
                    DownloadManager.STATUS_RUNNING -> "downloading"
                    DownloadManager.STATUS_PAUSED -> "paused"
                    DownloadManager.STATUS_SUCCESSFUL -> "completed"
                    DownloadManager.STATUS_FAILED -> "failed"
                    else -> "unknown"
                }

                val result = Arguments.createMap()
                result.putDouble("downloadId", downloadId)
                result.putString("status", statusStr)
                result.putDouble("progress", progress)
                result.putDouble("totalBytes", totalBytes.toDouble())
                result.putDouble("downloadedBytes", downloadedBytes.toDouble())
                result.putString("localUri", localUri)

                if (status == DownloadManager.STATUS_FAILED) {
                    result.putString("error", getErrorMessage(reason))
                }

                promise.resolve(result)
            } else {
                promise.reject("NOT_FOUND", "Download not found")
            }
            cursor.close()
        } catch (e: Exception) {
            promise.reject("QUERY_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun cancelDownload(downloadId: Double, promise: Promise) {
        try {
            val id = downloadId.toLong()
            downloadManager.remove(id)
            activeDownloads.remove(id)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("CANCEL_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun isDownloadComplete(downloadId: Double, promise: Promise) {
        try {
            val id = downloadId.toLong()
            val query = DownloadManager.Query().setFilterById(id)
            val cursor = downloadManager.query(query)

            var complete = false
            var success = false
            var localPath = ""

            if (cursor.moveToFirst()) {
                val statusIdx = cursor.getColumnIndex(DownloadManager.COLUMN_STATUS)
                val localUriIdx = cursor.getColumnIndex(DownloadManager.COLUMN_LOCAL_URI)
                val status = cursor.getInt(statusIdx)
                complete = status == DownloadManager.STATUS_SUCCESSFUL || status == DownloadManager.STATUS_FAILED
                success = status == DownloadManager.STATUS_SUCCESSFUL
                localPath = cursor.getString(localUriIdx) ?: ""
            }
            cursor.close()

            val result = Arguments.createMap()
            result.putBoolean("complete", complete)
            result.putBoolean("success", success)
            result.putString("localPath", localPath.replace("file://", ""))
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("QUERY_ERROR", e.message, e)
        }
    }

    private fun handleDownloadComplete(downloadId: Long) {
        val modelId = activeDownloads[downloadId] ?: return
        val query = DownloadManager.Query().setFilterById(downloadId)
        val cursor = downloadManager.query(query)

        if (cursor.moveToFirst()) {
            val statusIdx = cursor.getColumnIndex(DownloadManager.COLUMN_STATUS)
            val localUriIdx = cursor.getColumnIndex(DownloadManager.COLUMN_LOCAL_URI)
            val status = cursor.getInt(statusIdx)
            val localUri = cursor.getString(localUriIdx) ?: ""

            val params = Arguments.createMap()
            params.putDouble("downloadId", downloadId.toDouble())
            params.putString("modelId", modelId)
            params.putBoolean("success", status == DownloadManager.STATUS_SUCCESSFUL)
            params.putString("localPath", localUri.replace("file://", ""))
            params.putString("status", if (status == DownloadManager.STATUS_SUCCESSFUL) "completed" else "failed")

            reactApplicationContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                ?.emit("DownloadComplete", params)
        }
        cursor.close()
        activeDownloads.remove(downloadId)
    }

    private fun startProgressPolling() {
        progressTimer?.cancel()
        progressTimer = java.util.Timer().apply {
            scheduleAtFixedRate(object : java.util.TimerTask() {
                override fun run() {
                    if (activeDownloads.isEmpty()) return

                    for ((downloadId, modelId) in activeDownloads) {
                        try {
                            val query = DownloadManager.Query().setFilterById(downloadId)
                            val cursor = downloadManager.query(query)
                            if (cursor.moveToFirst()) {
                                val totalIdx = cursor.getColumnIndex(DownloadManager.COLUMN_TOTAL_SIZE_BYTES)
                                val downloadedIdx = cursor.getColumnIndex(DownloadManager.COLUMN_BYTES_DOWNLOADED_SO_FAR)
                                val totalBytes = cursor.getLong(totalIdx)
                                val downloadedBytes = cursor.getLong(downloadedIdx)

                                val progress = if (totalBytes > 0) {
                                    (downloadedBytes.toDouble() / totalBytes.toDouble()) * 100.0
                                } else 0.0

                                val params = Arguments.createMap()
                                params.putDouble("downloadId", downloadId.toDouble())
                                params.putString("modelId", modelId)
                                params.putDouble("progress", progress)
                                params.putDouble("totalBytes", totalBytes.toDouble())
                                params.putDouble("downloadedBytes", downloadedBytes.toDouble())

                                reactApplicationContext
                                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                                    ?.emit("DownloadProgress", params)
                            }
                            cursor.close()
                        } catch (e: Exception) {
                            // Ignore polling errors
                        }
                    }
                }
            }, 1000, 1000)
        }
    }

    private fun getErrorMessage(reason: Int): String {
        return when (reason) {
            DownloadManager.ERROR_CANNOT_RESUME -> "Cannot resume download"
            DownloadManager.ERROR_DEVICE_NOT_FOUND -> "Device not found"
            DownloadManager.ERROR_FILE_ALREADY_EXISTS -> "File already exists"
            DownloadManager.ERROR_FILE_ERROR -> "File error"
            DownloadManager.ERROR_HTTP_DATA_ERROR -> "HTTP data error"
            DownloadManager.ERROR_INSUFFICIENT_SPACE -> "Insufficient space"
            DownloadManager.ERROR_TOO_MANY_REDIRECTS -> "Too many redirects"
            DownloadManager.ERROR_UNHANDLED_HTTP_CODE -> "Unhandled HTTP code"
            DownloadManager.ERROR_UNKNOWN -> "Unknown error"
            else -> "Download failed"
        }
    }

    override fun onCatalystInstanceDestroy() {
        progressTimer?.cancel()
        try {
            reactApplicationContext.unregisterReceiver(downloadReceiver)
        } catch (e: Exception) {
            // Ignore
        }
        super.onCatalystInstanceDestroy()
    }
}
