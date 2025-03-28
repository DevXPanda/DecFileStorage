import { useEffect, useState } from 'react';
import { Download, FileText, ArrowLeft, ExternalLink, Lock, Calendar, Eye } from 'lucide-react';
import { getPinataUrl, getIpfsUrls } from '../lib/pinata';
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
    
    // Simple hash verification - in a real app, use a more secure method
    const inputHash = btoa(passwordInput);
    
    if (inputHash === fileInfo.passwordHash) {
      setIsPasswordVerified(true);
      toast.success('Password verified');
    } else {
      toast.error('Incorrect password');
    }
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

          <div className="w-24"></div> {/* Empty div for flex balance */}
        </div>

        <div className="flex-1 container mx-auto max-w-md p-6 flex items-center justify-center">
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
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="Enter password"
                    onKeyPress={(e) => e.key === 'Enter' && verifyPassword()}
                  />
                </div>
              </div>
              
              <button
                onClick={verifyPassword}
                className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
              >
                <Eye className="h-5 w-5" />
                <span className="font-medium">View File</span>
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

  const handleDownload = () => {
    try {
      // Get the main gateway URL
      const mainUrl = getPinataUrl(cid);
      window.open(mainUrl, '_blank');
      toast.success('Download started');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download file. Trying alternate gateway...');
      
      // Try the second gateway if available
      if (fallbackUrls.length > 1) {
        window.open(fallbackUrls[1], '_blank');
      }
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
                className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
              >
                <Download className="h-5 w-5" />
                <span className="font-medium">Download {fileType}</span>
              </button>
              
              {fallbackUrls.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-700 mb-2">If download doesn't start, try these alternate links:</p>
                  <div className="flex flex-wrap gap-2">
                    {fallbackUrls.slice(0, 3).map((url, index) => (
                      <a 
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs text-gray-700 transition-colors"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span>Gateway {index + 1}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
              
              <p className="text-center text-xs text-gray-500 mt-4">
                Files are stored on IPFS and accessible directly through multiple gateways
              </p>
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
