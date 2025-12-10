import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs
import { UploadedImage } from '../types';

interface UnifiedImageDisplayProps {
  allUploadedImages: UploadedImage[]; // All images uploaded by the user
  activeImageId: string | null; // ID of the currently active image for editing
  editedImageBase64: string | null;
  onImageSelect: (newImages: UploadedImage[], selectedId?: string) => void; // Now handles multiple images and setting active
  onClearImage: (imageIdToClear?: string) => void; // Clears a specific image or all
  onDownloadEditedImage: () => void;
  onMergeRequest: () => void; // Callback to open merge modal (now removed)
  isLoading: boolean;
  setActiveImageId: (id: string | null) => void; // To change active image from parent
}

const UnifiedImageDisplay: React.FC<UnifiedImageDisplayProps> = ({
  allUploadedImages,
  activeImageId,
  editedImageBase64,
  onImageSelect,
  onClearImage,
  onDownloadEditedImage,
  onMergeRequest, // Still required for prop type, but its implementation removed
  isLoading,
  setActiveImageId,
}) => {
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartY, setDragStartY] = useState(0);

  const [showOriginalForComparison, setShowOriginalForComparison] = useState<boolean>(false);

  const activeImage = useMemo(() => {
    return allUploadedImages.find(img => img.id === activeImageId) || null;
  }, [allUploadedImages, activeImageId]);

  // Determine which image to display in the main view
  const displayImageBase64 = editedImageBase64 && !showOriginalForComparison
    ? editedImageBase64 // If edited exists and not showing original, show edited
    : activeImage?.base64 || null; // Otherwise, show active original image

  const displayImageMimeType = editedImageBase64 && !showOriginalForComparison
    ? 'image/png' // Assuming edited output is PNG
    : activeImage?.mimeType || null; // Use original MIME type for active original image

  const resetZoomAndPan = useCallback(() => {
    setZoomLevel(1);
    setOffsetX(0);
    setOffsetY(0);
  }, []);

  // Effect to manage comparison toggle and reset zoom/pan
  useEffect(() => {
    if (activeImage) {
      if (editedImageBase64) {
        // If both original (active) and edited exist, default to showing edited result.
        setShowOriginalForComparison(false);
      } else {
        // If only original (active) exists (just uploaded, or edited was cleared), show original.
        setShowOriginalForComparison(true);
      }
    } else {
      // No images at all
      setShowOriginalForComparison(false);
    }
    resetZoomAndPan(); // Always reset zoom/pan when core image states change
  }, [activeImage, editedImageBase64, resetZoomAndPan]);


  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    // Explicitly cast to File[] to avoid 'unknown' type inference issues with Array.from on FileList
    const files = Array.from(event.target.files || []) as File[];
    if (files.length > 0) {
      const newImagesPromises = files.map(file => {
        return new Promise<UploadedImage>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64String = reader.result as string;
            const [meta, base64Data] = base64String.split(',');
            const mimeType = meta.match(/:(.*?);/)?.[1] || file.type;
            resolve({
              id: uuidv4(),
              base64: base64Data,
              mimeType: mimeType,
              fileName: file.name,
            });
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      try {
        const newUploadedImages = await Promise.all(newImagesPromises);
        const updatedAllImages = [...allUploadedImages, ...newUploadedImages];
        onImageSelect(updatedAllImages, newUploadedImages[0].id); // Pass all images and set first new one as active
      } catch (error) {
        console.error("Error reading files:", error);
        // Optionally, show an error message to the user
      }
    }
    event.target.value = ''; // Clear the input value
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
          {/* Merge button functionality removed */}
        </>
      ) : (
        <label htmlFor="file-upload" className="cursor-pointer w-full h-full flex flex-col items-center justify-center p-4">
          <input
            id="file-upload"
            type="file"
            accept="image/*"
            multiple // Allow multiple file selection
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
      {/* Main Image Uploader / Display */}
      {ImageDisplayContent}

      {/* Control buttons when image is present */}
      {activeImage && (
        <div className="flex flex-col gap-2 p-4 bg-gray-50 rounded-lg shadow-md border border-gray-200">
          <div className="flex flex-wrap justify-center gap-2"> {/* Consolidated buttons into one row */}
            <button
              onClick={() => setShowOriginalForComparison(true)}
              disabled={isLoading}
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
            <button
              onClick={() => onClearImage(activeImage.id)} // Clear only the active image
              className="py-2 px-4 bg-red-500 text-white font-semibold rounded-md hover:bg-red-600 transition-colors disabled:bg-red-300 text-sm"
              disabled={isLoading}
              aria-label="清除当前图片"
            >
              清除当前图片
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

      {/* Thumbnail Gallery for Multiple Uploaded Images */}
      {allUploadedImages.length > 0 && (
        <div className="w-full overflow-x-auto whitespace-nowrap py-2 pr-2 -mr-2 scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-blue-100">
          <div className="inline-flex gap-2">
            {allUploadedImages.map((img) => (
              <div
                key={img.id}
                className={`relative group inline-block w-24 h-24 flex-shrink-0 rounded-md border-2 transition-all duration-200
                  ${img.id === activeImageId ? 'border-blue-500 ring-2 ring-blue-500 shadow-md' : 'border-gray-300 hover:border-blue-300'}
                `}
              >
                <img
                  src={`data:${img.mimeType};base64,${img.base64}`}
                  alt={img.fileName}
                  className="w-full h-full object-cover rounded-md cursor-pointer"
                  onClick={() => setActiveImageId(img.id)}
                  title={img.fileName}
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent activating image when deleting
                    onClearImage(img.id);
                  }}
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  aria-label={`删除图片: ${img.fileName}`}
                  title="删除图片"
                  disabled={isLoading}
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedImageDisplay;