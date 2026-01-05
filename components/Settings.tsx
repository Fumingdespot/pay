import React, { useState } from 'react';
import { TagGroup, Tag } from '../types';
import { Icons } from './Icon';
import { COLORS } from '../constants';

interface SettingsProps {
  groups: TagGroup[];
  tags: Tag[];
  setGroups: (groups: TagGroup[]) => void;
  setTags: (tags: Tag[]) => void;
  onBack: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ 
  groups, tags, setGroups, setTags, onBack 
}) => {
  const [activeGroupId, setActiveGroupId] = useState<string>(groups[0]?.id || '');
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');

  // 新增：维度删除的二次确认状态
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleAddGroup = () => {
    if (!newGroupName.trim()) return;
    const newGroup: TagGroup = {
      id: `g_${Date.now()}`,
      name: newGroupName,
      isSingleSelect: true,
      allowWeight: true 
    };
    setGroups([...groups, newGroup]);
    setNewGroupName('');
    setIsAddingGroup(false);
    setActiveGroupId(newGroup.id);
  };

  const executeDeleteGroup = (id: string) => {
    // 1. 准备新数据
    const updatedGroups = groups.filter(g => g.id !== id);
    const updatedTags = tags.filter(t => t.groupId !== id);
    
    // 2. 更新父组件状态
    setGroups(updatedGroups);
    setTags(updatedTags);
    
    // 3. 处理当前激活项的回退逻辑
    if (activeGroupId === id) {
      if (updatedGroups.length > 0) {
        setActiveGroupId(updatedGroups[0].id);
      } else {
        setActiveGroupId('');
      }
    }
    
    // 4. 重置确认状态
    setConfirmDeleteId(null);
  };

  const handleAddTag = () => {
    if (!newTagName.trim() || !activeGroupId) return;
    const newTag: Tag = {
      id: `t_${Date.now()}`,
      name: newTagName,
      groupId: activeGroupId,
      color: COLORS[Math.floor(Math.random() * COLORS.length)]
    };
    setTags([...tags, newTag]);
    setNewTagName('');
    setIsAddingTag(false);
  };

  const handleDeleteTag = (id: string) => {
    const updatedTags = tags.filter(t => t.id !== id);
    setTags(updatedTags);
  };

  const activeGroup = groups.find(g => g.id === activeGroupId);
  const activeTags = tags.filter(t => t.groupId === activeGroupId);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* 顶部标题栏 */}
      <div className="bg-white p-4 shadow-sm z-10 flex items-center justify-between border-b border-gray-100">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-600 active:scale-90 transition-transform">
          <Icons.ChevronLeft size={24} />
        </button>
        <span className="font-black text-lg text-slate-800 tracking-tight">维度与标签配置</span>
        <div className="w-8" />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* 左侧维度列表 */}
        <div className="w-1/3 bg-white border-r border-gray-100 flex flex-col">
          <div className="p-3 bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
            透视维度
          </div>
          <div className="flex-1 overflow-y-auto hide-scrollbar">
            {groups.map(g => (
              <button
                key={g.id}
                onClick={() => {
                    setActiveGroupId(g.id);
                    setConfirmDeleteId(null); // 切换时重置确认状态
                }}
                className={`w-full text-left p-4 text-xs font-black border-b border-gray-50 relative transition-all ${
                  activeGroupId === g.id ? 'bg-blue-50 text-blue-700' : 'text-slate-400 active:bg-gray-50'
                }`}
              >
                {g.name}
                {activeGroupId === g.id && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600" />
                )}
              </button>
            ))}
            
            {isAddingGroup ? (
              <div className="p-3 border-b border-gray-100 bg-blue-50/30">
                <input 
                  autoFocus className="w-full text-xs border border-blue-200 p-2 rounded-lg mb-2 outline-none shadow-inner"
                  placeholder="维度名称" value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                />
                <div className="flex justify-between px-1">
                  <button onClick={() => setIsAddingGroup(false)} className="text-[10px] text-gray-400 font-bold">取消</button>
                  <button onClick={handleAddGroup} className="text-[10px] text-blue-600 font-black">确认</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setIsAddingGroup(true)} className="w-full p-5 flex items-center justify-center text-gray-300 hover:text-blue-500 active:scale-90 transition-transform">
                <Icons.Plus size={20} />
              </button>
            )}
          </div>
        </div>

        {/* 右侧标签详情 */}
        <div className="flex-1 bg-gray-50 flex flex-col">
          {activeGroup ? (
            <>
              {/* 右侧头部：包含删除逻辑 */}
              <div className="p-4 flex justify-between items-center border-b border-gray-100 bg-white">
                 <div className="flex flex-col">
                    <span className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em]">当前配置项</span>
                    <span className="text-sm font-black text-slate-800 tracking-tight truncate max-w-[120px]">
                        「{activeGroup.name}」
                    </span>
                 </div>
                 
                 {/* 二次确认删除逻辑 UI */}
                 {confirmDeleteId === activeGroup.id ? (
                    <div className="flex items-center space-x-1 animate-in fade-in slide-in-from-right-2">
                        <button 
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-3 py-1.5 text-[10px] font-bold text-gray-400 hover:bg-gray-100 rounded-lg"
                        >
                            取消
                        </button>
                        <button 
                            onClick={() => executeDeleteGroup(activeGroup.id)}
                            className="px-3 py-1.5 text-[10px] font-black bg-red-500 text-white rounded-lg shadow-sm active:scale-95"
                        >
                            确认删除
                        </button>
                    </div>
                 ) : (
                    <button 
                        onClick={() => setConfirmDeleteId(activeGroup.id)} 
                        className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-90"
                        title="删除整个维度"
                    >
                        <Icons.Trash2 size={18} />
                    </button>
                 )}
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {activeTags.length === 0 && !isAddingTag && (
                    <div className="text-center py-20 text-gray-300 flex flex-col items-center">
                        <Icons.Tag size={48} className="opacity-10 mb-3" />
                        <p className="text-[11px] font-black tracking-widest uppercase">该维度下暂无标签项</p>
                    </div>
                )}
                
                {activeTags.map(tag => (
                  <div key={tag.id} className="bg-white p-4 pr-2 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between animate-in slide-in-from-bottom-2 fade-in">
                    <div className="flex items-center space-x-3">
                      <div className="w-3.5 h-3.5 rounded-full shadow-inner" style={{ backgroundColor: tag.color }} />
                      <span className="text-slate-800 font-black text-sm">{tag.name}</span>
                    </div>
                    <button 
                        onClick={() => handleDeleteTag(tag.id)} 
                        className="p-3 text-red-400 hover:text-red-600 active:scale-110 transition-all"
                    >
                      <Icons.Trash2 size={16} />
                    </button>
                  </div>
                ))}

                {isAddingTag ? (
                  <div className="bg-white p-4 rounded-2xl shadow-xl border-2 border-blue-100 animate-in zoom-in-95">
                    <input 
                      autoFocus className="w-full text-sm font-black outline-none mb-4 text-slate-800 p-2 border-b-2 border-blue-50"
                      placeholder="输入标签名称..." value={newTagName}
                      onChange={e => setNewTagName(e.target.value)}
                    />
                    <div className="flex justify-end space-x-5 px-1">
                       <button onClick={() => setIsAddingTag(false)} className="text-xs font-bold text-gray-400">取消</button>
                       <button onClick={handleAddTag} className="text-xs font-black text-blue-600">确认添加</button>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => setIsAddingTag(true)}
                    className="w-full py-5 border-2 border-dashed border-gray-200 rounded-2xl text-gray-300 flex items-center justify-center hover:border-blue-200 hover:text-blue-400 transition-all active:scale-[0.98] mt-2"
                  >
                    <Icons.PlusCircle size={20} className="mr-2" />
                    <span className="text-xs font-black tracking-widest uppercase">新增标签项</span>
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
              <Icons.Settings size={64} className="text-gray-100 mb-4" />
              <p className="text-gray-400 font-bold text-sm">请从左侧选择一个维度进行编辑</p>
              <p className="text-gray-300 text-[10px] mt-2 leading-relaxed">如果没有可选维度，请先点击「+」创建一个新统计维度</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};