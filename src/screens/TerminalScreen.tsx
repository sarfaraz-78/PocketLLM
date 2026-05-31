import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSettingsStore } from '../store/useSettingsStore';
import { useWorkspaceStore, CommandHistory } from '../store/useWorkspaceStore';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../theme';

export const TerminalScreen: React.FC = () => {
  const { darkMode } = useSettingsStore();
  const colors = darkMode ? COLORS.dark : COLORS.light;
  const [command, setCommand] = useState('');

  const { terminalHistory, addTerminalCommand, clearTerminalHistory, files } = useWorkspaceStore();
  const flatListRef = useRef<FlatList>(null);

  const commandSuggestions = ['ls', 'help', 'pwd', 'whoami', 'date', 'node main.js', 'cat main.js', 'clear'];

  const executeCommand = async (customCmd?: string) => {
    const cmdToExec = (customCmd || command).trim();
    if (!cmdToExec) return;

    if (!customCmd) {
      setCommand('');
    }

    let result = '';
    const lc = cmdToExec.toLowerCase();

    try {
      if (lc === 'clear') {
        clearTerminalHistory();
        return;
      }

      if (lc === 'help') {
        result = `PocketLLM OS Shell v1.0.3-LTS
Available commands:
  help      - Show this help manual
  clear     - Clear terminal history logs
  date      - Show current system date/time
  echo <t>  - Echo text parameters back
  ls        - List workspace files/folders
  pwd       - Show active absolute storage directory
  whoami    - Show authorized developer identity
  uptime    - Show node simulation uptime
  cat <f>   - Print file contents to display
  node <f>  - Execute local JavaScript file and capture logs
  run <f>   - Alternative to execute JavaScript files`;
      } else if (lc === 'date') {
        result = new Date().toLocaleString();
      } else if (lc.startsWith('echo ')) {
        result = cmdToExec.substring(5);
      } else if (lc === 'pwd') {
        result = '/data/user/0/com.pocketllm/app_workspace';
      } else if (lc === 'whoami') {
        result = 'developer@pocketllm.dev';
      } else if (lc === 'uptime') {
        result = `${Math.floor(performance.now() / 1000)}s (active node container)`;
      } else if (lc === 'ls') {
        const fileNames = files.map(f => `${f.type === 'folder' ? '📁' : '📄'} ${f.name}`);
        result = fileNames.length > 0 ? fileNames.join('\n') : '(empty workspace)';
      } else if (lc.startsWith('cat ')) {
        const filename = cmdToExec.substring(4).trim();
        const found = files.find(f => f.name.toLowerCase() === filename.toLowerCase());
        if (found) {
          result = found.content || '(empty file)';
        } else {
          result = `cat: ${filename}: No such file or directory found in workspace`;
        }
      } else if (lc.startsWith('node ') || lc.startsWith('run ')) {
        const filename = cmdToExec.substring(cmdToExec.startsWith('node ') ? 5 : 4).trim();
        const found = files.find(f => f.name.toLowerCase() === filename.toLowerCase());
        if (found) {
          const code = found.content || '';
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
          result = `node: ${filename}: No such file found in workspace`;
        }
      } else if (lc.startsWith('git ')) {
        const store = useWorkspaceStore.getState();
        const gitCmd = cmdToExec.substring(4).trim();
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
        result = `sh: ${cmdToExec}: Command successfully piped to active Llama workspace listener.`;
      }

      addTerminalCommand(cmdToExec, result);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (error) {
      addTerminalCommand(cmdToExec, `Error: ${error instanceof Error ? error.message : 'Shell failure'}`);
    }
  };

  const renderHistoryItem = ({ item }: { item: CommandHistory }) => {
    const isError = item.output.startsWith('cat: ') || item.output.startsWith('Error:') || item.output.startsWith('sh: ') || item.output.startsWith('fatal:');
    const isGitDiff = item.command.toLowerCase().trim().startsWith('git diff');

    const renderOutputText = () => {
      if (!item.output) {
        return <Text style={[styles.outputText, { color: colors.textTertiary }]}>...</Text>;
      }

      if (isGitDiff) {
        const lines = item.output.split('\n');
        return (
          <View style={{ marginLeft: SPACING.lg, marginTop: 4 }}>
            {lines.map((line, idx) => {
              let lineColor = colors.textSecondary;
              if (line.startsWith('+')) {
                lineColor = colors.success;
              } else if (line.startsWith('-')) {
                lineColor = colors.error;
              } else if (line.startsWith('diff --git') || line.startsWith('---') || line.startsWith('+++')) {
                lineColor = colors.primary;
              }
              return (
                <Text
                  key={idx}
                  style={[
                    styles.outputText,
                    { color: lineColor, marginLeft: 0, marginTop: 0 }
                  ]}
                >
                  {line}
                </Text>
              );
            })}
          </View>
        );
      }

      return (
        <Text
          style={[
            styles.outputText,
            { color: isError ? colors.error : colors.textSecondary },
          ]}
        >
          {item.output}
        </Text>
      );
    };

    return (
      <View style={styles.historyItem}>
        <View style={styles.commandRow}>
          <Text style={[styles.prompt, { color: colors.primary }]}>$</Text>
          <Text style={[styles.commandText, { color: colors.text }]}>{item.command}</Text>
        </View>
        {renderOutputText()}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: darkMode ? '#070a13' : '#f8fafc' }]}>
      {/* HUD System Monitor Header */}
      <View style={[styles.hudHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.hudLeft}>
          <View style={[styles.liveDot, { backgroundColor: colors.success }]} />
          <Text style={[styles.hudLabel, { color: colors.textSecondary }]}>TTY0  ·  bash - pocketagent</Text>
        </View>
        <View style={styles.hudRight}>
          <Text style={[styles.hudMetric, { color: colors.primary }]}>PID: 3829</Text>
          <Text style={[styles.hudDivider, { color: colors.border }]}>|</Text>
          <Text style={[styles.hudMetric, { color: colors.success }]}>RAM: 42MB</Text>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={terminalHistory}
        keyExtractor={(item) => item.id}
        renderItem={renderHistoryItem}
        style={styles.outputList}
        contentContainerStyle={styles.outputContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={[styles.terminalIconWrapper, { backgroundColor: colors.primary + '12' }]}>
              <Icon name="terminal" size={32} color={colors.primary} />
            </View>
            <Text style={[styles.emptyText, { color: colors.text }]}>PocketLLM Shell v1.0.2</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>
              Sandbox container. Tap suggestions or type "help" to start.
            </Text>
          </View>
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 120 : 0}
      >
        {/* Quick Suggestion Pills */}
        <View style={[styles.suggestionsBar, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionsScroll}>
            {commandSuggestions.map((suggestion) => (
              <TouchableOpacity
                key={suggestion}
                style={[styles.suggestionPill, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => executeCommand(suggestion)}
                activeOpacity={0.7}
              >
                <Text style={[styles.suggestionText, { color: colors.primary }]}>{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Input Bar */}
        <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <Text style={[styles.prompt, { color: colors.primary }]}>$</Text>
          <TextInput
            style={[styles.input, { color: colors.text }]}
            value={command}
            onChangeText={setCommand}
            placeholder="Type a command..."
            placeholderTextColor={colors.textTertiary}
            onSubmitEditing={() => executeCommand()}
            returnKeyType="send"
            autoCorrect={false}
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={[styles.clearBtn, { backgroundColor: colors.error + '10' }]}
            onPress={clearTerminalHistory}
            activeOpacity={0.8}
          >
            <Icon name="trash-outline" size={16} color={colors.error} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  hudHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm - 2,
    borderBottomWidth: 1,
  },
  hudLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  hudLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  hudRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hudMetric: {
    fontSize: 9,
    fontWeight: '700',
  },
  hudDivider: {
    fontSize: 9,
  },
  outputList: {
    flex: 1,
  },
  outputContent: {
    padding: SPACING.md,
  },
  historyItem: {
    marginBottom: SPACING.md,
  },
  commandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  prompt: {
    fontSize: FONT_SIZES.md - 1,
    fontWeight: '800',
  },
  commandText: {
    fontSize: FONT_SIZES.sm - 1,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '700',
  },
  outputText: {
    fontSize: FONT_SIZES.xs + 1,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginTop: 4,
    marginLeft: SPACING.lg,
    lineHeight: 18,
  },
  suggestionsBar: {
    borderTopWidth: 1,
    height: 36,
  },
  suggestionsScroll: {
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    gap: 6,
  },
  suggestionPill: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  suggestionText: {
    fontSize: FONT_SIZES.xs - 1,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm - 2,
    borderTopWidth: 1,
    gap: SPACING.sm,
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZES.sm - 1,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    paddingVertical: SPACING.xs,
  },
  clearBtn: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
    gap: SPACING.xs,
  },
  terminalIconWrapper: {
    width: 54,
    height: 54,
    borderRadius: BORDER_RADIUS.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: FONT_SIZES.md - 1,
    fontWeight: '800',
  },
  emptySubtitle: {
    fontSize: FONT_SIZES.xs,
    textAlign: 'center',
    maxWidth: '80%',
    lineHeight: 18,
  },
});