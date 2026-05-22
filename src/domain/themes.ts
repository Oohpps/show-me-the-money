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
    name: '暖纸黄',
    description: '柔和纸张底色，保留黄、蓝、红的经典几何对比。',
    colors: ['#111111', '#F1EADF', '#F2C94C', '#184F9F'],
  },
  {
    id: 'obsidian',
    name: '包豪斯原色',
    description: '当前使用的明黄、淡蓝、强红与黑色结构线。',
    colors: ['#111111', '#F8F2E8', '#FFD21A', '#EF3328'],
  },
  {
    id: 'ocean',
    name: '深海蓝',
    description: '以浅蓝作为主色，图表和交互使用更深的蓝。',
    colors: ['#111111', '#E4EDF4', '#8BD3FF', '#0057B8'],
  },
  {
    id: 'moon',
    name: '月光紫',
    description: '紫色主块搭配蓝紫图表，负债仍保留醒目粉红。',
    colors: ['#111111', '#EBE4EF', '#D8C3FF', '#6747D7'],
  },
  {
    id: 'cafe',
    name: '咖金棕',
    description: '偏温暖的金棕主色，适合更沉稳的资产面板。',
    colors: ['#111111', '#EFE2CE', '#E7B84F', '#7A4F16'],
  },
] as const;

export const DEFAULT_THEME_ID: ThemeId = 'obsidian';
