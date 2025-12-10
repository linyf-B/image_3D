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

export interface UploadedImage {
  id: string;
  base64: string;
  mimeType: string;
  fileName: string;
}

// --- New types for Auth and Admin ---
export interface User {
  id: string;
  username: string;
  password?: string; // Stored hashed in real app, plain for simulation
  isAdmin: boolean;
  credits: number;
}

export interface AuthContextType {
  currentUser: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUserCredits: (userId: string, newCredits: number) => Promise<void>;
  getUserCredits: (userId: string) => Promise<number | null>;
}

export interface PaymentConfig {
  pricePerCredit: number; // e.g., 0.5 RMB
  initialFreeCredits: number; // e.g., 3
}
// --- End New types for Auth and Admin ---