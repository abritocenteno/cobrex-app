const baseConfig = require('./app.json');

// app.config.js is required for dynamic values like env-var file paths in EAS builds.
// app.json is kept as the canonical static config; this file only overrides what needs
// runtime evaluation (google-services.json path via EAS secret env var).
module.exports = {
  ...baseConfig.expo,
  android: {
    ...baseConfig.expo.android,
    googleServicesFile:
      process.env.GOOGLE_SERVICES_JSON ?? baseConfig.expo.android.googleServicesFile,
  },
};
