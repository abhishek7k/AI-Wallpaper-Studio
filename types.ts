export enum View {
  GENERATE = 'GENERATE',
  EDIT = 'EDIT',
  ANALYZE = 'ANALYZE',
}

export type PredefinedAspectRatio = '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
export type AspectRatio = PredefinedAspectRatio | '16:10' | 'custom';
export type Filter = 'grayscale' | 'sepia' | 'invert' | 'vintage' | 'cool' | 'warm';

export interface EditSettings {
  brightness: number;
  contrast: number;
  saturation: number;
}

// FIX: Add missing Preset type definition
export interface Preset {
  name: string;
  settings: EditSettings;
}

export const aspectRatios: AspectRatio[] = ['9:16', '16:9', '16:10', '1:1', '3:4', '4:3', 'custom'];

export const UPLOADED_IMAGE_MIMETYPE = 'image/png';