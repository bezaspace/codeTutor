import { useState, useMemo } from 'react';
import { CodeViewer } from './components/CodeViewer';
import { AudioVisualizer } from './components/AudioVisualizer';
import { useLiveAPI } from './hooks/useLiveAPI';
import { Mic, MicOff, Terminal, Code2, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

export default function App() {
  const [code, setCode] = useState('');
  const [micStream, setMicStream] = useState<MediaStream | null>(null);

  const systemInstruction = useMemo(() => {
    return `You are an expert programming tutor. 
    The user has provided the following code:
    \`\`\`
    ${code}
    \`\`\`
    Your task is to explain this code line by line in a natural, conversational way.
    ALWAYS mention the line number you are explaining (e.g., "On line 5, we define...").
    Explain one line at a time, or a small logical block, and wait for the user to ask questions or say 'next'.
    Be encouraging, clear, and use analogies if helpful.
    If the user asks questions about the code, answer them thoroughly.
    If no code is provided yet, ask the user to paste some code in the interpreter area.`;
  }, [code]);

  const { isConnected, isSpeaking, error, startSession, stopSession } = useLiveAPI(systemInstruction);

  const handleToggleMic = async () => {
    if (isConnected) {
      stopSession();
      if (micStream) {
        micStream.getTracks().forEach(track => track.stop());
        setMicStream(null);
      }
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setMicStream(stream);
        await startSession();
      } catch (err) {
        console.error("Failed to get microphone", err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-blue-500/30">
      {/* Header */}
      <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
            <Terminal className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">CodeTutor <span className="text-blue-500">Live</span></h1>
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">Gemini 3.1 Flash Live</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {error && (
            <div className="flex items-center gap-2 text-red-400 bg-red-400/10 px-3 py-1.5 rounded-full text-xs border border-red-400/20">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{error}</span>
            </div>
          )}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 rounded-full border border-zinc-800">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-zinc-600'}`} />
            <span className="text-xs font-medium text-zinc-400">{isConnected ? 'Live Session Active' : 'Disconnected'}</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-4rem)]">
        {/* Left Column: Code Interpreter */}
        <section className="lg:col-span-8 flex flex-col gap-4 min-h-0">
          <div className="flex items-center gap-2 text-zinc-400 px-1">
            <Code2 className="w-4 h-4" />
            <h2 className="text-sm font-medium">Code Interpreter</h2>
          </div>
          <div className="flex-1 min-h-0">
            <CodeViewer code={code} onCodeChange={setCode} />
          </div>
        </section>

        {/* Right Column: AI Assistant Controls */}
        <section className="lg:col-span-4 flex flex-col gap-6">
          <div className="flex items-center gap-2 text-zinc-400 px-1">
            <Sparkles className="w-4 h-4" />
            <h2 className="text-sm font-medium">Assistant</h2>
          </div>

          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 flex flex-col gap-8 shadow-xl">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Voice Activity</span>
                {isSpeaking && (
                  <motion.span 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-medium uppercase tracking-wider"
                  >
                    Assistant Speaking
                  </motion.span>
                )}
              </div>
              <AudioVisualizer stream={micStream} isModelSpeaking={isSpeaking} />
            </div>

            <div className="flex flex-col items-center gap-6">
              <button
                onClick={handleToggleMic}
                className={cn(
                  "w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl relative group",
                  isConnected 
                    ? "bg-red-500 hover:bg-red-600 shadow-red-900/40" 
                    : "bg-blue-600 hover:bg-blue-700 shadow-blue-900/40"
                )}
              >
                <AnimatePresence mode="wait">
                  {isConnected ? (
                    <motion.div
                      key="mic-off"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                    >
                      <MicOff className="w-10 h-10 text-white" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="mic-on"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                    >
                      <Mic className="w-10 h-10 text-white" />
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Pulse rings when active */}
                {isConnected && (
                  <>
                    <div className="absolute inset-0 rounded-full border-4 border-red-500/30 animate-ping" />
                    <div className="absolute inset-0 rounded-full border-4 border-red-500/20 animate-ping [animation-delay:0.2s]" />
                  </>
                )}
              </button>
              
              <div className="text-center space-y-2">
                <p className="text-lg font-semibold">
                  {isConnected ? 'Stop Session' : 'Start Tutoring'}
                </p>
                <p className="text-sm text-zinc-500 max-w-[200px]">
                  {isConnected 
                    ? 'Click to end the live voice conversation.' 
                    : 'Click to start a natural conversation with your AI tutor.'}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-6 border-t border-zinc-800 space-y-4">
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Instructions</h3>
              <ul className="text-xs text-zinc-400 space-y-3">
                <li className="flex gap-2">
                  <span className="text-blue-500 font-bold">1.</span>
                  Paste your code into the interpreter area on the left.
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-500 font-bold">2.</span>
                  Click the microphone button to start the live session.
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-500 font-bold">3.</span>
                  Ask the tutor to explain the code or say "start explaining".
                </li>
              </ul>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
