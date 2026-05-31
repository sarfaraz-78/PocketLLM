import { create } from 'zustand';

export interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  content?: string;
  language?: string;
}

export interface CommandHistory {
  id: string;
  command: string;
  output: string;
  timestamp: Date;
}

export interface Bookmark {
  id: string;
  title: string;
  url: string;
}

interface WorkspaceState {
  files: FileItem[];
  activeFileId: string | null;
  terminalHistory: CommandHistory[];
  browserUrl: string;
  bookmarks: Bookmark[];
  addFile: (name: string, type: 'file' | 'folder', content?: string) => string;
  updateFileContent: (id: string, content: string) => void;
  deleteFile: (id: string) => void;
  setActiveFileId: (id: string | null) => void;
  addTerminalCommand: (command: string, output: string) => void;
  clearTerminalHistory: () => void;
  setBrowserUrl: (url: string) => void;
}

const getLanguageFromExt = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    js: 'javascript', ts: 'typescript', py: 'python', java: 'java',
    kt: 'kotlin', cpp: 'cpp', c: 'c', rs: 'rust', go: 'go',
    rb: 'ruby', swift: 'swift', md: 'markdown', json: 'json',
    html: 'html', css: 'css', xml: 'xml', txt: 'text',
  };
  return map[ext] || 'text';
};

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  files: [
    {
      id: '1',
      name: 'index.html',
      type: 'file',
      language: 'html',
      content: `<!DOCTYPE html>
<html>
<head>
  <title>Pocket Showcase</title>
  <style>
    body {
      background-color: #0f172a;
      color: #f8fafc;
      font-family: sans-serif;
      padding: 20px;
    }
    h1 {
      color: #38bdf8;
      font-size: 24px;
      margin-bottom: 10px;
    }
    p {
      color: #94a3b8;
      font-size: 14px;
      line-height: 1.6;
    }
    .card {
      background-color: #1e293b;
      border: 1px solid #334155;
      padding: 16px;
      border-radius: 12px;
      margin-top: 15px;
    }
    button {
      background-color: #0ea5e9;
      color: white;
      padding: 10px 20px;
      border-radius: 8px;
      font-weight: bold;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <h1>Hello from PocketLLM! 🚀</h1>
  <p>This is a live rendered HTML/CSS website designed directly inside the PocketLLM IDE editor sandbox.</p>
  
  <div class="card">
    <h3 style="color: #38bdf8; font-size: 16px; font-weight: bold;">Dynamic Render Engine</h3>
    <p>Pocket-WebKit parses local markup, extracting selectors and attributes to render React Native views in real time!</p>
    <button>Explore Features</button>
  </div>
</body>
</html>`
    },
    {
      id: '2',
      name: 'main.js',
      type: 'file',
      language: 'javascript',
      content: '// Welcome to PocketLLM IDE\n\nfunction greet(name) {\n  return `Hello, ${name}!`;\n}\n\nconsole.log(greet("World"));'
    },
    {
      id: '3',
      name: 'app.ts',
      type: 'file',
      language: 'typescript',
      content: '// TypeScript example\nconst greet = (name: string): string => `Hello, ${name}!`;'
    },
    {
      id: '4',
      name: 'utils',
      type: 'folder'
    },
    {
      id: '5',
      name: 'README.md',
      type: 'file',
      language: 'markdown',
      content: '# PocketLLM IDE\n\nCode smarter with AI assistance.'
    }
  ],
  activeFileId: '1',
  terminalHistory: [],
  browserUrl: 'http://localhost:3000',
  bookmarks: [
    { id: '1', title: 'Local Server', url: 'http://localhost:3000' },
    { id: '2', title: 'Google', url: 'https://google.com' },
    { id: '3', title: 'GitHub', url: 'https://github.com' },
    { id: '4', title: 'Stack Overflow', url: 'https://stackoverflow.com' },
    { id: '5', title: 'MDN', url: 'https://developer.mozilla.org' },
  ],

  addFile: (name, type, content = '') => {
    const id = Date.now().toString();
    const newFile: FileItem = {
      id,
      name: name.trim(),
      type,
      language: type === 'file' ? getLanguageFromExt(name) : undefined,
      content: type === 'file' ? content : undefined,
    };
    set((state) => ({
      files: [...state.files, newFile],
      activeFileId: type === 'file' ? id : state.activeFileId,
    }));
    return id;
  },

  updateFileContent: (id, content) =>
    set((state) => ({
      files: state.files.map((f) => (f.id === id ? { ...f, content } : f)),
    })),

  deleteFile: (id) =>
    set((state) => ({
      files: state.files.filter((f) => f.id !== id),
      activeFileId: state.activeFileId === id ? null : state.activeFileId,
    })),

  setActiveFileId: (id) => set({ activeFileId: id }),

  addTerminalCommand: (command, output) =>
    set((state) => ({
      terminalHistory: [
        ...state.terminalHistory,
        {
          id: Date.now().toString() + Math.random(),
          command,
          output,
          timestamp: new Date(),
        },
      ],
    })),

  clearTerminalHistory: () => set({ terminalHistory: [] }),

  setBrowserUrl: (url) => set({ browserUrl: url }),
}));
