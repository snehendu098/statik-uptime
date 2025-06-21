import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { CivicAuthProvider } from "@civic/auth/nextjs"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Statik - Website Uptime Monitoring",
  description: "Monitor your websites and get instant alerts when they go down",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
         <CivicAuthProvider>
          {children}
          </CivicAuthProvider> 
        </ThemeProvider>
      </body>
    </html>
  )
}
