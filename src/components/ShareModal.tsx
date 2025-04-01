import { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { toast } from 'react-hot-toast';

// Custom icon components
const Share = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3"></circle>
    <circle cx="6" cy="12" r="3"></circle>
    <circle cx="18" cy="19" r="3"></circle>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
  </svg>
);

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const LinkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
  </svg>
);

const LockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

const CopyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>
);

const ExternalLinkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
    <polyline points="15 3 21 3 21 9"></polyline>
    <line x1="10" y1="14" x2="21" y2="3"></line>
  </svg>
);

interface ShareModalProps {
  fileId: string;
  fileName: string;
  onShare: (password: string | null, expiryDays: number | null) => Promise<string>;
}

export function ShareModal({ fileId, fileName, onShare }: ShareModalProps) {
  const [isOpen, setIsOpen] = useState(true);
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

  // Only render if isOpen is true
  if (!isOpen || !modalRoot) return null;

  // Directly render the content without conditional
  return (
    <>
      {ReactDOM.createPortal(
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
                <span className="mr-2"><Share /></span>
                Share File
              </h3>
              <button 
                onClick={closeModal}
                className="text-white/80 hover:text-white transition-colors"
              >
                <XIcon />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6">
              {!shareLink ? (
                <>
                  <div className="mb-6">
                    <div className="flex items-center mb-2">
                      <div className="p-2 bg-blue-100 rounded-md inline-block">
                        <LinkIcon />
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
                        <span className="mr-1 text-gray-500"><LockIcon /></span>
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
                      <span className="text-gray-500 mr-2"><CalendarIcon /></span>
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
                        <span className="mr-2"><Share /></span>
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
                            <span className="mr-1"><LockIcon /></span>
                            Protected
                          </span>
                        )}
                        {expiryDays && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                            <span className="mr-1"><CalendarIcon /></span>
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
                        <CopyIcon />
                        <span>Copy Link</span>
                      </button>
                      
                      <button 
                        onClick={openInNewTab}
                        className="flex-1 flex items-center justify-center gap-2 p-2 sm:px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors text-sm"
                      >
                        <ExternalLinkIcon />
                        <span>Open in New Tab</span>
                      </button>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setShareLink(null)}
                    className="w-full flex items-center justify-center py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                  >
                    <span className="mr-2"><Share /></span>
                    Create New Link
                  </button>
                </>
              )}
            </div>
          </div>
        </div>,
        modalRoot
      )}

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