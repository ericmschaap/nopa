# Athlete app (Expo / React Native)

The workflow and source of truth are in `/CLAUDE.md` and `/specs`. Notes specific to this folder:

- Expo ships breaking changes every SDK. Check the `expo` major version in `package.json` and
  read the installed package's type definitions (or the versioned docs at
  `https://docs.expo.dev/versions/v<major>.0.0/`) before using an Expo API from memory.
- Add packages with `npx expo install <package>` so versions match the SDK
  (`EXPO_OFFLINE=1` if the Expo API is unreachable).
- `ios/` and `android/` are generated. Never edit them by hand; configure native behaviour in
  `app.json` and config plugins.
- `expo-audio` background playback is native code, so the app needs a development build
  (`npx expo run:ios|android` or EAS), not Expo Go.
- Navigation is plain state in `App.tsx` (three screens). No router.
- `npm test` runs the type check and the unit tests.
