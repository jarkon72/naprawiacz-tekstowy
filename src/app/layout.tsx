import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Poprawiacz Tekstu",
  description: "Edytor i asystent tekstowy oparty na AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl" className="bg-gray-950">
      <body className="bg-gray-950 text-gray-100 min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}