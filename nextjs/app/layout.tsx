import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/providers/theme-provider';
import { AuthProvider } from '@/providers/auth-provider';
import { PaymentSummaryProvider } from '@/providers/payment-summary-provider';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PortalOps - Enterprise Service Management',
  description: 'Centralized platform for managing company web services, products, and user access',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <PaymentSummaryProvider>
              {children}
              <Toaster position="bottom-right" richColors />
            </PaymentSummaryProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

