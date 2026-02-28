import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Instrument_Serif } from 'next/font/google';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({
  variable: '--font-jakarta',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
});

const instrument = Instrument_Serif({
  variable: '--font-instrument',
  subsets: ['latin'],
  weight: '400',
});

export const metadata: Metadata = {
  title: 'RetireView',
  description: 'Personal retirement readiness dashboard',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${jakarta.variable} ${instrument.variable} font-sans antialiased grain`}
      >
        {children}
      </body>
    </html>
  );
}
