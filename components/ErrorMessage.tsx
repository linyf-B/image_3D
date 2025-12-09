import React from 'react';

interface ErrorMessageProps {
  message: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  if (!message) return null;
  return (
    <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm mt-4 text-center" role="alert">
      {message}
    </div>
  );
};

export default ErrorMessage;
