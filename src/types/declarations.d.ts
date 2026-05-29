declare module 'react-native-vector-icons/Ionicons' {
  import { Icon } from 'react-native-vector-icons';
  export default Icon;
}

declare module 'react-native-fs' {
  const RNFS: any;
  export default RNFS;
}

declare module 'react-native-document-picker' {
  const DocumentPicker: any;
  export default DocumentPicker;
}

declare module 'react-native-linear-gradient' {
  import { ViewProps } from 'react-native';
  interface LinearGradientProps extends ViewProps {
    colors: string[];
    start?: { x: number; y: number };
    end?: { x: number; y: number };
    locations?: number[];
  }
  export default class LinearGradient extends React.Component<LinearGradientProps> {}
}

declare module 'zustand' {
  type StoreApi<T> = {
    getState: () => T;
    setState: (partial: T | Partial<T> | ((state: T) => T | Partial<T>)) => void;
    subscribe: (listener: (state: T, prevState: T) => void) => () => void;
  };
  type UseBoundStore<T> = ((selector?: (state: T) => any) => any) & StoreApi<T>;
  export function create<T>(initializer: (set: (partial: T | Partial<T> | ((state: T) => T | Partial<T>)) => void, get: () => T) => T): UseBoundStore<T>;
}
