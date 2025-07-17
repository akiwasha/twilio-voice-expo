/* eslint-disable no-shadow */
const {
  withAppBuildGradle,
  withAndroidManifest,
  withStringsXml,
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Plugin Android pour Twilio Voice React Native SDK avec support Expo
 */
function withTwilioVoiceAndroid(config, options = {}) {
  const {
    firebaseMessagingServiceEnabled = true,
    googleServicesJsonPath = null,
  } = options;

  // 1. Ajouter les permissions nécessaires dans AndroidManifest.xml
  config = withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;

    // Permissions pour les appels vocaux
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

  // 2. Configurer les services Firebase si activé
  config = withStringsXml(config, (config) => {
    const strings = config.modResults;

    // Configurer le service FCM Twilio
    const fcmServiceConfig = {
      $: { name: 'twiliovoicereactnative_firebasemessagingservice_enabled' },
      _: firebaseMessagingServiceEnabled.toString(),
    };

    // Supprimer l'ancienne configuration si elle existe
    strings.resources.bool = strings.resources.bool || [];
    strings.resources.bool = strings.resources.bool.filter(
      (item) =>
        item.$.name !==
        'twiliovoicereactnative_firebasemessagingservice_enabled'
    );

    // Ajouter la nouvelle configuration
    strings.resources.bool.push(fcmServiceConfig);

    return config;
  });

  // 3. Modifier app/build.gradle pour ajouter les dépendances nécessaires
  config = withAppBuildGradle(config, (config) => {
    let buildGradle = config.modResults.contents;

    // Ajouter le plugin Google Services si pas déjà présent
    if (!buildGradle.includes('com.google.gms.google-services')) {
      // Ajouter après les autres plugins
      const pluginRegex = /(apply plugin: ['"]com\.android\.application['"])/;
      if (pluginRegex.test(buildGradle)) {
        buildGradle = buildGradle.replace(
          pluginRegex,
          '$1\napply plugin: "com.google.gms.google-services"'
        );
      }
    }

    // Ajouter les dépendances Firebase si nécessaires
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

  // 4. Modifier build.gradle principal pour ajouter le support Kotlin
  config = withAppBuildGradle(config, (config) => {
    let buildGradle = config.modResults.contents;

    // Ajouter le support Kotlin si pas déjà présent
    const kotlinVersion = '1.9.24';

    // Vérifier si buildscript existe et ajouter kotlin
    if (!buildGradle.includes('kotlin-gradle-plugin')) {
      const buildscriptRegex = /buildscript\s*\{[\s\S]*?dependencies\s*\{/;
      if (buildscriptRegex.test(buildGradle)) {
        buildGradle = buildGradle.replace(
          /dependencies\s*\{/,
          `dependencies {\n        classpath "org.jetbrains.kotlin:kotlin-gradle-plugin:${kotlinVersion}"`
        );
      }
    }

    // Ajouter le plugin kotlin-android
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

  // 5. Copier google-services.json si fourni
  if (googleServicesJsonPath && fs.existsSync(googleServicesJsonPath)) {
    config = withAppBuildGradle(config, (config) => {
      // Le fichier sera copié par Expo automatiquement si on le met dans le bon dossier
      // On peut ajouter une vérification ici
      console.log(
        '📁 google-services.json will be copied from:',
        googleServicesJsonPath
      );
      return config;
    });
  }

  return config;
}

/**
 * Plugin pour copier google-services.json au bon endroit
 */
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

module.exports = withTwilioVoiceAndroid;
module.exports.withGoogleServicesJson = withGoogleServicesJson;
