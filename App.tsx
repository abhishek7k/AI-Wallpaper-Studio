import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Header } from './components/Header';
import { BottomNavBar } from './components/BottomNavBar';
import { ImageDisplay } from './components/ImageDisplay';
import { PromptInput } from './components/PromptInput';
import { AspectRatioSelector } from './components/AspectRatioSelector';
import { View, AspectRatio, PredefinedAspectRatio, UPLOADED_IMAGE_MIMETYPE, Filter, EditSettings } from './types';
import { generateImage, editImage, analyzeImage, upscaleImage, reimagineImageRegion } from './services/geminiService';
import { fileToBase64 } from './utils/fileUtils';
import { useScreenAspectRatio } from './hooks/useScreenAspectRatio';
import { FilterSelector } from './components/FilterSelector';
import { ColorAdjustments } from './components/ColorAdjustments';
import { TransformControls } from './components/TransformControls';
import { applyEditsToBase64 } from './utils/imageUtils';
import { SparklesIcon } from './components/icons/SparklesIcon';
import { RandomIcon } from './components/icons/RandomIcon';
import { TopRightControls } from './components/TopRightControls';
import { MaskingOverlay } from './components/MaskingOverlay';
import { ExpandIcon } from './components/icons/ExpandIcon';


const findClosestAspectRatio = (width: number, height: number): PredefinedAspectRatio => {
    if (height === 0) return '16:9'; // Avoid division by zero, default to landscape
    const targetRatio = width / height;

    const predefinedRatios: { key: PredefinedAspectRatio; value: number }[] = [
        { key: '1:1', value: 1 },
        { key: '3:4', value: 3 / 4 },
        { key: '4:3', value: 4 / 3 },
        { key: '9:16', value: 9 / 16 },
        { key: '16:9', value: 16 / 9 },
    ];

    let closest = predefinedRatios[0];
    let minDiff = Math.abs(targetRatio - closest.value);

    for (let i = 1; i < predefinedRatios.length; i++) {
        const diff = Math.abs(targetRatio - predefinedRatios[i].value);
        if (diff < minDiff) {
        minDiff = diff;
        closest = predefinedRatios[i];
        }
    }

    return closest.key;
};

const promptSuggestions = [
  "A lone astronaut contemplating a swirling nebula, cinematic, detailed",
  "A mystical forest with glowing mushrooms and ancient trees, fantasy art",
  "Cyberpunk city street at night, neon lights reflecting on wet pavement, Blade Runner style",
  "A majestic dragon flying over a volcanic mountain range at sunset, epic, high detail",
  "An underwater city with bioluminescent creatures and futuristic glass dome buildings",
  "A tranquil Japanese Zen garden with a koi pond and cherry blossoms in full bloom",
  "Steampunk-inspired airship soaring through a sky filled with clockwork planets",
  "A surreal desert landscape with melting clocks and giant chess pieces, Salvador Dali style",
  "An enchanted library with floating books and spiraling staircases made of pure light",
  "A close-up of a futuristic robot's eye, reflecting a bustling city skyline, photorealistic",
  "A vast field of sunflowers under a dramatic, stormy sky with a single ray of light",
  "A whimsical, intricate treehouse built into a giant, ancient bioluminescent oak",
  "A glowing portal to another dimension opening up in a quiet city park at dusk",
  "Minimalist abstract art with overlapping geometric shapes and a pastel color palette",
  "A photorealistic portrait of a noble wolf with piercing blue eyes, set against a snowy backdrop",
];

interface HistoryState {
  base64: string;
  mimeType: string;
}

const initialEditSettings: EditSettings = {
    brightness: 100,
    contrast: 100,
    saturation: 100,
};

// Main App Component
export default function App() {
  const [view, setView] = useState<View>(View.GENERATE);
  const [prompt, setPrompt] = useState('');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>(UPLOADED_IMAGE_MIMETYPE);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState('');
  const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(null);
  
  const screenAspectRatio = useScreenAspectRatio();
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<AspectRatio>(screenAspectRatio);
  const [customWidth, setCustomWidth] = useState(window.screen.width * window.devicePixelRatio);
  const [customHeight, setCustomHeight] = useState(window.screen.height * window.devicePixelRatio);

  const [editHistory, setEditHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [editSettings, setEditSettings] = useState<EditSettings>(initialEditSettings);
  const [isCropping, setIsCropping] = useState(false);
  const [isMasking, setIsMasking] = useState(false);

  const [ai, setAi] = useState<GoogleGenAI | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageDisplayRef = useRef<HTMLDivElement>(null);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < editHistory.length - 1;
  
  // Initialize AI client
  useEffect(() => {
    if (process.env.API_KEY) {
        setAi(new GoogleGenAI({ apiKey: process.env.API_KEY }));
    } else {
        setError("API_KEY environment variable not set.");
    }
  }, []);

  const addToHistory = useCallback((newState: HistoryState) => {
    // on new action, discard redo history
    const newHistory = editHistory.slice(0, historyIndex + 1);
    newHistory.push(newState);
    setEditHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [editHistory, historyIndex]);

  const handleUndo = () => {
    if (canUndo) {
      const newIndex = historyIndex - 1;
      const previousState = editHistory[newIndex];
      setImageBase64(previousState.base64);
      setImageSrc(`data:${previousState.mimeType};base64,${previousState.base64}`);
      setMimeType(previousState.mimeType);
      setHistoryIndex(newIndex);
      setEditSettings(initialEditSettings); // Reset sliders on undo/redo
    }
  };

  const handleRedo = () => {
    if (canRedo) {
      const newIndex = historyIndex + 1;
      const nextState = editHistory[newIndex];
      setImageBase64(nextState.base64);
      setImageSrc(`data:${nextState.mimeType};base64,${nextState.base64}`);
      setMimeType(nextState.mimeType);
      setHistoryIndex(newIndex);
      setEditSettings(initialEditSettings); // Reset sliders on undo/redo
    }
  };

  const commonApiStart = (message: string) => {
    setIsLoading(true);
    setLoadingMessage(message);
    setError(null);
    setAnalysisResult('');
     if (message !== 'Analyzing your image...') {
      setImageAspectRatio(null);
    }
  };

  const commonApiEnd = () => {
    setIsLoading(false);
    setLoadingMessage('');
  };

  const handleGenerate = async (currentPrompt: string) => {
    if (!ai || !currentPrompt.trim()) return;
    commonApiStart('Generating your wallpaper...');
    
    let aspectRatio: PredefinedAspectRatio = '9:16';
    if (selectedAspectRatio !== 'custom' && selectedAspectRatio !== '16:10') {
      aspectRatio = selectedAspectRatio;
    } else if (selectedAspectRatio === '16:10') {
      aspectRatio = '16:9'; // Closest supported
    } else { // custom
      aspectRatio = findClosestAspectRatio(customWidth, customHeight);
    }

    try {
      const generatedBase64 = await generateImage(ai, currentPrompt, aspectRatio);
      const newMimeType = 'image/jpeg';
      setImageBase64(generatedBase64);
      setImageSrc(`data:${newMimeType};base64,${generatedBase64}`);
      setMimeType(newMimeType);
      // Reset history when a new image is generated
      const initialState = { base64: generatedBase64, mimeType: newMimeType };
      setEditHistory([initialState]);
      setHistoryIndex(0);
      setEditSettings(initialEditSettings);
    } catch (e: any) {
      setError(e.message);
    } finally {
      commonApiEnd();
    }
  };
  
  const handleEdit = async (editPrompt: string) => {
    if (!ai || !editPrompt.trim() || !imageBase64) return;
    commonApiStart('Applying your edits...');
    try {
      const editedBase64 = await editImage(ai, editPrompt, imageBase64, mimeType);
      const newMimeType = 'image/png'; // Edit often returns png
      setImageBase64(editedBase64);
      setImageSrc(`data:${newMimeType};base64,${editedBase64}`);
      setMimeType(newMimeType);
      addToHistory({ base64: editedBase64, mimeType: newMimeType });
    } catch (e: any) {
      setError(e.message);
    } finally {
      commonApiEnd();
    }
  };

  const handleReimagine = async (maskBase64: string, reimaginePrompt: string) => {
    setIsMasking(false);
    if (!ai || !reimaginePrompt.trim() || !imageBase64) return;
    commonApiStart('Reimagining selected area...');
    try {
      const baseState = editHistory[historyIndex];
      const editedBase64 = await reimagineImageRegion(ai, baseState.base64, baseState.mimeType, maskBase64, reimaginePrompt);
      const newMimeType = 'image/png';
      setImageBase64(editedBase64);
      setImageSrc(`data:${newMimeType};base64,${editedBase64}`);
      setMimeType(newMimeType);
      addToHistory({ base64: editedBase64, mimeType: newMimeType });
    } catch (e: any) {
      setError(e.message);
    } finally {
      commonApiEnd();
    }
  };

  const handleAnalyze = async (analyzePrompt: string) => {
    if (!ai || !analyzePrompt.trim() || !imageBase64) return;
    commonApiStart('Analyzing your image...');
    try {
      const result = await analyzeImage(ai, analyzePrompt, imageBase64, mimeType);
      setAnalysisResult(result);
    } catch (e: any) {
      setError(e.message);
    } finally {
      commonApiEnd();
    }
  };

  const handleSubmit = (currentPrompt: string) => {
    switch (view) {
      case View.GENERATE:
        handleGenerate(currentPrompt);
        break;
      case View.EDIT:
        handleEdit(currentPrompt);
        break;
      case View.ANALYZE:
        handleAnalyze(currentPrompt);
        break;
    }
  };

  const handleSuggestion = () => {
    const suggestedPrompt = promptSuggestions[Math.floor(Math.random() * promptSuggestions.length)];
    setPrompt(suggestedPrompt);
  };

  const handleRandom = () => {
    const suggestedPrompt = promptSuggestions[Math.floor(Math.random() * promptSuggestions.length)];
    setPrompt(suggestedPrompt);
    handleGenerate(suggestedPrompt);
  };
  
  const handleDownload = () => {
    if (!imageSrc) return;
    const link = document.createElement('a');
    link.href = imageSrc;
    link.download = `wallpaper-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageAspectRatio(null);
      commonApiStart('Uploading image...');
      try {
        const { base64, mimeType } = await fileToBase64(file);
        setImageBase64(base64);
        setImageSrc(`data:${mimeType};base64,${base64}`);
        setMimeType(mimeType);
        const initialState = { base64, mimeType };
        setEditHistory([initialState]);
        setHistoryIndex(0);
        setEditSettings(initialEditSettings);
        if (view === View.GENERATE) setView(View.EDIT); // Switch to edit view on upload
      } catch (e) {
        setError('Failed to read the uploaded file.');
        console.error(e);
      } finally {
        commonApiEnd();
      }
    }
    // Reset file input value to allow re-uploading the same file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleApplyFilter = async (filter: Filter) => {
    if (!imageBase64) return;
    commonApiStart('Applying filter...');
    try {
      const { base64: newBase64, mimeType: newMimeType } = await applyEditsToBase64(
        imageBase64,
        mimeType,
        { filter }
      );
      setImageBase64(newBase64);
      setImageSrc(`data:${newMimeType};base64,${newBase64}`);
      setMimeType(newMimeType);
      addToHistory({ base64: newBase64, mimeType: newMimeType });
    } catch(e: any) {
      setError(e.message);
    } finally {
      commonApiEnd();
    }
  };

  const handleSettingsChange = (setting: keyof EditSettings, value: number) => {
    setEditSettings(prev => ({ ...prev, [setting]: value }));
  };

  const handleApplyEdits = async () => {
    if (!imageBase64) return;
    // Get the base image from before the live preview
    const baseState = editHistory[historyIndex];
    if (!baseState) return;

    commonApiStart('Applying adjustments...');
    try {
      const { base64: newBase64, mimeType: newMimeType } = await applyEditsToBase64(
        baseState.base64,
        baseState.mimeType,
        { settings: editSettings }
      );
      setImageBase64(newBase64);
      setImageSrc(`data:${newMimeType};base64,${newBase64}`);
      setMimeType(newMimeType);
      addToHistory({ base64: newBase64, mimeType: newMimeType });
    } catch(e: any) {
      setError(e.message);
    } finally {
      commonApiEnd();
    }
  };

  const handleResetColors = () => {
    if (JSON.stringify(editSettings) !== JSON.stringify(initialEditSettings)) {
      setEditSettings(initialEditSettings);
      const baseState = editHistory[historyIndex];
      if (baseState) {
         setImageSrc(`data:${baseState.mimeType};base64,${baseState.base64}`);
      }
    }
  }

  const handleRotate = async () => {
    if (!imageBase64) return;
    commonApiStart('Rotating image...');
    try {
      // Use the latest from history as the base for rotation
      const baseState = editHistory[historyIndex];
      const { base64: newBase64, mimeType: newMimeType } = await applyEditsToBase64(
        baseState.base64,
        baseState.mimeType,
        { rotation: 90 }
      );
      setImageBase64(newBase64);
      setImageSrc(`data:${newMimeType};base64,${newBase64}`);
      setMimeType(newMimeType);
      addToHistory({ base64: newBase64, mimeType: newMimeType });
      setEditSettings(initialEditSettings); // Reset sliders after rotation
    } catch(e: any) {
      setError(e.message);
    } finally {
      commonApiEnd();
    }
  }
  
  const handleToggleCrop = () => {
    if (imageSrc) {
      setIsCropping(!isCropping);
    }
  }

  const handleToggleMask = () => {
    if (imageSrc) {
      setIsMasking(!isMasking);
    }
  }

  const handleApplyCrop = async (crop: {x: number, y: number, width: number, height: number}) => {
    setIsCropping(false);
    if (!imageBase64 || crop.width === 0 || crop.height === 0) return; // Zero width is cancel signal
    
    commonApiStart('Cropping image...');
    try {
      const baseState = editHistory[historyIndex];
      const { base64: newBase64, mimeType: newMimeType } = await applyEditsToBase64(
        baseState.base64,
        baseState.mimeType,
        { crop }
      );
      setImageBase64(newBase64);
      setImageSrc(`data:${newMimeType};base64,${newBase64}`);
      setMimeType(newMimeType);
      addToHistory({ base64: newBase64, mimeType: newMimeType });
      setEditSettings(initialEditSettings);
    } catch(e: any) {
      setError(e.message);
    } finally {
      commonApiEnd();
    }
  };

  const handleUpscale = async () => {
    if (!ai || !imageBase64) return;
    commonApiStart('Upscaling your image...');
    try {
      const baseState = editHistory[historyIndex];
      const upscaledBase64 = await upscaleImage(ai, baseState.base64, baseState.mimeType);
      const newMimeType = 'image/png'; // Upscaling might change format
      setImageBase64(upscaledBase64);
      setImageSrc(`data:${newMimeType};base64,${upscaledBase64}`);
      setMimeType(newMimeType);
      addToHistory({ base64: upscaledBase64, mimeType: newMimeType });
      setEditSettings(initialEditSettings);
    } catch (e: any) {
      setError(e.message);
    } finally {
      commonApiEnd();
    }
  };

  const getPlaceholder = (): string => {
    switch(view) {
        case View.GENERATE: return 'e.g., A surreal landscape with floating islands...';
        case View.EDIT: return 'e.g., Make the sky a vibrant purple...';
        case View.ANALYZE: return 'e.g., What is the main subject of this image?';
        default: return 'Enter your prompt...';
    }
  };
  
  const handleToggleFullscreen = () => {
    const element = imageDisplayRef.current;
    if (!element) return;

    if (!document.fullscreenElement) {
        element.requestFullscreen().catch(err => {
            alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        });
    } else {
        document.exitFullscreen();
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden font-sans text-white bg-gray-900 flex flex-col px-4">
      <header className="py-4 flex justify-center shrink-0">
        <div className="w-full max-w-md md:max-w-2xl lg:max-w-3xl">
          <Header />
        </div>
      </header>

      <main 
        ref={imageDisplayRef}
        className="flex-1 w-full max-w-3xl mx-auto min-h-0 flex flex-col justify-center relative transition-all duration-300 ease-in-out"
        style={{ aspectRatio: imageAspectRatio ? String(imageAspectRatio) : undefined }}
      >
        <ImageDisplay 
          imageSrc={imageSrc} 
          isLoading={isLoading}
          loadingMessage={loadingMessage}
          analysisResult={analysisResult}
          view={view}
          onUploadClick={() => fileInputRef.current?.click()}
          editSettings={editSettings}
          isCropping={isCropping}
          onCrop={handleApplyCrop}
          onImageLoad={setImageAspectRatio}
        />
        {isMasking && imageSrc && (
          <MaskingOverlay 
            imageSrc={imageSrc}
            onApply={handleReimagine}
            onCancel={() => setIsMasking(false)}
          />
        )}
        
        {imageSrc && !isCropping && !isMasking && (
            <button
            onClick={handleToggleFullscreen}
            className="absolute top-4 left-4 z-40 p-2 bg-black/30 backdrop-blur-md rounded-full hover:bg-black/50 transition-colors"
            aria-label="Toggle Fullscreen"
            >
            <ExpandIcon />
            </button>
        )}
        
        {imageSrc && !isCropping && !isMasking && (
            <TopRightControls
            view={view}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onDownload={handleDownload}
            canUndo={canUndo}
            canRedo={canRedo}
            isLoading={isLoading}
            />
        )}
      </main>

      <footer className="py-2 bg-gray-900 shrink-0">
        <div className="flex flex-col items-center gap-2">
            {error && (
                <div className="w-full max-w-md md:max-w-2xl lg:max-w-3xl p-3 bg-red-500/20 border border-red-500/50 text-red-300 text-sm rounded-lg text-center animate-fade-in">
                  {error}
                </div>
            )}
            
            {view === View.EDIT && imageSrc && !isCropping && !isMasking && (
                <div className="w-full max-w-md md:max-w-2xl lg:max-w-3xl flex flex-col gap-2">
                  <FilterSelector onApplyFilter={handleApplyFilter} isLoading={isLoading} />
                  <ColorAdjustments settings={editSettings} onChange={handleSettingsChange} onApply={handleApplyEdits} onReset={handleResetColors} />
                  <TransformControls 
                    onRotate={handleRotate} 
                    onCropToggle={handleToggleCrop} 
                    onUpscale={handleUpscale}
                    onReimagineToggle={handleToggleMask}
                    isCropping={isCropping}
                    isLoading={isLoading}
                  />
                </div>
            )}
            
            {view === View.GENERATE && (
              <div className="w-full max-w-md md:max-w-2xl lg:max-w-3xl">
                <AspectRatioSelector 
                    selected={selectedAspectRatio} 
                    onSelect={setSelectedAspectRatio} 
                    customWidth={customWidth}
                    customHeight={customHeight}
                    setCustomWidth={setCustomWidth}
                    setCustomHeight={setCustomHeight}
                />
              </div>
            )}

            <div className="w-full max-w-md md:max-w-2xl lg:max-w-3xl">
              <PromptInput
                  prompt={prompt}
                  setPrompt={setPrompt}
                  onSubmit={handleSubmit}
                  isLoading={isLoading}
                  placeholder={getPlaceholder()}
              >
                  {view === View.GENERATE && (
                    <>
                        <button type="button" onClick={handleSuggestion} disabled={isLoading} className="p-2 text-gray-400 hover:text-indigo-400 disabled:opacity-50" aria-label="Suggest Prompt">
                            <SparklesIcon />
                        </button>
                        <button type="button" onClick={handleRandom} disabled={isLoading} className="p-2 mr-2 text-gray-400 hover:text-indigo-400 disabled:opacity-50" aria-label="Random Generate">
                            <RandomIcon />
                        </button>
                    </>
                  )}
              </PromptInput>
            </div>
            
            <div className="w-full max-w-md md:max-w-2xl lg:max-w-3xl">
                <BottomNavBar currentView={view} setView={setView} />
            </div>
        </div>
      </footer>
      
      {/* Hidden file input for uploads */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
        accept="image/*"
      />
    </div>
  );
}