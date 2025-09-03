import React, { useState, useRef, useCallback } from 'react';
import { profileApi } from '../../services/api';
import { AvatarUploadResult, AvatarCropData } from '../../types/profile';

interface AvatarUploadProps {
  currentAvatar?: string;
  onAvatarUpdate: (result: AvatarUploadResult) => void;
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({
  currentAvatar,
  onAvatarUpdate,
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const [cropData, setCropData] = useState<AvatarCropData>({
    x: 0,
    y: 0,
    width: 200,
    height: 200,
    scale: 1,
  });

  const [dragState, setDragState] = useState({
    isDragging: false,
    startX: 0,
    startY: 0,
    startCropX: 0,
    startCropY: 0,
  });

  const handleFileSelect = useCallback((file: File) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please select a JPEG, PNG, or WebP image file.');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB.');
      return;
    }

    setSelectedFile(file);
    setError(null);

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setShowCropper(true);

    // Reset crop data
    setCropData({
      x: 0,
      y: 0,
      width: 200,
      height: 200,
      scale: 1,
    });
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleImageLoad = () => {
    if (imageRef.current) {
      const img = imageRef.current;
      const size = Math.min(img.naturalWidth, img.naturalHeight);
      const x = (img.naturalWidth - size) / 2;
      const y = (img.naturalHeight - size) / 2;
      
      setCropData({
        x,
        y,
        width: size,
        height: size,
        scale: 1,
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const scaleX = imageRef.current.naturalWidth / rect.width;
    const scaleY = imageRef.current.naturalHeight / rect.height;

    setDragState({
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      startCropX: cropData.x,
      startCropY: cropData.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragState.isDragging || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const scaleX = imageRef.current.naturalWidth / rect.width;
    const scaleY = imageRef.current.naturalHeight / rect.height;

    const deltaX = (e.clientX - dragState.startX) * scaleX;
    const deltaY = (e.clientY - dragState.startY) * scaleY;

    const newX = Math.max(0, Math.min(
      imageRef.current.naturalWidth - cropData.width,
      dragState.startCropX + deltaX
    ));
    const newY = Math.max(0, Math.min(
      imageRef.current.naturalHeight - cropData.height,
      dragState.startCropY + deltaY
    ));

    setCropData(prev => ({
      ...prev,
      x: newX,
      y: newY,
    }));
  };

  const handleMouseUp = () => {
    setDragState(prev => ({ ...prev, isDragging: false }));
  };

  const handleScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const scale = parseFloat(e.target.value);
    setCropData(prev => ({ ...prev, scale }));
  };

  const getCroppedCanvas = (): HTMLCanvasElement | null => {
    if (!imageRef.current || !canvasRef.current) return null;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const img = imageRef.current;
    const size = 512; // Output size
    canvas.width = size;
    canvas.height = size;

    // Calculate scaled dimensions
    const scaledWidth = cropData.width * cropData.scale;
    const scaledHeight = cropData.height * cropData.scale;

    ctx.drawImage(
      img,
      cropData.x,
      cropData.y,
      cropData.width,
      cropData.height,
      0,
      0,
      size,
      size
    );

    return canvas;
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError(null);

    try {
      let fileToUpload = selectedFile;

      // If cropping is enabled, create cropped file
      if (showCropper) {
        const canvas = getCroppedCanvas();
        if (canvas) {
          const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((blob) => {
              resolve(blob!);
            }, 'image/jpeg', 0.9);
          });
          fileToUpload = new File([blob], selectedFile.name, { type: 'image/jpeg' });
        }
      }

      const result = await profileApi.uploadAvatar(fileToUpload);
      onAvatarUpdate(result);
      
      // Reset state
      setSelectedFile(null);
      setPreviewUrl(null);
      setShowCropper(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      console.error('Avatar upload failed:', err);
      setError(err.response?.data?.message || 'Failed to upload avatar. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setShowCropper(false);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteAvatar = async () => {
    if (!currentAvatar) return;

    try {
      setUploading(true);
      await profileApi.deleteAvatar(currentAvatar);
      onAvatarUpdate({ filename: '', url: '', size: 0 });
    } catch (err: any) {
      console.error('Avatar delete failed:', err);
      setError(err.response?.data?.message || 'Failed to delete avatar. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Avatar Display */}
      <div className="flex items-center space-x-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
            {currentAvatar ? (
              <img
                src={currentAvatar}
                alt="Current avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-medium text-gray-900">Profile Picture</h3>
          <p className="text-sm text-gray-600">
            Upload a photo to personalize your account. Recommended size: 512x512 pixels.
          </p>
          <div className="mt-2 flex space-x-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {currentAvatar ? 'Change Photo' : 'Upload Photo'}
            </button>
            {currentAvatar && (
              <button
                onClick={handleDeleteAvatar}
                disabled={uploading}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                Remove Photo
              </button>
            )}
          </div>
        </div>
      </div>

      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Drag and Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
      >
        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className="mt-4">
          <p className="text-sm text-gray-600">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Click to upload
            </button>
            {' '}or drag and drop
          </p>
          <p className="text-xs text-gray-500 mt-1">
            JPEG, PNG, or WebP up to 5MB
          </p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Image Cropper */}
      {showCropper && previewUrl && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Crop Your Photo</h4>
          
          <div className="space-y-4">
            <div className="relative inline-block">
              <img
                ref={imageRef}
                src={previewUrl}
                alt="Preview"
                onLoad={handleImageLoad}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                className="max-w-md max-h-96 cursor-move select-none"
                draggable={false}
              />
              
              {/* Crop Overlay */}
              <div
                className="absolute border-2 border-blue-500 bg-blue-500 bg-opacity-20 pointer-events-none"
                style={{
                  left: `${(cropData.x / imageRef.current?.naturalWidth || 1) * 100}%`,
                  top: `${(cropData.y / imageRef.current?.naturalHeight || 1) * 100}%`,
                  width: `${(cropData.width / imageRef.current?.naturalWidth || 1) * 100}%`,
                  height: `${(cropData.height / imageRef.current?.naturalHeight || 1) * 100}%`,
                }}
              />
            </div>

            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">
                Zoom:
              </label>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.1"
                value={cropData.scale}
                onChange={handleScaleChange}
                className="flex-1"
              />
              <span className="text-sm text-gray-600">
                {Math.round(cropData.scale * 100)}%
              </span>
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={handleCancel}
                disabled={uploading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {uploading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Uploading...
                  </div>
                ) : (
                  'Upload Photo'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simple Upload (no cropping) */}
      {selectedFile && !showCropper && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200">
                {previewUrl && (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleCancel}
                disabled={uploading}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Canvas for Cropping */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default AvatarUpload;