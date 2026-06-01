import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../hooks/useTheme';
import { useModelStore } from '../store/useModelStore';
import { ModelInfo } from '../types';
import { BottomSheet } from './ui/BottomSheet';
import { SPACING, RADIUS, FONT_SIZES, FONT_WEIGHTS } from '../theme/tokens';

interface ModelNotesModalProps {
  visible: boolean;
  onClose: () => void;
  model: ModelInfo | null;
}

const ModelNotesModalBase: React.FC<ModelNotesModalProps> = ({ visible, onClose, model }) => {
  const { colors } = useTheme();
  const setModelNote = useModelStore((s) => s.setModelNote);
  const setModelRating = useModelStore((s) => s.setModelRating);
  const [note, setNote] = useState(model?.userNote || '');
  const [rating, setRating] = useState(model?.userRating || 0);

  React.useEffect(() => {
    setNote(model?.userNote || '');
    setRating(model?.userRating || 0);
  }, [model?.id]);

  if (!model) return null;

  const handleSave = () => {
    setModelNote(model.id, note);
    setModelRating(model.id, rating);
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Model Notes" height="60%">
      <View style={styles.content}>
        <View style={[styles.modelCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.modelName, { color: colors.text }]} numberOfLines={1}>
            {model.name}
          </Text>
          <Text style={[styles.modelMeta, { color: colors.textTertiary }]}>
            {model.params} · {model.quantization} · {model.sizeMB}MB
          </Text>
        </View>

        <Text style={[styles.label, { color: colors.textSecondary }]}>Rating</Text>
        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => setRating(rating === star ? 0 : star)}
              hitSlop={6}
              style={styles.starBtn}
            >
              <Icon
                name={star <= rating ? 'star' : 'star-outline'}
                size={28}
                color={star <= rating ? '#FACC15' : colors.textTertiary}
              />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { color: colors.textSecondary }]}>Notes</Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Add personal notes about this model..."
          placeholderTextColor={colors.textTertiary}
          multiline
          style={[
            styles.input,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              color: colors.text,
            },
          ]}
        />

        {model.lastUsedAt && (
          <Text style={[styles.usage, { color: colors.textTertiary }]}>
            Used {model.useCount || 0} times · Last used {new Date(model.lastUsedAt).toLocaleDateString()}
          </Text>
        )}

        <View style={styles.actions}>
          <TouchableOpacity
            onPress={onClose}
            style={[styles.btn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Text style={[styles.btnText, { color: colors.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSave}
            style={[styles.btn, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.btnText, { color: '#fff' }]}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheet>
  );
};

export const ModelNotesModal = React.memo(ModelNotesModalBase);

const styles = StyleSheet.create({
  content: {
    padding: SPACING.lg,
  },
  modelCard: {
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginBottom: SPACING.lg,
  },
  modelName: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
  },
  modelMeta: {
    fontSize: FONT_SIZES.xs,
    marginTop: 2,
  },
  label: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
  },
  stars: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginBottom: SPACING.lg,
  },
  starBtn: {
    padding: 2,
  },
  input: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZES.sm,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  usage: {
    fontSize: FONT_SIZES.xs,
    marginTop: SPACING.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
  btn: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    borderWidth: 1,
  },
  btnText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
  },
});
