import React, { useMemo, useState, useEffect } from 'react';
import { Transaction, Tag, TagGroup, ViewState } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { COLORS } from '../constants';
import { Icons } from './Icon';

interface AnalyticsProps {
  transactions: Transaction[];
  tags: Tag[];
  groups: TagGroup[];
  setView: (view: ViewState) => void;
}

export const Analytics: React.FC<AnalyticsProps> = ({ transactions, tags, groups, setView }) => {
  const [primaryGroupId, setPrimaryGroupId] = useState<string>(() => {
    return groups.find(g => g.name.includes('类目'))?.id || groups[0]?.id || '';
  });
  
  const [filterTagId, setFilterTagId] = useState<string | null>(null);

  useEffect(() => {
    const currentFilterTag = tags.find(t => t.id === filterTagId);
    if (currentFilterTag && currentFilterTag.groupId === primaryGroupId) {
      setFilterTagId(null);
    }
  }, [primaryGroupId, filterTagId, tags]);

  const filterTag = tags.find(t => t.id === filterTagId);
  const primaryGroup = groups.find(g => g.id === primaryGroupId);

  const processedData = useMemo(() => {
    const dataMap: Record<string, number> = {};
    let total = 0;

    transactions.forEach(t => {
      const filterWeight = filterTagId 
        ? (t.tagWeights.find(tw => tw.tagId === filterTagId)?.weight || 0)
        : 1;

      if (filterWeight <= 0) return;

      const effectiveAmount = t.amount * filterWeight;
      
      const primaryGroupTags = tags.filter(tag => tag.groupId === primaryGroupId);
      const groupTagWeights = t.tagWeights.filter(tw => 
        primaryGroupTags.some(pgt => pgt.id === tw.tagId)
      );

      if (groupTagWeights.length > 0) {
        groupTagWeights.forEach(tw => {
          const tagObj = tags.find(tag => tag.id === tw.tagId);
          const name = tagObj ? tagObj.name : '未命名';
          const weightedAmt = effectiveAmount * tw.weight;
          dataMap[name] = (dataMap[name] || 0) + weightedAmt;
          total += weightedAmt;
        });
      } else {
        const name = '未分类';
        dataMap[name] = (dataMap[name] || 0) + effectiveAmount;
        total += effectiveAmount;
      }
    });

    return {
      chart: Object.entries(dataMap)
        .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
        .sort((a, b) => b.value - a.value),
      total: Math.round(total * 100) / 100
    };
  }, [transactions, primaryGroupId, filterTagId, tags]);

  const availableFilterGroups = groups.filter(g => g.id !== primaryGroupId);

  const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 1.3;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.03) return null;

    return (
      <text 
        x={x} y={y} 
        fill="#64748b" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-[11px] font-black"
      >
        {`${name} ${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white shadow-sm sticky top-0 z-30 border-b border-gray-100">
        <div className="p-4 flex items-center">
             <button onClick={() => setView('dashboard')} className="mr-3 text-slate-400 p-1 active:scale-90 transition-transform">
                <Icons.ChevronLeft size={24} />
             </button>
             <div className="flex-1">
                <h2 className="text-xl font-black text-slate-800 tracking-tight leading-tight">加权支出透视</h2>
                <div className="flex items-center space-x-1.5 mt-1">
                    <span className="text-[10px] text-blue-600 font-black bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                        {filterTag ? `筛选：${filterTag.name}` : '全账单统计'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">按「{primaryGroup?.name}」展示</span>
                </div>
             </div>
        </div>
        
        <div className="pb-4 space-y-4">
            <div className="space-y-2">
                <div className="flex items-center space-x-1.5 px-5">
                    <Icons.PieChart size={12} className="text-slate-400" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">统计视角 (你想看什么的占比):</span>
                </div>
                <div 
                  className="overflow-x-auto hide-scrollbar touch-pan-x" 
                  style={{ WebkitOverflowScrolling: 'touch', maskImage: 'linear-gradient(to right, black 90%, transparent 100%)' }}
                >
                    <div className="flex items-center space-x-2 px-5 min-w-max">
                        {groups.map(g => (
                            <button
                                key={g.id}
                                onClick={() => setPrimaryGroupId(g.id)}
                                className={`px-5 py-2.5 rounded-2xl text-xs font-black border flex-shrink-0 transition-all duration-300 ${
                                    primaryGroupId === g.id 
                                    ? 'bg-slate-900 text-white border-slate-900 shadow-lg -translate-y-0.5' 
                                    : 'bg-white text-slate-400 border-gray-100 active:bg-gray-50'
                                }`}
                            >
                                {g.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex items-center space-x-1.5 px-5">
                    <Icons.Tag size={12} className="text-slate-400" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">分层滤镜 (筛选特定范围):</span>
                </div>
                <div 
                  className="overflow-x-auto hide-scrollbar touch-pan-x"
                  style={{ WebkitOverflowScrolling: 'touch', maskImage: 'linear-gradient(to right, black 92%, transparent 100%)' }}
                >
                    <div className="flex items-center space-x-2 px-5 min-w-max">
                        <button 
                            onClick={() => setFilterTagId(null)}
                            className={`px-5 py-2.5 rounded-2xl text-xs font-black border flex-shrink-0 transition-all ${
                                !filterTagId ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100' : 'bg-white text-slate-400 border-gray-100'
                            }`}
                        >
                            全部
                        </button>
                        {availableFilterGroups.map(group => (
                            <React.Fragment key={group.id}>
                                <div className="w-px h-5 bg-gray-200 mx-1 flex-shrink-0" />
                                {tags.filter(t => t.groupId === group.id).map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => setFilterTagId(filterTagId === t.id ? null : t.id)}
                                        className={`px-5 py-2.5 rounded-2xl text-xs font-black border flex-shrink-0 transition-all ${
                                            filterTagId === t.id 
                                            ? 'bg-blue-50 text-blue-700 border-blue-200 ring-2 ring-blue-100' 
                                            : 'bg-white text-slate-400 border-gray-100'
                                        }`}
                                    >
                                        {t.name}
                                    </button>
                                ))}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
        <div className="bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500 opacity-10 rounded-full -mr-24 -mt-24 blur-3xl"></div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">当前组合下加权总支出</p>
            <h3 className="text-4xl font-black text-white tracking-tighter">¥{processedData.total.toLocaleString()}</h3>
        </div>

        <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100">
            <h3 className="font-black text-slate-800 text-[10px] uppercase tracking-[0.2em] mb-8 flex items-center">
                <span className="w-1.5 h-4 bg-blue-600 rounded-full mr-2 shadow-sm shadow-blue-200"></span>
                加权分配占比
            </h3>
            
            <div className="w-full h-80">
                {processedData.chart.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={processedData.chart}
                                cx="50%"
                                cy="50%"
                                innerRadius={55}
                                outerRadius={90}
                                paddingAngle={6}
                                dataKey="value"
                                stroke="#fff"
                                strokeWidth={4}
                                cornerRadius={12}
                                label={renderPieLabel}
                                labelLine={{ stroke: '#e2e8f0', strokeWidth: 1 }}
                            >
                                {processedData.chart.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', fontSize: '12px' }}
                              itemStyle={{ fontWeight: '900', color: '#1e293b' }}
                              formatter={(value: number) => [`¥${value.toLocaleString()}`, '加权额']} 
                            />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex h-full items-center justify-center text-slate-200 flex-col space-y-4">
                        <Icons.PieChart size={64} strokeWidth={1} className="opacity-10" />
                        <span className="text-sm font-black tracking-widest text-slate-300">无匹配数据，请更换筛选组合</span>
                    </div>
                )}
            </div>
        </div>

        <div className="space-y-3">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] px-2 mb-2">明细清单</h4>
            {processedData.chart.map((item, idx) => (
                <div key={item.name} className="flex items-center justify-between bg-white p-5 rounded-[1.8rem] border border-gray-100 shadow-sm">
                    <div className="flex items-center space-x-4">
                        <div className="w-4 h-4 rounded-full shadow-inner" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                        <div>
                          <div className="text-sm font-black text-slate-800 tracking-tight">{item.name}</div>
                          <div className="text-[10px] font-bold text-slate-400">占比：{((item.value / (processedData.total || 1)) * 100).toFixed(1)}%</div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="font-black text-slate-900 text-lg tracking-tight">¥{item.value.toLocaleString()}</div>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};