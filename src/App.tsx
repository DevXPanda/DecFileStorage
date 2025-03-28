import React, { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { HardDrive, Upload, FileText, Cloud } from 'lucide-react';
import { FileUpload } from './components/FileUpload';
import { FileList } from './components/FileList';
import { PinataForm } from './components/PinataForm';
import { ShareModal } from './components/ShareModal';
import { WalletStatus } from './components/WalletStatus';
import { SharedFileViewer } from './components/SharedFileViewer';
import { toast } from 'react-hot-toast';

interface FileItem {
  cid: string;
  name: string;
  size: number;
  uploadedAt: Date;
}

function App() {
  const { isAuthenticated, account, connectMetamask, disconnectWallet } = useAuth();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [showPinataConfig, setShowPinataConfig] = useState(false);
  const [hasPinataKeys, setHasPinataKeys] = useState(false);
  const [isSharedView, setIsSharedView] = useState(false);
  
  // Check if we're viewing a shared file link
  useEffect(() => {
    // Check URL query parameters for shareView=true
    const urlParams = new URLSearchParams(window.location.search);
    const isShareView = urlParams.get('shareView') === 'true';
    
    console.log('Checking if this is a share link:', { 
      params: window.location.search,
      isShareView 
    });
    
    setIsSharedView(isShareView);
  }, []);
  
  // Debug logging
  console.log("Auth state:", { isAuthenticated, account, isSharedView });

  // Check for existing Pinata keys
  useEffect(() => {
    const apiKey = localStorage.getItem('pinata_api_key');
    const secretKey = localStorage.getItem('pinata_secret_key');
    
    if (apiKey && secretKey) {
      setHasPinataKeys(true);
      setShowPinataConfig(false);
    } else {
      setHasPinataKeys(false);
    }
  }, []);
  
  // Show Pinata config immediately after wallet connection
  useEffect(() => {
    if (isAuthenticated) {
      const apiKey = localStorage.getItem('pinata_api_key');
      const secretKey = localStorage.getItem('pinata_secret_key');
      
      if (!apiKey || !secretKey) {
        console.log("Wallet connected, showing Pinata config");
        setShowPinataConfig(true);
        setHasPinataKeys(false);
      } else {
        setHasPinataKeys(true);
        setShowPinataConfig(false);
      }
    }
  }, [isAuthenticated]);

  const handleConnectWallet = async () => {
    try {
      await connectMetamask();
      console.log("Wallet connected successfully");
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
  };

  const handleUploadComplete = (cid: string, fileName: string, size: number) => {
    setFiles((prev) => [
      {
        cid,
        name: fileName,
        size,
        uploadedAt: new Date(),
      },
      ...prev,
    ]);
  };

  const handleDelete = (cid: string) => {
    setFiles((prev) => prev.filter((file) => file.cid !== cid));
    toast.success('File deleted successfully');
  };

  const handlePinataSave = (apiKey: string, secretKey: string) => {
    localStorage.setItem('pinata_api_key', apiKey);
    localStorage.setItem('pinata_secret_key', secretKey);
    setHasPinataKeys(true);
    setShowPinataConfig(false);
    toast.success('Pinata keys configured successfully!');
  };

  const handleShare = async (fileId: string, fileName: string, password: string | null = null, expiryDays: number | null = null) => {
    try {
      // Base URL with file info
      let shareUrl = `${window.location.origin}?shareView=true&file=${encodeURIComponent(fileName)}&cid=${fileId}`;
      
      // Add password hash if password protection is enabled
      if (password) {
        // Simple hash for the password - in a real app, use a more secure method
        const passwordHash = btoa(password); // Base64 encode for simplicity
        shareUrl += `&protected=true&hash=${passwordHash}`;
      }
      
      // Add expiry if set
      if (expiryDays) {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + expiryDays);
        shareUrl += `&expires=${expiryDate.getTime()}`;
      }
      
      console.log('Share URL generated:', shareUrl);
      
      // Don't automatically open or copy - the ShareModal will handle this
      // The ShareModal needs the URL returned
      return shareUrl;
    } catch (error) {
      console.error('Share error:', error);
      toast.error('Failed to generate share link');
      return '';
    }
  };

  const returnToHome = () => {
    // Reset the URL to remove share parameters
    window.history.pushState({}, '', '/');
    setIsSharedView(false);
  };

  const renderNotConnected = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-blue-100 rounded-full p-6 mb-6 animate-pulse">
        <HardDrive className="h-12 w-12 text-blue-600" />
      </div>
      <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-800">Decentralized Storage</h2>
      <p className="text-gray-600 mb-8 max-w-md">
        Connect your wallet to securely store and share files using decentralized technology
      </p>
      <button
        onClick={handleConnectWallet}
        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M13.8 12H3" />
        </svg>
        <span className="text-lg font-medium">Connect Wallet</span>
      </button>
    </div>
  );
  
  const renderPinataConfig = () => (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 w-full">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
        <div className="flex flex-col md:flex-row">
          {/* Left side - Illustration/Info */}
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-6 sm:p-8 text-white md:w-2/5 flex flex-col justify-center items-center">
            <div className="p-4 bg-white/20 backdrop-blur-md rounded-full inline-flex mb-6 animate-pulse">
              <Cloud className="h-12 w-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-4 text-center">Unlock IPFS Storage</h2>
            <p className="text-white/90 mb-6 text-center">
              Connect your Pinata account to store files securely on the decentralized web
            </p>
            <div className="space-y-3 bg-white/10 p-4 rounded-xl backdrop-blur-md w-full">
              <h3 className="font-medium text-white">Why Pinata?</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <div className="w-5 h-5 bg-green-400 rounded-full flex items-center justify-center mr-2">✓</div>
                  <span>Permanent decentralized storage</span>
                </li>
                <li className="flex items-center">
                  <div className="w-5 h-5 bg-green-400 rounded-full flex items-center justify-center mr-2">✓</div>
                  <span>End-to-end encryption</span>
                </li>
                <li className="flex items-center">
                  <div className="w-5 h-5 bg-green-400 rounded-full flex items-center justify-center mr-2">✓</div>
                  <span>Fast global content delivery</span>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Right side - Form */}
          <div className="p-8 md:w-3/5">
            <div className="max-w-md mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Configure Your Pinata Keys
                </h2>
                <p className="text-gray-600">
                  Enter your API keys to connect with Pinata's IPFS services
                </p>
              </div>
              
              <div className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-100 flex items-start">
                <div className="text-blue-500 mr-3 mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">New to Pinata?</p>
                  <p>Visit <a href="https://app.pinata.cloud" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">Pinata Cloud</a> to create an account and generate your API keys.</p>
                </div>
              </div>
              
              <PinataForm onSave={handlePinataSave} />

              <div className="mt-6 text-center">
                <p className="text-xs text-gray-500">
                  Your keys are stored locally and never sent to our servers
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  
  const renderFileUpload = () => (
    <div className="grid gap-6">
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden transform transition-all hover:shadow-lg">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-5 border-b border-gray-100">
          <div className="flex items-center">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg mr-3">
              <Upload className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Upload Files
            </h2>
          </div>
        </div>
        
        <div className="p-6">
          <FileUpload onUploadComplete={handleUploadComplete} />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden transform transition-all hover:shadow-lg">
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg mr-3">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Your Files
              </h2>
            </div>
            <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm font-medium rounded-full">
              {files.length} {files.length === 1 ? 'file' : 'files'}
            </span>
          </div>
        </div>
        
        <div className="p-6">
          {files.length > 0 ? (
            <FileList 
              files={files} 
              onDelete={handleDelete}
              onShare={handleShare}
            />
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
              <div className="inline-flex p-4 bg-gray-100 rounded-full mb-4">
                <FileText className="h-10 w-10 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium mb-2">No files uploaded yet</p>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                Drag and drop files here or use the upload area above to store your files securely on IPFS
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderSharedFileViewer = () => (
    <SharedFileViewer onBack={returnToHome} />
  );

  const renderContent = () => {
    if (isSharedView) {
      return renderSharedFileViewer();
    }
    
    if (!isAuthenticated) {
      return renderNotConnected();
    }
    
    if (showPinataConfig || !hasPinataKeys) {
      return renderPinataConfig();
    }
    
    return renderFileUpload();
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 shadow-md">
        <div className="container px-4 sm:px-6 md:px-8 mx-auto py-4 flex flex-col sm:flex-row items-center justify-between">
          <div className="flex items-center mb-4 sm:mb-0">
            <div className="bg-white p-2 rounded-full mr-3">
              <HardDrive className="h-6 w-6 text-blue-600" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Decentralized Storage</h1>
          </div>
          <WalletStatus isConnected={isAuthenticated} address={account} onConnect={handleConnectWallet} onDisconnect={disconnectWallet} />
        </div>
      </header>
      <main className="flex-1">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;