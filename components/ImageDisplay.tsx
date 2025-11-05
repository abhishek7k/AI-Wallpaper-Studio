import React from 'react';
import { View, EditSettings } from '../types';
import { UploadIcon } from './icons/UploadIcon';
import { CropOverlay } from './CropOverlay';
import { ZoomableImage } from './ZoomableImage';

interface ImageDisplayProps {
  imageSrc: string | null;
  isLoading: boolean;
  loadingMessage: string;
  analysisResult: string;
  view: View;
  onUploadClick?: () => void;
  editSettings?: EditSettings;
  isCropping?: boolean;
  onCrop?: (crop: {x: number, y: number, width: number, height: number}) => void;
  onImageLoad?: (aspectRatio: number) => void;
}

const LoadingSpinner: React.FC = () => (
    <svg className="animate-spin h-10 w-10 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);


export const ImageDisplay: React.FC<ImageDisplayProps> = ({ 
  imageSrc, isLoading, loadingMessage, analysisResult, view, onUploadClick, editSettings, isCropping, onCrop, onImageLoad
}) => {

  const getImageStyle = (): React.CSSProperties => {
    if (view === View.EDIT && editSettings) {
      const { brightness, contrast, saturation } = editSettings;
      return {
        filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`,
      };
    }
    return {};
  };

  const renderOverlayOrPlaceholder = () => {
    if (isLoading) {
      return (
        <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm flex flex-col justify-center items-center text-center p-4 z-50">
          <LoadingSpinner />
          <p className="mt-4 text-indigo-300 font-medium">{loadingMessage}</p>
        </div>
      );
    }
    
    if (analysisResult) {
        return (
            <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent p-6 pt-12 z-10 overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div className="h-full">
                    <h3 className="text-lg font-bold text-indigo-400 mb-2">Analysis Result</h3>
                    <p className="text-gray-300 whitespace-pre-wrap">{analysisResult}</p>
                </div>
            </div>
        )
    }

    if (!imageSrc) {
        const showUpload = (view === View.EDIT || view === View.ANALYZE) && onUploadClick;
        return (
            <div className="w-full h-full p-4 flex flex-col justify-center items-center">
                <div className="w-full h-full flex flex-col justify-center items-center text-center text-gray-500 border-2 border-dashed border-gray-700 rounded-2xl p-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="font-semibold max-w-xs">
                      {view === View.GENERATE && "Your wallpaper will appear here."}
                      {view === View.EDIT && "Generate or upload an image to edit."}
                      {view === View.ANALYZE && "Upload an image to analyze."}
                  </p>
                  {showUpload && (
                    <button 
                        onClick={onUploadClick} 
                        className="mt-4 inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white font-semibold text-sm rounded-full hover:bg-indigo-500 transition-colors"
                    >
                        <span className="w-5 h-5 mr-2">
                            <UploadIcon />
                        </span>
                        Upload Image
                    </button>
                  )}
                </div>
            </div>
        );
    }
    
    return null;
  };
  
  return (
    <div className="w-full h-full flex justify-center items-center relative">
        {imageSrc && (
          isCropping && onCrop ? 
          <CropOverlay imageSrc={imageSrc} onCrop={onCrop} /> :
          <ZoomableImage 
            src={imageSrc} 
            alt="User Wallpaper"
            style={getImageStyle()}
            onImageLoad={onImageLoad}
          />
        )}
        {renderOverlayOrPlaceholder()}
    </div>
  );
};