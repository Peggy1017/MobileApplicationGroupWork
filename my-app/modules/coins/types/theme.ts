// 主题类型定义

// 背景主题接口
export interface BackgroundTheme {
    id: string;
    name: string;
    nameZh: string; // 中文名称
    description: string;
    descriptionZh: string; // 中文描述
    price: number; // 价格（虚拟货币）
    type: 'solid' | 'gradient' | 'pattern'; // 主题类型
    colors: string[]; // 背景颜色（渐变时为多个颜色）
    isDefault?: boolean; // 是否为默认主题（免费）
    previewImage?: string; // 预览图片URL（可选）
}

// 预设主题列表
export const AVAILABLE_THEMES: BackgroundTheme[] = [
    // 免费默认主题
    {
        id: 'default_light',
        name: 'Classic Light',
        nameZh: '经典浅色',
        description: 'Clean and simple light theme',
        descriptionZh: '简洁明亮的经典主题',
        price: 0,
        type: 'solid',
        colors: ['#F5F5F5'],
        isDefault: true,
    },
    {
        id: 'default_dark',
        name: 'Classic Dark',
        nameZh: '经典深色',
        description: 'Elegant dark theme for night owls',
        descriptionZh: '优雅的深色主题，适合夜猫子',
        price: 0,
        type: 'solid',
        colors: ['#303030'], // Classic Dark 背景色
        isDefault: true,
    },
    // 付费渐变主题
    {
        id: 'sunset_glow',
        name: 'Sunset Glow',
        nameZh: '日落余晖',
        description: 'Warm orange to pink gradient',
        descriptionZh: '温暖的橙粉渐变',
        price: 50,
        type: 'gradient',
        colors: ['#FF6B6B', '#FFA07A', '#FFD700'],
    },
    {
        id: 'ocean_breeze',
        name: 'Ocean Breeze',
        nameZh: '海洋微风',
        description: 'Calm blue to teal gradient',
        descriptionZh: '宁静的蓝绿渐变',
        price: 50,
        type: 'gradient',
        colors: ['#667eea', '#764ba2'],
    },
    {
        id: 'aurora_night',
        name: 'Aurora Night',
        nameZh: '极光之夜',
        description: 'Mystical purple to green aurora',
        descriptionZh: '神秘的紫绿极光',
        price: 80,
        type: 'gradient',
        colors: ['#0F2027', '#203A43', '#2C5364'],
    },
    {
        id: 'cherry_blossom',
        name: 'Cherry Blossom',
        nameZh: '樱花粉',
        description: 'Soft pink cherry blossom theme',
        descriptionZh: '柔和的樱花粉色主题',
        price: 60,
        type: 'gradient',
        colors: ['#ffecd2', '#fcb69f'],
    },
    {
        id: 'mint_fresh',
        name: 'Mint Fresh',
        nameZh: '薄荷清新',
        description: 'Fresh mint green gradient',
        descriptionZh: '清新的薄荷绿渐变',
        price: 50,
        type: 'gradient',
        colors: ['#a8edea', '#fed6e3'],
    },
    {
        id: 'cosmic_purple',
        name: 'Cosmic Purple',
        nameZh: '宇宙紫',
        description: 'Deep space purple theme',
        descriptionZh: '深邃的宇宙紫色主题',
        price: 100,
        type: 'gradient',
        colors: ['#4a00e0', '#8e2de2'],
    },
    {
        id: 'golden_hour',
        name: 'Golden Hour',
        nameZh: '黄金时刻',
        description: 'Warm golden sunset theme',
        descriptionZh: '温暖的金色夕阳主题',
        price: 70,
        type: 'gradient',
        colors: ['#f7971e', '#ffd200'],
    },
    {
        id: 'forest_dawn',
        name: 'Forest Dawn',
        nameZh: '森林黎明',
        description: 'Peaceful green forest theme',
        descriptionZh: '宁静的森林绿色主题',
        price: 60,
        type: 'gradient',
        colors: ['#134e5e', '#71b280'],
    },
    {
        id: 'midnight_city',
        name: 'Midnight City',
        nameZh: '午夜都市',
        description: 'Cyberpunk neon city vibes',
        descriptionZh: '赛博朋克霓虹都市风',
        price: 120,
        type: 'gradient',
        colors: ['#232526', '#414345'],
    },
    {
        id: 'candy_dream',
        name: 'Candy Dream',
        nameZh: '糖果梦境',
        description: 'Sweet candy color gradient',
        descriptionZh: '甜蜜的糖果色渐变',
        price: 80,
        type: 'gradient',
        colors: ['#f093fb', '#f5576c'],
    },
];

// 货币奖励配置
export const COIN_REWARDS = {
    TASK_COMPLETE: 5,        // 完成一个任务
    FOCUS_SESSION: 10,       // 完成一次专注（番茄钟）
    DAILY_LOGIN: 3,          // 每日登录
    STREAK_BONUS: 2,         // 每天连续登录额外奖励
    FIRST_TASK_OF_DAY: 5,    // 每天第一个完成的任务额外奖励
};

// 用户货币信息接口
export interface UserCoins {
    balance: number;         // 当前余额
    totalEarned: number;     // 累计获得
    totalSpent: number;      // 累计消费
    ownedThemes: string[];   // 已拥有的主题ID列表
    currentTheme: string;    // 当前使用的主题ID
    lastLoginDate?: string;  // 上次登录日期（用于计算连续登录）
    loginStreak: number;     // 连续登录天数
}

// 默认用户货币状态
export const DEFAULT_USER_COINS: UserCoins = {
    balance: 20,             // 初始赠送20金币
    totalEarned: 20,
    totalSpent: 0,
    ownedThemes: ['default_light', 'default_dark'], // 默认拥有两个免费主题
    currentTheme: 'default_light',
    loginStreak: 0,
};
