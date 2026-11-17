import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'DSL Distributors | Supplies Without Limits',
  description: 'Supplies Without Limits. Premier distributor of authentic school exercise books, CR books, pens, geometry sets, and commercial office stationery across Sri Lanka.',
  keywords: ['stationery distribution', 'dsl distributors', 'sri lanka', 'atlas cr book', 'school packs', 'exercise books', 'promate', 'office supplies'],
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const runtimeEnv = {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '',
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || '',
    NEXT_PUBLIC_WHATSAPP_BUSINESS_NUMBER: process.env.NEXT_PUBLIC_WHATSAPP_BUSINESS_NUMBER || '',
  };

  return (
    <html lang="en">
      <head>
        <script
          id="runtime-env"
          dangerouslySetInnerHTML={{
            __html: `window.__ENV__ = ${JSON.stringify(runtimeEnv)};`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans antialiased bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
