import React from 'react';
import { Icons } from './Icon';

interface CalculatorProps {
  value: string;
  onChange: (val: string) => void;
  onDone: () => void;
}

export const Calculator: React.FC<CalculatorProps> = ({ value, onChange, onDone }) => {
  const handlePress = (key: string) => {
    if (key === 'backspace') {
      onChange(value.slice(0, -1) || '0');
    } else if (key === '.') {
      if (!value.includes('.')) onChange(value + '.');
    } else {
      onChange(value === '0' ? key : value + key);
    }
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'backspace'];

  return (
    <div className="grid grid-cols-3 gap-3 p-4 bg-gray-50 rounded-t-2xl">
      {keys.map((k) => (
        <button
          key={k}
          onClick={() => handlePress(k)}
          className="h-14 bg-white rounded-xl shadow-sm text-xl font-semibold text-slate-700 active:bg-gray-100 flex items-center justify-center"
        >
          {k === 'backspace' ? <Icons.Trash2 size={20} /> : k}
        </button>
      ))}
    </div>
  );
};
