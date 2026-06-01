import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useHistoryStore } from '../store/useHistoryStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useChatStore } from '../store/useChatStore';
import { useModelStore } from '../store/useModelStore';
import { useTheme } from '../hooks/useTheme';
import { SPACING, FONT_SIZES, RADIUS } from '../theme/tokens';
import { Conversation } from '../services/Database';

export const ConversationListScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Conversation[] | null>(
    null
  );
  const [refreshing, setRefreshing] = useState(false);

  const { darkMode } = useSettingsStore();
  const { conversations, isLoading, loadConversations, loadConversation, deleteConversation, startNewConversation } =
    useHistoryStore();
  const { setMessages, clearMessages } = useChatStore();
  const { activeModel } = useModelStore();
  const { colors } = useTheme();

  useEffect(() => {
    loadConversations();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const results = await useHistoryStore
        .getState()
        .searchConversations(query);
      setSearchResults(results);
    } else {
      setSearchResults(null);
    }
  };

  const handleNewChat = () => {
    startNewConversation();
    clearMessages();
    navigation.navigate('Chat');
  };

  const handleOpenConversation = async (conversation: Conversation) => {
    const messages = await loadConversation(conversation.id);
    setMessages(messages);
    navigation.navigate('Chat');
  };

  const handleDelete = (conversation: Conversation) => {
    Alert.alert(
      'Delete Conversation',
      `Delete "${conversation.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteConversation(conversation.id),
        },
      ]
    );
  };

  const displayConversations = searchResults || conversations;

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const renderItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={[styles.item, { backgroundColor: colors.surface }]}
      onPress={() => handleOpenConversation(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconBox, { backgroundColor: colors.primary + '10' }]}>
        <Icon name="chatbubble-outline" size={22} color={colors.primary} />
      </View>
      <View style={styles.itemText}>
        <Text style={[styles.itemTitle, { color: colors.text }]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={[styles.itemMeta, { color: colors.textTertiary }]}>
          {item.modelName} · {item.messageCount} messages
        </Text>
      </View>
      <View style={styles.itemRight}>
        <Text style={[styles.itemDate, { color: colors.textTertiary }]}>
          {formatDate(item.updatedAt)}
        </Text>
        <TouchableOpacity
          onPress={() => handleDelete(item)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="trash-outline" size={16} color={colors.error} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>History</Text>
        <TouchableOpacity
          style={[styles.newBtn, { backgroundColor: colors.primary }]}
          onPress={handleNewChat}
          activeOpacity={0.85}
        >
          <Icon name="add" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={[styles.searchBox, { backgroundColor: colors.surface }]}>
        <Icon name="search-outline" size={18} color={colors.textTertiary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search conversations..."
          placeholderTextColor={colors.textTertiary}
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Icon name="close-circle" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      {/* List */}
      {displayConversations.length === 0 ? (
        <View style={styles.empty}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.primary + '10' }]}>
            <Icon name="chatbubbles-outline" size={40} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {searchQuery ? 'No results found' : 'No conversations yet'}
          </Text>
          <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
            {searchQuery
              ? 'Try a different search term'
              : 'Start chatting to create your first conversation'}
          </Text>
          {!searchQuery && (
            <TouchableOpacity
              style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
              onPress={handleNewChat}
              activeOpacity={0.85}
            >
              <Text style={styles.emptyBtnText}>New Chat</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={displayConversations}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
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
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: Platform.OS === 'ios' ? SPACING.lg : SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  newBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: SPACING.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.xxl,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    paddingVertical: SPACING.xs,
  },
  list: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 110,
    gap: SPACING.sm,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.sm,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemText: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  itemTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    marginBottom: 2,
  },
  itemMeta: {
    fontSize: FONT_SIZES.sm,
  },
  itemRight: {
    alignItems: 'flex-end',
    gap: SPACING.sm,
  },
  itemDate: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xxl,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  emptyDesc: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  emptyBtn: {
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.xxl,
  },
  emptyBtnText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
  },
});
