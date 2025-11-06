package com.twiliovoicereactnative

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoModule : Module() {
    private val log = SDKLog(this.javaClass)

    override fun definition() = ModuleDefinition {
        Name("TwilioVoiceExpo")

        // For some reason I still need to have an empty module for things to work.
    }
}