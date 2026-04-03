import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';

const MODEL_NAME = 'gemini-3.1-flash-live-preview';

export function useLiveAPI(systemInstruction: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);

  const stopSession = useCallback(() => {
    activeSourcesRef.current.forEach(source => {
      try {
        source.stop();
      } catch (e) {}
    });
    activeSourcesRef.current = [];
    
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsConnected(false);
    setIsSpeaking(false);
  }, []);

  const startSession = useCallback(async () => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      
      // Setup audio worklet for recording (simple version)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = audioContextRef.current.createMediaStreamSource(stream);
      
      // We need to handle audio output as well
      // For simplicity in this demo, we'll use a simpler approach to audio processing
      // In a real app, you'd use a robust PCM processor

      const sessionPromise = ai.live.connect({
        model: MODEL_NAME,
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction,
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
          }
        },
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            console.log('Live session opened');
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data) {
              const base64Audio = message.serverContent.modelTurn.parts[0].inlineData.data;
              const binaryString = atob(base64Audio);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              
              // Convert PCM16 to Float32
              const pcm16 = new Int16Array(bytes.buffer);
              const float32 = new Float32Array(pcm16.length);
              for (let i = 0; i < pcm16.length; i++) {
                float32[i] = pcm16[i] / 32768.0;
              }

              if (audioContextRef.current) {
                const buffer = audioContextRef.current.createBuffer(1, float32.length, 24000);
                buffer.getChannelData(0).set(float32);
                const source = audioContextRef.current.createBufferSource();
                source.buffer = buffer;
                source.connect(audioContextRef.current.destination);
                
                const now = audioContextRef.current.currentTime;
                if (nextStartTimeRef.current < now) {
                  nextStartTimeRef.current = now;
                }
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += buffer.duration;
                
                activeSourcesRef.current.push(source);
                
                setIsSpeaking(true);
                source.onended = () => {
                   activeSourcesRef.current = activeSourcesRef.current.filter(s => s !== source);
                   // Check if more chunks are playing
                   if (audioContextRef.current && audioContextRef.current.currentTime >= nextStartTimeRef.current - 0.1) {
                     setIsSpeaking(false);
                   }
                };
              }
            }
            
            if (message.serverContent?.interrupted) {
              // Stop current playback
              activeSourcesRef.current.forEach(source => {
                try {
                  source.stop();
                } catch (e) {}
              });
              activeSourcesRef.current = [];
              nextStartTimeRef.current = 0;
              setIsSpeaking(false);
            }
          },
          onclose: () => {
            setIsConnected(false);
            console.log('Live session closed');
          },
          onerror: (err) => {
            setError(err.message);
            setIsConnected(false);
          }
        }
      });

      sessionRef.current = await sessionPromise;

      // Simple audio capture loop
      const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      source.connect(processor);
      processor.connect(audioContextRef.current.destination);

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        // Convert Float32 to PCM16
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          pcm16[i] = Math.max(-1, Math.min(1, inputData[i])) * 32767;
        }
        const base64 = btoa(String.fromCharCode(...new Uint8Array(pcm16.buffer)));
        
        sessionPromise.then((session) => {
          session.sendRealtimeInput({
            audio: { data: base64, mimeType: 'audio/pcm;rate=16000' }
          });
        }).catch(() => {});
      };

    } catch (err: any) {
      setError(err.message);
      console.error(err);
    }
  }, [systemInstruction, isConnected]);

  return { isConnected, isSpeaking, error, startSession, stopSession };
}
