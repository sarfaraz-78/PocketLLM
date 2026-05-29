/**
 * Estimate RAM required to load and run a GGUF model.
 * Rough heuristic: file_size * 1.25 for model weights + small overhead for context.
 */
export function estimateRAM(sizeMB: number): string {
  if (sizeMB <= 0) return 'Unknown';
  const ramMB = Math.round(sizeMB * 1.25);
  if (ramMB >= 1024) {
    return `${(ramMB / 1024).toFixed(1)} GB`;
  }
  return `${ramMB} MB`;
}

/**
 * Format file size nicely.
 */
export function formatSize(sizeMB: number): string {
  if (sizeMB <= 0) return 'Size unknown';
  if (sizeMB >= 1024) {
    return `${(sizeMB / 1024).toFixed(1)} GB`;
  }
  return `${sizeMB} MB`;
}
