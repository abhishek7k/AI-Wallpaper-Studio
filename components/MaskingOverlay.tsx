import React, { useState, useRef, useEffect, useCallback } from 'react';

interface MaskingOverlayProps {
  imageSrc: string;
  onApply: (maskBase64: string, prompt: string) => void;
  onCancel: () => void;
}

export const MaskingOverlay: React.FC<MaskingOverlayProps> = ({ imageSrc, onApply, onCancel }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(40);
  const [prompt, setPrompt] = useState('');

  const getCanvasAndImageRects = useCallback(() => {
    if (!imageRef.current || !canvasRef.current || !containerRef.current) return null;
    
    const image = imageRef.current;
    const canvas = canvasRef.current;
    const container = containerRef.current;

    const { naturalWidth, naturalHeight } = image;
    const { width: containerWidth, height: containerHeight } = container.getBoundingClientRect();

    const containerRatio = containerWidth / containerHeight;
    const imageRatio = naturalWidth / naturalHeight;

    let imageDisplayWidth = containerWidth;
    let imageDisplayHeight = containerHeight;

    if (containerRatio > imageRatio) { // Container is wider than image, letterboxed
      imageDisplayWidth = containerHeight * imageRatio;
    } else { // Container is taller than image, pillarboxed
      imageDisplayHeight = containerWidth / imageRatio;
    }
    
    const imageTop = (containerHeight - imageDisplayHeight) / 2;
    const imageLeft = (containerWidth - imageDisplayWidth) / 2;

    return {
      canvas,
      image,
      rect: {
        top: imageTop,
        left: imageLeft,
        width: imageDisplayWidth,
        height: imageDisplayHeight
      }
    };
  }, []);
  
  const setupCanvas = useCallback(() => {
    const data = getCanvasAndImageRects();
    if (!data) return;
    const { canvas, image, rect } = data;
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const ctx = canvas.getContext('2d');
    if(ctx) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, [getCanvasAndImageRects]);


  useEffect(() => {
    const image = imageRef.current;
    if (image) {
        // When image source is loaded, set up the canvas
        image.onload = setupCanvas;
        // If image is already loaded (e.g. from cache)
        if(image.complete) {
            setupCanvas();
        }
    }
  }, [imageSrc, setupCanvas]);

  const getMousePos = (e: React.MouseEvent | React.TouchEvent) => {
    const data = getCanvasAndImageRects();
    if (!data) return null;
    const { canvas, rect } = data;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const canvasX = ((clientX - rect.left) / rect.width) * canvas.width;
    const canvasY = ((clientY - rect.top) / rect.height) * canvas.height;
    return { x: canvasX, y: canvasY };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const pos = getMousePos(e);
    if (!pos) return;
    setIsDrawing(true);
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const pos = getMousePos(e);
    if (!pos) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = brushSize * (canvasRef.current!.width / imageRef.current!.clientWidth);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if(ctx) ctx.closePath();
    setIsDrawing(false);
  };

  const handleApply = () => {
    if (!canvasRef.current || !prompt.trim()) return;
    // Get the base64 representation of the mask
    const maskBase64 = canvasRef.current.toDataURL('image/png').split(',')[1];
    onApply(maskBase64, prompt);
  };
  
  const canvasStyle: React.CSSProperties = {
     ...getCanvasAndImageRects()?.rect,
     position: 'absolute',
     touchAction: 'none'
  };

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-50 bg-gray-900/80 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in"
    >
      <img ref={imageRef} src={imageSrc} className="max-w-full max-h-full object-contain pointer-events-none" alt="Masking target" />
      <canvas
        ref={canvasRef}
        style={canvasStyle}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        className="cursor-crosshair"
      />
      <div className="absolute top-4 left-4 right-4 flex flex-col sm:flex-row gap-2 items-center bg-gray-800/60 p-2 rounded-lg backdrop-blur-md">
        <label htmlFor="brushSize" className="text-xs font-medium text-gray-300 whitespace-nowrap">Brush Size:</label>
        <input 
            id="brushSize"
            type="range"
            min="5"
            max="150"
            value={brushSize}
            onChange={(e) => setBrushSize(parseInt(e.target.value))}
            className="w-full sm:w-48 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      <div className="absolute bottom-4 left-4 right-4 flex flex-col sm:flex-row gap-2 items-center">
        <input 
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="What should be in the selected area?"
            className="w-full bg-gray-800/80 backdrop-blur-md text-white rounded-full p-3 pl-5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <div className="flex gap-2">
            <button onClick={handleApply} disabled={!prompt.trim()} className="px-5 py-3 bg-indigo-600 text-white font-semibold rounded-full hover:bg-indigo-500 disabled:opacity-50 transition-colors">
                Apply
            </button>
            <button onClick={onCancel} className="px-5 py-3 bg-gray-700 text-white font-semibold rounded-full hover:bg-gray-600 transition-colors">
                Cancel
            </button>
        </div>
      </div>
    </div>
  );
};
