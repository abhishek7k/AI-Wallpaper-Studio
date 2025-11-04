import { Filter, EditSettings } from '../types';

interface Edits {
  filter?: Filter;
  settings?: EditSettings;
  rotation?: number;
  crop?: { x: number; y: number; width: number; height: number };
}

export const applyEditsToBase64 = (
  base64: string,
  mimeType: string,
  edits: Edits
): Promise<{ base64: string; mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = `data:${mimeType};base64,${base64}`;

    image.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        return reject(new Error('Could not get canvas context.'));
      }

      let currentImage: HTMLImageElement | HTMLCanvasElement = image;
      let tempCanvas: HTMLCanvasElement | null = null;
      let tempCtx: CanvasRenderingContext2D | null = null;

      if (edits.rotation) {
        tempCanvas = document.createElement('canvas');
        tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) return reject(new Error('Could not get temp canvas context.'));

        const angle = (edits.rotation * Math.PI) / 180;
        const sin = Math.abs(Math.sin(angle));
        const cos = Math.abs(Math.cos(angle));
        const newWidth = image.width * cos + image.height * sin;
        const newHeight = image.width * sin + image.height * cos;

        tempCanvas.width = newWidth;
        tempCanvas.height = newHeight;
        
        tempCtx.translate(newWidth / 2, newHeight / 2);
        tempCtx.rotate(angle);
        tempCtx.drawImage(image, -image.width / 2, -image.height / 2);

        currentImage = tempCanvas;
      }
      
      const sourceX = edits.crop?.x ?? 0;
      const sourceY = edits.crop?.y ?? 0;
      const sourceWidth = edits.crop?.width ?? currentImage.width;
      const sourceHeight = edits.crop?.height ?? currentImage.height;

      canvas.width = sourceWidth;
      canvas.height = sourceHeight;

      const filters: string[] = [];
      if (edits.filter) {
        switch (edits.filter) {
          case 'grayscale': filters.push('grayscale(100%)'); break;
          case 'sepia': filters.push('sepia(100%)'); break;
          case 'invert': filters.push('invert(100%)'); break;
          case 'vintage': filters.push('sepia(50%) contrast(120%) saturate(120%) brightness(90%)'); break;
          case 'cool': filters.push('contrast(110%) saturate(80%) brightness(105%)'); break;
          case 'warm': filters.push('sepia(20%) saturate(120%)'); break;
        }
      }
      if (edits.settings) {
        filters.push(`brightness(${edits.settings.brightness}%)`);
        filters.push(`contrast(${edits.settings.contrast}%)`);
        filters.push(`saturate(${edits.settings.saturation}%)`);
      }
      
      if (filters.length > 0) {
        ctx.filter = filters.join(' ');
      }
      
      ctx.drawImage(
        currentImage, 
        sourceX, 
        sourceY, 
        sourceWidth, 
        sourceHeight, 
        0, 
        0, 
        sourceWidth, 
        sourceHeight
      );

      const outputMimeType = 'image/png';
      const outputBase64 = canvas.toDataURL(outputMimeType).split(',')[1];
      
      resolve({ base64: outputBase64, mimeType: outputMimeType });
    };

    image.onerror = (error) => {
      reject(new Error('Failed to load image for editing.'));
    };
  });
};
