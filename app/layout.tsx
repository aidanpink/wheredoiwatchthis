import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Where do I watch... | Find Movies & TV Shows",
  description: "Find where to watch movies and TV shows across streaming platforms. Search for titles and discover where to stream, rent, or buy.",
  keywords: ["streaming", "movies", "TV shows", "where to watch", "netflix", "hulu", "disney plus"],
  openGraph: {
    title: "Where do I watch... | Find Movies & TV Shows",
    description: "Find where to watch movies and TV shows across streaming platforms",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
