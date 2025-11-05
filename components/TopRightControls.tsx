import React from 'react';
import { UndoIcon } from './icons/UndoIcon';
import { RedoIcon } from './icons/RedoIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { View } from '../types';

interface TopRightControlsProps {
  onUndo: () => void;
  onRedo: () => void;
  onDownload: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isLoading: boolean;
  view: View;
}

export const TopRightControls: React.FC<TopRightControlsProps> = ({
  onUndo,
  onRedo,
  onDownload,
  canUndo,
  canRedo,
  isLoading,
  view,
}) => {
  return (
    <div className="absolute top-20 right-4 z-40 flex items-center gap-2">
      {view === View.EDIT && (
        <>
          <button
            onClick={onUndo}
            disabled={!canUndo || isLoading}
            className="p-2 bg-black/30 backdrop-blur-md rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black/50 transition-colors"
            aria-label="Undo"
          >
            <UndoIcon />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo || isLoading}
            className="p-2 bg-black/30 backdrop-blur-md rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black/50 transition-colors"
            aria-label="Redo"
          >
            <RedoIcon />
          </button>
        </>
      )}
      <button
        onClick={onDownload}
        disabled={isLoading}
        className="p-2 bg-black/30 backdrop-blur-md rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black/50 transition-colors"
        aria-label="Download"
      >
        <DownloadIcon />
      </button>
    </div>
  );
};