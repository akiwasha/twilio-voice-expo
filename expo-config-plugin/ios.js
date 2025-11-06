const {
  withInfoPlist,
  withEntitlementsPlist,
} = require('@expo/config-plugins');

function withTwilioVoiceIOS(config) {
  config = withInfoPlist(config, (configuration) => {
    configuration.modResults.NSMicrophoneUsageDescription =
      'This app needs access to the microphone for voice calls and recording voice messages';
    configuration.modResults.UIBackgroundModes = ['audio', 'voip'];
    return configuration;
  });

  config = withEntitlementsPlist(config, (configuration) => {
    configuration.modResults['aps-environment'] = 'development';
    return configuration;
  });

  return config;
}

module.exports = withTwilioVoiceIOS;
