import React from 'react';

interface ErrorMessageProps {
  message: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  if (!message) return null;
  return (
    <div className="p-4 bg-red-100 border-2 border-red-400 text-red-800 rounded-lg text-sm mt-5 text-center shadow-md" role="alert" aria-live="assertive">
      <strong>错误:</strong> {message}
    </div>
  );
};

export default ErrorMessage;