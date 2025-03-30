import  { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Share2, Link2, X, Lock, Calendar, Copy, ExternalLink } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ShareModalProps {
  fileId: string;
  fileName: string;
  onShare: (password: string | null, expiryDays: number | null) => Promise<string>;
}

export function ShareModal({ fileId, fileName, onShare }: ShareModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isProtected, setIsProtected] = useState(false);
  const [password, setPassword] = useState('');
  const [expiryDays, setExpiryDays] = useState<number | ''>('');
  const [isLoading, setIsLoading] = useState(false);
  const [modalRoot, setModalRoot] = useState<HTMLElement | null>(null);
  const [shareLink, setShareLink] = useState<string | null>(null);

  useEffect(() => {
    setModalRoot(document.body);
  }, []);

  const handleShare = async () => {
    try {
      setIsLoading(true);
      
      // Call onShare to generate the link
      const generatedLink = await onShare(
        isProtected ? password : null,
        expiryDays ? Number(expiryDays) : null
      );
      
      // Store the link instead of closing modal
      setShareLink(generatedLink);
      setIsLoading(false);
    } catch (error) {
      console.error('Error sharing file:', error);
      setIsLoading(false);
      toast.error('Failed to share file');
    }
  };
  
  const copyToClipboard = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink)
        .then(() => toast.success('Link copied to clipboard!'))
        .catch(err => {
          console.error('Failed to copy link:', err);
          toast.error('Could not copy link. Please select and copy manually.');
        });
    }
  };

  const openInNewTab = () => {
    if (shareLink) {
      window.open(shareLink, '_blank');
    }
  };

  const closeModal = () => {
    setIsOpen(false);
    // Reset state after closing
    setTimeout(() => {
      setShareLink(null);
      setPassword('');
      setExpiryDays('');
      setIsProtected(false);
    }, 300);
  };

  const modalContent = isOpen && (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn"
         onClick={closeModal}>
      <div 
        className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-auto overflow-hidden transform transition-all"
        style={{
          animation: 'slideUp 0.3s ease-out forwards',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex justify-between items-center">
          <h3 className="text-lg font-bold text-white flex items-center">
            <Share2 className="mr-2 h-5 w-5" /> 
            Share File
          </h3>
          <button 
            onClick={closeModal}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Modal Body */}
        <div className="p-6">
          {!shareLink ? (
            <>
              <div className="mb-6">
                <div className="flex items-center mb-2">
                  <div className="p-2 bg-blue-100 rounded-md inline-block">
                    <Link2 className="h-4 w-4 text-blue-600" />
                  </div>
                  <p className="ml-2 text-sm font-medium text-gray-600">Sharing options for:</p>
                </div>
                
                <p className="text-sm font-medium text-gray-900 truncate ml-10" title={fileName}>
                  {fileName}
                </p>
              </div>

              <div className="mb-6">
                <div className="flex items-center mb-3">
                  <input
                    type="checkbox"
                    id="password-protect"
                    checked={isProtected}
                    onChange={(e) => setIsProtected(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="password-protect" className="ml-2 block text-sm font-medium text-gray-700 flex items-center">
                    <Lock className="h-4 w-4 mr-1 text-gray-500" />
                    Password Protection
                  </label>
                </div>
                
                {isProtected && (
                  <div className="ml-6 p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <label htmlFor="password" className="block text-xs font-medium text-gray-700 mb-1">
                      Set a password for this share
                    </label>
                    <input
                      type="password"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                )}
              </div>
              
              <div className="mb-6">
                <div className="flex items-center mb-3">
                  <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                  <label htmlFor="expiry-days" className="block text-sm font-medium text-gray-700">
                    Expiry (days)
                  </label>
                </div>
                
                <select
                  id="expiry-days"
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">No expiry</option>
                  <option value="1">1 day</option>
                  <option value="3">3 days</option>
                  <option value="7">7 days</option>
                  <option value="30">30 days</option>
                </select>
              </div>
              
              <button
                onClick={handleShare}
                disabled={isLoading || (isProtected && !password)}
                className={`w-full flex items-center justify-center py-3 px-4 rounded-lg text-white font-medium transition-all ${
                  isLoading || (isProtected && !password)
                    ? 'bg-gray-400 cursor-not-allowed opacity-70'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg'
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating Link...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Share2 className="mr-2 h-4 w-4" />
                    Generate Link
                  </span>
                )}
              </button>
            </>
          ) : (
            <>
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-700">Share link generated</h4>
                  <div className="flex items-center space-x-1">
                    {isProtected && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                        <Lock className="h-3 w-3 mr-1" />
                        Protected
                      </span>
                    )}
                    {expiryDays && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                        <Calendar className="h-3 w-3 mr-1" />
                        {expiryDays} day{expiryDays > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3 break-all">
                  <p className="text-xs text-gray-700 font-mono">{shareLink}</p>
                </div>
                
                <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                  <button
                    onClick={copyToClipboard}
                    className="flex-1 flex items-center justify-center gap-2 p-2 sm:px-4 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors text-sm"
                  >
                    <Copy className="h-4 w-4" />
                    <span>Copy Link</span>
                  </button>
                  
                  <button 
                    onClick={openInNewTab}
                    className="flex-1 flex items-center justify-center gap-2 p-2 sm:px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors text-sm"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>Open in New Tab</span>
                  </button>
                </div>
              </div>
              
              <button
                onClick={() => setShareLink(null)}
                className="w-full flex items-center justify-center py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                <Share2 className="mr-2 h-4 w-4" />
                Create New Link
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 text-gray-500 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-colors"
        title="Share"
      >
        <Share2 className="h-5 w-5" />
      </button>
      
      {modalRoot && isOpen && ReactDOM.createPortal(modalContent, modalRoot)}

      {/* Add CSS animations for modal */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }
      ` }} />
    </>
  );
}