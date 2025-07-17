import { NativeModule, Platform } from './common';

let requireNativeModule: any = null;
let isExpoAvailable = false;

try {
  if (Platform.OS === 'android') {
    // Vérifier si on est dans un environnement Expo
    const ExpoModulesCore = require('expo-modules-core');
    requireNativeModule = ExpoModulesCore.requireNativeModule;
    isExpoAvailable = true;
  }
} catch (e) {
  // Expo n'est pas disponible, utiliser fallback
  console.log('Expo modules not available, using React Native modules');
  isExpoAvailable = false;
}

interface ConnectOptions {
  params?: Record<string, any>;
  customParameters?: Record<string, any>;
}

class TwilioVoiceExpoModule {
  private androidExpoNativeModule =
    Platform.OS === 'android' && isExpoAvailable && requireNativeModule
      ? (() => {
          try {
            return requireNativeModule('TwilioVoiceExpo');
          } catch (e) {
            console.warn('TwilioVoiceExpo native module not found');
            return null;
          }
        })()
      : null;

  async connect(accessToken: string, options: ConnectOptions = {}) {
    const { params = {}, customParameters = {} } = options;

    if (Platform.OS === 'android' && this.androidExpoNativeModule) {
      // Utiliser le module Expo Android
      return this.androidExpoNativeModule.voice_connect(
        accessToken,
        params,
        customParameters
      );
    } else {
      // Fallback vers le module React Native standard
      return NativeModule.voice_connect_ios(
        accessToken,
        params,
        //@ts-ignore
        customParameters
      );
    }
  }

  // Autres méthodes
  async disconnect() {
    if (Platform.OS === 'android' && this.androidExpoNativeModule) {
      return this.androidExpoNativeModule.voice_disconnect?.();
    } else {
      return NativeModule.voice_disconnect_ios?.();
    }
  }

  // Méthode pour vérifier si Expo est disponible
  isExpoEnvironment(): boolean {
    return isExpoAvailable;
  }
}

export const twilioVoiceExpo = new TwilioVoiceExpoModule();
export default twilioVoiceExpo;
