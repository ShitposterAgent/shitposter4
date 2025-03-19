import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ShitPoster4 - Powerful Desktop Automation Agent',
  description: 'Automate your desktop interactions with Playwright and Next.js',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased min-h-screen bg-background-light dark:bg-background-dark dark:text-white`}>
        {children}
      </body>
    </html>
  );
}
