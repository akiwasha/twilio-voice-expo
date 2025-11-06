package com.twiliovoicereactnative;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import expo.modules.core.interfaces.ReactActivityLifecycleListener;

public class ExpoActivityLifecycleListener implements ReactActivityLifecycleListener {
    VoiceActivityProxy voiceActivityProxy;

    @Override
    public void onCreate(Activity activity, Bundle savedInstanceState) {
        // Create a PermissionsRationaleNotifier implementation
        VoiceActivityProxy.PermissionsRationaleNotifier notifier = new VoiceActivityProxy.PermissionsRationaleNotifier() {
            @Override
            public void displayRationale(String permission) {
                // Log the permission rationale for debugging
                SDKLog logger = new SDKLog(ExpoActivityLifecycleListener.class);
                logger.debug("Permission rationale needed for: " + permission);
                // You can add additional logic here to show a dialog or notification
                // to the user explaining why the permission is needed
            }
        };
        
        this.voiceActivityProxy = new VoiceActivityProxy(activity, notifier);
        this.voiceActivityProxy.onCreate(savedInstanceState);
    }

    @Override
    public boolean onNewIntent(Intent intent) {
        this.voiceActivityProxy.onNewIntent(intent);
        return false;
    }

    @Override
    public void onDestroy(Activity activity) {
        this.voiceActivityProxy.onDestroy();
    }
}