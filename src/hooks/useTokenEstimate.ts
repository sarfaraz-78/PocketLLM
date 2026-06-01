import { useMemo } from 'react';

const CHARS_PER_TOKEN = 4;

export const useTokenEstimate = (text: string): number => {
  return useMemo(() => {
    if (!text) return 0;
    return Math.ceil(text.length / CHARS_PER_TOKEN);
  }, [text]);
};

export const useTotalTokenEstimate = (texts: string[]): number => {
  return useMemo(() => {
    return Math.ceil(
      texts.reduce((sum, t) => sum + (t?.length || 0), 0) / CHARS_PER_TOKEN
    );
  }, [texts]);
};
