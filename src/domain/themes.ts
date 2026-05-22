import type { ThemeId } from './types';

export interface ThemeOption {
  id: ThemeId;
  name: string;
  description: string;
  colors: readonly [string, string, string, string];
}

export const THEMES: readonly ThemeOption[] = [
  {
    id: 'classic',
    name: '经典灰',
    description: '最开始的暖灰资产面板，柔和克制。',
    colors: ['#7D7871', '#F5F4F2', '#D6B56D', '#A7EAC7'],
  },
  {
    id: 'obsidian',
    name: '曜石绿',
    description: '深墨绿 + 雾白 + 浅金点缀，高级稳重。',
    colors: ['#0F2F2A', '#F3F6F2', '#D6B56D', '#6ED6A5'],
  },
  {
    id: 'ocean',
    name: '深海蓝',
    description: '深蓝黑 + 冰蓝 + 白色卡片，数字和图表更清晰。',
    colors: ['#10233F', '#F5F8FC', '#7EB6FF', '#7DE2C3'],
  },
  {
    id: 'moon',
    name: '月光紫灰',
    description: '紫灰 + 银白 + 柔粉，精致但不花。',
    colors: ['#3B3446', '#F7F4F8', '#C8A7E8', '#F2AFC2'],
  },
  {
    id: 'cafe',
    name: '暖白咖金',
    description: '暖白 + 咖灰 + 金色，偏轻奢记账感。',
    colors: ['#6B5C4B', '#FAF7F1', '#C79A45', '#A8D8B9'],
  },
] as const;

export const DEFAULT_THEME_ID: ThemeId = 'obsidian';
