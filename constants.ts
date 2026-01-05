import { TagGroup, Tag } from './types';

export const INITIAL_GROUPS: TagGroup[] = [
  { id: 'g_scope', name: '账本归属', isSingleSelect: false, allowWeight: true },
  { id: 'g_cat', name: '消费类目', isSingleSelect: true, allowWeight: false },
  { id: 'g_member', name: '成员/分摊', isSingleSelect: false, allowWeight: true },
];

export const INITIAL_TAGS: Tag[] = [
  // 归属
  { id: 't_family', name: '家庭公用', color: '#3b82f6', groupId: 'g_scope' },
  { id: 't_personal', name: '个人独享', color: '#8b5cf6', groupId: 'g_scope' },
  
  // 类目
  { id: 't_food', name: '餐饮美食', color: '#ef4444', groupId: 'g_cat' },
  { id: 't_shop', name: '日常购物', color: '#f59e0b', groupId: 'g_cat' },
  { id: 't_house', name: '居住物业', color: '#10b981', groupId: 'g_cat' },
  { id: 't_trans', name: '交通出行', color: '#06b6d4', groupId: 'g_cat' },
  { id: 't_play', name: '休闲娱乐', color: '#d946ef', groupId: 'g_cat' },

  // 成员
  { id: 't_me', name: '我', color: '#fcd34d', groupId: 'g_member' },
  { id: 't_partner', name: '伴侣', color: '#ec4899', groupId: 'g_member' },
];

export const COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', 
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
  '#6366f1', '#14b8a6', '#f43f5e', '#d946ef'
];