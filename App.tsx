import React, { useState, useEffect, useMemo } from 'react';
import { NavBar } from './components/NavBar';
import { TransactionForm } from './components/TransactionForm';
import { Analytics } from './components/Analytics';
import { Settings } from './components/Settings';
import { Icons } from './components/Icon';
import { Transaction, Tag, TagGroup, ViewState } from './types';
import { INITIAL_GROUPS, INITIAL_TAGS } from './constants';
import { generateInsight } from './services/geminiService';

const App = () => {
  const [view, setView] = useState<ViewState>('dashboard');
  
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('flexi_transactions');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [tags, setTags] = useState<Tag[]>(() => {
    const saved = localStorage.getItem('flexi_tags');
    return saved ? JSON.parse(saved) : INITIAL_TAGS;
  });

  const [groups, setGroups] = useState<TagGroup[]>(() => {
    const saved = localStorage.getItem('flexi_groups');
    return saved ? JSON.parse(saved) : INITIAL_GROUPS;
  });

  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportRange, setExportRange] = useState({ 
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

  const [insight, setInsight] = useState<string>('');
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    localStorage.setItem('flexi_transactions', JSON.stringify(transactions));
  }, [transactions]);
  
  useEffect(() => {
    localStorage.setItem('flexi_tags', JSON.stringify(tags));
    localStorage.setItem('flexi_groups', JSON.stringify(groups));
  }, [tags, groups]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === currentDate.getFullYear() && 
             d.getMonth() === currentDate.getMonth();
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, currentDate]);

  const monthTotal = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => acc + t.amount, 0);
  }, [filteredTransactions]);

  const handleSaveTransaction = (t: Omit<Transaction, 'id'>) => {
    if (editingTransaction) {
      const updated = transactions.map(item => 
        item.id === editingTransaction.id ? { ...t, id: editingTransaction.id } : item
      );
      setTransactions(updated);
      setEditingTransaction(null);
    } else {
      const newTransaction: Transaction = { ...t, id: Date.now().toString() };
      setTransactions([newTransaction, ...transactions]);
    }
    setView('dashboard');
  };

  const handleEdit = (t: Transaction) => {
    setEditingTransaction(t);
    setView('add'); 
  };

  const executeDelete = (id: string) => {
    setTransactions(transactions.filter(t => t.id !== id));
    setConfirmingDeleteId(null);
  };

  const changeMonth = (offset: number) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1);
    setCurrentDate(newDate);
  };

  const handleExportCSV = () => {
    const start = new Date(exportRange.start).getTime();
    const end = new Date(exportRange.end).getTime() + 86400000;

    const toExport = transactions.filter(t => {
      const time = new Date(t.date).getTime();
      return time >= start && time <= end;
    });

    if (toExport.length === 0) {
      alert('所选范围内没有数据');
      return;
    }

    let csv = '\uFEFF日期,描述,金额,分类详情\n';
    toExport.forEach(t => {
      const detailStr = t.tagWeights.map(tw => {
        const tag = tags.find(tag => tag.id === tw.tagId);
        return `${tag?.name || '未知'}(${(tw.weight * 100).toFixed(0)}%)`;
      }).join(' | ');
      csv += `${new Date(t.date).toLocaleDateString()},${t.description},${t.amount},"${detailStr}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `账单导出_${exportRange.start}_至_${exportRange.end}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportModal(false);
  };

  const fetchInsight = async () => {
    setLoadingInsight(true);
    const text = await generateInsight(transactions, tags);
    setInsight(text);
    setLoadingInsight(false);
  };

  const renderContent = () => {
    if (view === 'add') {
      return (
        <TransactionForm 
          groups={groups} 
          tags={tags} 
          initialData={editingTransaction || undefined}
          onSave={handleSaveTransaction} 
          onCancel={() => {
              setView('dashboard');
              setEditingTransaction(null);
          }} 
        />
      );
    }

    if (view === 'analytics') {
      return <Analytics transactions={transactions} tags={tags} groups={groups} setView={setView} />;
    }

    if (view === 'settings') {
      return (
        <Settings 
          groups={groups} 
          tags={tags} 
          setGroups={setGroups} 
          setTags={setTags} 
          onBack={() => setView('dashboard')} 
        />
      );
    }

    return (
      <div className="flex flex-col h-full bg-gray-50 relative">
        <div className="bg-white p-6 pb-6 rounded-b-[3rem] shadow-sm z-10 border-b border-gray-100">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tighter">自由分摊记账</h1>
                    <div className="flex items-center mt-1 space-x-2">
                        <button onClick={() => changeMonth(-1)} className="p-1 text-gray-400 active:scale-90"><Icons.ChevronLeft size={16}/></button>
                        <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">
                            {currentDate.getFullYear()}年 {currentDate.getMonth() + 1}月
                        </span>
                        <button onClick={() => changeMonth(1)} className="p-1 text-gray-400 active:scale-90"><Icons.ChevronRight size={16}/></button>
                    </div>
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => setShowExportModal(true)}
                    className="p-3 bg-gray-50 rounded-2xl text-slate-400 active:bg-gray-100 border border-gray-100"
                  >
                    <Icons.Download size={18} />
                  </button>
                  <button 
                    onClick={() => setView('settings')}
                    className="p-3 bg-gray-50 rounded-2xl text-slate-400 active:bg-gray-100 border border-gray-100"
                  >
                    <Icons.Settings size={18} />
                  </button>
                  <button 
                    onClick={fetchInsight}
                    disabled={loadingInsight}
                    className="p-3 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl shadow-lg active:scale-95 transition-all"
                  >
                    <Icons.Sparkles size={18} className={loadingInsight ? 'animate-spin' : ''} />
                  </button>
                </div>
            </div>
            
            {insight && (
              <div className="bg-blue-50/50 text-blue-700 text-[10px] p-3 rounded-2xl mb-4 border border-blue-100 flex items-start space-x-2">
                 <span className="mt-0.5">💡</span>
                 <p className="font-bold">{insight}</p>
              </div>
            )}

            <div className="bg-slate-900 text-white p-6 rounded-[2.2rem] shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12"></div>
                <span className="text-slate-500 text-[9px] font-black uppercase tracking-[0.2em]">
                    {currentDate.getMonth() + 1}月累计支出
                </span>
                <div className="text-3xl font-black mt-1 flex items-baseline tracking-tighter">
                    <span className="text-lg mr-1.5 font-normal text-slate-500">¥</span>
                    {monthTotal.toLocaleString()}
                </div>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-28">
            <div className="flex justify-between items-center px-2 mt-2">
                 <h3 className="font-black text-gray-300 text-[10px] uppercase tracking-[0.3em]">账目明细</h3>
                 <span className="text-[10px] font-bold text-gray-400">{filteredTransactions.length} 笔记录</span>
            </div>
            
            {filteredTransactions.length === 0 ? (
                <div className="text-center py-20 text-gray-300">
                    <div className="bg-white/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-gray-200">
                        <Icons.Wallet size={24} strokeWidth={1.5} className="opacity-20" />
                    </div>
                    <p className="font-bold text-xs text-gray-400 tracking-wider">本月暂无收支记录</p>
                </div>
            ) : (
                filteredTransactions.map(t => (
                    <div key={t.id} className="bg-white p-5 rounded-[1.8rem] shadow-sm border border-gray-100 flex flex-col transition-all overflow-hidden relative active:bg-gray-50/50">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex-1 min-w-0">
                                <h4 className="font-black text-slate-800 text-base truncate pr-2">{t.description}</h4>
                                <p className="text-[9px] font-bold text-gray-300 uppercase mt-0.5 tracking-wider">{new Date(t.date).toLocaleDateString()}</p>
                            </div>
                            <span className="font-black text-slate-900 text-lg tracking-tight">-¥{t.amount.toLocaleString()}</span>
                        </div>
                        
                        <div className="flex flex-wrap gap-1.5 pt-3 border-t border-gray-50 items-center">
                            {t.tagWeights.map(tw => {
                                const tag = tags.find(tag => tag.id === tw.tagId);
                                if (!tag) return null;
                                return (
                                    <div key={tag.id} className="flex items-center space-x-1.5 px-2 py-1 rounded-lg bg-gray-50 border border-gray-100">
                                        <div className="w-1 h-1 rounded-full" style={{ backgroundColor: tag.color }}></div>
                                        <span className="text-[9px] font-black text-slate-600">{tag.name}</span>
                                        {tw.weight < 1 && (
                                          <span className="text-[8px] text-blue-600 font-black bg-blue-50 px-1 rounded-sm">{(tw.weight * 100).toFixed(0)}%</span>
                                        )}
                                    </div>
                                );
                            })}
                            
                            <div className="ml-auto flex items-center space-x-1">
                                {confirmingDeleteId === t.id ? (
                                    <div className="flex items-center animate-in slide-in-from-right-2 bg-red-50 rounded-xl p-0.5 border border-red-100" onClick={(e) => e.stopPropagation()}>
                                        <button 
                                            onClick={() => setConfirmingDeleteId(null)}
                                            className="px-2 py-1 text-[9px] font-bold text-gray-400"
                                        >
                                            取消
                                        </button>
                                        <button 
                                            onClick={() => executeDelete(t.id)}
                                            className="px-2 py-1 text-[9px] font-black bg-red-500 text-white rounded-lg shadow-sm"
                                        >
                                            确定
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleEdit(t); }} 
                                            className="p-2 text-blue-400 active:scale-125 transition-transform"
                                        >
                                            <Icons.Edit2 size={14} />
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setConfirmingDeleteId(t.id); }} 
                                            className="p-2 text-red-300 active:scale-125 transition-transform"
                                        >
                                            <Icons.Trash2 size={14} />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>

        {showExportModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
                <div className="bg-white w-full rounded-[2.5rem] p-6 shadow-2xl animate-in zoom-in-95">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-black text-lg text-slate-800 tracking-tight">导出账单数据</h3>
                        <button onClick={() => setShowExportModal(false)} className="text-gray-300 p-1"><Icons.X size={24}/></button>
                    </div>
                    
                    <div className="space-y-4 mb-8">
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-1">开始日期</label>
                            <input 
                                type="date" 
                                value={exportRange.start}
                                onChange={e => setExportRange({...exportRange, start: e.target.value})}
                                className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl outline-none font-bold text-slate-700"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-1">结束日期</label>
                            <input 
                                type="date" 
                                value={exportRange.end}
                                onChange={e => setExportRange({...exportRange, end: e.target.value})}
                                className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl outline-none font-bold text-slate-700"
                            />
                        </div>
                    </div>

                    <button 
                        onClick={handleExportCSV}
                        className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black shadow-xl flex items-center justify-center space-x-2 active:scale-95 transition-all"
                    >
                        <Icons.Download size={18} />
                        <span>生成并下载 CSV</span>
                    </button>
                    <p className="text-center text-[10px] text-gray-300 mt-4 font-bold">CSV 格式兼容 Excel, 方便后续统计</p>
                </div>
            </div>
        )}

        <NavBar currentView={view} setView={setView} />
      </div>
    );
  };

  return (
    <div className="h-full w-full max-w-md mx-auto bg-gray-50 shadow-2xl overflow-hidden relative font-sans">
        {renderContent()}
    </div>
  );
};

export default App;