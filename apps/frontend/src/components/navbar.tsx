"use client"
import { Button } from "@/components/ui/button"
import { CreditCard, User } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { UserButton } from "@civic/auth/react";

interface NavbarProps {
  credits?: number
  userName?: string
}

export function Navbar({ credits = 150, userName = "H4B" }: NavbarProps) {
  const pathname = usePathname()

  return (
    <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4 group">
            <Link href="/">
              <h1 className="text-xl font-bold text-white transition-all duration-300 group-hover:text-[#00bf63] cursor-pointer">
                Statik
              </h1>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {/* Credits Display */}
            <div className="flex items-center space-x-2 px-3 py-1 bg-gray-800 rounded-lg border border-gray-700 hover:border-[#00bf63] transition-colors duration-300">
              <CreditCard className="w-4 h-4 text-[#00bf63]" />
              <span className="text-sm font-medium text-white">{credits}</span>
              <span className="text-xs text-gray-400">credits</span>
            </div>

            {/* Add Credits Button - only show on dashboard */}
            {pathname === "/" && (
              <Link href="/credits">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white hover:bg-gray-800 transition-all duration-300 transform hover:scale-105 active:scale-95"
                >
                  Add Credits
                </Button>
              </Link>
            )}

            {/* Back to Dashboard Button - only show on credits page */}
            {pathname === "/credits" && (
              <Link href="/">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white hover:bg-gray-800 transition-all duration-300 transform hover:scale-105 active:scale-95"
                >
                  Dashboard
                </Button>
              </Link>
            )}

            {/* User Profile Button */}
            {/* <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white hover:bg-gray-800 transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center space-x-2"
            >
              <User className="w-4 h-4" />
              <span className="text-sm font-medium">{userName}</span>
            </Button> */}
            <UserButton/>
          </div>
        </div>
      </div>
    </header>
  )
}
