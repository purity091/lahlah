import { useState, useCallback, useRef, useEffect } from 'react';

interface UseMediaRecorderOptions {
    onTranscript?: (text: string) => void;
    onError?: (error: string) => void;
}

/**
 * Custom hook for handling audio recording with Web Speech API or MediaRecorder fallback.
 */
export const useMediaRecorder = (options: UseMediaRecorderOptions = {}) => {
    const [isListening, setIsListening] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const recognitionRef = useRef<any>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    // Initialize Speech Recognition on mount
    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.lang = 'ar-SA';
            recognition.interimResults = false;

            recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                options.onTranscript?.(transcript);
                setIsListening(false);
            };

            recognition.onerror = (event: any) => {
                console.error('Speech recognition error', event.error);
                options.onError?.(event.error);
                setIsListening(false);
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current = recognition;
        }
    }, []);

    // Toggle listening state
    const toggleListening = useCallback(async () => {
        if (isListening) {
            // STOP RECORDING
            setIsListening(false);

            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }

            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
                mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            }
            return;
        }

        // START RECORDING
        if (recognitionRef.current) {
            // Use native Speech Recognition (Chrome/Edge)
            try {
                setIsListening(true);
                recognitionRef.current.start();
            } catch (err) {
                console.error('Failed to start speech recognition:', err);
                setIsListening(false);
            }
        } else {
            // Fallback to MediaRecorder (Firefox/Others)
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                options.onError?.('المتصفح لا يدعم تسجيل الصوت');
                return;
            }

            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const mediaRecorder = new MediaRecorder(stream);
                mediaRecorderRef.current = mediaRecorder;
                audioChunksRef.current = [];

                mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        audioChunksRef.current.push(event.data);
                    }
                };

                mediaRecorder.onstop = async () => {
                    setIsProcessing(true);
                    // Here we would send to Whisper API for transcription
                    // For now, just notify that recording stopped
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                    console.log('Audio recorded:', audioBlob.size, 'bytes');
                    setIsProcessing(false);
                };

                mediaRecorder.start();
                setIsListening(true);
            } catch (err) {
                console.error('Error accessing microphone:', err);
                options.onError?.('لم نتمكن من الوصول إلى الميكروفون');
            }
        }
    }, [isListening, options]);

    return {
        isListening,
        isProcessing,
        toggleListening,
        hasNativeSpeechRecognition: !!recognitionRef.current,
    };
};
