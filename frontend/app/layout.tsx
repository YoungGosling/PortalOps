import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/providers/theme-provider";
import { AuthProvider } from "@/providers/auth-provider";
import { PaymentSummaryProvider } from "@/providers/payment-summary-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PortalOps - Enterprise Service Management",
  description: "Comprehensive enterprise service and product management platform with role-based access control",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <PaymentSummaryProvider>
              {children}
              <Toaster />
            </PaymentSummaryProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
