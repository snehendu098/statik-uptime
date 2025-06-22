"use client"

import { Button } from "@/components/ui/button"
import { UserButton, useUser } from "@civic/auth/react"

export function Navbar() {

  const {user} = useUser()

  return (
    <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-black">
      <div className="flex items-center space-x-8">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <img src="/logo.png" alt="Statik Logo" className="w-8 h-8" />
            <span className="text-white font-bold text-lg">STATIK</span>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-4">

        {user?.email &&
        <>
        <div className="flex items-center space-x-2 bg-neutral-900 px-3 py-2 rounded-full border border-gray-700">
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <span className="text-sm font-medium text-white">1,250 Credits</span>
        </div>
        <Button className="bg-green-500 hover:bg-green-600 rounded-full text-black font-medium">Upgrade</Button>
        </>
        }

        <UserButton/>
      </div>
    </nav>
  )
}
