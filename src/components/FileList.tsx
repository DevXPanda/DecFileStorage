import React from 'react';
import { File, Download, Trash2, Calendar, HardDrive, Share2 } from 'lucide-react';
import { formatBytes } from '../lib/utils';
import { getPinataUrl } from '../lib/pinata';
import { ShareModal } from './ShareModal';

interface FileItem {
  cid: string;
  name: string;
  size: number;
  uploadedAt: Date;
}

interface FileListProps {
  files: FileItem[];
  onDelete: (cid: string) => void;
  onShare: (fileId: string, fileName: string, password: string | null, expiryDays: number | null) => Promise<string>;
}

export function FileList({ files, onDelete, onShare }: FileListProps) {
  if (files.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8 text-center">
        <div className="flex flex-col items-center justify-center py-8">
          <div className="bg-gray-100 rounded-full p-4 mb-4">
            <HardDrive className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No files uploaded yet</h3>
          <p className="text-gray-500 mb-6 max-w-sm">
            Drop and drag files here or use the upload button to store your files securely on IPFS
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 divide-y divide-gray-100 overflow-hidden">
      <div className="p-4 sm:p-6 flex justify-between items-center bg-gray-50">
        <h2 className="text-lg sm:text-xl font-medium text-gray-800">Your Files</h2>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {files.length} {files.length === 1 ? 'file' : 'files'}
        </span>
      </div>
      
      <div className="divide-y divide-gray-100">
        {files.map((file) => (
          <div 
            key={file.cid}
            className="p-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center group hover:bg-gray-50 transition-colors duration-150"
          >
            <div className="flex-1 min-w-0 mb-3 sm:mb-0">
              <div className="flex items-start">
                <div className="flex-shrink-0 mr-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <File className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-medium text-gray-900 truncate mb-0.5" title={file.name}>
                    {file.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                    <span>{formatBytes(file.size)}</span>
                    <span className="hidden sm:flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(file.uploadedAt).toLocaleDateString()}
                    </span>
                    <span className="text-xs text-gray-400 hidden xs:inline-block">
                      {file.cid.substring(0, 8)}...
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end space-x-2 sm:space-x-3">
              <ShareModal
                fileId={file.cid}
                fileName={file.name}
                onShare={(password, expiryDays) => {
                  console.log('ShareModal requesting share with:', { 
                    fileId: file.cid, 
                    fileName: file.name,
                    password,
                    expiryDays
                  });
                  // Pass ALL parameters to the App's handleShare function
                  return onShare(file.cid, file.name, password, expiryDays);
                }}
              />
              <a
                href={getPinataUrl(file.cid)}
                target="_blank"
                rel="noreferrer"
                className="p-2 text-gray-500 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-colors"
                title="Download"
              >
                <Download className="h-5 w-5" />
              </a>
              <button
                onClick={() => onDelete(file.cid)}
                className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors"
                title="Delete"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}