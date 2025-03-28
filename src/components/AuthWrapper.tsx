import React from 'react';
import { ClerkProvider } from '@clerk/clerk-react';
import { useAuth } from '../hooks/useAuth';
import { Loader2 } from 'lucide-react';

const CLERK_PUBLISHABLE_KEY = 'your_clerk_key'; // Replace with your Clerk key

interface AuthWrapperProps {
  children: React.ReactNode;
}

export const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      {children}
    </ClerkProvider>
  );
};