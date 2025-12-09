import React from 'react';
import LoadingSpinner from './LoadingSpinner'; // Assuming this path is correct

interface PromptSuggestionsProps {
  suggestions: string[];
  onSelectSuggestion: (suggestion: string) => void;
  isLoading: boolean;
  error: string | null;
}

const PromptSuggestions: React.FC<PromptSuggestionsProps> = ({
  suggestions,
  onSelectSuggestion,
  isLoading,
  error,
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-2 text-sm text-blue-600">
        <LoadingSpinner />
        <span className="ml-2">生成建议中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-2 text-sm text-red-500 text-center">
        错误：{error}
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null; // Don't show anything if no suggestions and not loading/error
  }

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {suggestions.map((suggestion, index) => (
        <button
          key={index}
          onClick={() => onSelectSuggestion(suggestion)}
          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm hover:bg-blue-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label={`添加提示词建议: ${suggestion}`}
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
};

export default PromptSuggestions;