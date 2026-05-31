const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    maxWorkers: 2,
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        internalPackageAlias: 1,
        enableBabelRCHook: true,
        unstable_compileBinary: true,
      },
    }),
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
