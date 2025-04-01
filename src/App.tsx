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
import { SignIn, SignUp, useUser, SignOutButton, useClerk } from '@clerk/clerk-react';
import { saveFileToDatabase, getUserFiles, deleteFileFromDatabase, DatabaseFile } from './lib/database';
import { FileItem } from './types';
import { uploadToPinata, isPinataConfigured, testPinataConnection } from './lib/pinata';

function App() {
  const { isAuthenticated, account, connectMetamask, disconnectWallet } = useAuth();
  const { isSignedIn, user } = useUser();
  const { openSignIn } = useClerk();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [hasPinataKeys, setHasPinataKeys] = useState(false);
  const [showPinataConfig, setShowPinataConfig] = useState(false);
  const [isSharedView, setIsSharedView] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  
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

  // Load files from database when user signs in
  useEffect(() => {
    const loadUserFiles = async () => {
      try {
        const userId = user?.id || '';
        const walletAddress = account || '';
        
        if (!userId && !walletAddress) return;
        
        const dbFiles = await getUserFiles(userId, walletAddress);
        
        if (dbFiles && dbFiles.length > 0) {
          const formattedFiles = dbFiles.map(file => ({
            id: file.id,
            name: file.name,
            type: file.type,
            size: file.size,
            cid: file.cid,
            created_at: file.uploaded_at || new Date().toISOString(),
            user_id: file.user_id,
            wallet_address: file.wallet_address,
            uploadedAt: new Date(file.uploaded_at || Date.now())
          }));
          setFiles(formattedFiles);
        }
      } catch (error) {
        console.error('Error loading files:', error);
        toast.error('Failed to load your files');
      }
    };

    loadUserFiles();
  }, [isSignedIn, user, account]);

  const handleConnectWallet = async () => {
    try {
      await connectMetamask();
      console.log("Wallet connected successfully");
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
  };

  const handleFileUpload = async (files: File[]) => {
    try {
      // Set uploading state to true at the beginning
      setUploading(true);
      
      // Check for authentication
      const isUserAuthenticated = isSignedIn || isAuthenticated;
      
      if (!isUserAuthenticated) {
        toast.error('Please sign in or connect your wallet to upload files');
        setUploading(false); // Reset uploading state
        return;
      }

      const userId = user?.id || '';
      const walletAddress = account || '';

      for (const file of files) {
        try {
          console.log(`Uploading file: ${file.name} (${file.size} bytes)`);
          toast.loading(`Uploading ${file.name}...`, { id: 'upload' });
          
          // Upload to Pinata/IPFS - keep the upload state active during this time
          const formData = new FormData();
          formData.append('file', file);

          // Get Pinata keys
          const apiKey = localStorage.getItem('pinata_api_key');
          const secretKey = localStorage.getItem('pinata_secret_key');

          if (!apiKey || !secretKey) {
            toast.error('Pinata API keys not configured', { id: 'upload' });
            continue;
          }

          // Upload to IPFS - this will take time and should show the loading indicator
          const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
            method: 'POST',
            headers: {
              'pinata_api_key': apiKey,
              'pinata_secret_api_key': secretKey
            },
            body: formData
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('Pinata upload error:', response.status, errorText);
            toast.error('Failed to upload to IPFS', { id: 'upload' });
            continue;
          }

          // Parse the response
          const data = await response.json();
          const cid = data.IpfsHash;
          const uploadTime = new Date().toISOString();

          // Create file data for the database
          const fileData = {
            id: crypto.randomUUID(),
            name: file.name,
            type: file.type || 'application/octet-stream',
            size: file.size,
            cid: cid,
            uploaded_at: uploadTime,
            user_id: userId,
            wallet_address: walletAddress
          };

          // Save to database
          await saveFileToDatabase(fileData);

          // Update local state
          const newFile = {
            id: fileData.id,
            name: fileData.name,
            type: fileData.type,
            size: fileData.size,
            cid: fileData.cid,
            created_at: uploadTime,
            user_id: fileData.user_id,
            wallet_address: fileData.wallet_address,
            uploadedAt: new Date(uploadTime)
          };
          
          setFiles(prevFiles => [...prevFiles, newFile]);
          
          // Show success message
          toast.success('File uploaded successfully!', { id: 'upload' });
        } catch (err) {
          console.error('Error uploading file:', err);
          toast.error(err instanceof Error ? err.message : 'Failed to upload file');
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file');
    } finally {
      // Set uploading state to false when all files are done
      setUploading(false);
    }
  };

  const handleDelete = async (cid: string) => {
    try {
      // Check for either Clerk authentication or wallet authentication
      const isUserAuthenticated = isSignedIn || isAuthenticated;
      
      if (!isUserAuthenticated) {
        throw new Error('User not authenticated');
      }

      // Find the file in the database
      const fileToDelete = files.find(f => f.cid === cid);
      if (!fileToDelete) {
        throw new Error('File not found');
      }

      // Delete from database
      await deleteFileFromDatabase(fileToDelete.id);

      // Update local state
      setFiles((prev) => prev.filter((file) => file.cid !== cid));
      toast.success('File deleted successfully');
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete file');
    }
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
      // Check for either Clerk authentication or wallet authentication
      const isUserAuthenticated = isSignedIn || isAuthenticated;
      
      if (!isUserAuthenticated) {
        throw new Error('Please sign in or connect your wallet to share files');
      }

      // Find the file in our files array
      const file = files.find(f => f.cid === fileId);
      if (!file) {
        throw new Error('File not found');
      }

      // Base URL with file info
      let shareUrl = `${window.location.origin}?shareView=true&file=${encodeURIComponent(fileName)}&cid=${fileId}`;
      
      // Add password hash if password protection is enabled
      if (password) {
        const passwordHash = btoa(password); // Base64 encode for simplicity
        shareUrl += `&protected=true&hash=${passwordHash}`;
      }
      
      // Add expiry if set
      if (expiryDays) {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + expiryDays);
        shareUrl += `&expires=${expiryDate.getTime()}`;
      }
      
      toast.success('Share link generated successfully!');
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

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      await handleFileUpload(files);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      const files = Array.from(e.target.files);
      await handleFileUpload(files);
    }
  };

  const renderNotConnected = () => (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 sm:p-6 text-center bg-gradient-to-b from-gray-50 to-white">
      <div className="bg-gradient-to-r from-violet-100 to-indigo-100 rounded-full p-6 mb-8 shadow-lg shadow-violet-100/50">
        <HardDrive className="h-12 w-12 text-violet-600" />
      </div>
      <h2 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-violet-600 to-indigo-600 inline-block text-transparent bg-clip-text">
        Decentralized Storage
      </h2>
      <p className="text-gray-600 mb-12 max-w-md text-lg">
        Choose your preferred authentication method to securely store and share files
      </p>
      
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white p-8 rounded-2xl shadow-xl shadow-gray-200/70 border border-gray-100">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Welcome to DCFileStorage</h3>
            <p className="text-gray-600 mb-8">Please sign in to continue</p>
            <button
              onClick={() => openSignIn()}
              className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all duration-300 shadow-lg shadow-violet-600/25 hover:shadow-xl hover:shadow-violet-600/30"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
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
    <div className="grid gap-8">
      {/* Upload Files Container */}
      <div className="group bg-white rounded-2xl shadow-xl shadow-violet-100/30 border border-gray-100 overflow-hidden transform transition-all duration-300 hover:shadow-2xl hover:shadow-violet-200/40 hover:border-violet-100">
        <div className="bg-gradient-to-r from-violet-500/10 to-indigo-500/10 px-8 py-6 border-b border-gray-100/80">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl mr-4 group-hover:scale-110 transition-transform duration-300">
              <Upload className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              Upload Files
            </h2>
          </div>
        </div>
        
        <div className="p-8">
          <FileUpload
            onFileSelect={handleFileSelect}
            onDrop={handleDrop}
            uploading={uploading}
            dragging={dragging}
          />
        </div>
      </div>

      {/* Your Files Container */}
      <div className="group bg-white rounded-2xl shadow-xl shadow-blue-100/30 border border-gray-100 overflow-hidden transform transition-all duration-300 hover:shadow-2xl hover:shadow-blue-200/40 hover:border-blue-100">
        <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 px-8 py-6 border-b border-gray-100/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl mr-4 group-hover:scale-110 transition-transform duration-300">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Your Files
              </h2>
            </div>
            <span className="px-4 py-2 bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-600 text-sm font-medium rounded-full border border-blue-100">
              {files.length} {files.length === 1 ? 'file' : 'files'}
            </span>
          </div>
        </div>
        
        <div className="p-8">
          <FileList 
            files={files} 
            onDelete={handleDelete}
            onShare={handleShare}
          />
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
    
    if (!isAuthenticated && !isSignedIn) {
      return renderNotConnected();
    }
    
    // Show Pinata config for both wallet and Clerk authentication
    if (!hasPinataKeys) {
      return renderPinataConfig();
    }
    
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          {/* <h1 className="text-3xl font-bold text-gray-900">Your Files</h1> */}
          <div className="flex items-center gap-4">
            {/* {isAuthenticated && (
              <WalletStatus 
                isConnected={isAuthenticated} 
                address={account} 
                onConnect={handleConnectWallet} 
                onDisconnect={disconnectWallet} 
              />
            )} */}
            {/* {isSignedIn && (
              <div className="flex items-center gap-3 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-white/20 hover:shadow-md transition-all duration-300 w-full sm:w-auto">
                <div className="flex items-center gap-2 min-w-0 flex-1 sm:flex-initial">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse shrink-0"></div>
                  <span className="text-sm text-gray-700 font-medium truncate">
                    {user?.primaryEmailAddress?.emailAddress}
                  </span>
                </div>
                <div className="h-4 w-px bg-gray-200 shrink-0"></div>
                <SignOutButton>
                  <button className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors whitespace-nowrap">
                    Sign Out
                  </button>
                </SignOutButton>
              </div>
            )} */}
          </div>
        </div>
        {renderFileUpload()}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            {/* Logo and Title */}
            <div className="flex items-center">
              <div className="bg-white p-2 rounded-full mr-3">
                <HardDrive className="h-5 w-5 text-blue-600" />
              </div>
              <h1 className="text-lg md:text-xl font-bold text-white">Decentralized Storage</h1>
            </div>

            {/* Auth and Wallet Container */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              {isSignedIn && (
                <div className="flex items-center gap-3 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-white/20 hover:shadow-md transition-all duration-300 w-full sm:w-auto">
                  <div className="flex items-center gap-2 min-w-0 flex-1 sm:flex-initial">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse shrink-0"></div>
                    <span className="text-sm text-gray-700 font-medium truncate">
                      {user?.primaryEmailAddress?.emailAddress}
                    </span>
                  </div>
                  <div className="h-4 w-px bg-gray-200 shrink-0"></div>
                  <SignOutButton>
                    <button className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors whitespace-nowrap">
                      Sign Out
                    </button>
                  </SignOutButton>
                </div>
              )}
              <WalletStatus 
                isConnected={isAuthenticated} 
                address={account} 
                onConnect={handleConnectWallet} 
                onDisconnect={disconnectWallet}
              />
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1">
        {renderContent()}
      </main>
      <footer className="bg-gradient-to-b from-gray-50 to-white border-t border-gray-100">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
            {/* Main Footer Content */}
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {/* About Section */}
                <div className="col-span-2 md:col-span-1">
                  <div className="flex items-center mb-4">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg mr-2">
                      <HardDrive className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      DCFileStorage
                    </h3>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">
                    Your secure and decentralized storage solution. Store, share, and manage files with confidence using IPFS technology.
                  </p>
                  <div className="flex space-x-4">
                    <a href="https://www.instagram.com/satyammm.19?igsh=bGN1cjhkc2Robmtt" className="bg-gray-50 p-2 rounded-lg text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-all">
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                      </svg>
                    </a>
                    <a href="https://www.linkedin.com/in/satyam-pandey-b5818824b?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app" className="bg-gray-50 p-2 rounded-lg text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-all">
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                    </a>
                    <a href="https://github.com/DevXPanda" className="bg-gray-50 p-2 rounded-lg text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-all">
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.91-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"/>
                      </svg>
                    </a>
                  </div>
                </div>

                {/* Features Section */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Features</h3>
                  <ul className="space-y-2">
                    <li>
                      <a href="#" className="text-gray-600 hover:text-blue-600 text-sm transition-colors flex items-center group">
                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2 group-hover:scale-125 transition-transform"></span>
                        Secure Storage
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-gray-600 hover:text-blue-600 text-sm transition-colors flex items-center group">
                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2 group-hover:scale-125 transition-transform"></span>
                        File Sharing
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-gray-600 hover:text-blue-600 text-sm transition-colors flex items-center group">
                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2 group-hover:scale-125 transition-transform"></span>
                        Password Protection
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-gray-600 hover:text-blue-600 text-sm transition-colors flex items-center group">
                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2 group-hover:scale-125 transition-transform"></span>
                        Expiry Control
                      </a>
                    </li>
                  </ul>
                </div>

                {/* Resources Section */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Resources</h3>
                  <ul className="space-y-2">
                    <li>
                      <a href="#" className="text-gray-600 hover:text-blue-600 text-sm transition-colors flex items-center group">
                        <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full mr-2 group-hover:scale-125 transition-transform"></span>
                        Documentation
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-gray-600 hover:text-blue-600 text-sm transition-colors flex items-center group">
                        <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full mr-2 group-hover:scale-125 transition-transform"></span>
                        API Reference
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-gray-600 hover:text-blue-600 text-sm transition-colors flex items-center group">
                        <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full mr-2 group-hover:scale-125 transition-transform"></span>
                        Support
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-gray-600 hover:text-blue-600 text-sm transition-colors flex items-center group">
                        <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full mr-2 group-hover:scale-125 transition-transform"></span>
                        Status
                      </a>
                    </li>
                  </ul>
                </div>

                {/* Legal Section */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Legal</h3>
                  <ul className="space-y-2">
                    <li>
                      <a href="#" className="text-gray-600 hover:text-blue-600 text-sm transition-colors flex items-center group">
                        <span className="w-1.5 h-1.5 bg-violet-600 rounded-full mr-2 group-hover:scale-125 transition-transform"></span>
                        Privacy Policy
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-gray-600 hover:text-blue-600 text-sm transition-colors flex items-center group">
                        <span className="w-1.5 h-1.5 bg-violet-600 rounded-full mr-2 group-hover:scale-125 transition-transform"></span>
                        Terms of Service
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-gray-600 hover:text-blue-600 text-sm transition-colors flex items-center group">
                        <span className="w-1.5 h-1.5 bg-violet-600 rounded-full mr-2 group-hover:scale-125 transition-transform"></span>
                        Cookie Policy
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-gray-600 hover:text-blue-600 text-sm transition-colors flex items-center group">
                        <span className="w-1.5 h-1.5 bg-violet-600 rounded-full mr-2 group-hover:scale-125 transition-transform"></span>
                        GDPR
                      </a>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Bottom Bar */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold text-gray-600">© {new Date().getFullYear()} DCFileStorage.</span>
                    <span className="text-xs text-gray-500">All rights reserved.</span>
                  </div>
                  <div className="flex flex-wrap justify-center gap-3">
                    <div className="flex items-center px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span>
                      <span className="text-xs font-medium text-gray-600">Powered by IPFS & Pinata</span>
                    </div>
                    <div className="flex items-center px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                      <span className="text-xs font-medium text-gray-600">Secure & Reliable</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;