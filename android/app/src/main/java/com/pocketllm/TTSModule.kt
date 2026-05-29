package com.pocketllm

import android.os.Bundle
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import com.facebook.react.bridge.*
import java.util.*

class TTSModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext), TextToSpeech.OnInitListener {
    
    private var tts: TextToSpeech? = null
    private var isInitialized = false
    private var pendingSpeak: String? = null
    private var pendingPromise: Promise? = null
    
    init {
        tts = TextToSpeech(reactContext, this)
    }
    
    override fun getName(): String = "TTS"
    
    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) {
            isInitialized = true
            tts?.language = Locale.US
            
            // Process any pending speak request
            pendingSpeak?.let { text ->
                speakInternal(text, pendingPromise)
                pendingSpeak = null
                pendingPromise = null
            }
        }
    }
    
    @ReactMethod
    fun setDefaultLanguage(language: String) {
        if (!isInitialized) return
        try {
            val locale = Locale.forLanguageTag(language)
            tts?.language = locale
        } catch (e: Exception) {
            // Ignore
        }
    }
    
    @ReactMethod
    fun setDefaultRate(rate: Double) {
        if (!isInitialized) return
        tts?.setSpeechRate(rate.toFloat())
    }
    
    @ReactMethod
    fun setDefaultPitch(pitch: Double) {
        if (!isInitialized) return
        tts?.setPitch(pitch.toFloat())
    }
    
    @ReactMethod
    fun speak(text: String, promise: Promise) {
        if (!isInitialized) {
            pendingSpeak = text
            pendingPromise = promise
            return
        }
        speakInternal(text, promise)
    }
    
    private fun speakInternal(text: String, promise: Promise?) {
        try {
            val params = Bundle()
            params.putString(TextToSpeech.Engine.KEY_PARAM_UTTERANCE_ID, "utteranceId")
            
            tts?.speak(text, TextToSpeech.QUEUE_FLUSH, params, "utteranceId")
            promise?.resolve(true)
        } catch (e: Exception) {
            promise?.reject("TTS_ERROR", e.message)
        }
    }
    
    @ReactMethod
    fun stop() {
        tts?.stop()
    }
    
    @ReactMethod
    fun isSpeaking(promise: Promise) {
        val speaking = tts?.isSpeaking ?: false
        promise.resolve(speaking)
    }
    
    override fun onCatalystInstanceDestroy() {
        tts?.shutdown()
        tts = null
    }
}
