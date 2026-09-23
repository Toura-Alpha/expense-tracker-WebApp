import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Expense Tracker',
  description: 'An offline-first personal expense tracker with AI-powered natural language transaction parsing.',
  openGraph: {
    title: 'Expense Tracker',
    description: 'An offline-first personal expense tracker with AI-powered natural language transaction parsing.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} bg-paper text-ink antialiased min-h-screen`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
