// 标签类型定义
export interface Tag {
  id: string;
  name: string;
  color: string; // 颜色代码
  priority?: number; // 优先级（数字越小越紧急，用于排序）
}

// 默认标签配置（按紧急性，priority越小越紧急）
export const DEFAULT_TAGS: Tag[] = [
  { id: 'urgent', name: '紧急', color: '#FF3B30', priority: 1 },      // 红色 - 紧急
  { id: 'high', name: '高优先级', color: '#FF9500', priority: 2 },    // 橙色 - 高优先级
  { id: 'medium', name: '中优先级', color: '#FFCC00', priority: 3 }, // 黄色 - 中优先级
  { id: 'low', name: '低优先级', color: '#34C759', priority: 4 },    // 绿色 - 低优先级
  { id: 'personal', name: '个人', color: '#007AFF', priority: 5 },    // 蓝色 - 个人
  { id: 'work', name: '工作', color: '#AF52DE', priority: 6 },        // 紫色 - 工作
];

// 任务项接口
export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
  completedAt?: Date; // 完成时间
  startedAt?: Date; // 开始时间
  tag?: Tag; // 标签
  duration?: number; // 实际时长（分钟）- 从计时器记录
  priority?: number; // 紧急性（数字越小越紧急）
  notes?: string; // 备注
}

