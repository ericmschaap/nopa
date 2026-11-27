// Extends app.json. EXPO_BASE_URL serves the web build from a sub-path, e.g. /nopa/app on
// GitHub Pages (npm run athlete:publish-web). Native builds ignore it.
module.exports = ({ config }) =>
  process.env.EXPO_BASE_URL
    ? { ...config, experiments: { ...config.experiments, baseUrl: process.env.EXPO_BASE_URL } }
    : config;
