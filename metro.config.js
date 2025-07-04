// const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

// /**
//  * Metro configuration
//  * https://reactnative.dev/docs/metro
//  *
//  * @type {import('metro-config').MetroConfig}
//  */
// const config = {};

// module.exports = mergeConfig(getDefaultConfig(__dirname), config);

const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

module.exports = async () => {
  const {
    resolver: {sourceExts, assetExts},
  } = await getDefaultConfig();

  const config = {
    transformer: {
      babelTransformerPath: require.resolve('react-native-svg-transformer'),
    },
    resolver: {
      assetExts: assetExts.filter(ext => ext !== 'svg'),
      sourceExts: [...sourceExts, 'svg'],
    },
  };
  return mergeConfig(getDefaultConfig(__dirname), config);
};

// const { getDefaultConfig } = require('expo/metro-config');

// module.exports = (async () => {
//   const config = await getDefaultConfig(__dirname);

//   config.transformer = {
//     ...config.transformer,
//     babelTransformerPath: require.resolve('react-native-svg-transformer'),
//   };

//   config.resolver.assetExts = config.resolver.assetExts.filter(ext => ext !== 'svg');
//   config.resolver.sourceExts = [...config.resolver.sourceExts, 'svg'];

//   return config;
// })();