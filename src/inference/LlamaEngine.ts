import { initLlama, loadLlamaModelInfo } from 'llama.rn';
import { CompletionSettings, DeviceTier, GenerationStats, ModelInfo } from '../types';
import { PresetManager } from './PresetManager';
import { STOP_WORDS } from '../utils/stopWords';
import { AttachmentItem } from '../components/ChatInput';

import { useWorkspaceStore } from '../store/useWorkspaceStore';
import { useSettingsStore } from '../store/useSettingsStore';

export type RNLlamaMessagePart = {
  type: 'text' | 'image_url' | 'input_audio';
  text?: string;
  image_url?: { url?: string };
  input_audio?: { format: string; data?: string; url?: string };
};

export async function extractModelSpecs(modelPath: string): Promise<ModelInfo['specs']> {
  try {
    const info = await loadLlamaModelInfo(modelPath);
    if (!info || typeof info !== 'object') return undefined;

    const meta = (info as any).meta || info;
    const arch = meta?.['general.architecture'] || '';
    const archKey = arch ? `${arch}.` : 'llama.';

    return {
      vocabSize: meta?.[`${archKey}vocab_size`] || meta?.['tokenizer.ggml.tokens']?.length || undefined,
      contextSize: meta?.[`${archKey}context_length`] || meta?.[`${archKey}max_position_embeddings`] || undefined,
      embeddingLength: meta?.[`${archKey}embedding_length`] || meta?.[`${archKey}hidden_size`] || undefined,
      layerCount: meta?.[`${archKey}block_count`] || meta?.[`${archKey}num_hidden_layers`] || undefined,
      feedForwardLength: meta?.[`${archKey}feed_forward_length`] || meta?.[`${archKey}intermediate_size`] || undefined,
      headCount: meta?.[`${archKey}attention.head_count`] || meta?.[`${archKey}num_attention_heads`] || undefined,
      kvHeadCount: meta?.[`${archKey}attention.head_count_kv`] || meta?.[`${archKey}num_key_value_heads`] || undefined,
      maxTokens: meta?.[`${archKey}context_length`] || undefined,
      quantizationVersion: meta?.['general.quantization_version']?.toString(),
    };
  } catch (e) {
    console.warn('[extractModelSpecs] Failed to read specs:', e);
    return undefined;
  }
}

export class LlamaEngine {
  private context: any = null;
  private isGenerating: boolean = false;
  private isLoading: boolean = false;
  private currentTier: DeviceTier | null = null;
  private lastModelInfo: any = null;
  private mmprojPath: string | null = null;
  private multimodalEnabled: boolean = false;

  // Tool execution callback
  private toolCallback: ((tool: string, args: any) => void) | null = null;
  setToolCallback(cb: (tool: string, args: any) => void) { this.toolCallback = cb; }

  // Tool types
  private toolResults: Map<string, string> = new Map();

  // AI can access these tools
  getTerminalOutput(): string {
    return useWorkspaceStore.getState().terminalHistory.map(h => `> ${h.command}\n${h.output}`).join('\n');
  }
  addTerminalCommand(cmd: string, output: string): void {
    useWorkspaceStore.getState().addTerminalCommand(cmd, output);
  }
  getIdeFile(name: string): string | null {
    return useWorkspaceStore.getState().files.find(f => f.name === name && f.type === 'file')?.content || null;
  }
  getIdeFilesList(): string[] {
    return useWorkspaceStore.getState().files.filter(f => f.type === 'file').map(f => f.name);
  }
  setIdeFile(name: string, content: string): void {
    const store = useWorkspaceStore.getState();
    const existing = store.files.find(f => f.name === name && f.type === 'file');
    if (existing) {
      store.updateFileContent(existing.id, content);
    } else {
      store.addFile(name, 'file', content);
    }
  }
  deleteIdeFile(name: string): void {
    const store = useWorkspaceStore.getState();
    const existing = store.files.find(f => f.name === name && f.type === 'file');
    if (existing) {
      store.deleteFile(existing.id);
    }
  }
  getBrowserHistory(): string[] {
    return useWorkspaceStore.getState().bookmarks.map(b => b.url);
  }
  getCurrentBrowserUrl(): string {
    return useWorkspaceStore.getState().browserUrl;
  }
  setCurrentBrowserUrl(url: string): void {
    useWorkspaceStore.getState().setBrowserUrl(url);
  }
  getToolResults(): string { return Array.from(this.toolResults.entries()).map(([k, v]) => `[${k}] ${v}`).join('\n'); }
  clearToolResults(): void { this.toolResults.clear(); }

  executeTool(tool: string, args: any): string {
    switch (tool) {
      case 'workspace_create':
        const wsId = useWorkspaceStore.getState().createWorkspace(args.name || 'New Project');
        return `Workspace "${args.name || 'New Project'}" created successfully with ID "${wsId}". It is now set as the active project. You can start creating files using ide_write.`;
      case 'workspace_list':
        const list = useWorkspaceStore.getState().workspaces.map(w => `- ${w.name} (id: ${w.id})`).join('\n');
        return `Available workspaces:\n${list || '(None)'}`;
      case 'workspace_switch':
        const wsIdSwitch = args.id;
        if (!wsIdSwitch) return 'Error: Workspace ID is required';
        const exists = useWorkspaceStore.getState().workspaces.find(w => w.id === wsIdSwitch);
        if (!exists) return `Error: Workspace with ID ${wsIdSwitch} not found`;
        useWorkspaceStore.getState().switchWorkspace(wsIdSwitch);
        return `Switched to workspace "${exists.name}" (id: ${wsIdSwitch}) successfully. Active files and terminal have been updated.`;
      case 'terminal':
        return this.executeTerminalCommand(args.command || args.cmd || '');
      case 'ide_write':
        this.setIdeFile(args.filename || args.name, args.content || '');
        return `File ${args.filename || args.name} written successfully`;
      case 'ide_read':
        return this.getIdeFile(args.filename || args.name) || 'File not found';
      case 'ide_delete':
        this.deleteIdeFile(args.filename || args.name);
        return `File ${args.filename || args.name} deleted`;
      case 'ide_list':
        return `Files: ${this.getIdeFilesList().join(', ')}`;
      case 'browser_open':
        this.setCurrentBrowserUrl(args.url);
        return `Opening ${args.url}`;
      default:
        return `Unknown tool: ${tool}`;
    }
  }

  private executeTerminalCommand(cmd: string): string {
    const lc = cmd.toLowerCase().trim();
    let result = '';

    if (lc === 'clear') {
      useWorkspaceStore.getState().clearTerminalHistory();
      return 'Terminal cleared';
    }
    if (lc === 'help') {
      return `Commands: help, clear, date, echo <text>, ls, pwd, whoami, uptime, cat <file>, history, node <file>, run <file>`;
    }
    if (lc === 'date') {
      result = new Date().toLocaleString();
    } else if (lc.startsWith('echo ')) {
      result = cmd.substring(5);
    } else if (lc === 'pwd') {
      result = '/data/user/0/com.pocketllm';
    } else if (lc === 'whoami') {
      result = 'u0_a266 (PocketLLM)';
    } else if (lc === 'uptime') {
      result = Math.floor(performance.now() / 1000) + 's (app time)';
    } else if (lc === 'ls') {
      const fileNames = useWorkspaceStore.getState().files.map(f => f.name);
      result = fileNames.length > 0 ? fileNames.join('\n') : '(empty workspace)';
    } else if (lc === 'history') {
      result = this.getTerminalOutput();
    } else if (lc.startsWith('cat ')) {
      const file = lc.substring(4).trim();
      result = this.getIdeFile(file) || `File ${file} not found in IDE`;
    } else if (lc.startsWith('node ') || lc.startsWith('run ')) {
      const file = cmd.substring(lc.startsWith('node ') ? 5 : 4).trim();
      const code = this.getIdeFile(file);
      if (code !== null) {
        const logs: string[] = [];
        const originalLog = console.log;
        const originalWarn = console.warn;
        const originalError = console.error;
        
        console.log = (...args) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
        console.warn = (...args) => logs.push('[WARN] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
        console.error = (...args) => logs.push('[ERROR] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
        
        try {
          const fn = new Function(code);
          fn();
          result = logs.length > 0 ? logs.join('\n') : '(Script executed successfully with no console outputs)';
        } catch (execErr: any) {
          result = `RuntimeError: ${execErr.message}\n` + (logs.length > 0 ? `Logs before error:\n${logs.join('\n')}` : '');
        } finally {
          console.log = originalLog;
          console.warn = originalWarn;
          console.error = originalError;
        }
      } else {
        result = `node: ${file}: No such file found in workspace`;
      }
    } else if (lc.startsWith('git ')) {
      const store = useWorkspaceStore.getState();
      const gitCmd = cmd.substring(4).trim();
      const gitLc = gitCmd.toLowerCase();

      if (gitLc === 'init') {
        if (store.gitInitialized) {
          result = 'Reinitialized existing Git repository in /data/user/0/com.pocketllm/app_workspace/.git/';
        } else {
          store.initGit();
          result = 'Initialized empty Git repository in /data/user/0/com.pocketllm/app_workspace/.git/';
        }
      } else {
        if (!store.gitInitialized) {
          result = 'fatal: not a git repository (or any of the parent directories): .git';
        } else if (gitLc === 'status') {
          const staged = store.gitStaged;
          const currentFiles = store.files.filter(f => f.type === 'file');
          const lastCommit = store.gitCommits.length > 0 ? store.gitCommits[store.gitCommits.length - 1] : null;
          const commitFiles = lastCommit ? lastCommit.filesSnapshot.filter(f => f.type === 'file') : [];

          const modifiedUnstaged: string[] = [];
          const untracked: string[] = [];

          currentFiles.forEach(file => {
            const matchedCommitFile = commitFiles.find(cf => cf.name.toLowerCase() === file.name.toLowerCase());
            if (!matchedCommitFile) {
              if (!staged.includes(file.name)) {
                untracked.push(file.name);
              }
            } else if (matchedCommitFile.content !== file.content) {
              if (!staged.includes(file.name)) {
                modifiedUnstaged.push(file.name);
              }
            }
          });

          const deletedUnstaged: string[] = [];
          commitFiles.forEach(cf => {
            const stillExists = currentFiles.some(f => f.name.toLowerCase() === cf.name.toLowerCase());
            if (!stillExists && !staged.includes(cf.name)) {
              deletedUnstaged.push(cf.name);
            }
          });

          let statusStr = 'On branch main\n';
          if (store.gitCommits.length === 0) {
            statusStr += 'No commits yet\n\n';
          }

          if (staged.length > 0) {
            statusStr += 'Changes to be committed:\n  (use "git restore --staged <file>..." to unstage)\n';
            staged.forEach(name => {
              statusStr += `\tstaged:    ${name}\n`;
            });
            statusStr += '\n';
          }

          if (modifiedUnstaged.length > 0 || deletedUnstaged.length > 0) {
            statusStr += 'Changes not staged for commit:\n  (use "git add <file>..." to update what will be committed)\n';
            modifiedUnstaged.forEach(name => {
              statusStr += `\tmodified:  ${name}\n`;
            });
            deletedUnstaged.forEach(name => {
              statusStr += `\tdeleted:   ${name}\n`;
            });
            statusStr += '\n';
          }

          if (untracked.length > 0) {
            statusStr += 'Untracked files:\n  (use "git add <file>..." to include in what will be committed)\n';
            untracked.forEach(name => {
              statusStr += `\t${name}\n`;
            });
            statusStr += '\n';
          }

          if (staged.length === 0 && modifiedUnstaged.length === 0 && deletedUnstaged.length === 0 && untracked.length === 0) {
            statusStr += 'nothing to commit, working tree clean';
          }
          result = statusStr;
        } else if (gitLc.startsWith('add ')) {
          const fileTarget = gitCmd.substring(4).trim();
          if (fileTarget === '.') {
            store.stageAllFiles();
            result = `staged ${store.files.filter(f => f.type === 'file').length} files`;
          } else {
            const success = store.stageFile(fileTarget);
            if (success) {
              result = `staged '${fileTarget}'`;
            } else {
              result = `fatal: pathspec '${fileTarget}' did not match any files`;
            }
          }
        } else if (gitLc.startsWith('commit')) {
          const msgMatch = gitCmd.match(/-m\s+["']([^"']+)["']/i) || gitCmd.match(/-m\s+(\S+)/i);
          if (!msgMatch) {
            result = 'error: switch `m\' requires a value\nUsage: git commit -m "commit message"';
          } else if (store.gitStaged.length === 0) {
            result = 'On branch main\nnothing added to commit but untracked files present (use "git add" to track)';
          } else {
            const msg = msgMatch[1];
            const sha = store.commitGit(msg, 'developer@pocketllm.dev');
            result = `[main ${sha}] ${msg}\n ${store.gitStaged.length} files changed, staged updates committed.`;
          }
        } else if (gitLc === 'log') {
          if (store.gitCommits.length === 0) {
            result = 'fatal: your current branch main does not have any commits yet';
          } else {
            result = store.gitCommits.map(commit => {
              return `commit ${commit.id} (HEAD -> main)\nAuthor: ${commit.author}\nDate:   ${new Date(commit.timestamp).toLocaleString()}\n\n    ${commit.message}\n`;
            }).reverse().join('\n');
          }
        } else if (gitLc === 'diff') {
          const activeFile = store.files.find(f => f.id === store.activeFileId);
          if (!activeFile) {
            result = 'No active file opened in IDE to diff.';
          } else {
            const lastCommit = store.gitCommits.length > 0 ? store.gitCommits[store.gitCommits.length - 1] : null;
            const lastCommitFile = lastCommit ? lastCommit.filesSnapshot.find(cf => cf.name.toLowerCase() === activeFile.name.toLowerCase()) : null;

            const oldText = lastCommitFile?.content || '';
            const newText = activeFile.content || '';

            if (oldText === newText) {
              result = `diff --git a/${activeFile.name} b/${activeFile.name}\nNo differences found. File is clean.`;
            } else {
              const oldLines = oldText.split('\n');
              const newLines = newText.split('\n');

              let diffStr = `diff --git a/${activeFile.name} b/${activeFile.name}\n`;
              diffStr += `--- a/${activeFile.name}\n+++ b/${activeFile.name}\n`;

              const max = Math.max(oldLines.length, newLines.length);
              for (let i = 0; i < max; i++) {
                const oldL = oldLines[i];
                const newL = newLines[i];
                if (oldL !== newL) {
                  if (oldL !== undefined) diffStr += `-\t${oldL}\n`;
                  if (newL !== undefined) diffStr += `+\t${newL}\n`;
                } else {
                  diffStr += ` \t${oldL}\n`;
                }
              }
              result = diffStr;
            }
          }
        } else {
          result = `git: '${gitCmd}' is not a simulated git command. Supported commands: init, status, add <file>, commit -m "<msg>", log, diff`;
        }
      }
    } else {
      result = `Executed: ${cmd}`;
    }

    this.addTerminalCommand(cmd, result);
    return result;
  }

  async loadModel(modelPath: string, tier: DeviceTier, mmprojPath?: string): Promise<void> {
    if (this.isLoading) {
      throw new Error('Model load already in progress. Please wait.');
    }

    this.isLoading = true;
    this.mmprojPath = mmprojPath || null;
    this.multimodalEnabled = false;

    try {
      if (this.context) {
        await this.release();
      }

      // Pre-validate the file with a lightweight metadata read
      try {
        this.lastModelInfo = await loadLlamaModelInfo(modelPath);
        console.log('[LlamaEngine] Model info:', this.lastModelInfo);
      } catch (infoErr) {
        throw new Error(
          `Cannot read model file. File may be corrupted or incomplete. (${infoErr})`
        );
      }

      this.currentTier = tier;
      const preset = PresetManager.getPresetForTier(tier);
      const isTurbo = useSettingsStore.getState().turboQuantEnabled;

      // Apply TurboQuant performance optimizations
      const useMlock = isTurbo ? true : preset.use_mlock;
      const useMmap = isTurbo ? true : preset.use_mmap;
      const flashAttnType = isTurbo ? 'on' : preset.flash_attn_type;
      
      // Auto-tune threads and layers offloading for high-speed GPU compilation
      const nThreads = isTurbo ? Math.min(6, preset.n_threads + 1) : preset.n_threads;
      const nGpuLayers = isTurbo 
        ? (tier === 'PREMIUM' || tier === 'HIGH' ? 24 : 12) 
        : preset.n_gpu_layers;

      console.log(`[LlamaEngine] Initializing model with TurboQuant=${isTurbo}. Config: Threads=${nThreads}, GPULayers=${nGpuLayers}, FlashAttn=${flashAttnType}, mlock=${useMlock}`);

      // Try loading with preset settings
      try {
        this.context = await initLlama({
          model: modelPath,
          use_mlock: useMlock,
          use_mmap: useMmap,
          n_ctx: preset.n_ctx,
          n_gpu_layers: nGpuLayers,
          n_threads: nThreads,
          n_batch: preset.n_batch,
          n_ubatch: preset.n_ubatch,
          cache_type_k: preset.cache_type_k,
          cache_type_v: preset.cache_type_v,
          flash_attn_type: flashAttnType,
          no_extra_bufts: preset.no_extra_bufts,
          ctx_shift: true, // Always shift context for turbo speed
        });
      } catch (initErr: any) {
        // If mmap failed, try without mmap (some 32-bit devices have mmap issues on external storage)
        if (useMmap && initErr?.message?.toLowerCase()?.includes('mmap')) {
          console.warn('[LlamaEngine] mmap failed, retrying without mmap');
          this.context = await initLlama({
            model: modelPath,
            use_mlock: false,
            use_mmap: false,
            n_ctx: preset.n_ctx,
            n_gpu_layers: 0,
            n_threads: nThreads,
            n_batch: preset.n_batch,
            n_ubatch: preset.n_ubatch,
            cache_type_k: preset.cache_type_k,
            cache_type_v: preset.cache_type_v,
            flash_attn_type: 'off',
            no_extra_bufts: true,
            ctx_shift: true,
          });
        } else {
          throw initErr;
        }
      }

      // Initialize multimodal if projector path provided
      if (this.mmprojPath) {
        try {
          console.log('[LlamaEngine] Initializing multimodal with projector:', this.mmprojPath);
          await this.context.initMultimodal({ path: this.mmprojPath, use_gpu: false });
          const support = await this.context.getMultimodalSupport();
          console.log('[LlamaEngine] Multimodal support:', support);
          this.multimodalEnabled = support.vision || support.audio;
        } catch (mmErr) {
          console.warn('[LlamaEngine] Failed to init multimodal:', mmErr);
          this.multimodalEnabled = false;
        }
      }
    } catch (error) {
      console.error('[LlamaEngine] loadModel error:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to load model'
      );
    } finally {
      this.isLoading = false;
    }
  }

  async getModelInfo(modelPath: string): Promise<any> {
    return await loadLlamaModelInfo(modelPath);
  }

  getLastModelInfo(): any {
    return this.lastModelInfo;
  }

  async sendMessage(
    messages: Array<{ role: string; content: string | RNLlamaMessagePart[] }>,
    settings: CompletionSettings,
    onToken: (token: string) => void,
    attachments?: AttachmentItem[],
    enableThinking?: boolean
  ): Promise<{ text: string; stats: GenerationStats }> {
    if (!this.context) {
      throw new Error('Model not loaded');
    }

    this.isGenerating = true;

    try {
      // Build messages with image/audio attachments as message parts
      const formattedMessages = messages.map((msg) => {
        // If message already has array content (from prior parts), return as-is
        if (Array.isArray(msg.content)) return msg;

        // Check if this is the last user message and has attachments
        const hasAttachments =
          msg.role === 'user' &&
          attachments &&
          attachments.length > 0 &&
          attachments.some((a) => a.type === 'image' || a.type === 'audio');

        if (hasAttachments) {
          const imageAtts = attachments!.filter((a) => a.type === 'image');
          const audioAtts = attachments!.filter((a) => a.type === 'audio');
          const parts: RNLlamaMessagePart[] = [
            { type: 'text', text: msg.content as string },
            ...imageAtts.map((att) => ({
              type: 'image_url' as const,
              image_url: { url: att.uri },
            })),
            ...audioAtts.map((att) => ({
              type: 'input_audio' as const,
              input_audio: { format: 'mp4', url: att.uri },
            })),
          ];
          return { role: msg.role, content: parts };
        }

        return msg;
      });

      const completionParams: any = {
        messages: formattedMessages,
        n_predict: settings.n_predict,
        temperature: settings.temperature,
        top_p: settings.top_p,
        top_k: settings.top_k,
        min_p: settings.min_p,
        penalty_repeat: settings.penalty_repeat,
        penalty_freq: settings.penalty_freq,
        penalty_present: settings.penalty_present,
        stop: STOP_WORDS,
        enable_thinking: enableThinking ?? true,
        cache_prompt: true, // Cache reuse across dialogue turns
      };

      // Check multimodal support
      const hasImages = attachments?.some((a) => a.type === 'image');
      const hasAudio = attachments?.some((a) => a.type === 'audio');
      if ((hasImages || hasAudio) && !this.multimodalEnabled) {
        console.warn('[LlamaEngine] Multimodal not enabled. Attachments may not work.');
      }

      const result = await this.context.completion(
        completionParams,
        (data: any) => {
          if (this.isGenerating && data.token) {
            onToken(data.token);
          }
        }
      );

      const stats: GenerationStats = {
        tokensPerSecond: result.timings?.predicted_per_second || 0,
        totalTokens: result.tokens_predicted || 0,
        promptTokens: result.tokens_evaluated || 0,
        promptPerSecond: result.timings?.prompt_per_second || 0,
        totalTimeMs:
          (result.timings?.predicted_ms || 0) +
          (result.timings?.prompt_ms || 0),
      };

      return { text: result.text, stats };
    } finally {
      this.isGenerating = false;
    }
  }

  stopGeneration(): void {
    this.isGenerating = false;
  }

  async release(): Promise<void> {
    if (this.context) {
      try {
        if (this.multimodalEnabled) {
          await this.context.releaseMultimodal();
        }
        await this.context.release();
      } catch (error) {
        console.error('Error releasing context:', error);
      }
      this.context = null;
    }
    this.currentTier = null;
    this.lastModelInfo = null;
    this.mmprojPath = null;
    this.multimodalEnabled = false;
  }

  isLoaded(): boolean {
    return this.context !== null;
  }

  isMultimodalLoaded(): boolean {
    return this.multimodalEnabled;
  }

  getCurrentTier(): DeviceTier | null {
    return this.currentTier;
  }
}

export const llamaEngine = new LlamaEngine();
