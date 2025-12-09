import React, { useState, FormEvent, useCallback } from 'react';
import { BlendMode } from '../types';

interface MergeImageModalProps {
  onClose: () => void;
  onMerge: (overlayImageBase64: string, overlayImageMimeType: string, blendMode: BlendMode, opacity: number) => void;
  baseImageBase64: string; // The image to merge onto (current edited result)
  baseImageMimeType: string;
  disabled: boolean;
}

const MergeImageModal: React.FC<MergeImageModalProps> = ({ onClose, onMerge, disabled }) => {
  const [overlayImageFile, setOverlayImageFile] = useState<File | null>(null);
  const [overlayImagePreview, setOverlayImagePreview] = useState<string | null>(null);
  const [blendMode, setBlendMode] = useState<BlendMode>(BlendMode.NORMAL);
  const [opacity, setOpacity] = useState<number>(1); // 0 to 1
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setOverlayImageFile(file);
      setError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setOverlayImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setOverlayImageFile(null);
      setOverlayImagePreview(null);
      setError("请选择有效的图片文件 (PNG, JPG, GIF)。");
    }
    event.target.value = ''; // Clear input
  }, []);

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!overlayImageFile) {
      setError("请先上传一张图片进行叠加。");
      return;
    }

    // Convert overlay file to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const [meta, base64Data] = base64String.split(',');
      const mimeType = meta.match(/:(.*?);/)?.[1] || overlayImageFile.type;
      onMerge(base64Data, mimeType, blendMode, opacity);
    };
    reader.readAsDataURL(overlayImageFile);

  }, [overlayImageFile, blendMode, opacity, onMerge]);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50" aria-modal="true" role="dialog">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg relative">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">叠加图片</h2>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-bold"
          aria-label="关闭"
          disabled={disabled}
        >
          &times;
        </button>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* File Upload for Overlay Image */}
          <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-blue-300 rounded-xl bg-blue-50 w-full text-center group transition-colors min-h-[120px]">
            {overlayImagePreview ? (
              <>
                <img src={overlayImagePreview} alt="Overlay preview" className="max-w-full max-h-32 rounded-md object-contain mb-2" />
                <button
                  type="button"
                  onClick={() => { setOverlayImageFile(null); setOverlayImagePreview(null); }}
                  className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600 text-xs"
                  aria-label="清除叠加图片"
                >
                  清除
                </button>
              </>
            ) : (
              <label htmlFor="overlay-file-upload" className="cursor-pointer w-full flex flex-col items-center p-2">
                <input
                  id="overlay-file-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={disabled}
                  aria-label="上传叠加图片文件"
                />
                <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                </svg>
                <p className="mt-2 text-sm font-semibold text-blue-700">
                  <span className="font-bold">点击上传</span> 叠加图片
                </p>
                <p className="text-xs text-gray-500 mt-1">支持PNG, JPG, GIF</p>
              </label>
            )}
          </div>

          {/* Blend Mode Selection */}
          <div>
            <label htmlFor="blend-mode" className="block text-sm font-medium text-gray-700 mb-1">
              混合模式:
            </label>
            <select
              id="blend-mode"
              value={blendMode}
              onChange={(e) => setBlendMode(e.target.value as BlendMode)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              disabled={disabled}
            >
              <option value={BlendMode.NORMAL}>正常叠加</option>
              <option value={BlendMode.OVERLAY}>叠加 (Overlay)</option>
            </select>
          </div>

          {/* Opacity Slider */}
          <div>
            <label htmlFor="opacity-slider" className="block text-sm font-medium text-gray-700 mb-1">
              不透明度: {(opacity * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              id="opacity-slider"
              min="0"
              max="1"
              step="0.01"
              value={opacity}
              onChange={(e) => setOpacity(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={disabled}
            />
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={disabled}
            >
              取消
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={disabled || !overlayImageFile}
            >
              确认叠加
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MergeImageModal;