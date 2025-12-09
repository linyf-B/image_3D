
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { BlendMode } from '../types';

interface UnifiedImageDisplayProps {
  selectedImageBase64: string | null;
  selectedImageMimeType: string | null;
  editedImageBase64: string | null;
  onImageSelect: (base64: string, mimeType: string) => void;
  onClearImage: () => void;
  onDownloadEditedImage: () => void;
  onMergeRequest: () => void; // Callback to open merge modal
  isLoading: boolean;
}

const UnifiedImageDisplay: React.FC<UnifiedImageDisplayProps> = ({
  selectedImageBase64,
  selectedImageMimeType,
  editedImageBase64,
  onImageSelect,
  onClearImage,
  onDownloadEditedImage,
  onMergeRequest,
  isLoading,
}) => {
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartY, setDragStartY] = useState(0);

  const [showOriginalForComparison, setShowOriginalForComparison] = useState<boolean>(false);

  // Determine which image to display based on state
  const displayImageBase64 = editedImageBase64 && !showOriginalForComparison
    ? editedImageBase64 // If edited exists and not showing original, show edited
    : selectedImageBase64; // Otherwise, show original (either by default or if edited is null)

  const displayImageMimeType = editedImageBase64 && !showOriginalForComparison
    ? 'image/png' // Assuming edited output is PNG
    : selectedImageMimeType; // Use original MIME type for original image

  const resetZoomAndPan = useCallback(() => {
    setZoomLevel(1);
    setOffsetX(0);
    setOffsetY(0);
  }, []);

  // Effect to manage comparison toggle and reset zoom/pan
  useEffect(() => {
    if (selectedImageBase64) {
      if (editedImageBase64) {
        // If both original and edited exist, default to showing edited result.
        setShowOriginalForComparison(false);
      } else {
        // If only original exists (just uploaded, or edited was cleared), show original.
        setShowOriginalForComparison(true);
      }
    } else {
      // No images at all
      setShowOriginalForComparison(false);
    }
    resetZoomAndPan(); // Always reset zoom/pan when core image states change
  }, [selectedImageBase64, editedImageBase64, resetZoomAndPan]);


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const [meta, base64Data] = base64String.split(',');
        const mimeType = meta.match(/:(.*?);/)?.[1] || file.type;
        onImageSelect(base64Data, mimeType);
        event.target.value = ''; // Clear the input value
      };
      reader.readAsDataURL(file);
    }
  };

  const handleZoom = useCallback((event: React.WheelEvent<HTMLDivElement>) => {
    if (!displayImageBase64 || !imageContainerRef.current) return;

    event.preventDefault(); // Prevent page scroll

    const scaleAmount = 0.1;
    const container = imageContainerRef.current;
    const rect = container.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    let newZoomLevel;
    if (event.deltaY < 0) {
      newZoomLevel = Math.min(zoomLevel + scaleAmount, 5); // Max zoom 5x
    } else {
      newZoomLevel = Math.max(zoomLevel - scaleAmount, 0.5); // Min zoom 0.5x
    }

    const zoomRatio = newZoomLevel / zoomLevel;

    // Calculate new offsets to zoom around the mouse position
    const newOffsetX = mouseX - (mouseX - offsetX) * zoomRatio;
    const newOffsetY = mouseY - (mouseY - offsetY) * zoomRatio;

    setZoomLevel(newZoomLevel);
    setOffsetX(newOffsetX);
    setOffsetY(newOffsetY);
  }, [zoomLevel, offsetX, offsetY, displayImageBase64]);

  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (event.button !== 0 || zoomLevel === 1 || !displayImageBase64) return; // Only left click for dragging when zoomed
    setIsDragging(true);
    setDragStartX(event.clientX - offsetX);
    setDragStartY(event.clientY - offsetY);
    // Add active dragging class to change cursor
    imageContainerRef.current?.classList.add('cursor-grabbing');
  }, [zoomLevel, offsetX, offsetY, displayImageBase64]);

  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setOffsetX(event.clientX - dragStartX);
    setOffsetY(event.clientY - dragStartY);
  }, [isDragging, dragStartX, dragStartY]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    imageContainerRef.current?.classList.remove('cursor-grabbing');
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      imageContainerRef.current?.classList.remove('cursor-grabbing');
    }
  }, [isDragging]);

  const ImageDisplayContent = (
    <div
      ref={imageContainerRef}
      className={`relative flex items-center justify-center overflow-hidden rounded-md border border-gray-200 shadow-sm
        ${displayImageBase64 && zoomLevel > 1 ? 'cursor-grab' : ''}
      `}
      onWheel={handleZoom}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      style={{
        height: '400px', // Fixed height for the image display/upload area
        cursor: isDragging ? 'grabbing' : (zoomLevel > 1 ? 'grab' : 'default'),
      }}
    >
      {displayImageBase64 ? (
        <>
          <img
            src={`data:${displayImageMimeType};base64,${displayImageBase64}`}
            alt={showOriginalForComparison ? "Original Image" : "Edited by AI"}
            className="max-w-full max-h-full object-contain will-change-transform"
            style={{
              transform: `translate(${offsetX}px, ${offsetY}px) scale(${zoomLevel})`,
              transition: isDragging ? 'none' : 'transform 0.1s ease-out',
              transformOrigin: '0 0',
              cursor: isDragging ? 'grabbing' : (zoomLevel > 1 ? 'grab' : 'default'),
            }}
          />
          {/* Merge button only on edited image when it's the current display */}
          {!showOriginalForComparison && editedImageBase64 && (
            <button
              onClick={onMergeRequest}
              className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 text-white text-5xl opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-md"
              aria-label="叠加图片"
              title="点击叠加另一张图片"
              disabled={isLoading}
            >
              +
            </button>
          )}
        </>
      ) : (
        <label htmlFor="file-upload" className="cursor-pointer w-full h-full flex flex-col items-center justify-center p-4">
          <input
            id="file-upload"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={isLoading}
            aria-label="上传图片文件"
          />
          <svg className="w-12 h-12 text-blue-500 group-hover:text-blue-700 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
          </svg>
          <p className="mt-3 text-lg font-semibold text-blue-700 group-hover:text-blue-900">
            <span className="font-bold">点击上传</span> 或拖放图片
          </p>
          <p className="text-sm text-gray-500 mt-1">支持PNG, JPG, GIF格式，最大10MB</p>
        </label>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Image Uploader / Display */}
      {ImageDisplayContent}

      {/* Control buttons when image is present */}
      {selectedImageBase64 && (
        <div className="flex flex-col gap-2 p-4 bg-gray-50 rounded-lg shadow-md border border-gray-200">
          <div className="flex justify-center gap-2 mb-2">
            <button
              onClick={() => setShowOriginalForComparison(true)}
              disabled={!selectedImageBase64 || isLoading}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                showOriginalForComparison
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
              }`}
            >
              查看原图
            </button>
            <button
              onClick={() => setShowOriginalForComparison(false)}
              disabled={!editedImageBase64 || isLoading}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                !showOriginalForComparison
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
              }`}
            >
              查看编辑结果
            </button>
          </div>

          <div className="flex justify-center gap-2">
            <button
              onClick={onClearImage}
              className="py-2 px-4 bg-red-500 text-white font-semibold rounded-md hover:bg-red-600 transition-colors disabled:bg-red-300 text-sm"
              disabled={isLoading}
              aria-label="清除当前图片"
            >
              清除图片
            </button>
            <button
              onClick={resetZoomAndPan}
              className="py-2 px-4 bg-gray-300 text-gray-800 font-semibold rounded-md hover:bg-gray-400 transition-colors disabled:bg-gray-200 text-sm"
              disabled={isLoading || zoomLevel === 1}
              aria-label="重置图片缩放"
            >
              重置缩放
            </button>
            {!showOriginalForComparison && editedImageBase64 && (
              <button
                onClick={onDownloadEditedImage}
                className="py-2 px-4 bg-green-500 text-white font-semibold rounded-md hover:bg-green-600 transition-colors disabled:bg-green-300 text-sm"
                disabled={isLoading}
                aria-label="下载编辑后的图片"
              >
                下载
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedImageDisplay;
