import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Parnika Jewellers — Fashion & One Gram Gold Jewellery',
  description: 'Exquisite fashion jewellery and premium one gram gold jewellery with traditional temple artistry and contemporary designs.',
  metadataBase: new URL('https://www.parnikajewellers.com'),
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  );
}
