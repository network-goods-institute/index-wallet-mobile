module.exports = function (api) {
    api.cache(true);
    return {
      presets: [
        ["babel-preset-expo", { jsxImportSource: "nativewind" }],
        "nativewind/babel",
      ],
      // Removed react-native-dotenv plugin that was causing conflicts with Expo Router
      plugins: [
        'react-native-reanimated/plugin'
      ]
    };
  };