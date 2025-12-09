import React, { useState, useCallback, useRef, useEffect } from 'react';
import ImageUploader from './components/ImageUploader';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import { editImage } from './services/geminiService';

const App: React.FC = () => {
  const [selectedImageBase64, setSelectedImageBase64] = useState<string | null>(null);
  const [selectedImageMimeType, setSelectedImageMimeType] = useState<string | null>(null);
  const [editedImageBase64, setEditedImageBase64] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const promptInputRef = useRef<HTMLTextAreaElement>(null);

  const handleImageSelect = useCallback((base64: string, mimeType: string) => {
    setSelectedImageBase64(base64);
    setSelectedImageMimeType(mimeType);
    setEditedImageBase64(null); // Clear previous edited image
    setError(null);
  }, []);

  const handleEditImage = useCallback(async () => {
    if (!selectedImageBase64 || !selectedImageMimeType || !prompt.trim()) {
      setError("Please upload an image and provide a text prompt.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await editImage(selectedImageBase64, selectedImageMimeType, prompt);
      if (result) {
        setEditedImageBase64(result);
      } else {
        setError("No edited image was returned. Please try a different prompt.");
      }
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("An unexpected error occurred during image editing.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [selectedImageBase64, selectedImageMimeType, prompt]);

  // Focus on the prompt input when an image is selected
  useEffect(() => {
    if (selectedImageBase64 && promptInputRef.current) {
      promptInputRef.current.focus();
    }
  }, [selectedImageBase64]);

  return (
    <div className="flex flex-col lg:flex-row gap-8 p-6 bg-white shadow-lg rounded-xl max-w-7xl w-full min-h-[80vh] items-start">
      {/* Left Panel: Image Upload & Original Image Display */}
      <div className="flex flex-col items-center w-full lg:w-1/2 p-4 border border-gray-200 rounded-lg shadow-sm bg-gray-50">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Original Image</h2>
        <ImageUploader onImageSelect={handleImageSelect} disabled={isLoading} />

        {selectedImageBase64 && (
          <div className="mt-6 w-full max-w-md bg-white p-2 rounded-lg shadow-md">
            <img
              src={`data:${selectedImageMimeType};base64,${selectedImageBase64}`}
              alt="Selected for editing"
              className="max-w-full h-auto rounded-md object-contain max-h-[400px]"
            />
            <p className="text-sm text-gray-600 mt-2 text-center">Your uploaded image.</p>
          </div>
        )}
      </div>

      {/* Right Panel: Prompt Input, Controls, and Edited Image Display */}
      <div className="flex flex-col w-full lg:w-1/2 p-4 border border-gray-200 rounded-lg shadow-sm bg-gray-50">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Edit Image with AI</h2>

        <div className="flex flex-col gap-4">
          <label htmlFor="prompt-input" className="text-sm font-medium text-gray-700">
            Tell Gemini what to do:
          </label>
          <textarea
            id="prompt-input"
            ref={promptInputRef}
            className="w-full p-3 border border-gray-300 rounded-lg resize-y min-h-[100px] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="e.g., 'Add a retro filter', 'Remove the person in the background', 'Make it look like a painting'"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isLoading || !selectedImageBase64}
          ></textarea>

          <button
            onClick={handleEditImage}
            disabled={isLoading || !selectedImageBase64 || !prompt.trim()}
            className="w-full py-3 px-6 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <LoadingSpinner />
                <span className="ml-2">Editing...</span>
              </span>
            ) : (
              'Generate Edited Image'
            )}
          </button>
        </div>

        <ErrorMessage message={error || ''} />

        {editedImageBase64 && (
          <div className="mt-8 w-full bg-white p-2 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 text-center">Edited Image</h3>
            <img
              src={`data:image/png;base64,${editedImageBase64}`} // Assuming Gemini returns PNG for edited images
              alt="Edited by AI"
              className="max-w-full h-auto rounded-md object-contain max-h-[400px]"
            />
            <p className="text-sm text-gray-600 mt-2 text-center">Your image, reimagined by AI.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
