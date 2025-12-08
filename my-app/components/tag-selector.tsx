import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Tag } from '@/types/todo';
import { useTags } from '@/contexts/TagContext';

interface TagSelectorProps {
  selectedTag: Tag | null;
  onSelectTag: (tag: Tag | null) => void;
}

export default function TagSelector({ selectedTag, onSelectTag }: TagSelectorProps) {
  const { tags } = useTags();
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.tagButton, selectedTag && { backgroundColor: selectedTag.color + '20', borderColor: selectedTag.color }]}
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
            <Ionicons name="pricetag-outline" size={16} color="#666" />
            <Text style={styles.placeholderText}>选择标签</Text>
            <Ionicons name="chevron-down" size={16} color="#666" />
          </View>
        )}
      </TouchableOpacity>

      {selectedTag && (
        <TouchableOpacity
          style={styles.clearButton}
          onPress={() => onSelectTag(null)}
        >
          <Ionicons name="close-circle" size={20} color="#999" />
        </TouchableOpacity>
      )}

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>选择标签</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.tagsList}>
              <TouchableOpacity
                style={[styles.tagOption, !selectedTag && styles.tagOptionSelected]}
                onPress={() => {
                  onSelectTag(null);
                  setModalVisible(false);
                }}
              >
                <Text style={styles.tagOptionText}>无标签</Text>
                {!selectedTag && <Ionicons name="checkmark" size={20} color="#007AFF" />}
              </TouchableOpacity>

              {tags.map((tag) => (
                <TouchableOpacity
                  key={tag.id}
                  style={[
                    styles.tagOption,
                    selectedTag?.id === tag.id && styles.tagOptionSelected,
                  ]}
                  onPress={() => {
                    onSelectTag(tag);
                    setModalVisible(false);
                  }}
                >
                  <View style={[styles.colorDot, { backgroundColor: tag.color }]} />
                  <Text style={styles.tagOptionText}>{tag.name}</Text>
                  {selectedTag?.id === tag.id && <Ionicons name="checkmark" size={20} color="#007AFF" />}
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
    borderColor: '#e0e0e0',
    backgroundColor: '#f5f5f5',
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
    color: '#666',
    marginLeft: 8,
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
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
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
    backgroundColor: '#f5f5f5',
  },
  tagOptionSelected: {
    backgroundColor: '#E3F2FD',
  },
  tagOptionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
});

