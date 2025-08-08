import type { Metadata } from "next"
import { Inter } from 'next/font/google'
import { Toaster } from "sonner"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "CV. Venus - Official Distributor",
  description: "Official distributor of Garuda Food, Mondelez, and Cleo in North Halmahera",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster 
          position="top-right"
          toastOptions={{
            style: {
              background: 'rgba(30, 58, 138, 0.9)',
              color: 'white',
              border: '1px solid rgba(59, 130, 246, 0.5)',
            },
          }}
        />
      </body>
    </html>
  )
}
