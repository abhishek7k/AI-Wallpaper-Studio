import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="w-full text-center px-6 py-2 bg-black/20 backdrop-blur-lg border border-white/10 rounded-full shadow-lg">
      <h1 className="inline-block text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
        AI Wallpaper Studio
      </h1>
    </header>
  );
};