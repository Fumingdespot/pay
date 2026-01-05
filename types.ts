export interface Tag {
  id: string;
  name: string;
  color: string;
  groupId: string;
}

export interface TagGroup {
  id: string;
  name: string;
  isSingleSelect: boolean;
  allowWeight?: boolean; // New: indicates if this group allows splitting amounts by percentage
}

export interface TagWeight {
  tagId: string;
  weight: number; // 0 to 1 (percentage)
}

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  date: string;
  tagWeights: TagWeight[]; // Replaces simple tagIds
  type: 'expense' | 'income';
}

export type ViewState = 'dashboard' | 'add' | 'analytics' | 'settings';

export interface DateRange {
  start: Date;
  end: Date;
}