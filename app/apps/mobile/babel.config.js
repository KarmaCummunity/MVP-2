module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        'babel-preset-expo',
        // Metro web: transform import.meta in deps (e.g. zustand ESM via package exports)
        { unstable_transformImportMeta: true },
      ],
    ],
    plugins: [
      // Must stay last
      'react-native-reanimated/plugin',
    ],
  };
};
