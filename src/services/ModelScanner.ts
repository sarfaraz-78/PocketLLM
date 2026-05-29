import RNFS from 'react-native-fs';
import { Platform } from 'react-native';

export interface ScanResult {
  ggufFiles: Array<{
    path: string;
    name: string;
    size: number;
    mmprojPath?: string;
    mmprojName?: string;
  }>;
  mmprojFiles: Array<{
    path: string;
    name: string;
    size: number;
  }>;
}

const COMMON_SCAN_DIRS = [
  RNFS.DownloadDirectoryPath,
  RNFS.DocumentDirectoryPath,
  RNFS.ExternalDirectoryPath,
  RNFS.ExternalStorageDirectoryPath,
  `${RNFS.ExternalStorageDirectoryPath}/Download`,
  `${RNFS.ExternalStorageDirectoryPath}/Documents`,
];

async function scanDirectory(dir: string, depth: number = 0): Promise<{ gguf: any[]; mmproj: any[] }> {
  if (depth > 2) return { gguf: [], mmproj: [] };

  try {
    const items = await RNFS.readDir(dir);
    const gguf: any[] = [];
    const mmproj: any[] = [];

    for (const item of items) {
      if (item.isFile()) {
        const lower = item.name.toLowerCase();
        if (lower.endsWith('.gguf')) {
          if (lower.includes('mmproj')) {
            mmproj.push({
              path: item.path,
              name: item.name,
              size: item.size,
            });
          } else {
            gguf.push({
              path: item.path,
              name: item.name,
              size: item.size,
            });
          }
        }
      } else if (item.isDirectory() && depth < 2) {
        // Scan subdirectories with names suggesting models
        const subLower = item.name.toLowerCase();
        if (
          subLower.includes('model') ||
          subLower.includes('gguf') ||
          subLower.includes('llm') ||
          subLower.includes('ai') ||
          subLower.includes('download') ||
          subLower.includes('document')
        ) {
          const sub = await scanDirectory(item.path, depth + 1);
          gguf.push(...sub.gguf);
          mmproj.push(...sub.mmproj);
        }
      }
    }

    return { gguf, mmproj };
  } catch (e) {
    return { gguf: [], mmproj: [] };
  }
}

export async function scanForModels(): Promise<ScanResult> {
  const ggufFiles: any[] = [];
  const mmprojFiles: any[] = [];

  for (const dir of COMMON_SCAN_DIRS) {
    if (!dir) continue;
    const result = await scanDirectory(dir, 0);
    ggufFiles.push(...result.gguf);
    mmprojFiles.push(...result.mmproj);
  }

  // Deduplicate by path
  const uniqueGguf = new Map<string, any>();
  for (const f of ggufFiles) {
    uniqueGguf.set(f.path, f);
  }

  const uniqueMmproj = new Map<string, any>();
  for (const f of mmprojFiles) {
    uniqueMmproj.set(f.path, f);
  }

  // Pair gguf with mmproj by directory
  const pairedGguf = Array.from(uniqueGguf.values()).map((g) => {
    const dir = g.path.substring(0, g.path.lastIndexOf('/'));
    // Find mmproj in same directory
    const matchingMmproj = Array.from(uniqueMmproj.values()).find((m) =>
      m.path.startsWith(dir) && m.name.toLowerCase().includes('mmproj')
    );
    return {
      ...g,
      mmprojPath: matchingMmproj?.path,
      mmprojName: matchingMmproj?.name,
    };
  });

  return {
    ggufFiles: pairedGguf,
    mmprojFiles: Array.from(uniqueMmproj.values()),
  };
}
