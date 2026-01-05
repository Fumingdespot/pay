import React, { useState, useEffect } from 'react';
import { Tag, TagGroup, Transaction, TagWeight } from '../types';
import { Calculator } from './Calculator';
import { Icons } from './Icon';

interface TransactionFormProps {
  groups: TagGroup[];
  tags: Tag[];
  initialData?: Transaction; // 新增：初始数据用于编辑
  onSave: (t: Omit<Transaction, 'id'>) => void;
  onCancel: () => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  groups, tags, initialData, onSave, onCancel
}) => {
  const [amount, setAmount] = useState('0');
  const [description, setDescription] = useState('');
  const [tagWeights, setTagWeights] = useState<TagWeight[]>([]);
  const [step, setStep] = useState<'amount' | 'details'>('amount');

  // 初始化编辑数据
  useEffect(() => {
    if (initialData) {
      setAmount(initialData.amount.toString());
      setDescription(initialData.description);
      setTagWeights(initialData.tagWeights);
      // 编辑模式通常直接进入详情页，或者可以根据需要选择进入金额页
      setStep('details');
    }
  }, [initialData]);

  const toggleTag = (tagId: string, group: TagGroup) => {
    const isAlreadySelected = tagWeights.some(tw => tw.tagId === tagId);
    let newWeights = [...tagWeights];
    
    if (isAlreadySelected) {
      newWeights = newWeights.filter(tw => tw.tagId !== tagId);
    } else {
      if (group.isSingleSelect) {
        const groupTagIds = tags.filter(t => t.groupId === group.id).map(t => t.id);
        newWeights = newWeights.filter(tw => !groupTagIds.includes(tw.tagId));
      }
      newWeights.push({ tagId, weight: 1 });
    }

    // 自动平衡权重
    groups.forEach(g => {
      const tagsInGroup = newWeights.filter(tw => tags.find(t => t.id === tw.tagId)?.groupId === g.id);
      if (tagsInGroup.length > 0) {
        const equalWeight = 1 / tagsInGroup.length;
        newWeights = newWeights.map(tw => {
          const tagObj = tags.find(t => t.id === tw.tagId);
          if (tagObj?.groupId === g.id) return { ...tw, weight: equalWeight };
          return tw;
        });
      }
    });
    setTagWeights(newWeights);
  };

  const updateWeight = (tagId: string, value: number) => {
    const tag = tags.find(t => t.id === tagId);
    if (!tag) return;
    const siblingTagWeights = tagWeights.filter(tw => {
      const siblingTag = tags.find(t => t.id === tw.tagId);
      return siblingTag?.groupId === tag.groupId && tw.tagId !== tagId;
    });
    if (siblingTagWeights.length === 0) return;
    const remainingWeight = 1 - value;
    const currentSiblingsSum = siblingTagWeights.reduce((sum, tw) => sum + tw.weight, 0);
    const newWeights = tagWeights.map(tw => {
      if (tw.tagId === tagId) return { ...tw, weight: value };
      const siblingTag = tags.find(t => t.id === tw.tagId);
      if (siblingTag?.groupId === tag.groupId) {
        const ratio = currentSiblingsSum > 0 ? tw.weight / currentSiblingsSum : 1 / siblingTagWeights.length;
        return { ...tw, weight: remainingWeight * ratio };
      }
      return tw;
    });
    setTagWeights(newWeights);
  };

  const handleSave = () => {
    if (parseFloat(amount) === 0) return;
    onSave({
      amount: parseFloat(amount),
      description: description || '日常支出',
      date: initialData ? initialData.date : new Date().toISOString(),
      tagWeights: tagWeights,
      type: 'expense'
    });
  };

  if (step === 'amount') {
    return (
      <div className="flex flex-col h-full bg-white">
        <div className="flex-1 flex flex-col justify-center items-center p-8">
          <span className="text-gray-400 mb-2 font-black tracking-widest text-[10px] uppercase">
            {initialData ? '修改金额' : '请输入金额'}
          </span>
          <div className="text-6xl font-black text-slate-800 flex items-baseline tracking-tighter">
            <span className="text-2xl mr-2 font-normal text-gray-300">¥</span>
            {amount}
          </div>
        </div>
        <div className="p-4 bg-gray-50 border-t border-gray-100">
            <button 
                onClick={() => setStep('details')}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-lg shadow-xl mb-4 active:scale-[0.98] transition-all"
            >
                {initialData ? '确认修改并继续' : '确认金额并继续'}
            </button>
            <button onClick={onCancel} className="w-full text-gray-400 font-bold py-2 text-sm">取消返回</button>
        </div>
        <Calculator value={amount} onChange={setAmount} onDone={() => setStep('details')} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white p-4 shadow-sm z-10 sticky top-0 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setStep('amount')} className="p-2 -ml-2 text-gray-400 active:scale-90 transition-transform">
            <Icons.ChevronLeft size={24} />
          </button>
          <span className="font-black text-lg text-slate-800">
            {initialData ? '修改账目' : '记账详情'}
          </span>
          <button onClick={handleSave} className="text-blue-600 font-black p-2 active:scale-90 transition-transform">
            {initialData ? '完成' : '保存'}
          </button>
        </div>
        
        <div className="flex items-center space-x-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest">金额</span>
            <span className="font-black text-xl text-slate-800">¥{amount}</span>
          </div>
          <div className="h-10 w-px bg-gray-200 mx-1"></div>
          <input
            type="text"
            placeholder="这笔钱花在哪了?"
            className="flex-1 bg-transparent outline-none text-slate-700 font-bold placeholder:text-gray-300"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            autoFocus
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {groups.map(group => {
          const groupTags = tags.filter(t => t.groupId === group.id);
          const selectedInGroup = tagWeights.filter(tw => groupTags.some(gt => gt.id === tw.tagId));
          
          return (
            <div key={group.id} className="space-y-3">
              <div className="flex justify-between items-end px-1">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">{group.name}</h3>
                {group.allowWeight && selectedInGroup.length > 1 && (
                  <span className="text-[9px] bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-black animate-pulse">自定义分摊已开启</span>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2">
                {groupTags.map(tag => {
                  const weightData = tagWeights.find(tw => tw.tagId === tag.id);
                  const isSelected = !!weightData;
                  return (
                    <button
                      key={tag.id}
                      onClick={() => toggleTag(tag.id, group)}
                      className={`
                        px-4 py-2 rounded-xl text-sm font-bold transition-all border relative overflow-hidden
                        ${isSelected 
                          ? 'bg-slate-900 text-white border-slate-900 shadow-lg scale-105' 
                          : 'bg-white text-gray-500 border-gray-100 active:bg-gray-100'
                        }
                      `}
                    >
                      {tag.name}
                      {isSelected && weightData.weight < 1 && (
                        <span className="ml-2 text-[10px] opacity-60">{(weightData.weight * 100).toFixed(0)}%</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {group.allowWeight && selectedInGroup.length > 1 && (
                <div className="bg-white p-4 rounded-2xl border border-gray-100 space-y-4 shadow-sm">
                  {selectedInGroup.map(tw => {
                    const tagObj = tags.find(t => t.id === tw.tagId);
                    return (
                      <div key={tw.tagId} className="space-y-1">
                        <div className="flex justify-between text-[11px] font-black text-slate-500 uppercase">
                          <span>{tagObj?.name}</span>
                          <span className="text-blue-600">{(tw.weight * 100).toFixed(0)}%</span>
                        </div>
                        <input 
                          type="range" min="0" max="1" step="0.01" value={tw.weight}
                          onChange={(e) => updateWeight(tw.tagId, parseFloat(e.target.value))}
                          className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="p-4 bg-white border-t border-gray-100 pb-safe">
        <button 
          onClick={handleSave}
          disabled={parseFloat(amount) === 0}
          className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black shadow-xl flex items-center justify-center space-x-2 active:scale-95 transition-all disabled:opacity-30"
        >
          <Icons.Check size={20} />
          <span>{initialData ? '保存修改记录' : '确认保存记录'}</span>
        </button>
      </div>
    </div>
  );
};