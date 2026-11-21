import Foundation
import Capacitor
import Speech
import AVFoundation

@objc(TAIOSpeechPlugin)
public class TAIOSpeechPlugin: CAPPlugin, CAPBridgedPlugin, SFSpeechRecognizerDelegate {
    public let identifier = "TAIOSpeechPlugin"
    public let jsName = "TAIOSpeechPlugin"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "isAvailable", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "startRecognition", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stopRecognition", returnType: CAPPluginReturnPromise)
    ]

    private var speechRecognizer: SFSpeechRecognizer?
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    private var recognitionTask: SFSpeechRecognitionTask?
    private let audioEngine = AVAudioEngine()
    private var maxTimer: Timer?

    @objc func isAvailable(_ call: CAPPluginCall) {
        let available = SFSpeechRecognizer.authorizationStatus() == .authorized
        call.resolve(["available": available])
    }

    @objc func startRecognition(_ call: CAPPluginCall) {
        let langCode = call.getString("lang") ?? "vi-VN"
        let locale = Locale(identifier: langCode)
        speechRecognizer = SFSpeechRecognizer(locale: locale)
        speechRecognizer?.delegate = self

        guard let recognizer = speechRecognizer, recognizer.isAvailable else {
            call.reject("Speech recognizer unavailable for locale \(langCode)")
            return
        }

        SFSpeechRecognizer.requestAuthorization { [weak self] authStatus in
            DispatchQueue.main.async {
                guard authStatus == .authorized else {
                    call.reject("Speech recognition authorization denied")
                    return
                }

                AVAudioSession.sharedInstance().requestRecordPermission { granted in
                    DispatchQueue.main.async {
                        guard granted else {
                            call.reject("Microphone permission denied")
                            return
                        }
                        self?.startAudioSessionAndRecording(call: call)
                    }
                }
            }
        }
    }

    private func startAudioSessionAndRecording(call: CAPPluginCall) {
        if audioEngine.isRunning {
            audioEngine.stop()
            recognitionRequest?.endAudio()
        }

        recognitionTask?.cancel()
        recognitionTask = nil

        let audioSession = AVAudioSession.sharedInstance()
        do {
            try audioSession.setCategory(.record, mode: .measurement, options: .duckOthers)
            try audioSession.setActive(true, options: .notifyOthersOnDeactivation)
        } catch {
            call.reject("Audio session error: \(error.localizedDescription)")
            return
        }

        recognitionRequest = SFSpeechAudioBufferRecognitionRequest()
        guard let recognitionRequest = recognitionRequest else {
            call.reject("Unable to create recognition request")
            return
        }

        recognitionRequest.shouldReportPartialResults = true
        if #available(iOS 13.0, *), speechRecognizer?.supportsOnDeviceRecognition == true {
            recognitionRequest.requiresOnDeviceRecognition = true
        }

        let inputNode = audioEngine.inputNode
        let recordingFormat = inputNode.outputFormat(forBus: 0)
        inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) { [weak self] (buffer, _) in
            self?.recognitionRequest?.append(buffer)
        }

        audioEngine.prepare()
        do {
            try audioEngine.start()
        } catch {
            call.reject("AudioEngine start error: \(error.localizedDescription)")
            return
        }

        recognitionTask = speechRecognizer?.recognitionTask(with: recognitionRequest) { [weak self] (result, error) in
            guard let self = self else { return }

            if let result = result {
                let transcription = result.bestTranscription.formattedString
                let isFinal = result.isFinal
                self.notifyListeners("onSpeechResult", data: [
                    "text": transcription,
                    "isFinal": isFinal
                ])
                if isFinal {
                    self.stopAudioRecording()
                }
            }

            if error != nil {
                self.stopAudioRecording()
            }
        }

        // 60-second automatic safety cutoff (A3 #5)
        maxTimer?.invalidate()
        maxTimer = Timer.scheduledTimer(withTimeInterval: 60.0, repeats: false) { [weak self] _ in
            self?.stopAudioRecording()
        }

        call.resolve(["started": true])
    }

    @objc func stopRecognition(_ call: CAPPluginCall) {
        stopAudioRecording()
        call.resolve(["stopped": true])
    }

    private func stopAudioRecording() {
        maxTimer?.invalidate()
        maxTimer = nil

        if audioEngine.isRunning {
            audioEngine.stop()
            audioEngine.inputNode.removeTap(onBus: 0)
        }
        recognitionRequest?.endAudio()
        recognitionRequest = nil
        recognitionTask?.cancel()
        recognitionTask = nil

        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
    }
}
