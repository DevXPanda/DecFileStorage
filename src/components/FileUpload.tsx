import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '../lib/utils';
import { uploadToPinata } from '../lib/pinata';

interface FileUploadProps {
  onUploadComplete: (hash: string, fileName: string, size: number) => void;
}

export function FileUpload({ onUploadComplete }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    try {
      setUploading(true);
      const file = acceptedFiles[0];
      const hash = await uploadToPinata(file);
      onUploadComplete(hash, file.name, file.size);
      toast.success('File uploaded successfully!');
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
    }
  }, [onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed rounded-2xl p-6 sm:p-8 md:p-12 text-center transition-all duration-300",
        isDragActive 
          ? "border-blue-500 bg-blue-50 scale-102 shadow-lg" 
          : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-3 sm:gap-4">
        {uploading ? (
          <>
            <div className="relative">
              <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 text-blue-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-white" />
              </div>
            </div>
            <h3 className="text-sm sm:text-base font-medium text-gray-700">Uploading file...</h3>
            <p className="text-xs sm:text-sm text-gray-500 max-w-xs mx-auto">
              This might take a moment depending on file size
            </p>
          </>
        ) : (
          <>
            <div className="p-3 sm:p-4 bg-blue-100 rounded-full">
              <Upload className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600" />
            </div>
            <h3 className="text-base sm:text-lg font-medium text-gray-800">
              Upload your file
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 max-w-xs mx-auto mb-2">
              Drag and drop your file here, or click to browse
            </p>
            <div className="inline-flex flex-wrap justify-center gap-2 text-xs text-gray-400">
              <span className="px-2 py-1 bg-gray-50 rounded-md border border-gray-100">Images</span>
              <span className="px-2 py-1 bg-gray-50 rounded-md border border-gray-100">Documents</span>
              <span className="px-2 py-1 bg-gray-50 rounded-md border border-gray-100">Videos</span>
              <span className="px-2 py-1 bg-gray-50 rounded-md border border-gray-100">Audio</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}