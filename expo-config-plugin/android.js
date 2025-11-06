/* eslint-disable no-shadow */
const {
  withAppBuildGradle,
  withProjectBuildGradle,
  withAndroidManifest,
  withStringsXml,
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const googleServicesClassPath = 'com.google.gms:google-services';
const googleServicesVersion = '4.4.1';

function withTwilioVoiceAndroid(config, options = {}) {
  const {
    firebaseMessagingServiceEnabled = true,
    googleServicesJsonPath = null,
  } = options;

  config = withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;

    const permissions = [
      'android.permission.RECORD_AUDIO',
      'android.permission.MODIFY_AUDIO_SETTINGS',
      'android.permission.USE_SIP',
      'android.permission.WAKE_LOCK',
      'android.permission.VIBRATE',
    ];

    permissions.forEach((permission) => {
      if (
        !androidManifest.manifest['uses-permission']?.find(
          (p) => p.$['android:name'] === permission
        )
      ) {
        if (!androidManifest.manifest['uses-permission']) {
          androidManifest.manifest['uses-permission'] = [];
        }
        androidManifest.manifest['uses-permission'].push({
          $: { 'android:name': permission },
        });
      }
    });

    return config;
  });

  config = withStringsXml(config, (config) => {
    const strings = config.modResults;

    const fcmServiceConfig = {
      $: { name: 'twiliovoicereactnative_firebasemessagingservice_enabled' },
      _: firebaseMessagingServiceEnabled.toString(),
    };

    strings.resources.bool = strings.resources.bool || [];
    strings.resources.bool = strings.resources.bool.filter(
      (item) =>
        item.$.name !==
        'twiliovoicereactnative_firebasemessagingservice_enabled'
    );

    strings.resources.bool.push(fcmServiceConfig);

    return config;
  });

  config = withAppBuildGradle(config, (config) => {
    let buildGradle = config.modResults.contents;

    if (!buildGradle.includes('com.google.gms.google-services')) {
      const pluginRegex = /(apply plugin: ['"]com\.android\.application['"])/;
      if (pluginRegex.test(buildGradle)) {
        buildGradle = buildGradle.replace(
          pluginRegex,
          '$1\napply plugin: "com.google.gms.google-services"'
        );
      }
    }

    const firebaseDeps = [
      "implementation 'com.google.firebase:firebase-messaging:23.0.0'",
      "implementation 'com.google.firebase:firebase-core:21.0.0'",
    ];

    const dependenciesRegex = /dependencies\s*\{/;
    if (dependenciesRegex.test(buildGradle)) {
      firebaseDeps.forEach((dep) => {
        if (!buildGradle.includes(dep)) {
          buildGradle = buildGradle.replace(
            dependenciesRegex,
            `dependencies {\n    ${dep}`
          );
        }
      });
    }

    config.modResults.contents = buildGradle;
    return config;
  });

  config = withAppBuildGradle(config, (config) => {
    let buildGradle = config.modResults.contents;

    const kotlinVersion = '2.0.21';

    if (!buildGradle.includes('kotlin-gradle-plugin')) {
      const buildscriptRegex = /buildscript\s*\{[\s\S]*?dependencies\s*\{/;
      if (buildscriptRegex.test(buildGradle)) {
        buildGradle = buildGradle.replace(
          /dependencies\s*\{/,
          `dependencies {\n        classpath "org.jetbrains.kotlin:kotlin-gradle-plugin:${kotlinVersion}"`
        );
      }
    }

    if (!buildGradle.includes('kotlin-android')) {
      const pluginRegex = /(apply plugin: ['"]com\.android\.application['"])/;
      if (pluginRegex.test(buildGradle)) {
        buildGradle = buildGradle.replace(
          pluginRegex,
          '$1\napply plugin: "kotlin-android"'
        );
      }
    }

    config.modResults.contents = buildGradle;
    return config;
  });

  config = withProjectBuildGradle(config, (config) => {
    config.modResults.contents = setClassPath(
      config,
      config.modResults.contents
    );
    return config;
  });

  if (googleServicesJsonPath && fs.existsSync(googleServicesJsonPath)) {
    config = withAppBuildGradle(config, (config) => {
      console.log(
        '📁 google-services.json will be copied from:',
        googleServicesJsonPath
      );
      return config;
    });
  }

  config = withGoogleServicesJson(config, googleServicesJsonPath);

  return config;
}

function withGoogleServicesJson(config, googleServicesJsonPath) {
  return withAppBuildGradle(config, async (config) => {
    if (googleServicesJsonPath && fs.existsSync(googleServicesJsonPath)) {
      const projectRoot = config.modRequest.projectRoot;
      const targetPath = path.join(
        projectRoot,
        'android',
        'app',
        'google-services.json'
      );

      try {
        fs.copyFileSync(googleServicesJsonPath, targetPath);
        console.log('✅ google-services.json copied successfully');
      } catch (error) {
        console.warn('⚠️ Failed to copy google-services.json:', error.message);
      }
    }
    return config;
  });
}

function setClassPath(config, buildGradle) {
  if (buildGradle.includes(googleServicesClassPath)) {
    return buildGradle;
  }

  //
  return buildGradle.replace(
    /dependencies\s?{/,
    `dependencies {
        classpath('${googleServicesClassPath}:${googleServicesVersion}')`
  );
}

module.exports = withTwilioVoiceAndroid;
module.exports.withGoogleServicesJson = withGoogleServicesJson;
