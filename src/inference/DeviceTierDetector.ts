import { Platform, NativeModules } from 'react-native';
import { DeviceProfile, DeviceTier } from '../types';

export class DeviceTierDetector {
  static async detect(): Promise<DeviceProfile> {
    let ramGB = 4;
    let cpuCores = 4;

    try {
      // Try to get memory info from native module if available
      const { PlatformConstants } = NativeModules;
      if (PlatformConstants?.getConstants) {
        const constants = await PlatformConstants.getConstants();
        if (constants?.TotalMemory) {
          ramGB = constants.TotalMemory / (1024 * 1024 * 1024);
        }
      }
    } catch {
      // Fallback to estimate
    }

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
      cpuCores,
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
