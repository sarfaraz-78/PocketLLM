import { useState, useCallback } from 'react';
import Clipboard from '@react-native-clipboard/clipboard';

export const useClipboard = () => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = useCallback(async (text: string) => {
    Clipboard.setString(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const getFromClipboard = useCallback(async () => {
    return await Clipboard.getString();
  }, []);

  return { copyToClipboard, getFromClipboard, copied };
};