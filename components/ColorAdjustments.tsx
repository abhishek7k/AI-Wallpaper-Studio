import React from 'react';
import { EditSettings } from '../types';

interface ColorAdjustmentsProps {
  settings: EditSettings;
  onChange: (setting: keyof EditSettings, value: number) => void;
  onApply: () => void;
  onReset: () => void;
}

const Slider: React.FC<{
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onMouseUp: () => void;
}> = ({ label, value, min = 0, max = 200, onChange, onMouseUp }) => (
  <div className="flex-1 flex flex-col items-center">
    <label htmlFor={label} className="text-xs font-medium text-gray-300">
      {label}
    </label>
    <input
      id={label}
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={onChange}
      onMouseUp={onMouseUp}
      onTouchEnd={onMouseUp}
      className="w-full h-2 bg-gray-600/50 rounded-lg appearance-none cursor-pointer slider-thumb"
    />
     <style>{`
        .slider-thumb::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 16px;
            height: 16px;
            background: #818cf8;
            cursor: pointer;
            border-radius: 50%;
            border: 2px solid #1f2937;
        }
        .slider-thumb::-moz-range-thumb {
            width: 16px;
            height: 16px;
            background: #818cf8;
            cursor: pointer;
            border-radius: 50%;
            border: 2px solid #1f2937;
        }
    `}</style>
  </div>
);

export const ColorAdjustments: React.FC<ColorAdjustmentsProps> = ({ settings, onChange, onApply, onReset }) => {
  return (
    <div className="w-full bg-black/20 backdrop-blur-lg border border-white/10 p-3 rounded-2xl flex flex-col gap-3 animate-fade-in shadow-lg">
        <div className="flex items-center justify-between gap-4">
            <Slider
                label="Brightness"
                value={settings.brightness}
                onChange={(e) => onChange('brightness', parseInt(e.target.value))}
                onMouseUp={onApply}
            />
            <Slider
                label="Contrast"
                value={settings.contrast}
                onChange={(e) => onChange('contrast', parseInt(e.target.value))}
                onMouseUp={onApply}
            />
            <Slider
                label="Saturation"
                value={settings.saturation}
                onChange={(e) => onChange('saturation', parseInt(e.target.value))}
                onMouseUp={onApply}
            />
        </div>
        <button
            onClick={onReset}
            className="text-xs text-center text-indigo-400 hover:text-indigo-300 transition-colors"
        >
            Reset Colors
        </button>
    </div>
  );
};