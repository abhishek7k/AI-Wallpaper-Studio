
import React from 'react';
import { View } from '../types';
import { GenerateIcon } from './icons/GenerateIcon';
import { EditIcon } from './icons/EditIcon';
import { AnalyzeIcon } from './icons/AnalyzeIcon';

interface BottomNavBarProps {
  currentView: View;
  setView: (view: View) => void;
}

const NavItem: React.FC<{
  label: string;
  view: View;
  currentView: View;
  setView: (view: View) => void;
  children: React.ReactNode;
}> = ({ label, view, currentView, setView, children }) => {
  const isActive = currentView === view;
  return (
    <button
      onClick={() => setView(view)}
      className={`flex-1 flex flex-col items-center justify-center p-2 transition-colors duration-200 ${
        isActive ? 'text-indigo-400' : 'text-gray-400 hover:text-indigo-300'
      }`}
    >
      {children}
      <span className={`text-xs mt-1 font-medium ${isActive ? 'text-indigo-400' : 'text-gray-300'}`}>
        {label}
      </span>
    </button>
  );
};

export const BottomNavBar: React.FC<BottomNavBarProps> = ({ currentView, setView }) => {
  return (
    <nav className="w-full max-w-sm h-16 bg-black/20 backdrop-blur-lg border border-white/10 rounded-full flex justify-around">
      <NavItem label="Generate" view={View.GENERATE} currentView={currentView} setView={setView}>
        <GenerateIcon />
      </NavItem>
      <NavItem label="Edit" view={View.EDIT} currentView={currentView} setView={setView}>
        <EditIcon />
      </NavItem>
      <NavItem label="Analyze" view={View.ANALYZE} currentView={currentView} setView={setView}>
        <AnalyzeIcon />
      </NavItem>
    </nav>
  );
};