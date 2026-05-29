import { supportedAbis } from 'react-native-device-info';

let cachedIs64Bit: boolean | null = null;

export async function isDevice64Bit(): Promise<boolean> {
  if (cachedIs64Bit !== null) return cachedIs64Bit;

  const abis = await supportedAbis();
  const has64Bit = abis.some(
    (abi) =>
      abi.toLowerCase().includes('arm64') ||
      abi.toLowerCase().includes('x86_64') ||
      abi.toLowerCase().includes('arm64-v8a')
  );
  cachedIs64Bit = has64Bit;
  return has64Bit;
}

export async function assert64Bit(): Promise<void> {
  const is64 = await isDevice64Bit();
  if (!is64) {
    throw new Error(
      'This device is 32-bit. On-device LLM inference requires a 64-bit device (arm64-v8a or x86_64).'
    );
  }
}
