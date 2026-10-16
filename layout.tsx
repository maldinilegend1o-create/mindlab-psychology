import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MindLab — Psychology Academy",
  description: "A human-centered, self-paced psychology learning experience."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}