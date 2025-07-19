const {
  withInfoPlist,
  withEntitlementsPlist,
} = require('@expo/config-plugins');

function withTwilioVoiceIOS(config) {
  // Ajouter les permissions nécessaires
  config = withInfoPlist(config, (config) => {
    config.modResults.NSMicrophoneUsageDescription =
      'Cette application a besoin du microphone pour les appels vocaux';
    config.modResults.UIBackgroundModes = ['audio', 'voip'];
    return config;
  });

  // Ajouter les entitlements VoIP
  config = withEntitlementsPlist(config, (config) => {
    config.modResults['aps-environment'] = ['development'];
    return config;
  });

  return config;
}

module.exports = withTwilioVoiceIOS;
