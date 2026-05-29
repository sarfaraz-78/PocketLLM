import { NativeModules } from 'react-native';

const { DownloadNotification } = NativeModules;

export const DownloadNotificationService = {
  show: (title: string) => {
    if (DownloadNotification?.showDownloadNotification) {
      DownloadNotification.showDownloadNotification(title);
    }
  },

  updateProgress: (progress: number, total: number = 100) => {
    if (DownloadNotification?.updateDownloadProgress) {
      DownloadNotification.updateDownloadProgress(Math.round(progress), total);
    }
  },

  cancel: () => {
    if (DownloadNotification?.cancelDownloadNotification) {
      DownloadNotification.cancelDownloadNotification();
    }
  },

  showComplete: (title: string) => {
    if (DownloadNotification?.showCompleteNotification) {
      DownloadNotification.showCompleteNotification(title);
    }
  },
};
