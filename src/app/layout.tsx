import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Poprawiacz Tekstu",
  description: "Edytor i asystent tekstowy oparty na AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl">
      <body className="bg-gray-950 text-gray-100 antialiased h-screen overflow-hidden">
        {children}
      </body>
    </html>
  );
}