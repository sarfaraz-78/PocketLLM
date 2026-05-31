import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSettingsStore } from '../store/useSettingsStore';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../theme';

interface CommandHistory {
  id: string;
  command: string;
  output: string;
  timestamp: Date;
}

export const TerminalScreen: React.FC = () => {
  const { darkMode } = useSettingsStore();
  const colors = darkMode ? COLORS.dark : COLORS.light;
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<CommandHistory[]>([]);
  const flatListRef = useRef<FlatList>(null);

  const executeCommand = async () => {
    if (!command.trim()) return;

    const cmd = command.trim();
    setCommand('');

    const newEntry: CommandHistory = {
      id: Date.now().toString(),
      command: cmd,
      output: '',
      timestamp: new Date(),
    };

    setHistory(prev => [...prev, newEntry]);
    flatListRef.current?.scrollToEnd();

    try {
      let result = '';
      const lc = cmd.toLowerCase();

      if (lc === 'clear') {
        setHistory([]);
        return;
      }

      if (lc === 'help') {
        result = `Available commands:
  help     - Show this help
  clear    - Clear terminal
  date     - Show current date/time
  echo     - Echo text back
  ls       - List app directories
  pwd      - Show current path
  whoami   - Show user info
  uptime   - Show system uptime
  cat <f>  - Show file content
  <any>    - Ask AI to interpret`;

      } else if (lc === 'date') {
        result = new Date().toLocaleString();

      } else if (lc.startsWith('echo ')) {
        result = cmd.substring(5);

      } else if (lc === 'pwd') {
        result = '/data/user/0/com.pocketllm';

      } else if (lc === 'whoami') {
        result = 'u0_a266 (PocketLLM)';

      } else if (lc === 'uptime') {
        const uptimeMs = require('react-native').NativeModules.Uptime ?
          'N/A' : Math.floor(performance.now() / 1000) + 's (app time)';
        result = `Uptime: ${uptimeMs}`;

      } else if (lc === 'ls') {
        result = 'app/\ncache/\nfiles/\nmodels/';

      } else {
        result = `Command: "${cmd}"\n\nThis would be sent to AI for natural language shell interpretation.`;
      }

      setHistory(prev => prev.map((h, i) =>
        i === prev.length - 1 ? { ...h, output: result } : h
      ));
    } catch (error) {
      setHistory(prev => prev.map((h, i) =>
        i === prev.length - 1 ? { ...h, output: `Error: ${error}` } : h
      ));
    }
  };

  const renderHistoryItem = ({ item }: { item: CommandHistory }) => (
    <View style={styles.historyItem}>
      <View style={styles.commandRow}>
        <Text style={[styles.prompt, { color: colors.primary }]}>$</Text>
        <Text style={[styles.commandText, { color: colors.text }]}>{item.command}</Text>
      </View>
      {item.output ? (
        <Text style={[styles.outputText, { color: colors.textSecondary }]}>{item.output}</Text>
      ) : (
        <Text style={[styles.outputText, { color: colors.textTertiary }]}>...</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Icon name="terminal-outline" size={22} color={colors.primary} />
        <Text style={[styles.headerTitle, { color: colors.text }]}>Terminal</Text>
        <TouchableOpacity
          onPress={() => setHistory([])}
          style={styles.headerBtn}
        >
          <Icon name="trash-outline" size={20} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={renderHistoryItem}
        style={styles.outputList}
        contentContainerStyle={styles.outputContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <Text style={[styles.prompt, { color: colors.primary }]}>$</Text>
          <TextInput
            style={[styles.input, { color: colors.text }]}
            value={command}
            onChangeText={setCommand}
            placeholder="Enter command..."
            placeholderTextColor={colors.textTertiary}
            onSubmitEditing={executeCommand}
            returnKeyType="send"
            autoCorrect={false}
            autoCapitalize="none"
          />
          <TouchableOpacity onPress={executeCommand} style={styles.sendBtn}>
            <Icon name="send-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    gap: SPACING.sm,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    flex: 1,
  },
  headerBtn: {
    padding: SPACING.xs,
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
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
  },
  commandText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  outputText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginTop: SPACING.xs,
    marginLeft: SPACING.lg,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderTopWidth: 1,
    gap: SPACING.sm,
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    padding: SPACING.sm,
  },
  sendBtn: {
    padding: SPACING.sm,
  },
});