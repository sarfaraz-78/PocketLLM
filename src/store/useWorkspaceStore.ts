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

export interface Workspace {
  id: string;
  name: string;
  files: FileItem[];
  terminalHistory: CommandHistory[];
  browserUrl: string;
  bookmarks: Bookmark[];
}

interface WorkspaceState {
  workspaces: Workspace[];
  activeWorkspaceId: string;
  files: FileItem[];
  activeFileId: string | null;
  terminalHistory: CommandHistory[];
  browserUrl: string;
  bookmarks: Bookmark[];
  
  createWorkspace: (name: string) => string;
  switchWorkspace: (id: string) => void;
  deleteWorkspace: (id: string) => void;
  addFile: (name: string, type: 'file' | 'folder', content?: string) => string;
  updateFileContent: (id: string, content: string) => void;
  deleteFile: (id: string) => void;
  setActiveFileId: (id: string | null) => void;
  addTerminalCommand: (command: string, output: string) => void;
  clearTerminalHistory: () => void;
  setBrowserUrl: (url: string) => void;
  resetWorkspaces: () => void;
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

const initialFiles: FileItem[] = [
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
];

const initialBookmarks: Bookmark[] = [
  { id: '1', title: 'Local Server', url: 'http://localhost:3000' },
  { id: '2', title: 'Google', url: 'https://google.com' },
  { id: '3', title: 'GitHub', url: 'https://github.com' },
  { id: '4', title: 'Stack Overflow', url: 'https://stackoverflow.com' },
  { id: '5', title: 'MDN', url: 'https://developer.mozilla.org' },
];

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  workspaces: [
    {
      id: 'default',
      name: 'Default Project',
      files: initialFiles,
      terminalHistory: [],
      browserUrl: 'http://localhost:3000',
      bookmarks: initialBookmarks,
    }
  ],
  activeWorkspaceId: 'default',
  files: initialFiles,
  activeFileId: '1',
  terminalHistory: [],
  browserUrl: 'http://localhost:3000',
  bookmarks: initialBookmarks,

  createWorkspace: (name) => {
    const id = Date.now().toString();
    const newWorkspace: Workspace = {
      id,
      name: name.trim(),
      files: [
        {
          id: '1',
          name: 'index.html',
          type: 'file',
          language: 'html',
          content: `<!DOCTYPE html>\n<html>\n<head>\n  <title>${name}</title>\n</head>\n<body>\n  <h1>Welcome to ${name}! 🚀</h1>\n</body>\n</html>`
        }
      ],
      terminalHistory: [],
      browserUrl: 'http://localhost:3000',
      bookmarks: [
        { id: '1', title: 'Local Server', url: 'http://localhost:3000' }
      ]
    };
    
    set((state) => {
      // Save current active workspace state before adding new one
      const updatedWorkspaces = state.workspaces.map(w => {
        if (w.id === state.activeWorkspaceId) {
          return {
            ...w,
            files: state.files,
            terminalHistory: state.terminalHistory,
            browserUrl: state.browserUrl,
            bookmarks: state.bookmarks,
          };
        }
        return w;
      });

      return {
        workspaces: [...updatedWorkspaces, newWorkspace],
        activeWorkspaceId: id,
        files: newWorkspace.files,
        activeFileId: '1',
        terminalHistory: [],
        browserUrl: 'http://localhost:3000',
        bookmarks: newWorkspace.bookmarks,
      };
    });
    
    return id;
  },

  switchWorkspace: (id) => set((state) => {
    const target = state.workspaces.find(w => w.id === id);
    if (!target) return {};
    
    // Save current active workspace files/terminal state before switching
    const updatedWorkspaces = state.workspaces.map(w => {
      if (w.id === state.activeWorkspaceId) {
        return {
          ...w,
          files: state.files,
          terminalHistory: state.terminalHistory,
          browserUrl: state.browserUrl,
          bookmarks: state.bookmarks,
        };
      }
      return w;
    });

    return {
      activeWorkspaceId: id,
      workspaces: updatedWorkspaces,
      files: target.files,
      activeFileId: target.files.length > 0 ? target.files[0].id : null,
      terminalHistory: target.terminalHistory,
      browserUrl: target.browserUrl,
      bookmarks: target.bookmarks,
    };
  }),

  deleteWorkspace: (id) => set((state) => {
    if (state.workspaces.length <= 1) return {}; // Keep at least one
    const updatedWorkspaces = state.workspaces.filter(w => w.id !== id);
    const nextWorkspace = updatedWorkspaces[0];
    
    return {
      workspaces: updatedWorkspaces,
      activeWorkspaceId: state.activeWorkspaceId === id ? nextWorkspace.id : state.activeWorkspaceId,
      files: state.activeWorkspaceId === id ? nextWorkspace.files : state.files,
      activeFileId: state.activeWorkspaceId === id ? (nextWorkspace.files.length > 0 ? nextWorkspace.files[0].id : null) : state.activeFileId,
      terminalHistory: state.activeWorkspaceId === id ? nextWorkspace.terminalHistory : state.terminalHistory,
      browserUrl: state.activeWorkspaceId === id ? nextWorkspace.browserUrl : state.browserUrl,
      bookmarks: state.activeWorkspaceId === id ? nextWorkspace.bookmarks : state.bookmarks,
    };
  }),

  addFile: (name, type, content = '') => {
    const id = Date.now().toString();
    const newFile: FileItem = {
      id,
      name: name.trim(),
      type,
      language: type === 'file' ? getLanguageFromExt(name) : undefined,
      content: type === 'file' ? content : undefined,
    };
    
    set((state) => {
      const updatedFiles = [...state.files, newFile];
      const updatedWorkspaces = state.workspaces.map(w => {
        if (w.id === state.activeWorkspaceId) {
          return { ...w, files: updatedFiles };
        }
        return w;
      });
      return {
        files: updatedFiles,
        workspaces: updatedWorkspaces,
        activeFileId: type === 'file' ? id : state.activeFileId,
      };
    });
    return id;
  },

  updateFileContent: (id, content) =>
    set((state) => {
      const updatedFiles = state.files.map((f) => (f.id === id ? { ...f, content } : f));
      const updatedWorkspaces = state.workspaces.map(w => {
        if (w.id === state.activeWorkspaceId) {
          return { ...w, files: updatedFiles };
        }
        return w;
      });
      return {
        files: updatedFiles,
        workspaces: updatedWorkspaces,
      };
    }),

  deleteFile: (id) =>
    set((state) => {
      const updatedFiles = state.files.filter((f) => f.id !== id);
      const updatedWorkspaces = state.workspaces.map(w => {
        if (w.id === state.activeWorkspaceId) {
          return { ...w, files: updatedFiles };
        }
        return w;
      });
      return {
        files: updatedFiles,
        workspaces: updatedWorkspaces,
        activeFileId: state.activeFileId === id ? null : state.activeFileId,
      };
    }),

  setActiveFileId: (id) => set({ activeFileId: id }),

  addTerminalCommand: (command, output) =>
    set((state) => {
      const updatedHistory = [
        ...state.terminalHistory,
        {
          id: Date.now().toString() + Math.random(),
          command,
          output,
          timestamp: new Date(),
        },
      ];
      const updatedWorkspaces = state.workspaces.map(w => {
        if (w.id === state.activeWorkspaceId) {
          return { ...w, terminalHistory: updatedHistory };
        }
        return w;
      });
      return {
        terminalHistory: updatedHistory,
        workspaces: updatedWorkspaces,
      };
    }),

  clearTerminalHistory: () =>
    set((state) => {
      const updatedWorkspaces = state.workspaces.map(w => {
        if (w.id === state.activeWorkspaceId) {
          return { ...w, terminalHistory: [] };
        }
        return w;
      });
      return {
        terminalHistory: [],
        workspaces: updatedWorkspaces,
      };
    }),

  setBrowserUrl: (url) =>
    set((state) => {
      const updatedWorkspaces = state.workspaces.map(w => {
        if (w.id === state.activeWorkspaceId) {
          return { ...w, browserUrl: url };
        }
        return w;
      });
      return {
        browserUrl: url,
        workspaces: updatedWorkspaces,
      };
    }),

  resetWorkspaces: () => set({
    workspaces: [
      {
        id: 'default',
        name: 'Default Project',
        files: initialFiles,
        terminalHistory: [],
        browserUrl: 'http://localhost:3000',
        bookmarks: initialBookmarks,
      }
    ],
    activeWorkspaceId: 'default',
    files: initialFiles,
    activeFileId: '1',
    terminalHistory: [],
    browserUrl: 'http://localhost:3000',
    bookmarks: initialBookmarks,
  }),
}));
