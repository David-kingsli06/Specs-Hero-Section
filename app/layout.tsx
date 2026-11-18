import type { Metadata } from 'next';
import { Cormorant_Garamond, Inter } from 'next/font/google';
import './globals.css';

const cormorantGaramond = Cormorant_Garamond({
  variable: '--font-cormorant',
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
});

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Verity Frame Co. — Made to flex. Built to last for years.',
  description:
    'Verity Frame Co. premium sunglasses: bone white acetate, tinted lenses, and brushed steel hinges engineered to flex and endure.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${cormorantGaramond.variable} ${inter.variable} antialiased`}
    >
      <body className="bg-[#14100E] text-[#F3EDE3] selection:bg-[#E8E2D6] selection:text-[#14100E]">
        {children}
      </body>
    </html>
  );
}
