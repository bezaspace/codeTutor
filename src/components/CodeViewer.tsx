import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeViewerProps {
  code: string;
  language?: string;
  onCodeChange: (code: string) => void;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({ code, language = 'javascript', onCodeChange }) => {
  return (
    <div className="flex flex-col h-full bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-800/50 border-b border-zinc-800">
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Code Interpreter</span>
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/50" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
          <div className="w-3 h-3 rounded-full bg-green-500/50" />
        </div>
      </div>
      <div className="flex-1 overflow-auto relative">
        {code ? (
          <SyntaxHighlighter
            language={language}
            style={vscDarkPlus}
            showLineNumbers={true}
            customStyle={{
              margin: 0,
              padding: '1rem',
              fontSize: '0.875rem',
              backgroundColor: 'transparent',
            }}
            lineNumberStyle={{
              minWidth: '2.5em',
              paddingRight: '1em',
              color: '#52525b',
              textAlign: 'right',
              userSelect: 'none',
            }}
          >
            {code}
          </SyntaxHighlighter>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 p-8 text-center">
            <p className="mb-4">Paste your code here to start the tutoring session.</p>
            <textarea
              className="w-full h-32 bg-zinc-800 border border-zinc-700 rounded-lg p-4 text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
              placeholder="Paste code here..."
              onChange={(e) => onCodeChange(e.target.value)}
            />
          </div>
        )}
        {code && (
          <button
            onClick={() => onCodeChange('')}
            className="absolute top-4 right-4 p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-md transition-colors text-xs"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
};
