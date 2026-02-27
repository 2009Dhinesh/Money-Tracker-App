module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Note: react-native-reanimated v4 (SDK 54) no longer requires the babel plugin
  };
};
