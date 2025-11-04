import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="p-3 px-6 text-center bg-black/30 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg">
      <h1 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
        AI Wallpaper Studio
      </h1>
    </header>
  );
};