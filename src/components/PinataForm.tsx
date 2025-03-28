import React, { useState } from 'react';
import { Key, Lock, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface PinataFormProps {
  onSave: (apiKey: string, secretKey: string) => void;
}

export function PinataForm({ onSave }: PinataFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey || !secretKey) {
      toast.error('Please fill in all fields');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Simulate validation check
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onSave(apiKey, secretKey);
      setIsOpen(false);
      setIsLoading(false);
      toast.success('Pinata keys saved successfully');
    } catch (error) {
      setIsLoading(false);
      toast.error('Failed to save keys. Please try again.');
    }
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Main form directly embedded in the UI */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-4">
          <div className="group">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Key
            </label>
            <div className="relative transition-all duration-300 hover:shadow-md">
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-4 py-3 pl-10 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                placeholder="Enter your Pinata API key"
                aria-label="Pinata API Key"
              />
              <Key className="absolute left-3 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-300" />
            </div>
          </div>
          
          <div className="group">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Secret Key
            </label>
            <div className="relative transition-all duration-300 hover:shadow-md">
              <input
                type="password"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                className="w-full px-4 py-3 pl-10 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                placeholder="Enter your Pinata secret key"
                aria-label="Pinata Secret Key"
              />
              <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-300" />
            </div>
          </div>
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full px-6 py-3 rounded-xl flex items-center justify-center transition-all duration-300 font-medium text-white 
            ${isLoading 
              ? 'bg-blue-400 cursor-not-allowed' 
              : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-sm hover:shadow transform hover:scale-[1.02]'
            }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CheckCircle className="h-5 w-5 mr-2" />
              Save & Continue
            </>
          )}
        </button>
      </form>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
          <div 
            className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4 transform transition-all"
            style={{
              animation: 'slideUp 0.3s ease-out forwards',
            }}
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Key className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Configure Pinata Keys</h3>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Key
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                    placeholder="Enter your Pinata API key"
                  />
                  <Key className="absolute right-4 top-3.5 h-5 w-5 text-gray-400" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Secret Key
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                    placeholder="Enter your Pinata secret key"
                  />
                  <Lock className="absolute right-4 top-3.5 h-5 w-5 text-gray-400" />
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <h4 className="font-medium text-gray-900 mb-2">How to get your Pinata keys:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                  <li>Visit <a href="https://app.pinata.cloud" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Pinata Cloud</a></li>
                  <li>Sign in or create an account</li>
                  <li>Go to API Keys section</li>
                  <li>Create a new API Key</li>
                </ol>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`px-4 py-2 text-white rounded-lg transition-all duration-300 
                    ${isLoading 
                      ? 'bg-blue-400 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-sm hover:shadow'
                    }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 inline mr-1 animate-spin" />
                      Saving...
                    </>
                  ) : 'Save Keys'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}