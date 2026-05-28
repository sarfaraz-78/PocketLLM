import DeviceInfo from 'react-native-device-info';
import { Platform } from 'react-native';
import { DeviceProfile, DeviceTier } from '../types';

export class DeviceTierDetector {
  static async detect(): Promise<DeviceProfile> {
    const ramBytes = await DeviceInfo.getTotalMemory();
    const ramGB = ramBytes / (1024 * 1024 * 1024);
    const cpuCores = await DeviceInfo.getSupportedAbis();
    const platform = Platform.OS as 'ios' | 'android';

    let gpuAvailable = false;
    let gpuName: string | undefined;

    if (Platform.OS === 'ios') {
      gpuAvailable = true;
      gpuName = 'Metal';
    } else {
      gpuAvailable = false;
      gpuName = 'CPU';
    }

    const tier = this.calculateTier(ramGB);

    return {
      tier,
      ramGB: Math.round(ramGB * 10) / 10,
      cpuCores: cpuCores.length,
      platform,
      gpuAvailable,
      gpuName,
    };
  }

  private static calculateTier(ramGB: number): DeviceTier {
    if (ramGB < 3) {
      return DeviceTier.ULTRA_LOW;
    } else if (ramGB < 4) {
      return DeviceTier.LOW;
    } else if (ramGB < 6) {
      return DeviceTier.MEDIUM;
    } else if (ramGB < 8) {
      return DeviceTier.HIGH;
    } else {
      return DeviceTier.PREMIUM;
    }
  }

  static getTierDescription(tier: DeviceTier): string {
    switch (tier) {
      case DeviceTier.ULTRA_LOW:
        return 'Ultra Low (< 3GB RAM) - Small models only';
      case DeviceTier.LOW:
        return 'Low (3-4GB RAM) - Compact models';
      case DeviceTier.MEDIUM:
        return 'Medium (4-6GB RAM) - Balanced performance';
      case DeviceTier.HIGH:
        return 'High (6-8GB RAM) - Good performance';
      case DeviceTier.PREMIUM:
        return 'Premium (8GB+ RAM) - Best performance';
    }
  }
}
