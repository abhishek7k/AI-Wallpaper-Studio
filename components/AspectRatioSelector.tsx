import React from 'react';
import { AspectRatio, aspectRatios } from '../types';

interface AspectRatioSelectorProps {
  selected: AspectRatio;
  onSelect: (aspectRatio: AspectRatio) => void;
  customWidth: number;
  customHeight: number;
  setCustomWidth: (width: number) => void;
  setCustomHeight: (height: number) => void;
}

export const AspectRatioSelector: React.FC<AspectRatioSelectorProps> = ({ 
  selected, onSelect, customWidth, customHeight, setCustomWidth, setCustomHeight 
}) => {
  return (
    <div className="w-full bg-black/20 backdrop-blur-lg border border-white/10 p-2 rounded-2xl shadow-lg animate-fade-in">
      <div className="w-full overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex justify-start sm:justify-center space-x-2 p-1 whitespace-nowrap">
          {aspectRatios.map((ratio) => (
            <button
              key={ratio}
              onClick={() => onSelect(ratio)}
              className={`px-3 py-2 text-xs sm:px-4 sm:text-sm font-semibold rounded-full transition-all duration-200 capitalize backdrop-blur-md ${
                selected === ratio
                  ? 'bg-indigo-500/60 text-white shadow-lg'
                  : 'bg-white/10 text-gray-200 hover:bg-white/20'
              }`}
            >
              {ratio}
            </button>
          ))}
        </div>
      </div>
      {selected === 'custom' && (
        <div className="mt-3 flex items-center justify-center space-x-2 animate-fade-in max-w-full p-2 bg-black/20 backdrop-blur-lg rounded-full">
           <p className="text-xs text-gray-300 whitespace-nowrap pl-2">
            Resolution:
          </p>
          <input
            type="number"
            value={customWidth}
            onChange={(e) => setCustomWidth(parseInt(e.target.value, 10) || 0)}
            placeholder="Width"
            className="w-20 bg-white/10 text-white text-center rounded-full p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Custom Width"
          />
          <span className="text-gray-400">x</span>
          <input
            type="number"
            value={customHeight}
            onChange={(e) => setCustomHeight(parseInt(e.target.value, 10) || 0)}
            placeholder="Height"
            className="w-20 bg-white/10 text-white text-center rounded-full p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Custom Height"
          />
        </div>
      )}
       {selected !== 'custom' && selected !== '16:9' && selected !== '9:16' && (
         <p className="text-xs text-gray-400 text-center mt-2">
            Note: The AI will generate at the closest supported aspect ratio.
          </p>
       )}
    </div>
  );
};