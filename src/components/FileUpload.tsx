import React, { useCallback } from 'react';
import { Upload } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => Promise<void>;
  uploading: boolean;
  dragging: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect, 
  onDrop, 
  uploading, 
  dragging
}) => {
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  // Custom loading spinner
  const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center">
      <div className="relative">
        <div className="h-20 w-20 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mb-4"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <Upload className="h-8 w-8 text-violet-600" />
        </div>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">Uploading file...</h3>
      <p className="text-gray-500 mb-2">Please wait while we upload your file to IPFS</p>
      <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full bg-violet-600 rounded-full animate-pulse"></div>
      </div>
      <p className="text-xs text-gray-500 mt-3">This may take a moment depending on the file size</p>
    </div>
  );

  if (uploading) {
    return (
      <div className="border-2 border-dashed rounded-xl p-8 text-center border-gray-200 bg-gray-50">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div 
      className={`relative border-2 border-dashed rounded-xl p-8 text-center ${
        dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
      } hover:border-violet-300 hover:bg-violet-50/20 transition-all duration-200`}
      onDragOver={handleDragOver}
      onDrop={onDrop}
    >
      <input
        type="file"
        id="file-upload"
        className="hidden"
        onChange={onFileSelect}
        multiple
      />
      
      <div className="flex flex-col items-center justify-center">
        <div className="mb-6 bg-violet-100 p-4 rounded-full">
          <Upload className="w-8 h-8 text-violet-600 mx-auto" />
        </div>

        <h3 className="text-lg font-medium text-gray-900 mb-2">Upload your file</h3>
        <p className="text-gray-500 mb-8">Drag and drop your file here, or click to browse</p>
        
        <label
          htmlFor="file-upload"
          className="w-full max-w-xs px-4 py-3 bg-violet-600 text-white text-center rounded-lg cursor-pointer hover:bg-violet-700 transition-colors shadow-md hover:shadow-lg flex items-center justify-center"
        >
          <span className="font-medium">Choose File</span>
        </label>
        
        <p className="text-xs text-gray-500 mt-4">Supports most common file types up to 50MB</p>
      </div>
    </div>
  );
};