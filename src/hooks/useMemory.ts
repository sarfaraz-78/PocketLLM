import { useCallback, useRef } from 'react';
import { Alert, Linking } from 'react-native';

export const useMemory = () => {
  const memoryRef = useRef<{
    startTime: number;
    modelsLoaded: number;
    totalTokens: number;
  }>({
    startTime: Date.now(),
    modelsLoaded: 0,
    totalTokens: 0,
  });

  const logMemory = useCallback((tag: string) => {
    const mem = memoryRef.current;
    const uptime = Math.floor((Date.now() - mem.startTime) / 1000);
    console.log(`[Memory:${tag}] Uptime:${uptime}s Models:${mem.modelsLoaded} Tokens:${mem.totalTokens}`);
  }, []);

  const trackModelLoad = useCallback(() => {
    memoryRef.current.modelsLoaded += 1;
  }, []);

  const trackTokens = useCallback((count: number) => {
    memoryRef.current.totalTokens += count;
  }, []);

  return { logMemory, trackModelLoad, trackTokens, memoryRef };
};