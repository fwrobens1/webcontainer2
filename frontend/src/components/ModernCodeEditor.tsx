import React from 'react';
import Editor from '@monaco-editor/react';
import { FileItem } from '../types';
import { Code, FileText } from 'lucide-react';

interface ModernCodeEditorProps {
  file: FileItem | null;
}

function getLanguageFromFileName(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  
  switch (ext) {
    case 'js':
    case 'jsx':
      return 'javascript';
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'json':
      return 'json';
    case 'css':
      return 'css';
    case 'html':
      return 'html';
    case 'md':
      return 'markdown';
    case 'py':
      return 'python';
    default:
      return 'plaintext';
  }
}

export function ModernCodeEditor({ file }: ModernCodeEditorProps) {
  if (!file) {
    return (
      <div className="h-full bg-gray-950 flex flex-col items-center justify-center text-center">
        <Code className="w-16 h-16 text-gray-600 mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">No file selected</h3>
        <p className="text-gray-400">Select a file from the explorer to view its contents</p>
      </div>
    );
  }

  const language = getLanguageFromFileName(file.name);

  return (
    <div className="h-full bg-gray-950 flex flex-col">
      {/* File Header */}
      <div className="border-b border-gray-800 px-4 py-3 flex items-center space-x-3">
        <FileText className="w-4 h-4 text-blue-400" />
        <span className="text-sm font-medium text-white">{file.name}</span>
        <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
          {language}
        </span>
      </div>

      {/* Editor */}
      <div className="flex-1">
        <Editor
          height="100%"
          language={language}
          theme="vs-dark"
          value={file.content || ''}
          options={{
            readOnly: true,
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: 'JetBrains Mono, Fira Code, Monaco, Consolas, monospace',
            wordWrap: 'on',
            scrollBeyondLastLine: false,
            padding: { top: 16, bottom: 16 },
            lineNumbers: 'on',
            renderLineHighlight: 'line',
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            bracketPairColorization: { enabled: true },
          }}
        />
      </div>
    </div>
  );
}