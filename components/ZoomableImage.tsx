import React, { useState, useRef, useEffect } from 'react';

interface ZoomableImageProps {
  src: string;
  alt: string;
  style?: React.CSSProperties;
  onImageLoad?: (aspectRatio: number) => void;
}

const MIN_SCALE = 1;
const MAX_SCALE = 5;

export const ZoomableImage: React.FC<ZoomableImageProps> = ({ src, alt, style, onImageLoad }) => {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(MIN_SCALE);
  const [isDragging, setIsDragging] = useState(false);
  const [startDrag, setStartDrag] = useState({ x: 0, y: 0 });
  const [initialPinchDist, setInitialPinchDist] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Reset state when image source changes
  useEffect(() => {
    setScale(MIN_SCALE);
    setOffset({ x: 0, y: 0 });
  }, [src]);
  
  const getBoundedOffset = (newOffset: {x: number, y: number}, newScale: number) => {
    if (!imageRef.current || !containerRef.current) return { x: 0, y: 0 };
    
    const image = imageRef.current;
    const container = containerRef.current;
    
    // Use the image's rendered dimensions inside the object-contain container
    const realImgWidth = image.clientWidth * newScale;
    const realImgHeight = image.clientHeight * newScale;

    const maxOffsetX = (realImgWidth - container.offsetWidth) / 2;
    const maxOffsetY = (realImgHeight - container.offsetHeight) / 2;
    
    // Allow panning only if the image is larger than the container
    const boundedX = maxOffsetX > 0 ? Math.max(-maxOffsetX, Math.min(maxOffsetX, newOffset.x)) : 0;
    const boundedY = maxOffsetY > 0 ? Math.max(-maxOffsetY, Math.min(maxOffsetY, newOffset.y)) : 0;
    
    return { x: boundedX, y: boundedY };
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const newScale = scale - e.deltaY * 0.005;
    const clampedScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));
    
    if(clampedScale === MIN_SCALE) {
        setOffset({ x: 0, y: 0 });
    } else {
        setOffset(prevOffset => getBoundedOffset(prevOffset, clampedScale));
    }
    setScale(clampedScale);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    if (scale <= MIN_SCALE) return;
    setIsDragging(true);
    setStartDrag({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || scale <= MIN_SCALE) return;
    e.preventDefault();
    const newOffset = { x: e.clientX - startDrag.x, y: e.clientY - startDrag.y };
    setOffset(getBoundedOffset(newOffset, scale));
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      setIsDragging(false);
      setInitialPinchDist(Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY));
    } else if (e.touches.length === 1 && scale > MIN_SCALE) {
      e.preventDefault();
      setIsDragging(true);
      setStartDrag({ x: e.touches[0].clientX - offset.x, y: e.touches[0].clientY - offset.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialPinchDist !== null) {
      e.preventDefault();
      const currentPinchDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      const newScale = scale * (currentPinchDist / initialPinchDist);
      const clampedScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));

      setInitialPinchDist(currentPinchDist);
      if(clampedScale === MIN_SCALE) {
          setOffset({ x: 0, y: 0 });
      } else {
          setOffset(prevOffset => getBoundedOffset(prevOffset, clampedScale));
      }
      setScale(clampedScale);

    } else if (e.touches.length === 1 && isDragging && scale > MIN_SCALE) {
      e.preventDefault();
      const newOffset = { x: e.touches[0].clientX - startDrag.x, y: e.touches[0].clientY - startDrag.y };
      setOffset(getBoundedOffset(newOffset, scale));
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setInitialPinchDist(null);
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    if (onImageLoad && naturalHeight > 0) {
      onImageLoad(naturalWidth / naturalHeight);
    }
  };

  const imageStyle: React.CSSProperties = {
    ...style,
    transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
    transition: isDragging ? 'none' : 'transform 0.1s ease-out',
    cursor: isDragging ? 'grabbing' : (scale > MIN_SCALE ? 'grab' : 'default'),
    touchAction: 'none',
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center overflow-hidden rounded-2xl"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <img
        ref={imageRef}
        src={src}
        alt={alt}
        className="max-w-full max-h-full object-contain"
        style={imageStyle}
        onLoad={handleImageLoad}
      />
    </div>
  );
};