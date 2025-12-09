export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  prompt: string;
  isUserDefined?: boolean; // True if the template was added by the user
}

export interface TemplateCategory {
  id: string;
  name: string;
  description: string; // Description of the category
  templates: PromptTemplate[];
}

export interface HistoryEntry {
  id: string;
  originalImageBase64: string;
  originalImageMimeType: string;
  prompt: string;
  editedImageBase64: string;
  timestamp: number; // Unix timestamp
  templateName?: string; // Optional: name of the template used
  categoryName?: string; // Optional: name of the category used
}

export enum BlendMode {
  NORMAL = 'normal',
  OVERLAY = 'overlay',
}