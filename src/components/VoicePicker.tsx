import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { TTSVoice } from '../types';
import { getVoiceGroups } from '../services/VoiceManager';
import { COLORS, SPACING } from '../theme';

interface VoicePickerProps {
  visible: boolean;
  selectedVoiceId: string;
  onSelect: (voiceId: string) => void;
  onClose: () => void;
  darkMode: boolean;
}

export const VoicePicker: React.FC<VoicePickerProps> = ({
  visible,
  selectedVoiceId,
  onSelect,
  onClose,
  darkMode,
}) => {
  const colors = darkMode ? COLORS.dark : COLORS.light;
  const groups = getVoiceGroups();

  const getGenderIcon = (gender: string) => {
    switch (gender) {
      case 'female':
        return 'female';
      case 'male':
        return 'male';
      default:
        return 'person';
    }
  };

  const renderVoiceItem = (voice: TTSVoice) => {
    const isSelected = voice.id === selectedVoiceId;
    return (
      <Pressable
        key={voice.id}
        style={[
          styles.voiceItem,
          {
            backgroundColor: isSelected ? colors.primary + '18' : colors.surfaceVariant,
            borderColor: isSelected ? colors.primary : colors.border,
          },
        ]}
        onPress={() => {
          onSelect(voice.id);
          onClose();
        }}
      >
        <View style={styles.voiceLeft}>
          <Icon
            name={getGenderIcon(voice.gender)}
            size={18}
            color={isSelected ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[
              styles.voiceName,
              { color: isSelected ? colors.primary : colors.text },
            ]}
          >
            {voice.name}
          </Text>
        </View>
        {isSelected && (
          <Icon name="checkmark" size={18} color={colors.primary} />
        )}
      </Pressable>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.background }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>
              Select Voice
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Icon name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {groups.map((group) => (
              <View key={group.title} style={styles.group}>
                <Text
                  style={[
                    styles.groupTitle,
                    { color: colors.textSecondary },
                  ]}
                >
                  {group.title}
                </Text>
                <View style={styles.voiceList}>
                  {group.voices.map(renderVoiceItem)}
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '75%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    padding: SPACING.xs,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  group: {
    marginBottom: SPACING.lg,
  },
  groupTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
  },
  voiceList: {
    gap: SPACING.xs,
  },
  voiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
  },
  voiceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  voiceName: {
    fontSize: 15,
    fontWeight: '500',
  },
});
