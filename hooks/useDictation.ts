"use client";

import { useState, useEffect, useRef } from "react";

export function useDictation(
    lang: string,
    onResult: (text: string) => void
) {
    const [isListening, setIsListening] = useState(false);
    const [isSupported, setIsSupported] = useState(false);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        // Check if browser supports speech recognition
        const SpeechRecognition =
            (window as any).SpeechRecognition ||
            (window as any).webkitSpeechRecognition;

        if (SpeechRecognition) {
            setIsSupported(true);
            const recognition = new SpeechRecognition();
            recognition.continuous = true; // Keep listening even if user pauses
            recognition.interimResults = true; // Show results while speaking
            recognition.lang = lang === "es" ? "es-ES" : "en-US";

            recognition.onresult = (event: any) => {
                let finalTranscript = "";
                // Loop through results to get the transcript
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    }
                }
                if (finalTranscript) {
                    onResult(finalTranscript + " ");
                }
            };

            recognition.onerror = (event: any) => {
                console.error("Speech recognition error", event.error);
                setIsListening(false);
            };

            recognition.onend = () => {
                // If we didn't manually stop it, maybe it timed out. 
                // For simple UI, we'll just set listening to false.
                setIsListening(false);
            };

            recognitionRef.current = recognition;
        }
    }, [lang, onResult]);

    const toggleListening = () => {
        if (!isSupported || !recognitionRef.current) return;

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            try {
                recognitionRef.current.start();
                setIsListening(true);
            } catch (e) {
                console.error("Could not start recognition:", e);
            }
        }
    };

    return {
        isListening,
        isSupported,
        toggleListening
    };
}
