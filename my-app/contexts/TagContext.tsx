import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Tag, DEFAULT_TAGS } from '@/types/todo';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface TagContextType {
  tags: Tag[];
  addTag: (tag: Tag) => void;
  updateTag: (id: string, tag: Tag) => void;
  deleteTag: (id: string) => void;
  loadTags: () => Promise<void>;
  saveTags: () => Promise<void>;
}

const TagContext = createContext<TagContextType | undefined>(undefined);

const TAGS_STORAGE_KEY = '@todo_tags';

export function TagProvider({ children }: { children: ReactNode }) {
  const [tags, setTags] = useState<Tag[]>(DEFAULT_TAGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // 加载标签
  const loadTags = async () => {
    try {
      const storedTags = await AsyncStorage.getItem(TAGS_STORAGE_KEY);
      if (storedTags) {
        const parsedTags = JSON.parse(storedTags);
        setTags(parsedTags);
      } else {
        // 首次使用，保存默认标签
        await saveTags();
      }
    } catch (error) {
      console.error('Error loading tags:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  // 保存标签
  const saveTags = async () => {
    try {
      await AsyncStorage.setItem(TAGS_STORAGE_KEY, JSON.stringify(tags));
    } catch (error) {
      console.error('Error saving tags:', error);
    }
  };

  // 添加标签
  const addTag = (tag: Tag) => {
    const newTags = [...tags, tag];
    setTags(newTags);
    AsyncStorage.setItem(TAGS_STORAGE_KEY, JSON.stringify(newTags)).catch((error) => {
      console.error('Error saving tags:', error);
    });
  };

  // 更新标签
  const updateTag = (id: string, updatedTag: Tag) => {
    const newTags = tags.map((tag) => (tag.id === id ? updatedTag : tag));
    setTags(newTags);
    AsyncStorage.setItem(TAGS_STORAGE_KEY, JSON.stringify(newTags)).catch((error) => {
      console.error('Error saving tags:', error);
    });
  };

  // 删除标签
  const deleteTag = (id: string) => {
    const newTags = tags.filter((tag) => tag.id !== id);
    setTags(newTags);
    AsyncStorage.setItem(TAGS_STORAGE_KEY, JSON.stringify(newTags)).catch((error) => {
      console.error('Error saving tags:', error);
    });
  };

  // 初始化时加载标签
  React.useEffect(() => {
    if (!isLoaded) {
      loadTags();
    }
  }, []);

  return (
    <TagContext.Provider
      value={{
        tags,
        addTag,
        updateTag,
        deleteTag,
        loadTags,
        saveTags,
      }}
    >
      {children}
    </TagContext.Provider>
  );
}

export function useTags() {
  const context = useContext(TagContext);
  if (context === undefined) {
    throw new Error('useTags must be used within a TagProvider');
  }
  return context;
}

