import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  Text,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';
import { COLORS, SPACING, BORDER_RADIUS } from '../theme';

export interface AttachmentItem {
  uri: string;
  type: 'image' | 'audio';
  name?: string;
  duration?: number;
}

interface ChatInputProps {
  onSend: (message: string, attachments?: AttachmentItem[]) => void;
  onStop: () => void;
  isGenerating: boolean;
  darkMode: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  onStop,
  isGenerating,
  darkMode,
}) => {
  const [inputText, setInputText] = useState('');
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const colors = darkMode ? COLORS.dark : COLORS.light;

  const handleSend = () => {
    if ((inputText.trim() || attachments.length > 0) && !isGenerating) {
      onSend(inputText.trim(), attachments);
      setInputText('');
      setAttachments([]);
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1024,
        maxHeight: 1024,
      });

      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const uri = asset.uri;
        if (uri) {
          setAttachments((prev) => [
            ...prev,
            { uri, type: 'image' as const, name: asset.fileName },
          ]);
        }
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const hasContent = inputText.trim() || attachments.length > 0;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <View style={[styles.container, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        {attachments.length > 0 && (
          <View style={styles.attachmentsRow}>
            {attachments.map((att, idx) => (
              <View
                key={idx}
                style={[
                  styles.attachmentThumb,
                  { backgroundColor: colors.surfaceVariant },
                ]}
              >
                {att.type === 'image' ? (
                  <Image source={{ uri: att.uri }} style={styles.thumbImage} />
                ) : null}
                <TouchableOpacity
                  style={[styles.removeBtn, { backgroundColor: colors.error }]}
                  onPress={() => handleRemoveAttachment(idx)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Icon name="close" size={10} color="#FFF" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <View
          style={[
            styles.inputContainer,
            { backgroundColor: colors.inputBackground },
          ]}
        >
          {!isGenerating && (
            <TouchableOpacity
              style={styles.attachBtn}
              onPress={handlePickImage}
              activeOpacity={0.7}
            >
              <Icon name="image-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
          )}

          <TextInput
            style={[styles.input, { color: colors.text }]}
            value={inputText}
            onChangeText={setInputText}
            placeholder={
              attachments.some((a) => a.type === 'image')
                ? 'Describe what you see...'
                : 'Message...'
            }
            placeholderTextColor={colors.textTertiary}
            multiline
            maxLength={4000}
            editable={!isGenerating}
            textAlignVertical="center"
          />
          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor: isGenerating
                  ? colors.error + '18'
                  : hasContent
                  ? colors.primary
                  : colors.textTertiary + '30',
              },
            ]}
            onPress={isGenerating ? onStop : handleSend}
            disabled={!hasContent && !isGenerating}
            activeOpacity={0.8}
          >
            <Icon
              name={isGenerating ? 'stop' : 'arrow-up'}
              size={18}
              color={isGenerating ? colors.error : '#FFFFFF'}
            />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingBottom: 96,
    borderTopWidth: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: BORDER_RADIUS.xxl,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    minHeight: 48,
  },
  input: {
    flex: 1,
    fontSize: 16,
    maxHeight: 120,
    paddingVertical: SPACING.sm,
    paddingRight: SPACING.md,
  },
  button: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.sm,
    marginBottom: 2,
  },
  attachBtn: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
    marginBottom: 2,
  },
  attachmentsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  attachmentThumb: {
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  removeBtn: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
