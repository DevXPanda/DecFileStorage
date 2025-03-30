import { useEffect, useState } from 'react';
import { Download, FileText, ArrowLeft, ExternalLink, Lock, Calendar, Eye } from 'lucide-react';
import { getPinataUrl, getIpfsUrls, getPinataDownloadUrl } from '../lib/pinata';
import { toast } from 'react-hot-toast';

interface SharedFileViewerProps {
  onBack: () => void;
}

export function SharedFileViewer({ onBack }: SharedFileViewerProps) {
  const [fileInfo, setFileInfo] = useState<{
    cid: string;
    fileName: string;
    isProtected: boolean;
    passwordHash?: string;
    expiryDate?: Date;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fallbackUrls, setFallbackUrls] = useState<string[]>([]);
  const [passwordInput, setPasswordInput] = useState('');
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    // Parse the URL query parameters to extract share information
    const parseShareUrl = () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const cid = urlParams.get('cid');
        const fileName = urlParams.get('file');
        const isProtected = urlParams.get('protected') === 'true';
        const passwordHash = urlParams.get('hash') || undefined;
        const expiryTimestamp = urlParams.get('expires');
        
        let expiryDate: Date | undefined;
        if (expiryTimestamp) {
          expiryDate = new Date(parseInt(expiryTimestamp));
          
          // Check if the link is expired
          if (expiryDate < new Date()) {
            setError('This share link has expired');
            setIsExpired(true);
            setLoading(false);
            return;
          }
        }

        if (!cid || !fileName) {
          setError('Invalid share link');
          setLoading(false);
          return;
        }

        // Store alternate gateway URLs
        setFallbackUrls(getIpfsUrls(cid));

        setFileInfo({
          cid,
          fileName: decodeURIComponent(fileName),
          isProtected,
          passwordHash,
          expiryDate
        });
        
        // Automatically set as verified if no password protection
        if (!isProtected) {
          setIsPasswordVerified(true);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Failed to parse share URL:', err);
        setError('Invalid share link');
        setLoading(false);
      }
    };

    parseShareUrl();
  }, []);
  
  const verifyPassword = () => {
    if (!fileInfo || !fileInfo.passwordHash) return;
    
    // Reset error state
    setPasswordError(null);
    setIsVerifying(true);
    
    // Simulate a small delay for better UX
    setTimeout(() => {
      // Simple hash verification - in a real app, use a more secure method
      const inputHash = btoa(passwordInput);
      
      if (inputHash === fileInfo.passwordHash) {
        setIsPasswordVerified(true);
        setPasswordError(null);
        toast.success('Password verified successfully');
      } else {
        setPasswordError('Incorrect password. Please try again.');
        toast.error('Incorrect password');
      }
      setIsVerifying(false);
    }, 500);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600">Loading shared file...</p>
      </div>
    );
  }

  if (error || !fileInfo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6 max-w-md text-center">
          <p className="font-medium">{error || 'File not found'}</p>
          <p className="text-sm mt-2">
            {isExpired 
              ? 'This share link has expired and is no longer accessible.'
              : 'This share link may be invalid or expired.'}
          </p>
        </div>
        <button
          onClick={onBack}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Home</span>
        </button>
      </div>
    );
  }
  
  // Password verification screen
  if (fileInfo.isProtected && !isPasswordVerified) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <div className="flex items-center justify-between p-4 bg-white shadow-sm border-b">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Home</span>
          </button>

          <h1 className="font-medium text-gray-900">Protected File</h1>

          <div className="w-24"></div>
        </div>

        <div className="flex-1 container mx-auto max-w-md px-6 -mt-12 flex items-start pt-20 justify-center">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden w-full">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white flex items-center">
                <Lock className="h-5 w-5 mr-2" />
                Password Protected
              </h2>
            </div>

            <div className="p-6">
              <div className="bg-blue-50 p-4 rounded-xl mb-6">
                <p className="text-sm text-blue-800">
                  This file is password protected. Please enter the password to access it.
                </p>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      setPasswordError(null); // Clear error when typing
                    }}
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl transition-all ${
                      passwordError 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    placeholder="Enter password"
                    onKeyPress={(e) => e.key === 'Enter' && !isVerifying && verifyPassword()}
                  />
                </div>
                {passwordError && (
                  <div className="mt-2 text-sm text-red-600 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {passwordError}
                  </div>
                )}
              </div>
              
              <button
                onClick={verifyPassword}
                disabled={isVerifying || !passwordInput}
                className={`w-full flex items-center justify-center space-x-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl transition-all shadow-md ${
                  isVerifying || !passwordInput
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg'
                }`}
              >
                {isVerifying ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span className="font-medium">Verifying...</span>
                  </>
                ) : (
                  <>
                    <Eye className="h-5 w-5" />
                    <span className="font-medium">View File</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { cid, fileName, expiryDate } = fileInfo;
  const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
  
  // Map file extensions to file types for display
  const getFileType = (ext: string) => {
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'];
    const docExts = ['pdf', 'doc', 'docx', 'txt', 'rtf'];
    const videoExts = ['mp4', 'mov', 'avi', 'webm'];
    const audioExts = ['mp3', 'wav', 'ogg'];
    
    if (imageExts.includes(ext)) return 'Image';
    if (docExts.includes(ext)) return 'Document';
    if (videoExts.includes(ext)) return 'Video';
    if (audioExts.includes(ext)) return 'Audio';
    return 'File';
  };
  
  const fileType = getFileType(fileExtension);

  const handleDownload = async () => {
    setIsDownloading(true);
    const toastId = toast.loading('Starting download...');

    try {
      const downloadUrl = `https://gateway.pinata.cloud/ipfs/${cid}?download=true&filename=${encodeURIComponent(fileName)}`;
      
      // Create a temporary anchor element for download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName; // Set the filename
      link.target = '_blank'; // Open in new tab if direct download fails
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      
      // Trigger the download
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      
      // Show success message after a short delay
      setTimeout(() => {
        setIsDownloading(false);
        toast.dismiss(toastId);
        
        toast.custom((t) => (
          <div className={`${
            t.visible ? 'animate-enter' : 'animate-leave'
          } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
            <div className="flex-1 w-0 p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Downloaded
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    If the download doesn't start automatically, click the download button again
                  </p>
                </div>
              </div>
            </div>
            <div className="flex border-l border-gray-200">
              <button
                onClick={() => toast.dismiss(t.id)}
                className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none"
              >
                Close
              </button>
            </div>
          </div>
        ), { duration: 3000 });
      }, 1000);

    } catch (error) {
      console.error('Download error:', error);
      setIsDownloading(false);
      toast.dismiss(toastId);
      toast.error('Failed to start download. Please try again.');
    }
  };

  const formatExpiryDate = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(date.getTime() - now.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Expires today';
    } else if (diffDays === 1) {
      return 'Expires tomorrow';
    } else {
      return `Expires in ${diffDays} days`;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="flex items-center justify-between p-4 bg-white shadow-sm border-b">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Home</span>
        </button>

        <h1 className="font-medium text-gray-900">Shared File</h1>

        <div className="w-24"></div> {/* Empty div for flex balance */}
      </div>

      <div className="flex-1 container mx-auto max-w-3xl p-6">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
            <h2 className="text-xl font-bold text-white">Shared File</h2>
          </div>

          <div className="p-6">
            <div className="flex flex-col md:flex-row items-center bg-gray-50 rounded-xl p-6 mb-6 border border-gray-100">
              <div className="bg-blue-100 p-4 rounded-full mb-4 md:mb-0 md:mr-6">
                <FileText className="h-10 w-10 text-blue-600" />
              </div>
              <div className="text-center md:text-left md:flex-1">
                <h3 className="text-xl font-medium text-gray-900 mb-1">{fileName}</h3>
                <p className="text-sm text-gray-600 mb-2">
                  {fileType} • Shared via IPFS
                </p>
                <div className="flex flex-wrap gap-2">
                  {fileInfo.isProtected && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      <Lock className="h-3 w-3 mr-1" />
                      Password Protected
                    </span>
                  )}
                  {expiryDate && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatExpiryDate(expiryDate)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDownloading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span className="font-medium">Downloading {fileType}...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5" />
                    <span className="font-medium">Download {fileType}</span>
                  </>
                )}
              </button>
              
              <div className="mt-4">
                <p className="text-center text-xs text-gray-500">
                  Files are stored securely on IPFS and accessible through our gateway
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="bg-white border-t border-gray-100 p-4 text-center text-sm text-gray-500">
        Decentralized Storage — Powered by IPFS & Pinata
      </footer>
    </div>
  );
}
