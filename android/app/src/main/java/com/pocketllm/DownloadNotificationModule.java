package com.pocketllm;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.os.Build;

import androidx.core.app.NotificationCompat;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class DownloadNotificationModule extends ReactContextBaseJavaModule {
    public static final String NAME = "DownloadNotification";
    private static final String CHANNEL_ID = "pocketllm_downloads";
    private static final int NOTIFICATION_ID = 1001;

    private final NotificationManager notificationManager;

    public DownloadNotificationModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.notificationManager = (NotificationManager) reactContext.getSystemService(Context.NOTIFICATION_SERVICE);
        createNotificationChannel();
    }

    @Override
    public String getName() {
        return NAME;
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Model Downloads",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Shows progress for model downloads");
            channel.setShowBadge(false);
            notificationManager.createNotificationChannel(channel);
        }
    }

    @ReactMethod
    public void showDownloadNotification(String title) {
        NotificationCompat.Builder builder = new NotificationCompat.Builder(getReactApplicationContext(), CHANNEL_ID)
            .setSmallIcon(android.R.drawable.stat_sys_download)
            .setContentTitle(title)
            .setContentText("Starting download...")
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setProgress(100, 0, false)
            .setPriority(NotificationCompat.PRIORITY_LOW);

        notificationManager.notify(NOTIFICATION_ID, builder.build());
    }

    @ReactMethod
    public void updateDownloadProgress(int progress, int total) {
        NotificationCompat.Builder builder = new NotificationCompat.Builder(getReactApplicationContext(), CHANNEL_ID)
            .setSmallIcon(android.R.drawable.stat_sys_download)
            .setContentTitle("Downloading model")
            .setContentText(progress + "% complete")
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setProgress(total, progress, false)
            .setPriority(NotificationCompat.PRIORITY_LOW);

        notificationManager.notify(NOTIFICATION_ID, builder.build());
    }

    @ReactMethod
    public void cancelDownloadNotification() {
        notificationManager.cancel(NOTIFICATION_ID);
    }

    @ReactMethod
    public void showCompleteNotification(String title) {
        NotificationCompat.Builder builder = new NotificationCompat.Builder(getReactApplicationContext(), CHANNEL_ID)
            .setSmallIcon(android.R.drawable.stat_sys_download_done)
            .setContentTitle(title)
            .setContentText("Download complete")
            .setOngoing(false)
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT);

        notificationManager.notify(NOTIFICATION_ID, builder.build());
    }
}
