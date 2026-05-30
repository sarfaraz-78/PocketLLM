import { Platform } from 'react-native';
import {
  getTotalMemory,
  getHardware,
  supportedAbis,
} from 'react-native-device-info';
import { DeviceProfile, DeviceTier } from '../types';

let cachedProfile: DeviceProfile | null = null;

export class DeviceTierDetector {
  static async detect(): Promise<DeviceProfile> {
    if (cachedProfile) return cachedProfile;

    // Get real hardware info from react-native-device-info
    let ramGB = 4;
    let cpuModel = 'Unknown';

    try {
      const totalMemory = await getTotalMemory();
      ramGB = totalMemory / (1024 * 1024 * 1024);
    } catch {
      // Fallback
    }

    try {
      cpuModel = await getHardware();
    } catch {
      // Fallback
    }

    const platform = Platform.OS as 'ios' | 'android';

    // Check supported ABIs for 64-bit
    let is64Bit = false;
    let abis: string[] = [];
    try {
      const abisResult = await supportedAbis();
      abis = Array.isArray(abisResult) ? abisResult : [];
      is64Bit = abis.some(
        (abi) =>
          abi.toLowerCase().includes('arm64') ||
          abi.toLowerCase().includes('x86_64')
      );
    } catch {
      // Fallback assume 64-bit if we can't detect
      is64Bit = true;
    }

    // Detect GPU availability
    let gpuAvailable = false;
    let gpuName: string | undefined;

    if (Platform.OS === 'ios') {
      gpuAvailable = true;
      gpuName = 'Metal';
    } else if (Platform.OS === 'android') {
      const upperModel = cpuModel.toUpperCase();
      if (
        upperModel.includes('ADRENO') ||
        upperModel.includes('MALI') ||
        upperModel.includes('Powervr') ||
        upperModel.includes('IMMORTAL')
      ) {
        gpuAvailable = true;
        gpuName = 'Android GPU';
      }
    }

    const tier = this.calculateTier(ramGB, is64Bit);

    // CPU cores - Android doesn't expose this reliably, use a safe default
    const cpuCores = Platform.OS === 'ios' ? 4 : 4;

    cachedProfile = {
      tier,
      ramGB: Math.round(ramGB * 10) / 10,
      cpuCores,
      platform,
      gpuAvailable,
      gpuName,
      cpuModel,
      abis,
      is64Bit,
    };

    return cachedProfile;
  }

  private static calculateTier(ramGB: number, is64Bit: boolean): DeviceTier {
    // 32-bit devices can only run small models
    if (!is64Bit) {
      return DeviceTier.ULTRA_LOW;
    }

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
        return 'Ultra Low (< 3GB RAM) — Small 0.5B–1B models only';
      case DeviceTier.LOW:
        return 'Low (3–4GB RAM) — Compact 1B–2B models';
      case DeviceTier.MEDIUM:
        return 'Medium (4–6GB RAM) — Balanced 2B–4B models';
      case DeviceTier.HIGH:
        return 'High (6–8GB RAM) — Powerful 4B–8B models';
      case DeviceTier.PREMIUM:
        return 'Premium (8GB+ RAM) — Full 7B–14B models';
    }
  }

  static clearCache(): void {
    cachedProfile = null;
  }
}