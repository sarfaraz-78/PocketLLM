import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSettingsStore } from '../store/useSettingsStore';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../theme';

interface Bookmark {
  id: string;
  title: string;
  url: string;
}

const DEFAULT_BOOKMARKS: Bookmark[] = [
  { id: '1', title: 'Google', url: 'https://google.com' },
  { id: '2', title: 'GitHub', url: 'https://github.com' },
  { id: '3', title: 'Stack Overflow', url: 'https://stackoverflow.com' },
  { id: '4', title: 'MDN', url: 'https://developer.mozilla.org' },
];

export const BrowserScreen: React.FC = () => {
  const { darkMode } = useSettingsStore();
  const colors = darkMode ? COLORS.dark : COLORS.light;

  const [url, setUrl] = useState('https://google.com');
  const [inputUrl, setInputUrl] = useState('https://google.com');
  const [loading, setLoading] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);

  const normalizeUrl = (input: string): string => {
    const trimmed = input.trim();
    if (!trimmed) return 'https://google.com';
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    if (trimmed.includes('.') && !trimmed.includes(' ')) return 'https://' + trimmed;
    return 'https://www.google.com/search?q=' + encodeURIComponent(trimmed);
  };

  const handleNavigation = async (newUrl: string) => {
    const normalized = normalizeUrl(newUrl);
    setUrl(normalized);
    setInputUrl(normalized);
    setLoading(true);
    try {
      const canOpen = await Linking.canOpenURL(normalized);
      if (canOpen) {
        await Linking.openURL(normalized);
      } else {
        Alert.alert('Cannot open URL', 'This URL cannot be opened.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open URL');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Icon name="globe-outline" size={22} color={colors.primary} />
        <Text style={[styles.headerTitle, { color: colors.text }]}>Browser</Text>
        <TouchableOpacity onPress={() => setShowBookmarks(!showBookmarks)} style={styles.headerBtn}>
          <Icon name="bookmark-outline" size={20} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.urlBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => Linking.openURL(url)} style={styles.navBtn}>
          <Icon name="open-outline" size={20} color={colors.text} />
        </TouchableOpacity>
        <TextInput
          style={[styles.urlInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
          value={inputUrl}
          onChangeText={setInputUrl}
          onSubmitEditing={() => handleNavigation(inputUrl)}
          placeholder="Search or enter URL"
          placeholderTextColor={colors.textTertiary}
          keyboardType="url"
          autoCorrect={false}
          autoCapitalize="none"
        />
        <TouchableOpacity onPress={() => handleNavigation(inputUrl)} style={styles.navBtn}>
          <Icon name="arrow-forward" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {showBookmarks && (
        <View style={[styles.bookmarksPanel, { backgroundColor: colors.surface }]}>
          <Text style={[styles.bookmarksTitle, { color: colors.textSecondary }]}>BOOKMARKS</Text>
          {DEFAULT_BOOKMARKS.map(bm => (
            <TouchableOpacity
              key={bm.id}
              style={styles.bookmarkItem}
              onPress={() => {
                handleNavigation(bm.url);
                setShowBookmarks(false);
              }}
            >
              <Icon name="globe" size={16} color={colors.primary} />
              <Text style={[styles.bookmarkText, { color: colors.text }]}>{bm.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={[styles.content, { backgroundColor: colors.background }]}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Opening browser...</Text>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Icon name="browsers-outline" size={64} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.text }]}>External Browser</Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              URLs will open in your device's browser
            </Text>
            <Text style={[styles.currentUrl, { color: colors.textTertiary }]} numberOfLines={1}>
              {url}
            </Text>
            <TouchableOpacity
              style={[styles.openButton, { backgroundColor: colors.primary }]}
              onPress={() => Linking.openURL(url)}
            >
              <Icon name="open-outline" size={20} color="#fff" />
              <Text style={styles.openButtonText}>Open URL</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    gap: SPACING.sm,
  },
  headerTitle: { fontSize: FONT_SIZES.lg, fontWeight: '700', flex: 1 },
  headerBtn: { padding: SPACING.xs },
  urlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    gap: SPACING.xs,
    borderBottomWidth: 1,
  },
  navBtn: { padding: SPACING.sm },
  urlInput: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  bookmarksPanel: { padding: SPACING.md, borderBottomWidth: 1 },
  bookmarksTitle: { fontSize: 10, fontWeight: '600', letterSpacing: 0.5, marginBottom: SPACING.sm },
  bookmarkItem: { flexDirection: 'row', alignItems: 'center', padding: SPACING.sm, gap: SPACING.sm },
  bookmarkText: { fontSize: FONT_SIZES.sm },
  content: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SPACING.md },
  loadingText: { fontSize: FONT_SIZES.sm },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl, gap: SPACING.md },
  emptyText: { fontSize: FONT_SIZES.xl, fontWeight: '600' },
  emptySubtext: { fontSize: FONT_SIZES.sm, textAlign: 'center' },
  currentUrl: { fontSize: FONT_SIZES.xs, marginTop: SPACING.md },
  openButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    marginTop: SPACING.lg,
  },
  openButtonText: { color: '#fff', fontSize: FONT_SIZES.md, fontWeight: '600' },
});