import React from 'react';
import { Tag, TagGroup } from '../types';

interface TagSelectorProps {
  groups: TagGroup[];
  tags: Tag[];
  selectedTagIds: string[];
  onToggleTag: (tagId: string, group: TagGroup) => void;
}

export const TagSelector: React.FC<TagSelectorProps> = ({ 
  groups, tags, selectedTagIds, onToggleTag 
}) => {
  return (
    <div className="space-y-4 pb-4">
      {groups.map(group => {
        const groupTags = tags.filter(t => t.groupId === group.id);
        if (groupTags.length === 0) return null;

        return (
          <div key={group.id} className="space-y-2">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">
              {group.name}
            </h3>
            <div className="flex flex-wrap gap-2">
              {groupTags.map(tag => {
                const isSelected = selectedTagIds.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    onClick={() => onToggleTag(tag.id, group)}
                    className={`
                      px-3 py-1.5 rounded-full text-sm font-medium transition-all border
                      ${isSelected 
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105' 
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    {tag.name}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
