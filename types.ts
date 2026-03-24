
export type AspectRatio = '16:9' | '4:3' | '1:1' | '3:4' | '9:16';
export type GeminiModel = 'gemini-3-pro-image-preview' | 'gemini-2.5-flash-image';

export interface StoryboardItem {
  id: string;
  cutNumber: number;
  imageUrl?: string;
  context: string;
  isGenerating: boolean;
}

export enum AppTab {
  EDITOR = 'editor',
  GALLERY = 'gallery'
}
