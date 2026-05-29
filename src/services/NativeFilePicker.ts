import { NativeModules } from 'react-native';

interface PickedFile {
  name: string;
  path: string;
  size: number;
  uri: string;
}

interface NativeFilePickerInterface {
  pickFiles(): Promise<PickedFile[]>;
}

const { NativeFilePicker } = NativeModules;

export const pickFiles = async (): Promise<PickedFile[]> => {
  if (!NativeFilePicker) {
    throw new Error('NativeFilePicker module is not available');
  }
  return (NativeFilePicker as NativeFilePickerInterface).pickFiles();
};
