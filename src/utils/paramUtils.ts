/**
 * Extract parameter count (e.g., "0.5B", "7B", "13B") from a model name or ID.
 * Handles formats like: 0.5B, 1.5B, 7B, 13B, 70B, 8x7B, etc.
 */
export function extractParams(nameOrId: string): string {
  if (!nameOrId) return 'Unknown';

  const cleaned = nameOrId.replace(/_/g, '-').replace(/\s+/g, '-');

  // Match patterns like 0.5B, 1.5B, 7B, 13B, 70B, 8x7B (MoE)
  const match = cleaned.match(/(\d+(?:\.\d+)?)(?:[xX](\d+(?:\.\d+)?))?\s*[bB]\b/);
  if (match) {
    if (match[2]) {
      // MoE format like 8x7B
      return `${match[1]}x${match[2]}B`;
    }
    return `${match[1]}B`;
  }

  // Fallback: look for common param labels
  const lower = cleaned.toLowerCase();
  const labels = [
    '0.5b', '1.5b', '2b', '3b', '4b', '7b', '8b', '9b',
    '13b', '14b', '20b', '30b', '34b', '40b', '70b', '72b',
    '110b', '236b', '405b',
  ];
  for (const label of labels) {
    if (lower.includes(label)) {
      return label.toUpperCase();
    }
  }

  return 'Unknown';
}

/**
 * Convert parameter count string to a number for comparison.
 */
export function paramsToNumber(params: string): number {
  const match = params.match(/([\d.]+)/);
  if (!match) return 0;
  return parseFloat(match[1]);
}
