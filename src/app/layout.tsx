import React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Navbar from '@/components/Navbar';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Agents Directory — Ready-to-Run Agentic AI Workflows for Solopreneurs',
  description: 'Discover, Compare & Copy Multi-Agent Systems Built for One-Person Businesses',
  keywords: ['agentic ai', 'workflows', 'solopreneurs', 'ai agents', 'multi-agent systems'],
  authors: [{ name: 'Agentic AI Team' }],
  viewport: 'width=device-width, initial-scale=1',
  openGraph: {
    title: 'Agents Directory — Ready-to-Run Agentic AI Workflows for Solopreneurs',
    description: 'Discover, Compare & Copy Multi-Agent Systems Built for One-Person Businesses',
    url: 'https://agents.wangdadi.xyz',
    siteName: 'Agents Directory',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Agents Directory — Ready-to-Run Agentic AI Workflows for Solopreneurs',
    description: 'Discover, Compare & Copy Multi-Agent Systems Built for One-Person Businesses',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={inter.className}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}