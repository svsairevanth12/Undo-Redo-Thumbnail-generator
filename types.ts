
export interface UploadedImage {
  id: string;
  file: File;
  previewUrl: string; // For UI display
  base64Data: string; // Clean base64 for API (no prefix)
  mimeType: string;
}

export interface Actor extends UploadedImage {
  emotion: string;
}

export enum AspectRatio {
  LANDSCAPE = '16:9',
  PORTRAIT = '9:16',
}

export interface GeneratorState {
  modelId: string;
  mainPrompt: string;
  backgroundPrompt: string;
  headlineText: string;
  aspectRatio: AspectRatio;
  stylePreset: string;
  actors: Actor[];
  references: UploadedImage[];
  imageResolution: '1K' | '2K' | '4K';
  generationCount: number;
}

export type GenerationStatus = 'queued' | 'generating' | 'success' | 'error';

export interface GalleryItem {
  id: string;
  status: GenerationStatus;
  imageUrl?: string;
  error?: string;
  timestamp: number;
  settings: GeneratorState;
  progress: number; // 0 to 100
}
