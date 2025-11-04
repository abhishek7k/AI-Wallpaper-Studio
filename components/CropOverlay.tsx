import React, { useState, useRef, useEffect, useCallback } from 'react';

interface CropOverlayProps {
  imageSrc: string;
  onCrop: (crop: { x: number; y: number; width: number; height: number }) => void;
}

type HandleType = 'n' | 's' | 'e' | 'w' | 'nw' | 'ne' | 'sw' | 'se' | 'move';

export const CropOverlay: React.FC<CropOverlayProps> = ({ imageSrc, onCrop }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [cropBox, setCropBox] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState<HandleType | null>(null);
  const [startPos, setStartPos] = useState({ x: 0, y: 0, boxX: 0, boxY: 0, boxW: 0, boxH: 0 });

  const getScale = useCallback(() => {
    if (!imageRef.current || !containerRef.current) return { scaleX: 1, scaleY: 1, offsetX: 0, offsetY: 0 };
    const { naturalWidth, naturalHeight } = imageRef.current;
    const { width: displayWidth, height: displayHeight } = containerRef.current.getBoundingClientRect();
    const scaleX = naturalWidth / displayWidth;
    const scaleY = naturalHeight / displayHeight;

    const displayAspectRatio = displayWidth / displayHeight;
    const naturalAspectRatio = naturalWidth / naturalHeight;
    
    let renderWidth = displayWidth;
    let renderHeight = displayHeight;

    if (displayAspectRatio > naturalAspectRatio) { // Taller than wide (letterboxed)
        renderWidth = displayHeight * naturalAspectRatio;
    } else { // Wider than tall (pillarboxed)
        renderHeight = displayWidth / naturalAspectRatio;
    }

    const offsetX = (displayWidth - renderWidth) / 2;
    const offsetY = (displayHeight - renderHeight) / 2;

    return { scaleX: naturalWidth / renderWidth, scaleY: naturalHeight / renderHeight, offsetX, offsetY };
  }, []);

  useEffect(() => {
    if (imageRef.current) {
      const { width, height } = imageRef.current.getBoundingClientRect();
      setCropBox({
        x: width * 0.1,
        y: height * 0.1,
        width: width * 0.8,
        height: height * 0.8,
      });
    }
  }, [imageSrc]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>, handle: HandleType) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(handle);
    setStartPos({
      x: e.clientX,
      y: e.clientY,
      boxX: cropBox.x,
      boxY: cropBox.y,
      boxW: cropBox.width,
      boxH: cropBox.height,
    });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    const dx = e.clientX - startPos.x;
    const dy = e.clientY - startPos.y;
    const { width: containerWidth, height: containerHeight } = containerRef.current.getBoundingClientRect();

    let newX = cropBox.x, newY = cropBox.y, newW = cropBox.width, newH = cropBox.height;

    if (isDragging === 'move') {
      newX = Math.max(0, Math.min(startPos.boxX + dx, containerWidth - startPos.boxW));
      newY = Math.max(0, Math.min(startPos.boxY + dy, containerHeight - startPos.boxH));
    } else {
        if(isDragging.includes('e')) newW = Math.min(startPos.boxW + dx, containerWidth - startPos.boxX);
        if(isDragging.includes('w')) {
            newW = Math.max(20, startPos.boxW - dx);
            newX = startPos.boxX + dx;
        }
        if(isDragging.includes('s')) newH = Math.min(startPos.boxH + dy, containerHeight - startPos.boxY);
        if(isDragging.includes('n')) {
            newH = Math.max(20, startPos.boxH - dy);
            newY = startPos.boxY + dy;
        }
        // Boundary checks
        if (newX < 0) { newW += newX; newX = 0; }
        if (newY < 0) { newH += newY; newY = 0; }
    }

    setCropBox({ x: newX, y: newY, width: newW, height: newH });
  }, [isDragging, startPos, cropBox]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(null);
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const handleApplyCrop = () => {
    const { scaleX, scaleY, offsetX, offsetY } = getScale();
    onCrop({
      x: (cropBox.x - offsetX) * scaleX,
      y: (cropBox.y - offsetY) * scaleY,
      width: cropBox.width * scaleX,
      height: cropBox.height * scaleY,
    });
  };

  const handleCancelCrop = () => {
    // A bit of a hack to signal cancellation by calling crop with zero dimensions
    onCrop({ x: 0, y: 0, width: 0, height: 0 });
  }

  const handles: HandleType[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

  return (
    <div ref={containerRef} className="absolute inset-0 z-20">
      <img ref={imageRef} src={imageSrc} className="w-full h-full object-contain pointer-events-none" alt="For cropping" />
      <div className="absolute inset-0 bg-black/70"></div>
      <div
        className="absolute border-2 border-dashed border-white cursor-move"
        style={{
          left: cropBox.x,
          top: cropBox.y,
          width: cropBox.width,
          height: cropBox.height,
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.7)',
        }}
        onMouseDown={(e) => handleMouseDown(e, 'move')}
      >
        {handles.map(h => (
          <div key={h} onMouseDown={(e) => handleMouseDown(e, h)} className={`absolute bg-white rounded-full w-3 h-3 -m-1.5 handle-${h}`}></div>
        ))}
      </div>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4">
        <button onClick={handleApplyCrop} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-full hover:bg-indigo-500">Apply Crop</button>
        <button onClick={handleCancelCrop} className="px-4 py-2 bg-gray-700 text-white font-semibold rounded-full hover:bg-gray-600">Cancel</button>
      </div>
      <style>{`
        .handle-n { top: 0; left: 50%; cursor: n-resize; }
        .handle-s { bottom: 0; left: 50%; cursor: s-resize; }
        .handle-e { top: 50%; right: 0; cursor: e-resize; }
        .handle-w { top: 50%; left: 0; cursor: w-resize; }
        .handle-nw { top: 0; left: 0; cursor: nw-resize; }
        .handle-ne { top: 0; right: 0; cursor: ne-resize; }
        .handle-sw { bottom: 0; left: 0; cursor: sw-resize; }
        .handle-se { bottom: 0; right: 0; cursor: se-resize; }
      `}</style>
    </div>
  );
};
