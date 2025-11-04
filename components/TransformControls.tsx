import React from 'react';
import { RotateIcon } from './icons/RotateIcon';
import { CropIcon } from './icons/CropIcon';
import { UpscaleIcon } from './icons/UpscaleIcon';
import { ReimagineIcon } from './icons/ReimagineIcon';

interface TransformControlsProps {
    onRotate: () => void;
    onCropToggle: () => void;
    onUpscale: () => void;
    onReimagineToggle: () => void;
    isCropping: boolean;
    isLoading: boolean;
}

const ControlButton: React.FC<{
    label: string;
    onClick: () => void;
    isActive?: boolean;
    disabled: boolean;
    children: React.ReactNode;
}> = ({ label, onClick, isActive, disabled, children }) => (
    <button 
        onClick={onClick}
        disabled={disabled}
        className={`flex-1 flex flex-col items-center justify-center p-2 rounded-2xl transition-colors duration-200 backdrop-blur-md ${
            isActive ? 'bg-indigo-500/50 text-indigo-200' : 'bg-white/10 hover:bg-white/20'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
        {children}
        <span className="text-xs mt-1 font-semibold">{label}</span>
    </button>
);

export const TransformControls: React.FC<TransformControlsProps> = ({ onRotate, onCropToggle, onUpscale, onReimagineToggle, isCropping, isLoading }) => {
    return (
        <div className="w-full animate-fade-in">
            <div className="flex justify-center items-center space-x-2">
                <ControlButton label="Rotate" onClick={onRotate} disabled={isLoading}>
                    <RotateIcon />
                </ControlButton>
                <ControlButton label="Crop" onClick={onCropToggle} isActive={isCropping} disabled={isLoading}>
                    <CropIcon />
                </ControlButton>
                <ControlButton label="Upscale" onClick={onUpscale} disabled={isLoading}>
                    <UpscaleIcon />
                </ControlButton>
                 <ControlButton label="Reimagine" onClick={onReimagineToggle} disabled={isLoading}>
                    <ReimagineIcon />
                </ControlButton>
            </div>
        </div>
    );
};