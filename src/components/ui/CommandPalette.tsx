import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  FlatList,
  Platform,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../hooks/useTheme';
import { SPACING, RADIUS, FONT_SIZES, FONT_WEIGHTS, ELEVATION } from '../../theme/tokens';

export interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  shortcut?: string;
  category?: string;
  onSelect: () => void;
}

interface CommandPaletteProps {
  visible: boolean;
  onClose: () => void;
  items: CommandItem[];
  placeholder?: string;
}

const CommandPaletteBase: React.FC<CommandPaletteProps> = ({
  visible,
  onClose,
  items,
  placeholder = 'Type a command or search...',
}) => {
  const { colors } = useTheme();
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!visible) setQuery('');
  }, [visible]);

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        (i.subtitle?.toLowerCase().includes(q) ?? false) ||
        (i.category?.toLowerCase().includes(q) ?? false)
    );
  }, [query, items]);

  const handleSelect = (item: CommandItem) => {
    item.onSelect();
    onClose();
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={[StyleSheet.absoluteFill, { paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 60 }]}>
        <Pressable
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: 'rgba(0,0,0,0.55)' },
          ]}
          onPress={onClose}
        />

        <View style={styles.container}>
          <View
            style={[
              styles.palette,
              { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
              ELEVATION[4],
            ]}
          >
            <View style={[styles.searchRow, { borderBottomColor: colors.divider }]}>
              <Icon name="search" size={18} color={colors.textTertiary} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={placeholder}
                placeholderTextColor={colors.textTertiary}
                style={[styles.input, { color: colors.text }]}
                autoFocus
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="search"
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}>
                  <Icon name="close-circle" size={16} color={colors.textTertiary} />
                </TouchableOpacity>
              )}
            </View>

            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Text style={{ color: colors.textTertiary }}>
                    No matching commands
                  </Text>
                </View>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleSelect(item)}
                  style={[
                    styles.item,
                    {
                      backgroundColor: colors.surface,
                      borderBottomColor: colors.divider,
                    },
                  ]}
                >
                  <Icon name={item.icon} size={18} color={colors.primary} />
                  <View style={styles.itemText}>
                    <Text style={[styles.itemTitle, { color: colors.text }]}>
                      {item.title}
                    </Text>
                    {item.subtitle && (
                      <Text
                        style={[styles.itemSubtitle, { color: colors.textTertiary }]}
                        numberOfLines={1}
                      >
                        {item.subtitle}
                      </Text>
                    )}
                  </View>
                  {item.shortcut && (
                    <View
                      style={[
                        styles.shortcut,
                        { backgroundColor: colors.surface, borderColor: colors.border },
                      ]}
                    >
                      <Text style={[styles.shortcutText, { color: colors.textSecondary }]}>
                        {item.shortcut}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

export const CommandPalette = React.memo(CommandPaletteBase);

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.md,
  },
  palette: {
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    maxHeight: 480,
    overflow: 'hidden',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    padding: 0,
  },
  empty: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 0.5,
  },
  itemText: {
    flex: 1,
  },
  itemTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  itemSubtitle: {
    fontSize: FONT_SIZES.xs,
    marginTop: 2,
  },
  shortcut: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  shortcutText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semibold,
  },
});
