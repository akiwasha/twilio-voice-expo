package com.twiliovoicereactnative

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import com.twilio.voice.ConnectOptions
import java.util.UUID

class ExpoModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("TwilioVoiceExpo")

        Function("voice_connect") { accessToken: String ->
            val context = appContext.reactContext ?: return@Function
            
            val connectOptions = ConnectOptions.Builder(accessToken).build()
            val uuid = UUID.randomUUID()
            val callListenerProxy = CallListenerProxy(uuid, context)
            
            val callRecord = CallRecordDatabase.CallRecord(
                uuid,
                VoiceApplicationProxy.getVoiceServiceApi().connect(
                    connectOptions,
                    callListenerProxy
                ),
                "Callee",
                HashMap(),
                CallRecord.Direction.OUTGOING,
                "Display Name"
            )
            
            VoiceApplicationProxy.getCallRecordDatabase().add(callRecord)
        }
    }
}