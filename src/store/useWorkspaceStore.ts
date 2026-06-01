import { create } from 'zustand';

export interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  content?: string;
  language?: string;
  // v3.0: folder hierarchy
  parentId?: string | null;
  expanded?: boolean;
  children?: string[];
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

export interface BrowserHistoryEntry {
  id: string;
  url: string;
  title: string;
  visitedAt: number;
}

export interface GitCommit {
  id: string;
  message: string;
  author: string;
  timestamp: Date;
  filesSnapshot: FileItem[];
}

export interface Workspace {
  id: string;
  name: string;
  files: FileItem[];
  terminalHistory: CommandHistory[];
  browserUrl: string;
  bookmarks: Bookmark[];
  browserHistory: BrowserHistoryEntry[];
  gitInitialized: boolean;
  gitStaged: string[];
  gitCommits: GitCommit[];
}

interface WorkspaceState {
  workspaces: Workspace[];
  activeWorkspaceId: string;
  files: FileItem[];
  activeFileId: string | null;
  terminalHistory: CommandHistory[];
  browserUrl: string;
  bookmarks: Bookmark[];
  browserHistory: BrowserHistoryEntry[];
  gitInitialized: boolean;
  gitStaged: string[];
  gitCommits: GitCommit[];
  
  createWorkspace: (name: string, templateType?: 'blank' | 'glassmorphic' | 'profile' | 'chat') => string;
  switchWorkspace: (id: string) => void;
  deleteWorkspace: (id: string) => void;
  addFile: (name: string, type: 'file' | 'folder', content?: string, parentId?: string | null) => string;
  renameFile: (id: string, newName: string) => void;
  moveFile: (id: string, newParentId: string | null) => void;
  toggleFolder: (id: string) => void;
  updateFileContent: (id: string, content: string) => void;
  deleteFile: (id: string) => void;
  setActiveFileId: (id: string | null) => void;
  addTerminalCommand: (command: string, output: string) => void;
  clearTerminalHistory: () => void;
  setBrowserUrl: (url: string) => void;
  addBrowserHistory: (entry: { url: string; title: string }) => void;
  clearBrowserHistory: () => void;
  exportBookmarks: () => string;
  importBookmarks: (json: string) => number;
  resetWorkspaces: () => void;
  initGit: () => void;
  stageFile: (name: string) => boolean;
  stageAllFiles: () => void;
  commitGit: (message: string, author: string) => string | null;
}

export const TEMPLATES = {
  blank: {
    files: (name: string): FileItem[] => [
      {
        id: '1',
        name: 'index.html',
        type: 'file',
        language: 'html',
        content: `<!DOCTYPE html>\n<html>\n<head>\n  <title>${name}</title>\n</head>\n<body>\n  <h1>Welcome to ${name}! 🚀</h1>\n</body>\n</html>`
      }
    ]
  },
  glassmorphic: {
    files: (name: string): FileItem[] => [
      {
        id: '1',
        name: 'index.html',
        type: 'file',
        language: 'html',
        content: `<!DOCTYPE html>
<html>
<head>
  <title>Developer Hub - Glassmorphism</title>
  <style>
    body {
      background-color: #030712;
      color: #f9fafb;
      font-family: system-ui, sans-serif;
      padding: 24px;
    }
    .dashboard {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .glass-card {
      background-color: rgba(11, 15, 25, 0.7);
      border: 1px solid rgba(129, 140, 248, 0.2);
      border-radius: 16px;
      padding: 20px;
    }
    h1 {
      color: #818cf8;
      font-size: 28px;
      font-weight: 800;
      margin-bottom: 4px;
    }
    p {
      color: #9ca3af;
      font-size: 14px;
      line-height: 20px;
    }
    .row {
      display: flex;
      flex-direction: row;
      gap: 16px;
      flex-wrap: wrap;
    }
    .col {
      flex: 1;
      min-width: 140px;
    }
    .btn {
      background-color: #6366f1;
      color: #ffffff;
      padding: 10px 20px;
      border-radius: 8px;
      font-weight: bold;
      margin-top: 12px;
    }
    .accent-text {
      color: #f472b6;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="dashboard">
    <div class="glass-card">
      <h1>Developer Workspace Hub ⚡</h1>
      <p>A beautiful responsive dark dashboard leveraging advanced pocketllm-webkit nested rendering, border glows, and glass backgrounds.</p>
    </div>
    
    <div class="row">
      <div class="glass-card col">
        <h3 style="color: #60a5fa; margin-bottom: 8px;">System Metrics</h3>
        <p>Inference Status: <span class="accent-text">Active</span></p>
        <p>GPU Acceleration: <span style="color: #34d399;">Vulkan API</span></p>
      </div>
      <div class="glass-card col">
        <h3 style="color: #a78bfa; margin-bottom: 8px;">Active Projects</h3>
        <p>Local Repositories: <span>3 Active</span></p>
        <p>Live Port: <span>3000 (Live Reload)</span></p>
      </div>
    </div>
    
    <div class="glass-card" style="align-items: center;">
      <h3 style="color: #818cf8;">Ready to Launch?</h3>
      <p>Click the interactive button below to trigger live click counters!</p>
      <button class="btn">Launch Server</button>
    </div>
  </div>
</body>
</html>`
      }
    ]
  },
  profile: {
    files: (name: string): FileItem[] => [
      {
        id: '1',
        name: 'index.html',
        type: 'file',
        language: 'html',
        content: `<!DOCTYPE html>
<html>
<head>
  <title>Interactive Dev Profile</title>
  <style>
    body {
      background-color: #0b0f19;
      color: #ffffff;
      font-family: sans-serif;
      padding: 16px;
    }
    .profile-card {
      background-color: #111827;
      border: 1px solid #1f2937;
      border-radius: 20px;
      padding: 24px;
      align-items: center;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .avatar {
      width: 80px;
      height: 80px;
      border-radius: 40px;
      border: 3px solid #818cf8;
    }
    h2 {
      font-size: 22px;
      font-weight: bold;
      color: #818cf8;
      margin-bottom: 2px;
    }
    .title {
      color: #f472b6;
      font-size: 13px;
      font-weight: 600;
    }
    .skills-list {
      margin-top: 16px;
      width: 100%;
    }
    .skills-title {
      font-size: 12px;
      font-weight: 800;
      color: #9ca3af;
      margin-bottom: 6px;
    }
    .nav-btn {
      color: #818cf8;
      text-decoration: underline;
      margin-top: 16px;
      font-size: 13px;
    }
  </style>
</head>
<body>
  <div class="profile-card">
    <img class="avatar" src="https://picsum.photos/100/100" alt="avatar" />
    <h2>Senior Code Agent</h2>
    <div class="title">PocketLLM AI Assistant · GGUF Engine</div>
    
    <p style="text-align: center; color: #9ca3af; font-size: 13px;">
      Offline coding specialist powered by Qwen 2.5 Coder. Designed to compile files, run terminals, and host multi-page sites on device.
    </p>
    
    <div class="skills-list">
      <div class="skills-title">OFFLINE CAPABILITIES:</div>
      <ul>
        <li style="color: #60a5fa;">Multi-page Local Server Router</li>
        <li style="color: #34d399;">Git Repository Simulation logs</li>
        <li style="color: #a78bfa;">Interactive monospaced shell editor</li>
      </ul>
    </div>
    
    <a href="projects.html" class="nav-btn">View Staged Projects</a>
  </div>
</body>
</html>`
      },
      {
        id: '2',
        name: 'projects.html',
        type: 'file',
        language: 'html',
        content: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { background-color: #0b0f19; color: white; font-family: sans-serif; padding: 20px; }
    h1 { color: #f472b6; font-size: 20px; font-weight: bold; }
    .project { background-color: #111827; border: 1px solid #1f2937; padding: 12px; border-radius: 8px; margin-top: 10px; }
    .back { color: #818cf8; margin-top: 20px; display: block; text-decoration: underline; }
  </style>
</head>
<body>
  <h1>Active Projects List</h1>
  <div class="project">
    <h3 style="color: #60a5fa;">Live Web Previewer v1.1</h3>
    <p style="color: #cccccc; font-size: 12px;">Cascading CSS stylesheet render engine with custom responsive inputs.</p>
  </div>
  <div class="project">
    <h3 style="color: #34d399;">Simulated Git shell suite</h3>
    <p style="color: #cccccc; font-size: 12px;">Full commit logs history timeline with colored line additions/deletions diffs.</p>
  </div>
  <a href="index.html" class="back">Back to profile</a>
</body>
</html>`
      }
    ]
  },
  chat: {
    files: (name: string): FileItem[] => [
      {
        id: '1',
        name: 'index.html',
        type: 'file',
        language: 'html',
        content: `<!DOCTYPE html>
<html>
<head>
  <title>Offline Chat Simulator</title>
  <style>
    body {
      background-color: #030712;
      color: #ffffff;
      font-family: sans-serif;
      padding: 16px;
    }
    .chat-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      gap: 12px;
    }
    .chat-header {
      background-color: #111827;
      border: 1px solid #1f2937;
      border-radius: 12px;
      padding: 12px;
      align-items: center;
    }
    .bubble-user {
      background-color: #6366f1;
      padding: 10px 14px;
      border-radius: 14px;
      align-self: flex-end;
      max-width: 80%;
      margin-left: 20%;
    }
    .bubble-agent {
      background-color: #1f2937;
      padding: 10px 14px;
      border-radius: 14px;
      align-self: flex-start;
      max-width: 80%;
      margin-right: 20%;
    }
    .text-input-row {
      display: flex;
      flex-direction: row;
      gap: 8px;
      margin-top: 16px;
      align-items: center;
    }
    .input-box {
      flex: 1;
      background-color: #111827;
      color: white;
      border: 1px solid #1f2937;
      border-radius: 8px;
      padding: 8px 12px;
    }
  </style>
</head>
<body>
  <div class="chat-container">
    <div class="chat-header">
      <h3 style="color: #6366f1; font-weight: bold;">Pocket-AI Simulator</h3>
    </div>
    
    <div class="bubble-user">
      <p style="margin: 0; font-size: 13px;">Hi, can you run coding models locally on mobile devices?</p>
    </div>
    
    <div class="bubble-agent">
      <p style="margin: 0; font-size: 13px; color: #f9fafb;">Yes! PocketLLM uses llama.rn to run GGUF models offline. Try the Qwen 2.5 Coder recommended model!</p>
    </div>
    
    <div class="text-input-row">
      <input class="input-box" type="text" placeholder="Type a message to test active input..." />
      <button style="background-color: #6366f1; color: white; padding: 8px 16px; border-radius: 8px; font-weight: bold;">Send</button>
    </div>
  </div>
</body>
</html>`
      }
    ]
  }
};

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

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspaces: [
    {
      id: 'default',
      name: 'Default Project',
      files: initialFiles,
      terminalHistory: [],
      browserUrl: 'http://localhost:3000',
      bookmarks: initialBookmarks,
      browserHistory: [],
      gitInitialized: false,
      gitStaged: [],
      gitCommits: [],
    }
  ],
  activeWorkspaceId: 'default',
  files: initialFiles,
  activeFileId: '1',
  terminalHistory: [],
  browserUrl: 'http://localhost:3000',
  bookmarks: initialBookmarks,
  browserHistory: [],
  gitInitialized: false,
  gitStaged: [],
  gitCommits: [],

  createWorkspace: (name, templateType = 'blank') => {
    const id = Date.now().toString();
    const template = TEMPLATES[templateType] || TEMPLATES['blank'];
    const newWorkspace: Workspace = {
      id,
      name: name.trim(),
      files: template.files(name.trim()),
      terminalHistory: [],
      browserUrl: 'http://localhost:3000',
      bookmarks: [
        { id: '1', title: 'Local Server', url: 'http://localhost:3000' }
      ],
      browserHistory: [],
      gitInitialized: false,
      gitStaged: [],
      gitCommits: [],
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
            gitInitialized: state.gitInitialized,
            gitStaged: state.gitStaged,
            gitCommits: state.gitCommits,
          };
        }
        return w;
      });

      return {
        workspaces: [...updatedWorkspaces, newWorkspace],
        activeWorkspaceId: id,
        files: newWorkspace.files,
        activeFileId: newWorkspace.files.length > 0 ? newWorkspace.files[0].id : null,
        terminalHistory: [],
        browserUrl: 'http://localhost:3000',
        bookmarks: newWorkspace.bookmarks,
        browserHistory: [],
        gitInitialized: false,
        gitStaged: [],
        gitCommits: [],
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
          gitInitialized: state.gitInitialized,
          gitStaged: state.gitStaged,
          gitCommits: state.gitCommits,
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
      browserHistory: target.browserHistory ?? [],
      gitInitialized: target.gitInitialized ?? false,
      gitStaged: target.gitStaged ?? [],
      gitCommits: target.gitCommits ?? [],
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
      browserHistory: state.activeWorkspaceId === id ? (nextWorkspace.browserHistory ?? []) : state.browserHistory,
      gitInitialized: state.activeWorkspaceId === id ? (nextWorkspace.gitInitialized ?? false) : state.gitInitialized,
      gitStaged: state.activeWorkspaceId === id ? (nextWorkspace.gitStaged ?? []) : state.gitStaged,
      gitCommits: state.activeWorkspaceId === id ? (nextWorkspace.gitCommits ?? []) : state.gitCommits,
    };
  }),

  addFile: (name, type, content = '', parentId = null) => {
    const id = Date.now().toString();
    const newFile: FileItem = {
      id,
      name: name.trim(),
      type,
      language: type === 'file' ? getLanguageFromExt(name) : undefined,
      content: type === 'file' ? content : undefined,
      parentId,
      expanded: type === 'folder' ? true : undefined,
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

  renameFile: (id, newName) =>
    set((state) => {
      const updatedFiles = state.files.map((f) =>
        f.id === id ? { ...f, name: newName.trim() } : f
      );
      const updatedWorkspaces = state.workspaces.map((w) =>
        w.id === state.activeWorkspaceId ? { ...w, files: updatedFiles } : w
      );
      return { files: updatedFiles, workspaces: updatedWorkspaces };
    }),

  moveFile: (id, newParentId) =>
    set((state) => {
      const updatedFiles = state.files.map((f) =>
        f.id === id ? { ...f, parentId: newParentId } : f
      );
      const updatedWorkspaces = state.workspaces.map((w) =>
        w.id === state.activeWorkspaceId ? { ...w, files: updatedFiles } : w
      );
      return { files: updatedFiles, workspaces: updatedWorkspaces };
    }),

  toggleFolder: (id) =>
    set((state) => {
      const updatedFiles = state.files.map((f) =>
        f.id === id && f.type === 'folder' ? { ...f, expanded: !f.expanded } : f
      );
      const updatedWorkspaces = state.workspaces.map((w) =>
        w.id === state.activeWorkspaceId ? { ...w, files: updatedFiles } : w
      );
      return { files: updatedFiles, workspaces: updatedWorkspaces };
    }),

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
      const toDelete = new Set<string>([id]);
      let changed = true;
      while (changed) {
        changed = false;
        for (const f of state.files) {
          if (f.parentId && toDelete.has(f.parentId) && !toDelete.has(f.id)) {
            toDelete.add(f.id);
            changed = true;
          }
        }
      }
      const updatedFiles = state.files.filter((f) => !toDelete.has(f.id));
      const updatedWorkspaces = state.workspaces.map(w => {
        if (w.id === state.activeWorkspaceId) {
          return { ...w, files: updatedFiles };
        }
        return w;
      });
      return {
        files: updatedFiles,
        workspaces: updatedWorkspaces,
        activeFileId: state.activeFileId && toDelete.has(state.activeFileId) ? null : state.activeFileId,
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

  addBrowserHistory: ({ url, title }) =>
    set((state) => {
      const entry: BrowserHistoryEntry = {
        id: Date.now().toString(),
        url,
        title,
        visitedAt: Date.now(),
      };
      const updated = [entry, ...state.browserHistory].slice(0, 100);
      const updatedWorkspaces = state.workspaces.map((w) =>
        w.id === state.activeWorkspaceId ? { ...w, browserHistory: updated } : w
      );
      return { browserHistory: updated, workspaces: updatedWorkspaces };
    }),

  clearBrowserHistory: () =>
    set((state) => {
      const updatedWorkspaces = state.workspaces.map((w) =>
        w.id === state.activeWorkspaceId ? { ...w, browserHistory: [] } : w
      );
      return { browserHistory: [], workspaces: updatedWorkspaces };
    }),

  exportBookmarks: () => {
    return JSON.stringify(get().bookmarks, null, 2);
  },

  importBookmarks: (json) => {
    let count = 0;
    set((state) => {
      try {
        const parsed = JSON.parse(json) as Array<{ title: string; url: string }>;
        const newBookmarks: Bookmark[] = parsed.map((b) => ({
          id: `imported_${Date.now()}_${count++}_${Math.random().toString(36).slice(2, 6)}`,
          title: b.title,
          url: b.url,
        }));
        const merged = [...state.bookmarks, ...newBookmarks];
        const updatedWorkspaces = state.workspaces.map((w) =>
          w.id === state.activeWorkspaceId ? { ...w, bookmarks: merged } : w
        );
        return { bookmarks: merged, workspaces: updatedWorkspaces };
      } catch {
        return {};
      }
    });
    return count;
  },

  resetWorkspaces: () => set({
    workspaces: [
      {
        id: 'default',
        name: 'Default Project',
        files: initialFiles,
        terminalHistory: [],
        browserUrl: 'http://localhost:3000',
        bookmarks: initialBookmarks,
        browserHistory: [],
        gitInitialized: false,
        gitStaged: [],
        gitCommits: [],
      }
    ],
    activeWorkspaceId: 'default',
    files: initialFiles,
    activeFileId: '1',
    terminalHistory: [],
    browserUrl: 'http://localhost:3000',
    bookmarks: initialBookmarks,
    browserHistory: [],
    gitInitialized: false,
    gitStaged: [],
    gitCommits: [],
  }),

  initGit: () => set((state) => {
    const updatedWorkspaces = state.workspaces.map(w => {
      if (w.id === state.activeWorkspaceId) {
        return { ...w, gitInitialized: true, gitStaged: [], gitCommits: [] };
      }
      return w;
    });
    return {
      gitInitialized: true,
      gitStaged: [],
      gitCommits: [],
      workspaces: updatedWorkspaces,
    };
  }),

  stageFile: (name) => {
    let success = false;
    set((state) => {
      const exists = state.files.some(f => f.name.toLowerCase() === name.toLowerCase() && f.type === 'file');
      if (!exists) return {};

      success = true;
      const alreadyStaged = state.gitStaged.includes(name);
      const updatedStaged = alreadyStaged ? state.gitStaged : [...state.gitStaged, name];

      const updatedWorkspaces = state.workspaces.map(w => {
        if (w.id === state.activeWorkspaceId) {
          return { ...w, gitStaged: updatedStaged };
        }
        return w;
      });

      return {
        gitStaged: updatedStaged,
        workspaces: updatedWorkspaces,
      };
    });
    return success;
  },

  stageAllFiles: () => set((state) => {
    const allFileNames = state.files.filter(f => f.type === 'file').map(f => f.name);
    const updatedWorkspaces = state.workspaces.map(w => {
      if (w.id === state.activeWorkspaceId) {
        return { ...w, gitStaged: allFileNames };
      }
      return w;
    });
    return {
      gitStaged: allFileNames,
      workspaces: updatedWorkspaces,
    };
  }),

  commitGit: (message, author) => {
    let sha = '';
    set((state) => {
      sha = Math.random().toString(36).substring(2, 9);
      const newCommit: GitCommit = {
        id: sha,
        message,
        author,
        timestamp: new Date(),
        filesSnapshot: JSON.parse(JSON.stringify(state.files)),
      };

      const updatedCommits = [...state.gitCommits, newCommit];
      const updatedWorkspaces = state.workspaces.map(w => {
        if (w.id === state.activeWorkspaceId) {
          return { ...w, gitStaged: [], gitCommits: updatedCommits };
        }
        return w;
      });

      return {
        gitStaged: [],
        gitCommits: updatedCommits,
        workspaces: updatedWorkspaces,
      };
    });
    return sha;
  },
}));
