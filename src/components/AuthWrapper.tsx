import React from 'react';
import { ClerkProvider } from '@clerk/clerk-react';

if (!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}

interface AuthWrapperProps {
  children: React.ReactNode;
}

export const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  return (
    <ClerkProvider
      publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
      appearance={{
        layout: {
          socialButtonsPlacement: "bottom",
          showOptionalFields: false,
          helpPageUrl: "https://clerk.com/support",
        },
        elements: {
          rootBox: "mx-auto",
          card: "bg-white rounded-2xl shadow-xl border border-gray-100",
          headerTitle: "text-2xl font-bold text-gray-900",
          headerSubtitle: "text-gray-600",
          socialButtonsBlockButton: "rounded-lg border border-gray-200 hover:border-violet-200 transition-all duration-200",
          formButtonPrimary: "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-sm normal-case rounded-xl px-6 py-4 shadow-lg shadow-violet-600/25 hover:shadow-xl hover:shadow-violet-600/30 transition-all duration-300",
          footerActionLink: "text-violet-600 hover:text-violet-700",
          formFieldInput: "rounded-lg border-gray-200 focus:border-violet-200 focus:ring-violet-200",
          dividerLine: "bg-gray-100",
          dividerText: "text-gray-400",
          modalBackdrop: "backdrop-blur-sm",
          modalContent: "shadow-2xl"
        }
      }}
    >
      {children}
    </ClerkProvider>
  );
};