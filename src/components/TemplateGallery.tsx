import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSettingsStore, PromptTemplate } from '../store/useSettingsStore';
import { BUILTIN_TEMPLATES } from '../data/promptTemplates';
import { SPACING, RADIUS, FONT_SIZES, FONT_WEIGHTS, ELEVATION, getThemeColors } from '../theme/tokens';

interface TemplateGalleryProps {
  darkMode: boolean;
}

export const TemplateGallery: React.FC<TemplateGalleryProps> = ({ darkMode }) => {
  const {
    systemPrompt,
    setSystemPrompt,
    customTemplates,
    addCustomTemplate,
    removeCustomTemplate,
    activeTemplateId,
    setActiveTemplateId,
    themeVariant,
  } = useSettingsStore();

  const themeName = themeVariant || (darkMode ? 'midnight' : 'aurora');
  const colors = getThemeColors(themeName);

  const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('document-text');
  const [newPrompt, setNewPrompt] = useState('');

  const allTemplates = [...BUILTIN_TEMPLATES, ...customTemplates];

  const applyTemplate = (template: PromptTemplate) => {
    setSystemPrompt(template.prompt);
    setActiveTemplateId(template.id);
  };

  const handleAddCustom = () => {
    if (!newName.trim() || !newPrompt.trim()) {
      Alert.alert('Missing Info', 'Please provide a name and prompt.');
      return;
    }
    const template: PromptTemplate = {
      id: `custom-${Date.now()}`,
      name: newName.trim(),
      icon: newIcon,
      prompt: newPrompt.trim(),
    };
    addCustomTemplate(template);
    setNewName('');
    setNewIcon('document-text');
    setNewPrompt('');
    setShowAddModal(false);
  };

  const handleDeleteCustom = (id: string) => {
    Alert.alert(
      'Delete Template',
      'Are you sure you want to delete this custom template?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            removeCustomTemplate(id);
            if (activeTemplateId === id) setActiveTemplateId(null);
          },
        },
      ]
    );
  };

  return (
    <View>
      <View style={styles.headerRow}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
          QUICK TEMPLATES
        </Text>
        <TouchableOpacity
          onPress={() => setShowAddModal(true)}
          style={[styles.addButton, { backgroundColor: colors.primary + '15' }]}
          activeOpacity={0.7}
        >
          <Icon name="add" size={14} color={colors.primary} />
          <Text style={[styles.addButtonText, { color: colors.primary }]}>Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {allTemplates.map((template) => {
          const isActive = activeTemplateId === template.id && systemPrompt === template.prompt;
          return (
            <TouchableOpacity
              key={template.id}
              style={[
                styles.templateCard,
                {
                  backgroundColor: isActive ? colors.primary + '15' : colors.surface,
                  borderColor: isActive ? colors.primary : colors.border,
                },
                ELEVATION[1],
              ]}
              onPress={() => applyTemplate(template)}
              onLongPress={() => !template.builtin && handleDeleteCustom(template.id)}
              activeOpacity={0.85}
            >
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: isActive ? colors.primary : colors.surfaceVariant },
                ]}
              >
                <Icon
                  name={template.icon as any}
                  size={20}
                  color={isActive ? colors.textInverse : colors.primary}
                />
              </View>
              <Text
                style={[styles.templateName, { color: colors.text }]}
                numberOfLines={1}
              >
                {template.name}
              </Text>
              {isActive && (
                <View style={[styles.activeDot, { backgroundColor: colors.primary }]} />
              )}
              {!template.builtin && (
                <View style={[styles.customBadge, { backgroundColor: colors.accent + '20' }]}>
                  <Text style={[styles.customBadgeText, { color: colors.accent }]}>CUSTOM</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }, ELEVATION[4]]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>New Custom Template</Text>

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceVariant, color: colors.text, borderColor: colors.border }]}
              value={newName}
              onChangeText={setNewName}
              placeholder="e.g. Marketing Assistant"
              placeholderTextColor={colors.textTertiary}
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Prompt</Text>
            <TextInput
              style={[
                styles.input,
                styles.promptInput,
                { backgroundColor: colors.surfaceVariant, color: colors.text, borderColor: colors.border },
              ]}
              value={newPrompt}
              onChangeText={setNewPrompt}
              placeholder="You are a..."
              placeholderTextColor={colors.textTertiary}
              multiline
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setShowAddModal(false)}
                style={[styles.modalButton, { backgroundColor: colors.surfaceVariant }]}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddCustom}
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                activeOpacity={0.85}
              >
                <Text style={[styles.modalButtonText, { color: colors.textInverse }]}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  sectionLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    letterSpacing: 0.5,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  addButtonText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
  },
  scrollContent: {
    paddingVertical: SPACING.xs,
    gap: SPACING.sm,
  },
  templateCard: {
    width: 110,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  templateName: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semibold,
    textAlign: 'center',
  },
  activeDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  customBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: RADIUS.xs,
  },
  customBadgeText: {
    fontSize: 8,
    fontWeight: FONT_WEIGHTS.black,
    letterSpacing: 0.5,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  modalContent: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.lg,
  },
  modalTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    marginBottom: SPACING.base,
  },
  inputLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semibold,
    marginBottom: SPACING.xs,
    marginTop: SPACING.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZES.base,
  },
  promptInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  modalButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.semibold,
  },
});
