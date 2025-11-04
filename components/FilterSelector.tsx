import React from 'react';
import { Filter } from '../types';

interface FilterSelectorProps {
  onApplyFilter: (filter: Filter) => void;
  isLoading: boolean;
}

const filters: { name: string; type: Filter }[] = [
    { name: 'Grayscale', type: 'grayscale' },
    { name: 'Sepia', type: 'sepia' },
    { name: 'Invert', type: 'invert' },
    { name: 'Vintage', type: 'vintage' },
    { name: 'Cool', type: 'cool' },
    { name: 'Warm', type: 'warm' },
];

export const FilterSelector: React.FC<FilterSelectorProps> = ({ onApplyFilter, isLoading }) => {
  return (
    <div className="w-full animate-fade-in">
        <div className="w-full overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex justify-start sm:justify-center space-x-2 p-1 whitespace-nowrap">
            {filters.map((filter) => (
                <button
                key={filter.type}
                onClick={() => onApplyFilter(filter.type)}
                disabled={isLoading}
                className="px-3 py-2 text-xs sm:px-4 sm:text-sm font-semibold rounded-full transition-all duration-200 capitalize bg-white/10 text-gray-200 hover:bg-white/20 backdrop-blur-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                {filter.name}
                </button>
            ))}
            </div>
      </div>
    </div>
  );
};