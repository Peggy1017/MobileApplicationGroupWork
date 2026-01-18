import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { TodoItem } from '@/types/todo';
import { useUser } from './UserContext';
import { API_URL } from '@/utils/apiConfig';

interface TodoContextType {
  todos: TodoItem[];
  setTodos: React.Dispatch<React.SetStateAction<TodoItem[]>>;
  addTodo: (todo: TodoItem) => Promise<void>;
  toggleTodo: (id: string) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  updateTodo: (updatedTodo: TodoItem) => Promise<void>;
  loadTodos: () => Promise<void>;
}

const TodoContext = createContext<TodoContextType | undefined>(undefined);

export function TodoProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useUser();
  const [todos, setTodos] = useState<TodoItem[]>([]);

  const loadTodos = async () => {
    if (!currentUser) return;

    try {
      const response = await fetch(`${API_URL}/api/todos?userId=${currentUser}`);
      if (response.ok) {
        const data = await response.json();
        // 转换数据库格式到前端格式
        const convertedTodos: TodoItem[] = data.map((item: any) => {
          const createdAt = new Date(item.createdAt);
          console.log('loadTodos - Task:', {
            text: item.text,
            createdAtRaw: item.createdAt,
            createdAtDate: createdAt,
            createdAtISO: createdAt.toISOString(),
            createdAtUTCYear: createdAt.getUTCFullYear(),
            createdAtUTCMonth: createdAt.getUTCMonth() + 1,
            createdAtUTCDay: createdAt.getUTCDate(),
          });
          return {
            id: item._id || item.id,
            text: item.text,
            completed: item.completed,
            createdAt: createdAt,
            completedAt: item.completedAt ? new Date(item.completedAt) : undefined,
            startedAt: item.startedAt ? new Date(item.startedAt) : undefined,
            tag: item.tag,
            duration: item.duration,
            priority: item.priority,
            notes: item.notes,
          };
        });
        setTodos(convertedTodos);
      }
    } catch (error) {
      console.error('Error loading todos:', error);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadTodos();
    } else {
      setTodos([]);
    }
  }, [currentUser]);

  const addTodo = async (todo: TodoItem) => {
    if (!currentUser) {
      setTodos(prev => [...prev, todo]);
      return;
    }

    try {
      // 格式化日期为 YYYY-MM-DD 格式，避免时区问题
      // 使用本地时区方法格式化，因为 selectedDate 已经是本地时区的日期
      let createdAtStr: string | undefined;
      if (todo.createdAt) {
        const date = new Date(todo.createdAt);
        // 使用本地时区方法，因为日期选择器返回的是本地时区的日期
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        createdAtStr = `${year}-${month}-${day}`;
        console.log('addTodo - Original date:', todo.createdAt);
        console.log('addTodo - Local year:', year, 'month:', month, 'day:', day);
        console.log('addTodo - Formatted createdAtStr:', createdAtStr);
      }

      const response = await fetch(`${API_URL}/api/todos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser,
          text: todo.text,
          tag: todo.tag,
          duration: todo.duration,
          priority: todo.priority,
          notes: todo.notes,
          createdAt: createdAtStr,
        }),
      });

      if (response.ok) {
        const savedTodo = await response.json();
        const convertedTodo: TodoItem = {
          id: savedTodo._id || savedTodo.id,
          text: savedTodo.text,
          completed: savedTodo.completed,
          createdAt: new Date(savedTodo.createdAt),
          completedAt: savedTodo.completedAt ? new Date(savedTodo.completedAt) : undefined,
          startedAt: savedTodo.startedAt ? new Date(savedTodo.startedAt) : undefined,
          tag: savedTodo.tag,
          duration: savedTodo.duration,
          priority: savedTodo.priority,
          notes: savedTodo.notes,
        };
        setTodos(prev => [...prev, convertedTodo]);
      } else {
        // 如果保存失败，仍然添加到本地状态
        setTodos(prev => [...prev, todo]);
      }
    } catch (error) {
      console.error('Error adding todo:', error);
      // 如果网络错误，仍然添加到本地状态
      setTodos(prev => [...prev, todo]);
    }
  };

  const toggleTodo = async (id: string) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    if (!currentUser) {
      // 如果未登录，只更新本地状态
      setTodos(prev => prev.map(t => {
        if (t.id === id) {
          return {
            ...t,
            completed: !t.completed,
            completedAt: !t.completed ? new Date() : undefined,
          };
        }
        return t;
      }));
      return;
    }

    const newCompleted = !todo.completed;

    // 乐观更新
    setTodos(prev => prev.map(t => {
      if (t.id === id) {
        return {
          ...t,
          completed: newCompleted,
          completedAt: newCompleted ? new Date() : undefined,
        };
      }
      return t;
    }));

    try {
      const response = await fetch(`${API_URL}/api/todos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          completed: newCompleted,
          userId: currentUser,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update todo');
      }
    } catch (error) {
      console.error('Error updating todo:', error);
      // 回滚
      setTodos(prev => prev.map(t => {
        if (t.id === id) {
          return {
            ...t,
            completed: !newCompleted,
            completedAt: todo.completedAt,
          };
        }
        return t;
      }));
    }
  };

  const deleteTodo = async (id: string) => {
    if (!currentUser) {
      // 如果未登录，只更新本地状态
      setTodos(prev => prev.filter(todo => todo.id !== id));
      return;
    }

    // 乐观更新
    setTodos(prev => prev.filter(todo => todo.id !== id));

    try {
      const response = await fetch(`${API_URL}/api/todos/${id}?userId=${currentUser}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete todo');
      }
    } catch (error) {
      console.error('Error deleting todo:', error);
      // 重新加载以恢复
      loadTodos();
    }
  };

  const updateTodo = async (updatedTodo: TodoItem) => {
    // 乐观更新
    setTodos(prev => prev.map(t => (t.id === updatedTodo.id ? updatedTodo : t)));

    if (currentUser) {
      try {
        // 确保日期格式正确（转换为 ISO 字符串）
        const requestBody = {
          text: updatedTodo.text,
          completed: updatedTodo.completed,
          completedAt: updatedTodo.completedAt ? updatedTodo.completedAt.toISOString() : undefined,
          startedAt: updatedTodo.startedAt ? updatedTodo.startedAt.toISOString() : undefined,
          duration: updatedTodo.duration,
          tag: updatedTodo.tag,
          priority: updatedTodo.priority,
          notes: updatedTodo.notes,
          userId: currentUser,
        };

        const response = await fetch(`${API_URL}/api/todos/${updatedTodo.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          throw new Error('Failed to update todo');
        }

        // 重新加载任务列表以确保数据同步
        await loadTodos();
      } catch (error) {
        console.error('Error updating todo:', error);
        // 重新加载以恢复
        loadTodos();
      }
    }
  };

  return (
    <TodoContext.Provider
      value={{
        todos,
        setTodos,
        addTodo,
        toggleTodo,
        deleteTodo,
        updateTodo,
        loadTodos,
      }}
    >
      {children}
    </TodoContext.Provider>
  );
}

export function useTodos() {
  const context = useContext(TodoContext);
  if (context === undefined) {
    throw new Error('useTodos must be used within a TodoProvider');
  }
  return context;
}

