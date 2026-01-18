import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Tag } from '@/types/todo';
import { useTags } from '@/contexts/TagContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';

interface TagSelectorProps {
  selectedTag: Tag | null;
  onSelectTag: (tag: Tag | null) => void;
}

export default function TagSelector({ selectedTag, onSelectTag }: TagSelectorProps) {
  const { tags } = useTags();
  const { t } = useLanguage();
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.tagButton,
          { backgroundColor: colors.surface, borderColor: colors.border },
          selectedTag && { backgroundColor: selectedTag.color + '20', borderColor: selectedTag.color }
        ]}
        onPress={() => setModalVisible(true)}
      >
        {selectedTag ? (
          <View style={styles.selectedTagContainer}>
            <View style={[styles.colorDot, { backgroundColor: selectedTag.color }]} />
            <Text style={[styles.tagText, { color: selectedTag.color }]}>{selectedTag.name}</Text>
            <Ionicons name="chevron-down" size={16} color={selectedTag.color} />
          </View>
        ) : (
          <View style={styles.unselectedTagContainer}>
            <Ionicons name="pricetag-outline" size={16} color={colors.text} />
            <Text style={[styles.placeholderText, { color: colors.text }]}>{t('select_tag')}</Text>
            <Ionicons name="chevron-down" size={16} color={colors.text} />
          </View>
        )}
      </TouchableOpacity>

      {selectedTag && (
        <TouchableOpacity
          style={styles.clearButton}
          onPress={() => onSelectTag(null)}
        >
          <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      )}

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t('select_tag')}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.tagsList}>
              <TouchableOpacity
                style={[
                  styles.tagOption,
                  { backgroundColor: colors.surface },
                  !selectedTag && { backgroundColor: colors.primary + '20' }
                ]}
                onPress={() => {
                  onSelectTag(null);
                  setModalVisible(false);
                }}
              >
                <Text style={[styles.tagOptionText, { color: colors.text }]}>{t('no_tag')}</Text>
                {!selectedTag && <Ionicons name="checkmark" size={20} color={colors.primary} />}
              </TouchableOpacity>

              {tags.map((tag) => (
                <TouchableOpacity
                  key={tag.id}
                  style={[
                    styles.tagOption,
                    { backgroundColor: colors.surface },
                    selectedTag?.id === tag.id && { backgroundColor: colors.primary + '20' }
                  ]}
                  onPress={() => {
                    onSelectTag(tag);
                    setModalVisible(false);
                  }}
                >
                  <View style={[styles.colorDot, { backgroundColor: tag.color }]} />
                  <Text style={[styles.tagOptionText, { color: colors.text }]}>{tag.name}</Text>
                  {selectedTag?.id === tag.id && <Ionicons name="checkmark" size={20} color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tagButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    // backgroundColor and borderColor will be set dynamically
  },
  selectedTagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  unselectedTagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  tagText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  placeholderText: {
    flex: 1,
    fontSize: 14,
    marginLeft: 8,
    // color will be set dynamically
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
    // backgroundColor will be set dynamically
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    // borderBottomColor will be set dynamically
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    // color will be set dynamically
  },
  tagsList: {
    maxHeight: 300,
    padding: 16,
  },
  tagOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    // backgroundColor will be set dynamically
  },
  tagOptionSelected: {
    // backgroundColor will be set dynamically
  },
  tagOptionText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
    // color will be set dynamically
  },
});

