'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from './theme-provider';
import { AuthProvider } from './auth-provider';
import { PaymentSummaryProvider } from './payment-summary-provider';
import { Toaster } from 'sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <SessionProvider>
        <AuthProvider>
          <PaymentSummaryProvider>
            {children}
            <Toaster position="bottom-right" richColors />
          </PaymentSummaryProvider>
        </AuthProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}

