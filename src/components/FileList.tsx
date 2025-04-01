import React, { useState } from 'react';
import { formatBytes } from '../lib/utils';
import { getPinataUrl } from '../lib/pinata';
import { ShareModal } from './ShareModal';

// Use actual available icons
import { FileText } from 'lucide-react';

// Custom icon components as fallbacks
const Share = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3"></circle>
    <circle cx="6" cy="12" r="3"></circle>
    <circle cx="18" cy="19" r="3"></circle>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
  </svg>
);

const Download = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="7 10 12 15 17 10"></polyline>
    <line x1="12" y1="15" x2="12" y2="3"></line>
  </svg>
);

const Trash = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

interface FileItem {
  id: string;
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
  const [selectedFile, setSelectedFile] = useState<{id: string, name: string} | null>(null);

  const handleShareClick = (fileId: string, fileName: string) => {
    setSelectedFile({ id: fileId, name: fileName });
  };

  const handleModalShare = async (password: string | null, expiryDays: number | null) => {
    if (!selectedFile) return '';
    return await onShare(selectedFile.id, selectedFile.name, password, expiryDays);
  };

  if (files.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8 text-center">
        <div className="flex flex-col items-center justify-center py-8">
          <div className="bg-gray-100 rounded-full p-4 mb-4">
            <FileText className="h-8 w-8 text-gray-400" />
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
    <div>
      {selectedFile && (
        <ShareModal
          fileId={selectedFile.id}
          fileName={selectedFile.name}
          onShare={handleModalShare}
        />
      )}
      
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-medium text-gray-800">Your Files</h2>
        {/* <div className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
          {files.length} {files.length === 1 ? 'file' : 'files'}
        </div> */}
      </div>
      
      <div className="space-y-3">
        {files.map((file) => (
          <div key={file.id} className="flex items-center justify-between bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className="flex items-center">
              <div className="bg-violet-100 p-3 rounded-lg mr-4">
                <FileText className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="font-medium text-gray-800">{file.name}</p>
                <p className="text-xs text-gray-500 mt-1">{formatBytes(file.size)}</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={() => handleShareClick(file.cid, file.name)}
                className="p-2 text-gray-500 hover:text-violet-600 rounded-full hover:bg-violet-50 transition-colors"
                title="Share"
              >
                <Share />
              </button>
              <a
                href={getPinataUrl(file.cid)}
                download={file.name}
                className="p-2 text-gray-500 hover:text-violet-600 rounded-full hover:bg-violet-50 transition-colors"
                title="Download"
              >
                <Download />
              </a>
              <button
                onClick={() => onDelete(file.cid)}
                className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors"
                title="Delete"
              >
                <Trash />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}